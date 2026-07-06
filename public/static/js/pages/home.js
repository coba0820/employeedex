/* ============================================================
   pages/home.js
   ホームページ: 一覧・検索・フィルタ・並び替え
   ============================================================ */

const HomePage = (() => {
  const esc = Components.escapeHtml;

  let state = {
    keyword: '',
    department: '',
    mbti: '',
    loveMbti: '',
    tenureRange: '',
    gender: '',
    area: '',
    tags: [],
    sort: 'new'
  };

  function tenureYears(joinDate) {
    const start = new Date(joinDate);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    const m = now.getMonth() - start.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < start.getDate())) years--;
    return years;
  }

  function matchTenureRange(years, range) {
    if (!range) return true;
    if (range === '0-1') return years < 1;
    if (range === '1-3') return years >= 1 && years < 3;
    if (range === '3-5') return years >= 3 && years < 5;
    if (range === '5-10') return years >= 5 && years < 10;
    if (range === '10+') return years >= 10;
    return true;
  }

  function applyFiltersAndSort(employees) {
    let list = employees.filter(emp => {
      const kw = state.keyword.trim().toLowerCase();
      if (kw) {
        const hay = (emp.name + ' ' + emp.nickname).toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      if (state.department && emp.department !== state.department) return false;
      if (state.mbti && emp.mbti !== state.mbti) return false;
      if (state.loveMbti && emp.loveMbti !== state.loveMbti) return false;
      if (state.gender && emp.gender !== state.gender) return false;
      if (state.area && !(emp.area || '').includes(state.area)) return false;
      if (state.tenureRange && !matchTenureRange(tenureYears(emp.joinDate), state.tenureRange)) return false;
      if (state.tags.length > 0) {
        const empTags = emp.tags || [];
        const hasAll = state.tags.every(t => empTags.includes(t));
        if (!hasAll) return false;
      }
      return true;
    });

    switch (state.sort) {
      case 'new':
        list.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
        break;
      case 'tenure':
        list.sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
        break;
      case 'random':
        list = list.map(e => [Math.random(), e]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
        break;
    }
    return list;
  }

  function countActiveFilters() {
    let n = 0;
    if (state.department) n++;
    if (state.mbti) n++;
    if (state.loveMbti) n++;
    if (state.gender) n++;
    if (state.area) n++;
    if (state.tenureRange) n++;
    n += state.tags.length;
    return n;
  }

  function renderActiveFilterPills(masters) {
    const pills = [];
    if (state.department) {
      const d = masters.departments.find(x => x.id === state.department);
      pills.push({ key: 'department', label: '部署: ' + (d ? d.name : state.department) });
    }
    if (state.mbti) pills.push({ key: 'mbti', label: 'MBTI: ' + state.mbti });
    if (state.loveMbti) pills.push({ key: 'loveMbti', label: '恋愛MBTI: ' + state.loveMbti });
    if (state.gender) pills.push({ key: 'gender', label: '性別: ' + state.gender });
    if (state.area) pills.push({ key: 'area', label: 'エリア: ' + state.area });
    if (state.tenureRange) {
      const map = { '0-1': '1年未満', '1-3': '1〜3年', '3-5': '3〜5年', '5-10': '5〜10年', '10+': '10年以上' };
      pills.push({ key: 'tenureRange', label: '社歴: ' + map[state.tenureRange] });
    }
    state.tags.forEach(t => {
      const tag = masters.tags.find(x => x.id === t);
      pills.push({ key: 'tag:' + t, label: (tag ? tag.emoji + ' ' + tag.label : t) });
    });

    if (pills.length === 0) return '';
    return `
      <div class="active-filters-bar">
        ${pills.map(p => `<span class="active-filter-pill">${esc(p.label)} <button data-remove-filter="${p.key}"><i class="fa-solid fa-xmark"></i></button></span>`).join('')}
        <a class="clear-filters-link" data-clear-all-filters href="javascript:void(0)">すべてクリア</a>
      </div>
    `;
  }

  async function render(root) {
    await DataStore.init();
    const [employees, masters] = await Promise.all([DataStore.getEmployees(), DataStore.getMasters()]);
    const featured = employees[0];

    root.innerHTML = `
      <div class="app-shell">
        ${Components.renderSidebar('members')}
        <div class="main-content">
          <div class="main-inner page-enter">
        <section class="hero">
          <div class="hero-left">
            <span class="hero-eyebrow"><i class="fa-solid fa-sparkles"></i> 社内プロフィールデータベース</span>
            <h1>「どんな人がいるか」を楽しく知って、<span class="accent-text">つながりをつくる</span></h1>
            <p>社員一人ひとりをキャラクターとして紹介する、社内コミュニケーションのための"社員ポケモン図鑑"。カードを集めて、まだ話したことのない同僚を見つけよう。</p>
            <div class="hero-stats">
              <div class="hero-stat"><div class="num">${employees.length}</div><div class="lbl">登録社員数</div></div>
              <div class="hero-stat"><div class="num">${masters.departments.length}</div><div class="lbl">部署数</div></div>
              <div class="hero-stat"><div class="num">${masters.tags.length}</div><div class="lbl">バッジ種類</div></div>
            </div>
          </div>
          ${featured ? `
          <div class="hero-promo">
            <div class="hero-promo-label"><i class="fa-solid fa-star"></i> トレーディングカードでもっと楽しく！</div>
            ${CardRenderer.renderCard(featured, masters, { idPrefix: 'promo', mini: true })}
            <a href="/employee/${featured.id}" data-link class="btn btn-accent btn-sm" style="width:100%;margin-top:10px;justify-content:center;">
              <i class="fa-solid fa-arrow-right"></i> 詳しく見る
            </a>
          </div>` : ''}
        </section>

        <section class="search-panel" id="search-panel">
          <div class="search-row">
            <div class="search-input-wrap">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" class="search-input" id="keyword-input" placeholder="名前・ニックネームで検索" value="${esc(state.keyword)}" />
            </div>
            <button class="filter-toggle-btn" id="filter-toggle-btn">
              <i class="fa-solid fa-sliders"></i> 絞り込み
              ${countActiveFilters() > 0 ? `<span class="count-badge">${countActiveFilters()}</span>` : ''}
            </button>
          </div>

          <div class="filter-body" id="filter-body">
            <div class="filter-group">
              <label>部署</label>
              <select class="filter-select" id="filter-department">
                <option value="">すべて</option>
                ${masters.departments.map(d => `<option value="${d.id}" ${state.department === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>MBTI</label>
              <select class="filter-select" id="filter-mbti">
                <option value="">すべて</option>
                ${masters.mbtiOptions.map(m => `<option value="${m}" ${state.mbti === m ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>恋愛MBTI</label>
              <select class="filter-select" id="filter-love-mbti">
                <option value="">すべて</option>
                ${masters.mbtiOptions.map(m => `<option value="${m}" ${state.loveMbti === m ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>社歴</label>
              <select class="filter-select" id="filter-tenure">
                <option value="">すべて</option>
                <option value="0-1" ${state.tenureRange === '0-1' ? 'selected' : ''}>1年未満</option>
                <option value="1-3" ${state.tenureRange === '1-3' ? 'selected' : ''}>1〜3年</option>
                <option value="3-5" ${state.tenureRange === '3-5' ? 'selected' : ''}>3〜5年</option>
                <option value="5-10" ${state.tenureRange === '5-10' ? 'selected' : ''}>5〜10年</option>
                <option value="10+" ${state.tenureRange === '10+' ? 'selected' : ''}>10年以上</option>
              </select>
            </div>
            <div class="filter-group">
              <label>性別</label>
              <select class="filter-select" id="filter-gender">
                <option value="">すべて</option>
                ${masters.genderOptions.map(g => `<option value="${g}" ${state.gender === g ? 'selected' : ''}>${g}</option>`).join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>住んでいるエリア</label>
              <input type="text" id="filter-area" placeholder="例: 東京都" value="${esc(state.area)}" />
            </div>
            <div class="filter-group" style="grid-column: 1 / -1;">
              <label>タグ</label>
              <div class="tag-chip-select" id="filter-tags">
                ${masters.tags.map(t => `<span class="tag-chip ${state.tags.includes(t.id) ? 'selected' : ''}" data-tag-id="${t.id}">${t.emoji} ${esc(t.label)}</span>`).join('')}
              </div>
            </div>
          </div>

          <div id="active-filters-container">${renderActiveFilterPills(masters)}</div>
        </section>

        <div class="sort-row">
          <div class="result-count" id="result-count"></div>
          <div class="sort-tabs">
            <button class="sort-tab ${state.sort === 'new' ? 'active' : ''}" data-sort="new">新しい順</button>
            <button class="sort-tab ${state.sort === 'tenure' ? 'active' : ''}" data-sort="tenure">社歴順</button>
            <button class="sort-tab ${state.sort === 'name' ? 'active' : ''}" data-sort="name">名前順</button>
            <button class="sort-tab ${state.sort === 'random' ? 'active' : ''}" data-sort="random">ランダム</button>
          </div>
        </div>

        <div class="employee-grid" id="employee-grid"></div>
          </div>
          ${Components.renderFooter()}
        </div>
      </div>
    `;

    Components.bindSidebar(root);
    renderGrid(employees, masters);
    bindEvents(employees, masters);
  }

  function renderGrid(employees, masters) {
    const grid = document.getElementById('employee-grid');
    const countEl = document.getElementById('result-count');
    const filtered = applyFiltersAndSort(employees);
    countEl.innerHTML = `<b>${filtered.length}</b> 名の社員が見つかりました`;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <i class="fa-solid fa-magnifying-glass"></i>
          <h3>該当する社員が見つかりませんでした</h3>
          <p>検索条件を変更してみてください</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map((emp, i) => Components.renderEmployeeCard(emp, masters, { index: i })).join('');
    Components.bindFavToggles(grid);
    Components.bindCardLinks(grid);
  }

  function bindEvents(employees, masters) {
    const kwInput = document.getElementById('keyword-input');
    let kwTimer = null;
    kwInput.addEventListener('input', () => {
      clearTimeout(kwTimer);
      kwTimer = setTimeout(() => {
        state.keyword = kwInput.value;
        renderGrid(employees, masters);
      }, 200);
    });

    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterBody = document.getElementById('filter-body');
    filterToggleBtn.addEventListener('click', () => {
      filterBody.classList.toggle('open');
      filterToggleBtn.classList.toggle('active');
    });

    document.getElementById('filter-department').addEventListener('change', (e) => {
      state.department = e.target.value; refreshAll();
    });
    document.getElementById('filter-mbti').addEventListener('change', (e) => {
      state.mbti = e.target.value; refreshAll();
    });
    document.getElementById('filter-love-mbti').addEventListener('change', (e) => {
      state.loveMbti = e.target.value; refreshAll();
    });
    document.getElementById('filter-tenure').addEventListener('change', (e) => {
      state.tenureRange = e.target.value; refreshAll();
    });
    document.getElementById('filter-gender').addEventListener('change', (e) => {
      state.gender = e.target.value; refreshAll();
    });
    let areaTimer = null;
    document.getElementById('filter-area').addEventListener('input', (e) => {
      clearTimeout(areaTimer);
      areaTimer = setTimeout(() => { state.area = e.target.value; refreshAll(); }, 250);
    });

    document.querySelectorAll('#filter-tags .tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.getAttribute('data-tag-id');
        if (state.tags.includes(id)) {
          state.tags = state.tags.filter(t => t !== id);
        } else {
          state.tags.push(id);
        }
        chip.classList.toggle('selected');
        refreshAll(false);
        // update badge count without full rerender of filter body (keep it open)
        updateFilterCountBadge();
        updateActiveFiltersBar(masters);
      });
    });

    document.querySelectorAll('.sort-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.sort = tab.getAttribute('data-sort');
        document.querySelectorAll('.sort-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderGrid(employees, masters);
      });
    });

    function refreshAll(fullRerender) {
      updateFilterCountBadge();
      updateActiveFiltersBar(masters);
      renderGrid(employees, masters);
    }

    function updateFilterCountBadge() {
      const n = countActiveFilters();
      const existing = filterToggleBtn.querySelector('.count-badge');
      if (n > 0) {
        if (existing) existing.textContent = n;
        else filterToggleBtn.insertAdjacentHTML('beforeend', `<span class="count-badge">${n}</span>`);
      } else if (existing) {
        existing.remove();
      }
    }

    function updateActiveFiltersBar(masters) {
      const container = document.getElementById('active-filters-container');
      container.innerHTML = renderActiveFilterPills(masters);
      container.querySelectorAll('[data-remove-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-remove-filter');
          removeFilter(key);
          syncFilterInputs(masters);
          refreshAll();
        });
      });
      const clearAll = container.querySelector('[data-clear-all-filters]');
      if (clearAll) {
        clearAll.addEventListener('click', () => {
          state = Object.assign(state, { department: '', mbti: '', loveMbti: '', tenureRange: '', gender: '', area: '', tags: [] });
          syncFilterInputs(masters);
          refreshAll();
        });
      }
    }

    function removeFilter(key) {
      if (key.startsWith('tag:')) {
        const tagId = key.slice(4);
        state.tags = state.tags.filter(t => t !== tagId);
      } else {
        state[key] = '';
      }
    }

    function syncFilterInputs(masters) {
      document.getElementById('filter-department').value = state.department;
      document.getElementById('filter-mbti').value = state.mbti;
      document.getElementById('filter-love-mbti').value = state.loveMbti;
      document.getElementById('filter-tenure').value = state.tenureRange;
      document.getElementById('filter-gender').value = state.gender;
      document.getElementById('filter-area').value = state.area;
      document.querySelectorAll('#filter-tags .tag-chip').forEach(chip => {
        chip.classList.toggle('selected', state.tags.includes(chip.getAttribute('data-tag-id')));
      });
    }
  }

  return { render };
})();

window.HomePage = HomePage;
