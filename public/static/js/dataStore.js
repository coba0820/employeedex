/* ============================================================
   dataStore.js
   データ層。JSON(初期データ) + localStorage(編集差分/お気に入り/認証)
   将来的に SQLite / Supabase へ移行しやすいよう、
   全てのデータ操作は DataStore の非同期メソッド経由に統一する。
   ============================================================ */

const DataStore = (() => {
  const LS_KEYS = {
    employees: 'edx_employees_v1',       // 社員データの上書き保存(全量スナップショット)
    masters: 'edx_masters_v1',           // マスタデータの上書き保存
    favorites: 'edx_favorites_v1',       // お気に入りID配列
    adminAuth: 'edx_admin_auth_v1',      // 管理者ログイン状態
    cardDesign: 'edx_card_design_v1'     // カードデザイン設定(将来拡張用)
  };

  const ADMIN_PASSCODE = 'EMPLOYEDEX2026'; // デモ用パスコード

  let _employees = null;
  let _masters = null;
  let _initialized = false;

  async function _fetchJSON(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch ' + path);
    return res.json();
  }

  function _loadLS(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('LS parse error', key, e);
      return fallback;
    }
  }

  function _saveLS(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LS save error', key, e);
    }
  }

  async function init() {
    if (_initialized) return;
    const [empData, masterData] = await Promise.all([
      _fetchJSON('/static/data/employees.json'),
      _fetchJSON('/static/data/masters.json')
    ]);

    const overriddenEmp = _loadLS(LS_KEYS.employees, null);
    const overriddenMasters = _loadLS(LS_KEYS.masters, null);

    _employees = overriddenEmp && Array.isArray(overriddenEmp) ? overriddenEmp : empData;
    _masters = overriddenMasters && typeof overriddenMasters === 'object' ? overriddenMasters : masterData;

    _initialized = true;
  }

  function _persistEmployees() {
    _saveLS(LS_KEYS.employees, _employees);
  }
  function _persistMasters() {
    _saveLS(LS_KEYS.masters, _masters);
  }

  /* ---------------- Employees ---------------- */
  async function getEmployees() {
    await init();
    return _employees.slice();
  }

  async function getEmployeeById(id) {
    await init();
    return _employees.find(e => e.id === id) || null;
  }

  async function addEmployee(emp) {
    await init();
    const maxNum = _employees.reduce((max, e) => {
      const n = parseInt((e.number || '').replace(/\D/g, ''), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const nextNum = maxNum + 1;
    emp.id = 'emp' + String(Date.now());
    emp.number = 'No.' + String(nextNum).padStart(3, '0');
    _employees.push(emp);
    _persistEmployees();
    return emp;
  }

  async function updateEmployee(id, patch) {
    await init();
    const idx = _employees.findIndex(e => e.id === id);
    if (idx === -1) return null;
    _employees[idx] = Object.assign({}, _employees[idx], patch);
    _persistEmployees();
    return _employees[idx];
  }

  async function deleteEmployee(id) {
    await init();
    _employees = _employees.filter(e => e.id !== id);
    _persistEmployees();
    return true;
  }

  async function resetEmployeesToDefault() {
    localStorage.removeItem(LS_KEYS.employees);
    _initialized = false;
    await init();
  }

  /* ---------------- Masters ---------------- */
  async function getMasters() {
    await init();
    return JSON.parse(JSON.stringify(_masters));
  }

  async function updateMasters(patch) {
    await init();
    _masters = Object.assign({}, _masters, patch);
    _persistMasters();
    return _masters;
  }

  async function addDepartment(dept) {
    await init();
    _masters.departments.push(dept);
    _persistMasters();
    return _masters.departments;
  }
  async function updateDepartment(id, patch) {
    await init();
    const idx = _masters.departments.findIndex(d => d.id === id);
    if (idx === -1) return null;
    _masters.departments[idx] = Object.assign({}, _masters.departments[idx], patch);
    _persistMasters();
    return _masters.departments[idx];
  }
  async function deleteDepartment(id) {
    await init();
    _masters.departments = _masters.departments.filter(d => d.id !== id);
    _persistMasters();
    return true;
  }

  async function addTag(tag) {
    await init();
    _masters.tags.push(tag);
    _persistMasters();
    return _masters.tags;
  }
  async function deleteTag(id) {
    await init();
    _masters.tags = _masters.tags.filter(t => t.id !== id);
    _persistMasters();
    return true;
  }

  async function updateRarity(id, patch) {
    await init();
    const idx = _masters.rarities.findIndex(r => r.id === id);
    if (idx === -1) return null;
    _masters.rarities[idx] = Object.assign({}, _masters.rarities[idx], patch);
    _persistMasters();
    return _masters.rarities[idx];
  }

  /* ---------------- Favorites ---------------- */
  function getFavorites() {
    return _loadLS(LS_KEYS.favorites, []);
  }
  function isFavorite(id) {
    return getFavorites().includes(id);
  }
  function toggleFavorite(id) {
    let favs = getFavorites();
    if (favs.includes(id)) {
      favs = favs.filter(f => f !== id);
    } else {
      favs.push(id);
    }
    _saveLS(LS_KEYS.favorites, favs);
    return favs.includes(id);
  }

  /* ---------------- Admin auth ---------------- */
  function isAdminLoggedIn() {
    return _loadLS(LS_KEYS.adminAuth, false) === true;
  }
  function adminLogin(passcode) {
    if (passcode === ADMIN_PASSCODE) {
      _saveLS(LS_KEYS.adminAuth, true);
      return true;
    }
    return false;
  }
  function adminLogout() {
    localStorage.removeItem(LS_KEYS.adminAuth);
  }

  /* ---------------- Helpers ---------------- */
  function calcTenure(joinDateStr) {
    if (!joinDateStr) return '―';
    const start = new Date(joinDateStr);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (now.getDate() < start.getDate()) months -= 1;
    if (months < 0) { years -= 1; months += 12; }
    if (years < 0) return '入社前';
    if (years === 0 && months === 0) return '入社したて';
    let str = '';
    if (years > 0) str += years + '年';
    if (months > 0) str += months + 'ヶ月';
    return str || '入社したて';
  }

  function calcAge(birthDateStr) {
    if (!birthDateStr) return null;
    const b = new Date(birthDateStr);
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
  }

  function formatJoinDate(joinDateStr) {
    if (!joinDateStr) return '―';
    const d = new Date(joinDateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  }

  return {
    init,
    getEmployees, getEmployeeById, addEmployee, updateEmployee, deleteEmployee, resetEmployeesToDefault,
    getMasters, updateMasters, addDepartment, updateDepartment, deleteDepartment, addTag, deleteTag, updateRarity,
    getFavorites, isFavorite, toggleFavorite,
    isAdminLoggedIn, adminLogin, adminLogout,
    calcTenure, calcAge, formatJoinDate
  };
})();

window.DataStore = DataStore;
