/* ============================================================
   dataStore.js
   D1-backed data layer. All application data is loaded and
   persisted through /api/* endpoints.
   ============================================================ */

const DataStore = (() => {
  let _employees = [];
  let _masters = {};
  let _favorites = [];
  let _adminLoggedIn = false;
  let _initialized = false;

  async function _api(path, options) {
    const opts = Object.assign({ credentials: 'same-origin', cache: 'no-store' }, options || {});
    opts.headers = Object.assign({}, opts.headers || {});
    if (opts.body && !opts.headers['Content-Type']) {
      opts.headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(path, opts);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = data && data.error ? data.error : 'API request failed: ' + path;
      throw new Error(message);
    }
    return data;
  }

  function _clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function _ensureMasterCollections() {
    _masters.departments = Array.isArray(_masters.departments) ? _masters.departments : [];
    _masters.rarities = Array.isArray(_masters.rarities) ? _masters.rarities : [];
    _masters.cardTypes = Array.isArray(_masters.cardTypes) ? _masters.cardTypes : [];
    _masters.tags = Array.isArray(_masters.tags) ? _masters.tags : [];
    _masters.mbtiOptions = Array.isArray(_masters.mbtiOptions) ? _masters.mbtiOptions : [];
    _masters.genderOptions = Array.isArray(_masters.genderOptions) ? _masters.genderOptions : [];
    _masters.statLabels = Array.isArray(_masters.statLabels) ? _masters.statLabels : [];
    _masters.mbtiInfo = _masters.mbtiInfo && typeof _masters.mbtiInfo === 'object' ? _masters.mbtiInfo : {};
  }

  async function init() {
    if (_initialized) return;
    const [employees, masters, favorites, session] = await Promise.all([
      _api('/api/employees'),
      _api('/api/masters'),
      _api('/api/favorites'),
      _api('/api/admin/session')
    ]);

    _employees = Array.isArray(employees) ? employees : [];
    _masters = masters && typeof masters === 'object' ? masters : {};
    _favorites = Array.isArray(favorites) ? favorites : [];
    _adminLoggedIn = !!(session && session.loggedIn);
    _ensureMasterCollections();
    _initialized = true;
  }

  async function refreshEmployees() {
    _employees = await _api('/api/employees');
    return _employees;
  }

  async function saveMasters(nextMasters) {
    _masters = await _api('/api/masters', {
      method: 'PUT',
      body: JSON.stringify(nextMasters)
    });
    _ensureMasterCollections();
    return _masters;
  }

  /* ---------------- Employees ---------------- */
  async function getEmployees() {
    await init();
    return _employees.slice();
  }

  async function getEmployeeById(id) {
    await init();
    const cached = _employees.find(e => e.id === id);
    if (cached) return cached;
    return _api('/api/employees/' + encodeURIComponent(id));
  }

  async function addEmployee(emp) {
    await init();
    const created = await _api('/api/employees', {
      method: 'POST',
      body: JSON.stringify(emp)
    });
    await refreshEmployees();
    return created;
  }

  async function updateEmployee(id, patch) {
    await init();
    const updated = await _api('/api/employees/' + encodeURIComponent(id), {
      method: 'PUT',
      body: JSON.stringify(patch)
    });
    const idx = _employees.findIndex(e => e.id === id);
    if (idx >= 0) _employees[idx] = updated;
    else _employees.push(updated);
    return updated;
  }

  async function deleteEmployee(id) {
    await init();
    await _api('/api/employees/' + encodeURIComponent(id), { method: 'DELETE' });
    _employees = _employees.filter(e => e.id !== id);
    _favorites = _favorites.filter(f => f !== id);
    return true;
  }

  async function resetEmployeesToDefault() {
    await init();
    await refreshEmployees();
  }

  /* ---------------- Masters ---------------- */
  async function getMasters() {
    await init();
    return _clone(_masters);
  }

  async function updateMasters(patch) {
    await init();
    const next = Object.assign({}, _masters, patch);
    return saveMasters(next);
  }

  async function addDepartment(dept) {
    await init();
    const next = _clone(_masters);
    next.departments = Array.isArray(next.departments) ? next.departments : [];
    next.departments.push(dept);
    await saveMasters(next);
    return _masters.departments;
  }

  async function updateDepartment(id, patch) {
    await init();
    const next = _clone(_masters);
    const idx = next.departments.findIndex(d => d.id === id);
    if (idx === -1) return null;
    next.departments[idx] = Object.assign({}, next.departments[idx], patch);
    await saveMasters(next);
    return _masters.departments[idx];
  }

  async function deleteDepartment(id) {
    await init();
    const next = _clone(_masters);
    next.departments = next.departments.filter(d => d.id !== id);
    await saveMasters(next);
    return true;
  }

  async function addTag(tag) {
    await init();
    const next = _clone(_masters);
    next.tags = Array.isArray(next.tags) ? next.tags : [];
    next.tags.push(tag);
    await saveMasters(next);
    return _masters.tags;
  }

  async function deleteTag(id) {
    await init();
    const next = _clone(_masters);
    next.tags = next.tags.filter(t => t.id !== id);
    await saveMasters(next);
    return true;
  }

  async function updateRarity(id, patch) {
    await init();
    const next = _clone(_masters);
    const idx = next.rarities.findIndex(r => r.id === id);
    if (idx === -1) return null;
    next.rarities[idx] = Object.assign({}, next.rarities[idx], patch);
    await saveMasters(next);
    return _masters.rarities[idx];
  }

  /* ---------------- Favorites ---------------- */
  function getFavorites() {
    return _favorites.slice();
  }

  function isFavorite(id) {
    return _favorites.includes(id);
  }

  async function toggleFavorite(id) {
    await init();
    const wasFavorite = _favorites.includes(id);
    const data = await _api('/api/favorites/' + encodeURIComponent(id), {
      method: wasFavorite ? 'DELETE' : 'POST'
    });
    _favorites = data && Array.isArray(data.favorites) ? data.favorites : _favorites;
    return !wasFavorite;
  }

  /* ---------------- Admin auth ---------------- */
  function isAdminLoggedIn() {
    return _adminLoggedIn === true;
  }

  async function adminLogin(passcode) {
    try {
      const session = await _api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ passcode })
      });
      _adminLoggedIn = !!(session && session.loggedIn);
      return _adminLoggedIn;
    } catch (e) {
      _adminLoggedIn = false;
      return false;
    }
  }

  async function adminLogout() {
    await _api('/api/admin/logout', { method: 'POST' }).catch(() => null);
    _adminLoggedIn = false;
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
