/* ============================================================
   pages/home.js
   ホームページ + 検索ページの共通検索UI
   ============================================================ */

const EmployeeSearch = (() => {
  const esc = Components.escapeHtml;

  function createState() {
    return {
      keyword: '',
      department: '',
      mbti: '',
      tenureRange: '',
      gender: '',
      area: '',
      tags: [],
      sort: 'name'
    };
  }

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

  function hasSearchInput(state) {
    return !!(
      state.keyword.trim() ||
      state.department ||
      state.mbti ||
      state.tenureRange ||
      state.gender ||
      state.area.trim() ||
      state.tags.length
    );
  }

  function countActiveFilters(state) {
    let n = 0;
    if (state.department) n++;
    if (state.mbti) n++;
    if (state.gender) n++;
    if (state.area) n++;
    if (state.tenureRange) n++;
    n += state.tags.length;
    return n;
  }

  function applyFilters(employees, state) {
    return employees.filter(emp => {
      const kw = state.keyword.trim().toLowerCase();
      if (kw) {
        const hay = [emp.name, emp.nickname, emp.department, emp.position, emp.area, emp.mbti].join(' ').toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      if (state.department && emp.department !== state.department) return false;
      if (state.mbti && emp.mbti !== state.mbti) return false;
      if (state.gender && emp.gender !== state.gender) return false;
      if (state.area && !(emp.area || '').includes(state.area)) return false;
      if (state.tenureRange && !matchTenureRange(tenureYears(emp.joinDate), state.tenureRange)) return false;
      if (state.tags.length > 0) {
        const empTags = emp.tags || [];
        if (!state.tags.every(t => empTags.includes(t))) return false;
      }
      return true;
    });
  }

  function sortEmployees(employees, sortKey) {
    let list = employees.slice();
    switch (sortKey) {
      case 'new':
        list.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
        break;
      case 'tenure':
        list.sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
        break;
      case 'random':
        list = list.map(e => [Math.random(), e]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
        break;
      case 'name':
      default:
        list.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
        break;
    }
    return list;
  }

  function renderActiveFilterPills(masters, state, prefix) {
    const pills = [];
    if (state.department) {
      const d = masters.departments.find(x => x.id === state.department);
      pills.push({ key: 'department', label: '部署: ' + (d ? d.name : state.department) });
    }
    if (state.mbti) pills.push({ key: 'mbti', label: 'MBTI: ' + Components.formatMbti(state.mbti, masters) });
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
        ${pills.map(p => `<span class="active-filter-pill">${esc(p.label)} <button data-remove-filter="${prefix}" data-filter-key="${p.key}"><i class="fa-solid fa-xmark"></i></button></span>`).join('')}
        <a class="clear-filters-link" data-clear-all-filters="${prefix}" href="javascript:void(0)">すべてクリア</a>
      </div>
    `;
  }

  function renderPanel(masters, state, opts) {
    const prefix = opts.prefix;
    const filterOpen = opts.filterOpen ? ' open' : '';
    const filterActive = opts.filterOpen ? ' active' : '';
    const activeCount = countActiveFilters(state);

    return `
      <section class="search-panel ${opts.compact ? 'search-panel-compact' : ''}" id="${prefix}-search-panel">
        <div class="search-row">
          <div class="search-input-wrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" class="search-input" id="${prefix}-keyword-input" placeholder="名前・ニックネームで検索" value="${esc(state.keyword)}" />
          </div>
          <button class="filter-toggle-btn${filterActive}" id="${prefix}-filter-toggle-btn">
            <i class="fa-solid fa-sliders"></i> 絞り込み
            ${activeCount > 0 ? `<span class="count-badge">${activeCount}</span>` : ''}
          </button>
        </div>

        <div class="filter-body${filterOpen}" id="${prefix}-filter-body">
          <div class="filter-group">
            <label>部署</label>
            <select class="filter-select" id="${prefix}-filter-department">
              <option value="">すべて</option>
              ${masters.departments.map(d => `<option value="${d.id}" ${state.department === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label>MBTI</label>
            <select class="filter-select" id="${prefix}-filter-mbti">
              <option value="">すべて</option>
              ${masters.mbtiOptions.map(m => `<option value="${m}" ${state.mbti === m ? 'selected' : ''}>${Components.formatMbti(m, masters)}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label>社歴</label>
            <select class="filter-select" id="${prefix}-filter-tenure">
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
            <select class="filter-select" id="${prefix}-filter-gender">
              <option value="">すべて</option>
              ${masters.genderOptions.map(g => `<option value="${g}" ${state.gender === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label>住んでいるエリア</label>
            <input type="text" id="${prefix}-filter-area" placeholder="例: 東京都" value="${esc(state.area)}" />
          </div>
          <div class="filter-group" style="grid-column: 1 / -1;">
            <label>タグ一覧</label>
            <div class="tag-chip-select" id="${prefix}-filter-tags">
              ${masters.tags.map(t => `<span class="tag-chip ${state.tags.includes(t.id) ? 'selected' : ''}" data-tag-id="${t.id}">${t.emoji} ${esc(t.label)}</span>`).join('')}
            </div>
          </div>
        </div>

        <div id="${prefix}-active-filters-container">${renderActiveFilterPills(masters, state, prefix)}</div>
      </section>
    `;
  }

  function renderResults(container, employees, masters, state, opts) {
    if (!opts.alwaysShowResults && !hasSearchInput(state)) {
      container.innerHTML = opts.emptyBeforeSearchHtml || '';
      return;
    }

    const filtered = sortEmployees(applyFilters(employees, state), state.sort);
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-magnifying-glass"></i>
          <h3>該当する社員が見つかりませんでした</h3>
          <p>検索条件を変更してみてください</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      ${opts.showSort ? `
      <div class="sort-row">
        <div class="result-count"><b>${filtered.length}</b> 名の社員が見つかりました</div>
        <div class="sort-tabs">
          <button class="sort-tab ${state.sort === 'name' ? 'active' : ''}" data-sort="${opts.prefix}" data-sort-key="name">名前順</button>
          <button class="sort-tab ${state.sort === 'new' ? 'active' : ''}" data-sort="${opts.prefix}" data-sort-key="new">新しい順</button>
          <button class="sort-tab ${state.sort === 'tenure' ? 'active' : ''}" data-sort="${opts.prefix}" data-sort-key="tenure">社歴順</button>
          <button class="sort-tab ${state.sort === 'random' ? 'active' : ''}" data-sort="${opts.prefix}" data-sort-key="random">ランダム</button>
        </div>
      </div>` : `<div class="result-count"><b>${filtered.length}</b> 名の社員が見つかりました</div>`}
      <div class="employee-grid">${filtered.map((emp, i) => Components.renderEmployeeCard(emp, masters, { index: i })).join('')}</div>
    `;
    Components.bindFavToggles(container);
    Components.bindCardLinks(container);
    container.querySelectorAll(`[data-sort="${opts.prefix}"]`).forEach(tab => {
      tab.addEventListener('click', () => {
        state.sort = tab.getAttribute('data-sort-key');
        renderResults(container, employees, masters, state, opts);
      });
    });
  }

  function bind(root, employees, masters, state, opts) {
    const prefix = opts.prefix;
    const results = document.getElementById(`${prefix}-results`);
    const filterToggleBtn = document.getElementById(`${prefix}-filter-toggle-btn`);
    const filterBody = document.getElementById(`${prefix}-filter-body`);
    const kwInput = document.getElementById(`${prefix}-keyword-input`);
    let keywordTimer = null;
    let areaTimer = null;

    function refresh() {
      updateFilterCountBadge();
      updateActiveFiltersBar();
      renderResults(results, employees, masters, state, opts);
    }

    kwInput.addEventListener('input', () => {
      clearTimeout(keywordTimer);
      keywordTimer = setTimeout(() => {
        state.keyword = kwInput.value;
        refresh();
      }, 180);
    });

    filterToggleBtn.addEventListener('click', () => {
      filterBody.classList.toggle('open');
      filterToggleBtn.classList.toggle('active');
    });

    document.getElementById(`${prefix}-filter-department`).addEventListener('change', e => { state.department = e.target.value; refresh(); });
    document.getElementById(`${prefix}-filter-mbti`).addEventListener('change', e => { state.mbti = e.target.value; refresh(); });
    document.getElementById(`${prefix}-filter-tenure`).addEventListener('change', e => { state.tenureRange = e.target.value; refresh(); });
    document.getElementById(`${prefix}-filter-gender`).addEventListener('change', e => { state.gender = e.target.value; refresh(); });
    document.getElementById(`${prefix}-filter-area`).addEventListener('input', e => {
      clearTimeout(areaTimer);
      areaTimer = setTimeout(() => { state.area = e.target.value; refresh(); }, 220);
    });

    document.querySelectorAll(`#${prefix}-filter-tags .tag-chip`).forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.getAttribute('data-tag-id');
        if (state.tags.includes(id)) state.tags = state.tags.filter(t => t !== id);
        else state.tags.push(id);
        chip.classList.toggle('selected');
        refresh();
      });
    });

    function updateFilterCountBadge() {
      const n = countActiveFilters(state);
      const existing = filterToggleBtn.querySelector('.count-badge');
      if (n > 0) {
        if (existing) existing.textContent = n;
        else filterToggleBtn.insertAdjacentHTML('beforeend', `<span class="count-badge">${n}</span>`);
      } else if (existing) {
        existing.remove();
      }
    }

    function updateActiveFiltersBar() {
      const container = document.getElementById(`${prefix}-active-filters-container`);
      container.innerHTML = renderActiveFilterPills(masters, state, prefix);
      container.querySelectorAll(`[data-remove-filter="${prefix}"]`).forEach(btn => {
        btn.addEventListener('click', () => {
          removeFilter(btn.getAttribute('data-filter-key'));
          syncFilterInputs();
          refresh();
        });
      });
      const clearAll = container.querySelector(`[data-clear-all-filters="${prefix}"]`);
      if (clearAll) {
        clearAll.addEventListener('click', () => {
          Object.assign(state, createState());
          syncFilterInputs();
          refresh();
        });
      }
    }

    function removeFilter(key) {
      if (key.startsWith('tag:')) state.tags = state.tags.filter(t => t !== key.slice(4));
      else state[key] = '';
    }

    function syncFilterInputs() {
      kwInput.value = state.keyword;
      document.getElementById(`${prefix}-filter-department`).value = state.department;
      document.getElementById(`${prefix}-filter-mbti`).value = state.mbti;
      document.getElementById(`${prefix}-filter-tenure`).value = state.tenureRange;
      document.getElementById(`${prefix}-filter-gender`).value = state.gender;
      document.getElementById(`${prefix}-filter-area`).value = state.area;
      document.querySelectorAll(`#${prefix}-filter-tags .tag-chip`).forEach(chip => {
        chip.classList.toggle('selected', state.tags.includes(chip.getAttribute('data-tag-id')));
      });
    }

    renderResults(results, employees, masters, state, opts);
  }

  return { createState, renderPanel, bind };
})();

const HomePage = (() => {
  async function render(root) {
    await DataStore.init();
    const [employees, masters] = await Promise.all([DataStore.getEmployees(), DataStore.getMasters()]);
    const featured = employees[0];
    const state = EmployeeSearch.createState();

    root.innerHTML = `
      <div class="app-shell">
        ${Components.renderSidebar('home')}
        <div class="main-content">
          <div class="main-inner page-enter">
            <section class="hero home-hero">
              <div class="hero-left">
                <span class="hero-eyebrow"><i class="fa-solid fa-sparkles"></i> 社内プロフィールデータベース</span>
                <h1>SVS社員図鑑</h1>
                <p>社員一人ひとりの個性や強み、価値観を知り、新しいつながりを生み出すための社員図鑑です。部署や役職を超えて、お互いをもっと知るきっかけをつくります。</p>
                ${EmployeeSearch.renderPanel(masters, state, { prefix: 'home', compact: true, filterOpen: false })}
              </div>
              ${featured ? `
              <div class="hero-promo">
                <div class="hero-promo-label"><i class="fa-solid fa-star"></i> トレーディングカードでもっと楽しく！</div>
                ${CardRenderer.renderCard(featured, masters, { idPrefix: 'promo', mini: true })}
                <a href="/employee/${featured.id}" data-link class="btn btn-accent btn-sm hero-promo-link">
                  <i class="fa-solid fa-arrow-right"></i> 詳しく見る
                </a>
              </div>` : ''}
            </section>
            <div id="home-results" class="home-search-results"></div>
          </div>
          ${Components.renderFooter()}
        </div>
      </div>
    `;

    Components.bindSidebar(root);
    Router.bindLinks(root);
    EmployeeSearch.bind(root, employees, masters, state, {
      prefix: 'home',
      alwaysShowResults: true,
      showSort: true
    });
  }

  return { render };
})();

const SearchPage = (() => {
  async function render(root) {
    await DataStore.init();
    const [employees, masters] = await Promise.all([DataStore.getEmployees(), DataStore.getMasters()]);
    const state = EmployeeSearch.createState();

    root.innerHTML = `
      <div class="app-shell">
        ${Components.renderSidebar('search')}
        <div class="main-content">
          <div class="main-inner page-enter">
            <div class="page-header">
              <h1><i class="fa-solid fa-magnifying-glass"></i> 検索</h1>
              <p>条件を入力すると、該当する社員だけを表示します。</p>
            </div>
            ${EmployeeSearch.renderPanel(masters, state, { prefix: 'search', filterOpen: true })}
            <div id="search-results" class="search-results-area"></div>
          </div>
          ${Components.renderFooter()}
        </div>
      </div>
    `;

    Components.bindSidebar(root);
    EmployeeSearch.bind(root, employees, masters, state, {
      prefix: 'search',
      emptyBeforeSearchHtml: `
        <div class="empty-state search-ready-state">
          <i class="fa-solid fa-sliders"></i>
          <h3>検索条件を入力してください</h3>
          <p>入力後、ここに社員一覧が表示されます</p>
        </div>
      `
    });
  }

  return { render };
})();

window.EmployeeSearch = EmployeeSearch;
window.HomePage = HomePage;
window.SearchPage = SearchPage;
