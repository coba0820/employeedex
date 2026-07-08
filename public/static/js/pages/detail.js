/* ============================================================
   pages/detail.js
   社員詳細ページ: プロフィール、トレーディングカード、前後移動
   ============================================================ */

const DetailPage = (() => {
  const esc = Components.escapeHtml;

  const STAT_DESC = {
    comm: '誰とでもすぐに打ち解けられる力',
    action: '思い立ったらすぐ動ける実行力',
    planning: 'アイデアを生み出し形にする力',
    analysis: '情報を整理し、課題を見抜く力',
    idea: '新しい発想を生み出す力',
    leadership: 'チームをまとめ、引っ張る力'
  };

  const STAT_COLORS = {
    comm: '#ff5f8f',
    action: '#ff9f4a',
    planning: '#4f8dff',
    analysis: '#9b6bff',
    idea: '#2fbf82',
    leadership: '#f5a623'
  };

  function statTo100(v) { return Math.round((v || 0) * 20); }

  async function render(root, empId) {
    await DataStore.init();
    const [employees, masters] = await Promise.all([DataStore.getEmployees(), DataStore.getMasters()]);
    const emp = employees.find(e => e.id === empId);

    if (!emp) {
      root.innerHTML = `
        <div class="app-shell">
          ${Components.renderSidebar('')}
          <div class="main-content"><div class="main-inner page-enter">
            <div class="empty-state">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <h3>社員が見つかりませんでした</h3>
              <a href="/" data-link class="btn btn-primary" style="margin-top:16px;">図鑑ホームへ戻る</a>
            </div>
          </div>${Components.renderFooter()}</div>
        </div>
      `;
      Components.bindSidebar(root);
      Router.bindLinks(root);
      return;
    }

    const idx = employees.findIndex(e => e.id === empId);
    const prevEmp = employees[(idx - 1 + employees.length) % employees.length];
    const nextEmp = employees[(idx + 1) % employees.length];

    const dept = masters.departments.find(d => d.id === emp.department) || { name: emp.department, color: '#999' };
    const cardType = masters.cardTypes.find(t => t.id === emp.cardType) || { name: '', icon: 'fa-star' };
    const tenure = DataStore.calcTenure(emp.joinDate);
    const age = DataStore.calcAge(emp.birthDate);
    const isFav = DataStore.isFavorite(emp.id);

    const statBarsHtml = (masters.statLabels || []).map(sl => {
      const val = (emp.stats && emp.stats[sl.id]) || 0;
      const pct = statTo100(val);
      const color = STAT_COLORS[sl.id] || 'var(--accent)';
      return `
        <div class="stat-bar-row">
          <span class="stat-bar-name">${esc(sl.name)}</span>
          <div>
            <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%;background:${color};"></div></div>
            <div style="font-size:11px;color:var(--text-tertiary);font-weight:600;margin-top:4px;">${esc(STAT_DESC[sl.id] || '')}</div>
          </div>
          <span class="stat-bar-value">${pct}</span>
        </div>
      `;
    }).join('');

    root.innerHTML = `
      <div class="app-shell">
        ${Components.renderSidebar('')}
        <div class="main-content">
          <div class="main-inner page-enter">
        <div class="detail-topbar">
          <a href="/" data-link class="back-link"><i class="fa-solid fa-arrow-left"></i> 図鑑ホームへ戻る</a>
          <div class="detail-nav-arrows">
            <a href="/employee/${prevEmp.id}" data-link class="nav-arrow-btn">
              <i class="fa-solid fa-chevron-left"></i>
              <span class="arrow-label"><small>前の社員</small>${esc(prevEmp.name)}</span>
            </a>
            <a href="/employee/${nextEmp.id}" data-link class="nav-arrow-btn">
              <span class="arrow-label"><small>次の社員</small>${esc(nextEmp.name)}</span>
              <i class="fa-solid fa-chevron-right"></i>
            </a>
          </div>
        </div>

        <section class="detail-hero">
          <div class="detail-card-stage">
            <div class="tcard-wrap">
              <div class="tcard-3d-holder">
                ${CardRenderer.renderCard(emp, masters, { idPrefix: 'detail' })}
              </div>
              <div class="tcard-actions">
                <button class="btn btn-accent btn-sm" id="download-card-btn"><i class="fa-solid fa-download"></i> カードを保存</button>
                <button class="fav-btn-large ${isFav ? 'active' : ''}" id="fav-btn-large" data-fav-toggle="${emp.id}">
                  <i class="fa-solid fa-heart"></i> ${isFav ? 'お気に入り済み' : 'お気に入り'}
                </button>
              </div>
              <p class="tcard-hint"><i class="fa-solid fa-arrows-up-down-left-right"></i> カードを動かすとキラキラ光ります</p>
            </div>
          </div>

          <div class="detail-info-head">
            <div class="detail-badges-row">
              ${Components.renderRarityBadge(emp.rarity, masters)}
              <span class="dept-pill" style="background:${dept.color}">${esc(dept.name)}</span>
            </div>
            <div class="detail-name-row">
              <h1 class="detail-name">${esc(emp.name)}</h1>
              <span class="detail-nickname">${esc(emp.nickname)}</span>
            </div>
            <p class="detail-position">${esc(emp.position)} ／ ${esc(emp.jobDescription)}</p>
            <p class="detail-catchphrase">${esc(emp.catchphrase)}</p>

            <div class="detail-info-grid single">
              <div class="info-panel mbti">
                <span class="info-panel-label">MBTI</span>
                <div class="info-panel-value">${Components.formatMbti(emp.mbti, masters)}</div>
              </div>
            </div>

            <div class="badges-row">
              ${(emp.tags || []).map(t => Components.renderTagChip(t, masters)).join('')}
            </div>
          </div>
        </section>

        <section class="detail-sections">
          <div class="info-section">
            <h2><i class="fa-solid fa-address-card"></i> 基本情報</h2>
            <div class="info-grid">
              <div class="info-item"><div class="info-label">性別</div><div class="info-value">${esc(emp.gender)}</div></div>
              <div class="info-item"><div class="info-label">年齢</div><div class="info-value">${age !== null ? age + '歳' : '―'}</div></div>
              <div class="info-item"><div class="info-label">住んでいるエリア</div><div class="info-value">${esc(emp.area)}</div></div>
              <div class="info-item"><div class="info-label">入社年月</div><div class="info-value">${esc(DataStore.formatJoinDate(emp.joinDate))} (社歴 ${esc(tenure)})</div></div>
            </div>
          </div>

          <div class="info-section">
            <h2><i class="fa-solid fa-chart-simple"></i> パラメータ詳細</h2>
            <div class="stat-bar-list">${statBarsHtml}</div>
          </div>

          <div class="info-section">
            <h2><i class="fa-solid fa-user"></i> 人物紹介</h2>
            <div class="info-grid">
              <div class="info-item"><div class="info-label">得意なこと</div><div class="info-value">${esc(emp.strengths)}</div></div>
              <div class="info-item"><div class="info-label">苦手なこと</div><div class="info-value">${esc(emp.weaknesses)}</div></div>
              <div class="info-item"><div class="info-label">趣味</div><div class="info-value">${esc(emp.hobby)}</div></div>
              <div class="info-item"><div class="info-label">好きなもの</div><div class="info-value">${esc(emp.favorites)}</div></div>
              <div class="info-item"><div class="info-label">仕事スタイル</div><div class="info-value">${esc(emp.workStyle)}</div></div>
              <div class="info-item"><div class="info-label">性格タイプ</div><div class="info-value">${esc(emp.personalityType)}</div></div>
            </div>
          </div>

          <div class="info-section">
            <h2><i class="fa-solid fa-star"></i> 社内でのキャラクター</h2>
            <div style="margin-bottom:18px;">
              <span class="type-badge-lg"><i class="fa-solid ${cardType.icon}"></i> ${esc(cardType.name)}</span>
            </div>
            <p class="info-value" style="line-height:1.9;">${esc(emp.characterInOffice)}</p>
          </div>

          <div class="info-section">
            <h2><i class="fa-solid fa-comment-dots"></i> 自由コメント</h2>
            <div class="free-comment-box">${esc(emp.freeComment)}</div>
          </div>
        </section>
          </div>
          ${Components.renderFooter()}
        </div>
      </div>
    `;

    Components.bindSidebar(root);
    Router.bindLinks(root);

    const cardEl = document.getElementById('detail-' + emp.id);
    CardRenderer.bindTilt(cardEl);

    document.getElementById('download-card-btn').addEventListener('click', () => {
      CardRenderer.downloadCard(cardEl, `${emp.name}_カード.png`);
    });

    const favBtn = document.getElementById('fav-btn-large');
    favBtn.addEventListener('click', async () => {
      try {
        const nowFav = await DataStore.toggleFavorite(emp.id);
        favBtn.classList.toggle('active', nowFav);
        favBtn.innerHTML = `<i class="fa-solid fa-heart"></i> ${nowFav ? 'お気に入り済み' : 'お気に入り'}`;
        Components.showToast(nowFav ? 'お気に入りに追加しました' : 'お気に入りを解除しました', nowFav ? 'success' : 'default');
        document.dispatchEvent(new CustomEvent('favorites-changed'));
      } catch (err) {
        console.error(err);
        Components.showToast('お気に入りの更新に失敗しました', 'error');
      }
    });

    // Keyboard navigation
    const keyHandler = (e) => {
      if (e.key === 'ArrowLeft') Router.navigate('/employee/' + prevEmp.id);
      if (e.key === 'ArrowRight') Router.navigate('/employee/' + nextEmp.id);
    };
    document.addEventListener('keydown', keyHandler, { once: true });
  }

  return { render };
})();

window.DetailPage = DetailPage;
