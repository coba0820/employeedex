/* ============================================================
   pages/admin.js
   管理画面: 社員CRUD、部署/タグ/レアリティ管理、能力値・カードデザイン編集
   ============================================================ */

const AdminPage = (() => {
  const esc = Components.escapeHtml;
  let currentTab = 'employees';
  let cachedEmployees = [];
  let cachedMasters = null;

  async function render(root) {
    await DataStore.init();

    if (!DataStore.isAdminLoggedIn()) {
      renderLogin(root);
      return;
    }

    cachedEmployees = await DataStore.getEmployees();
    cachedMasters = await DataStore.getMasters();

    root.innerHTML = `
      <div class="app-shell">
        ${Components.renderSidebar('admin')}
        <div class="main-content">
          <div class="main-inner page-enter">
            <div class="page-header">
              <h1><i class="fa-solid fa-gear"></i> 管理画面</h1>
              <p>社員データ・部署・タグ・レアリティ・能力値・カードデザインを編集できます。</p>
            </div>
            <div class="admin-shell">
              <nav class="admin-sidebar">
                ${menuItem('employees', 'fa-solid fa-users', '社員管理')}
                ${menuItem('departments', 'fa-solid fa-building', '部署管理')}
                ${menuItem('tags', 'fa-solid fa-tags', 'バッジ/タグ管理')}
                ${menuItem('rarities', 'fa-solid fa-gem', 'レアリティ管理')}
                <a class="admin-menu-item" href="javascript:void(0)" id="admin-logout-btn" style="margin-top:12px;color:#dc2626;">
                  <i class="fa-solid fa-arrow-right-from-bracket"></i> ログアウト
                </a>
              </nav>
              <div class="admin-panel" id="admin-panel"></div>
            </div>
          </div>
          ${Components.renderFooter()}
        </div>
      </div>
    `;
    Components.bindSidebar(root);

    document.querySelectorAll('.admin-menu-item[data-tab]').forEach(el => {
      el.addEventListener('click', () => {
        currentTab = el.getAttribute('data-tab');
        document.querySelectorAll('.admin-menu-item[data-tab]').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        renderPanel();
      });
    });
    document.getElementById('admin-logout-btn').addEventListener('click', async () => {
      await DataStore.adminLogout();
      Router.navigate('/admin');
    });

    renderPanel();
  }

  function menuItem(tab, icon, label) {
    return `<a class="admin-menu-item ${currentTab === tab ? 'active' : ''}" href="javascript:void(0)" data-tab="${tab}"><i class="${icon}"></i> ${label}</a>`;
  }

  function renderLogin(root) {
    root.innerHTML = `
      <div class="app-shell">
        ${Components.renderSidebar('admin')}
        <div class="main-content">
          <div class="main-inner page-enter">
            <div class="admin-login-box">
              <i class="fa-solid fa-lock"></i>
              <h2>管理者ログイン</h2>
              <p>パスコードを入力してください（デモ用: EMPLOYEDEX2026）</p>
              <div class="login-error" id="login-error"></div>
              <input type="password" id="passcode-input" placeholder="パスコード" />
              <button class="btn btn-accent" style="width:100%;" id="login-btn">ログイン</button>
            </div>
          </div>
          ${Components.renderFooter()}
        </div>
      </div>
    `;
    Components.bindSidebar(root);
    const doLogin = async () => {
      const val = document.getElementById('passcode-input').value;
      if (await DataStore.adminLogin(val)) {
        Router.navigate('/admin');
      } else {
        document.getElementById('login-error').textContent = 'パスコードが正しくありません';
      }
    };
    document.getElementById('login-btn').addEventListener('click', doLogin);
    document.getElementById('passcode-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  }

  function renderPanel() {
    const panel = document.getElementById('admin-panel');
    if (currentTab === 'employees') return renderEmployeesPanel(panel);
    if (currentTab === 'departments') return renderDepartmentsPanel(panel);
    if (currentTab === 'tags') return renderTagsPanel(panel);
    if (currentTab === 'rarities') return renderRaritiesPanel(panel);
  }

  /* ================= Employees ================= */
  function renderEmployeesPanel(panel) {
    panel.innerHTML = `
      <div class="admin-panel-head">
        <h2>社員管理 (${cachedEmployees.length}名)</h2>
        <button class="btn btn-accent btn-sm" id="add-emp-btn"><i class="fa-solid fa-plus"></i> 社員を追加</button>
      </div>
      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>写真</th><th>No.</th><th>名前</th><th>部署</th><th>レアリティ</th><th>MBTI</th><th style="width:90px;"></th>
            </tr>
          </thead>
          <tbody>
            ${cachedEmployees.map(emp => {
              const dept = cachedMasters.departments.find(d => d.id === emp.department) || { name: emp.department, color: '#999' };
              return `
              <tr>
                <td><img class="admin-row-photo" src="${emp.photo}" alt="${esc(emp.name)}"/></td>
                <td>${esc(emp.number)}</td>
                <td><b>${esc(emp.name)}</b><br><span style="color:var(--text-tertiary);font-size:12px;">${esc(emp.nickname)}</span></td>
                <td><span class="dept-pill" style="background:${dept.color}">${esc(dept.name)}</span></td>
                <td>${Components.renderRarityBadge(emp.rarity, cachedMasters)}</td>
                <td>${esc(emp.mbti)}</td>
                <td>
                  <div class="admin-actions-cell">
                    <button class="icon-action-btn" data-edit-emp="${emp.id}" title="編集"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-action-btn danger" data-delete-emp="${emp.id}" title="削除"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('add-emp-btn').addEventListener('click', () => openEmployeeForm(null));
    panel.querySelectorAll('[data-edit-emp]').forEach(btn => {
      btn.addEventListener('click', () => openEmployeeForm(btn.getAttribute('data-edit-emp')));
    });
    panel.querySelectorAll('[data-delete-emp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-emp');
        const emp = cachedEmployees.find(e => e.id === id);
        Components.confirmDialog(`「${emp.name}」さんのデータを削除します。よろしいですか？`, async () => {
          await DataStore.deleteEmployee(id);
          cachedEmployees = await DataStore.getEmployees();
          Components.showToast('社員データを削除しました', 'success');
          renderEmployeesPanel(panel);
        });
      });
    });
  }

  function statStarPickerHtml(statId, statName, currentVal) {
    currentVal = currentVal || 0;
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<i class="fa-solid fa-star ${i <= currentVal ? 'filled' : ''}" data-stat="${statId}" data-val="${i}"></i>`;
    }
    return `
      <div class="stat-editor-row">
        <span>${esc(statName)}</span>
        <div class="star-picker" data-stat-picker="${statId}">${stars}</div>
      </div>
    `;
  }

  function openEmployeeForm(empId) {
    const emp = empId ? cachedEmployees.find(e => e.id === empId) : {
      name: '', nickname: '', photo: '/static/images/employees/001.png', department: cachedMasters.departments[0].id,
      position: '', jobDescription: '', gender: cachedMasters.genderOptions[0], birthDate: '', area: '', joinDate: '',
      catchphrase: '', mbti: cachedMasters.mbtiOptions[0], loveMbti: cachedMasters.mbtiOptions[0],
      strengths: '', weaknesses: '', hobby: '', favorites: '', workStyle: '', personalityType: '',
      characterInOffice: '', freeComment: '', rarity: 'N', cardType: cachedMasters.cardTypes[0].id,
      stats: { comm: 3, action: 3, planning: 3, analysis: 3, idea: 3, leadership: 3 }, tags: []
    };
    const workingStats = Object.assign({}, emp.stats);
    let workingTags = (emp.tags || []).slice();
    let workingRarity = emp.rarity;

    const { overlay } = Components.openModal({
      title: empId ? `${emp.name} さんを編集` : '新しい社員を追加',
      size: 'lg',
      bodyHtml: `
        <div class="form-grid">
          <div class="form-field"><label>名前</label><input type="text" id="f-name" value="${esc(emp.name)}" /></div>
          <div class="form-field"><label>ニックネーム</label><input type="text" id="f-nickname" value="${esc(emp.nickname)}" /></div>
          <div class="form-field full"><label>写真URL</label><input type="text" id="f-photo" value="${esc(emp.photo)}" /></div>
          <div class="form-field">
            <label>部署</label>
            <select id="f-department">${cachedMasters.departments.map(d => `<option value="${d.id}" ${emp.department === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>
          </div>
          <div class="form-field"><label>役職</label><input type="text" id="f-position" value="${esc(emp.position)}" /></div>
          <div class="form-field full"><label>担当業務</label><input type="text" id="f-jobDescription" value="${esc(emp.jobDescription)}" /></div>
          <div class="form-field">
            <label>性別</label>
            <select id="f-gender">${cachedMasters.genderOptions.map(g => `<option value="${g}" ${emp.gender === g ? 'selected' : ''}>${g}</option>`).join('')}</select>
          </div>
          <div class="form-field"><label>生年月日</label><input type="date" id="f-birthDate" value="${esc(emp.birthDate)}" /></div>
          <div class="form-field"><label>住んでいるエリア</label><input type="text" id="f-area" value="${esc(emp.area)}" /></div>
          <div class="form-field"><label>入社年月</label><input type="date" id="f-joinDate" value="${esc(emp.joinDate)}" /></div>
          <div class="form-field full"><label>一言キャッチコピー</label><input type="text" id="f-catchphrase" value="${esc(emp.catchphrase)}" /></div>
          <div class="form-field">
            <label>MBTI</label>
            <select id="f-mbti">${cachedMasters.mbtiOptions.map(m => `<option value="${m}" ${emp.mbti === m ? 'selected' : ''}>${m}</option>`).join('')}</select>
          </div>
          <div class="form-field">
            <label>恋愛MBTI</label>
            <select id="f-loveMbti">${cachedMasters.mbtiOptions.map(m => `<option value="${m}" ${emp.loveMbti === m ? 'selected' : ''}>${m}</option>`).join('')}</select>
          </div>
          <div class="form-field"><label>得意なこと</label><input type="text" id="f-strengths" value="${esc(emp.strengths)}" /></div>
          <div class="form-field"><label>苦手なこと</label><input type="text" id="f-weaknesses" value="${esc(emp.weaknesses)}" /></div>
          <div class="form-field"><label>趣味</label><input type="text" id="f-hobby" value="${esc(emp.hobby)}" /></div>
          <div class="form-field"><label>好きなもの</label><input type="text" id="f-favorites" value="${esc(emp.favorites)}" /></div>
          <div class="form-field"><label>仕事スタイル</label><input type="text" id="f-workStyle" value="${esc(emp.workStyle)}" /></div>
          <div class="form-field"><label>性格タイプ</label><input type="text" id="f-personalityType" value="${esc(emp.personalityType)}" /></div>
          <div class="form-field full"><label>社内でのキャラクター</label><textarea id="f-characterInOffice">${esc(emp.characterInOffice)}</textarea></div>
          <div class="form-field full"><label>自由コメント</label><textarea id="f-freeComment">${esc(emp.freeComment)}</textarea></div>
          <div class="form-field">
            <label>カードタイプ属性</label>
            <select id="f-cardType">${cachedMasters.cardTypes.map(t => `<option value="${t.id}" ${emp.cardType === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
          </div>
        </div>

        <div style="margin-top:22px;">
          <label style="font-size:12px;font-weight:800;color:var(--text-secondary);display:block;margin-bottom:10px;">レアリティ</label>
          <div class="rarity-picker" id="f-rarity-picker">
            ${cachedMasters.rarities.map(r => `<span class="rarity-option ${workingRarity === r.id ? 'selected' : ''}" data-rarity="${r.id}" style="background:${r.color}">${esc(r.label)}</span>`).join('')}
          </div>
        </div>

        <div style="margin-top:22px;">
          <label style="font-size:12px;font-weight:800;color:var(--text-secondary);display:block;margin-bottom:6px;">能力値</label>
          <div id="f-stats">
            ${cachedMasters.statLabels.map(sl => statStarPickerHtml(sl.id, sl.name, workingStats[sl.id])).join('')}
          </div>
        </div>

        <div style="margin-top:22px;">
          <label style="font-size:12px;font-weight:800;color:var(--text-secondary);display:block;margin-bottom:10px;">バッジ/タグ</label>
          <div class="tag-chip-select" id="f-tags">
            ${cachedMasters.tags.map(t => `<span class="tag-chip ${workingTags.includes(t.id) ? 'selected' : ''}" data-tag-id="${t.id}">${t.emoji} ${esc(t.label)}</span>`).join('')}
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-ghost" data-cancel-form>キャンセル</button>
        <button class="btn btn-accent" data-save-form>${empId ? '保存する' : '追加する'}</button>
      `,
      onMount: (ov, close) => {
        ov.querySelectorAll('.rarity-option').forEach(el => {
          el.addEventListener('click', () => {
            workingRarity = el.getAttribute('data-rarity');
            ov.querySelectorAll('.rarity-option').forEach(x => x.classList.remove('selected'));
            el.classList.add('selected');
          });
        });
        ov.querySelectorAll('#f-tags .tag-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const id = chip.getAttribute('data-tag-id');
            if (workingTags.includes(id)) { workingTags = workingTags.filter(t => t !== id); }
            else { workingTags.push(id); }
            chip.classList.toggle('selected');
          });
        });
        ov.querySelectorAll('.star-picker i').forEach(star => {
          star.addEventListener('click', () => {
            const statId = star.getAttribute('data-stat');
            const val = parseInt(star.getAttribute('data-val'), 10);
            workingStats[statId] = val;
            const picker = ov.querySelector(`[data-stat-picker="${statId}"]`);
            picker.querySelectorAll('i').forEach(s => {
              s.classList.toggle('filled', parseInt(s.getAttribute('data-val'), 10) <= val);
            });
          });
        });

        ov.querySelector('[data-cancel-form]').addEventListener('click', close);
        ov.querySelector('[data-save-form]').addEventListener('click', async () => {
          const patch = {
            name: ov.querySelector('#f-name').value.trim(),
            nickname: ov.querySelector('#f-nickname').value.trim(),
            photo: ov.querySelector('#f-photo').value.trim(),
            department: ov.querySelector('#f-department').value,
            position: ov.querySelector('#f-position').value.trim(),
            jobDescription: ov.querySelector('#f-jobDescription').value.trim(),
            gender: ov.querySelector('#f-gender').value,
            birthDate: ov.querySelector('#f-birthDate').value,
            area: ov.querySelector('#f-area').value.trim(),
            joinDate: ov.querySelector('#f-joinDate').value,
            catchphrase: ov.querySelector('#f-catchphrase').value.trim(),
            mbti: ov.querySelector('#f-mbti').value,
            loveMbti: ov.querySelector('#f-loveMbti').value,
            strengths: ov.querySelector('#f-strengths').value.trim(),
            weaknesses: ov.querySelector('#f-weaknesses').value.trim(),
            hobby: ov.querySelector('#f-hobby').value.trim(),
            favorites: ov.querySelector('#f-favorites').value.trim(),
            workStyle: ov.querySelector('#f-workStyle').value.trim(),
            personalityType: ov.querySelector('#f-personalityType').value.trim(),
            characterInOffice: ov.querySelector('#f-characterInOffice').value.trim(),
            freeComment: ov.querySelector('#f-freeComment').value.trim(),
            cardType: ov.querySelector('#f-cardType').value,
            rarity: workingRarity,
            stats: workingStats,
            tags: workingTags
          };

          if (!patch.name) {
            Components.showToast('名前を入力してください', 'error');
            return;
          }

          if (empId) {
            await DataStore.updateEmployee(empId, patch);
            Components.showToast('社員データを更新しました', 'success');
          } else {
            await DataStore.addEmployee(patch);
            Components.showToast('社員を追加しました', 'success');
          }
          cachedEmployees = await DataStore.getEmployees();
          close();
          renderEmployeesPanel(document.getElementById('admin-panel'));
        });
      }
    });
  }

  /* ================= Departments ================= */
  function renderDepartmentsPanel(panel) {
    panel.innerHTML = `
      <div class="admin-panel-head">
        <h2>部署管理 (${cachedMasters.departments.length})</h2>
        <button class="btn btn-accent btn-sm" id="add-dept-btn"><i class="fa-solid fa-plus"></i> 部署を追加</button>
      </div>
      <table class="admin-table">
        <thead><tr><th>色</th><th>部署名</th><th>ID</th><th style="width:90px;"></th></tr></thead>
        <tbody>
          ${cachedMasters.departments.map(d => `
            <tr>
              <td><span style="display:inline-block;width:22px;height:22px;border-radius:6px;background:${d.color};"></span></td>
              <td><b>${esc(d.name)}</b></td>
              <td style="color:var(--text-tertiary);">${esc(d.id)}</td>
              <td>
                <div class="admin-actions-cell">
                  <button class="icon-action-btn" data-edit-dept="${d.id}"><i class="fa-solid fa-pen"></i></button>
                  <button class="icon-action-btn danger" data-delete-dept="${d.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    document.getElementById('add-dept-btn').addEventListener('click', () => openDeptForm(null));
    panel.querySelectorAll('[data-edit-dept]').forEach(btn => btn.addEventListener('click', () => openDeptForm(btn.getAttribute('data-edit-dept'))));
    panel.querySelectorAll('[data-delete-dept]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-dept');
        Components.confirmDialog('この部署を削除しますか？この部署に所属する社員のデータは残ります。', async () => {
          await DataStore.deleteDepartment(id);
          cachedMasters = await DataStore.getMasters();
          renderDepartmentsPanel(panel);
          Components.showToast('部署を削除しました', 'success');
        });
      });
    });
  }

  function openDeptForm(deptId) {
    const dept = deptId ? cachedMasters.departments.find(d => d.id === deptId) : { id: '', name: '', color: '#4d5bff' };
    Components.openModal({
      title: deptId ? '部署を編集' : '部署を追加',
      bodyHtml: `
        <div class="form-grid">
          ${!deptId ? `<div class="form-field"><label>ID (英数字)</label><input type="text" id="d-id" placeholder="例: legal" /></div>` : ''}
          <div class="form-field"><label>部署名</label><input type="text" id="d-name" value="${esc(dept.name)}" /></div>
          <div class="form-field"><label>カラー</label><input type="color" id="d-color" value="${dept.color}" /></div>
        </div>
      `,
      footerHtml: `<button class="btn btn-ghost" data-cancel>キャンセル</button><button class="btn btn-accent" data-save>保存する</button>`,
      onMount: (ov, close) => {
        ov.querySelector('[data-cancel]').addEventListener('click', close);
        ov.querySelector('[data-save]').addEventListener('click', async () => {
          const name = ov.querySelector('#d-name').value.trim();
          const color = ov.querySelector('#d-color').value;
          if (!name) { Components.showToast('部署名を入力してください', 'error'); return; }
          if (deptId) {
            await DataStore.updateDepartment(deptId, { name, color });
          } else {
            const idInput = ov.querySelector('#d-id');
            const id = idInput.value.trim() || 'dept_' + Date.now();
            await DataStore.addDepartment({ id, name, color });
          }
          cachedMasters = await DataStore.getMasters();
          close();
          renderDepartmentsPanel(document.getElementById('admin-panel'));
          Components.showToast('部署を保存しました', 'success');
        });
      }
    });
  }

  /* ================= Tags ================= */
  function renderTagsPanel(panel) {
    panel.innerHTML = `
      <div class="admin-panel-head">
        <h2>バッジ/タグ管理 (${cachedMasters.tags.length})</h2>
        <button class="btn btn-accent btn-sm" id="add-tag-btn"><i class="fa-solid fa-plus"></i> タグを追加</button>
      </div>
      <div class="tag-chip-select">
        ${cachedMasters.tags.map(t => `
          <span class="tag-chip" style="padding:10px 14px;">
            ${t.emoji} ${esc(t.label)}
            <button class="icon-action-btn danger" style="width:22px;height:22px;margin-left:6px;" data-delete-tag="${t.id}"><i class="fa-solid fa-xmark" style="font-size:10px;"></i></button>
          </span>
        `).join('')}
      </div>
    `;
    document.getElementById('add-tag-btn').addEventListener('click', () => openTagForm());
    panel.querySelectorAll('[data-delete-tag]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-tag');
        Components.confirmDialog('このタグを削除しますか？', async () => {
          await DataStore.deleteTag(id);
          cachedMasters = await DataStore.getMasters();
          renderTagsPanel(panel);
          Components.showToast('タグを削除しました', 'success');
        });
      });
    });
  }

  function openTagForm() {
    Components.openModal({
      title: 'タグを追加',
      bodyHtml: `
        <div class="form-grid">
          <div class="form-field"><label>絵文字</label><input type="text" id="t-emoji" placeholder="例: 🏇" maxlength="4" /></div>
          <div class="form-field"><label>ラベル</label><input type="text" id="t-label" placeholder="例: 競馬好き" /></div>
        </div>
      `,
      footerHtml: `<button class="btn btn-ghost" data-cancel>キャンセル</button><button class="btn btn-accent" data-save>追加する</button>`,
      onMount: (ov, close) => {
        ov.querySelector('[data-cancel]').addEventListener('click', close);
        ov.querySelector('[data-save]').addEventListener('click', async () => {
          const emoji = ov.querySelector('#t-emoji').value.trim() || '🏷️';
          const label = ov.querySelector('#t-label').value.trim();
          if (!label) { Components.showToast('ラベルを入力してください', 'error'); return; }
          const id = 'tag_' + Date.now();
          await DataStore.addTag({ id, emoji, label });
          cachedMasters = await DataStore.getMasters();
          close();
          renderTagsPanel(document.getElementById('admin-panel'));
          Components.showToast('タグを追加しました', 'success');
        });
      }
    });
  }

  /* ================= Rarities ================= */
  function renderRaritiesPanel(panel) {
    panel.innerHTML = `
      <div class="admin-panel-head">
        <h2>レアリティ管理</h2>
      </div>
      <p style="font-size:13px;color:var(--text-tertiary);margin-bottom:20px;">レアリティのカラーは全社員カードの見た目に反映されます。社員ごとのレアリティ付与は「社員管理」の編集画面から行えます。</p>
      <table class="admin-table">
        <thead><tr><th>表示</th><th>ラベル</th><th>正式名称</th><th>カラー</th></tr></thead>
        <tbody>
          ${cachedMasters.rarities.sort((a,b) => a.order - b.order).map(r => `
            <tr>
              <td><span class="rarity-pill" style="background:${r.color};">${esc(r.label)}</span></td>
              <td>${esc(r.id)}</td>
              <td>${esc(r.name)}</td>
              <td><input type="color" value="${r.color}" data-rarity-color="${r.id}" style="width:44px;height:28px;border:none;background:none;cursor:pointer;"/></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    panel.querySelectorAll('[data-rarity-color]').forEach(input => {
      input.addEventListener('change', async () => {
        const id = input.getAttribute('data-rarity-color');
        await DataStore.updateRarity(id, { color: input.value });
        cachedMasters = await DataStore.getMasters();
        Components.showToast('レアリティカラーを更新しました', 'success');
      });
    });
  }

  return { render };
})();

window.AdminPage = AdminPage;
