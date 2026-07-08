/* ============================================================
   components.js
   共通UIコンポーネント（サイドバー、社員ミニカード、トースト、モーダル等）
   ============================================================ */

const Components = (() => {

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------------- Sidebar (SaaS dashboard style) ---------------- */
  const SIDEBAR_LINKS = [
    { key: 'home', path: '/', icon: 'fa-solid fa-house', label: 'ホーム' },
    { key: 'search', path: '/search', icon: 'fa-solid fa-magnifying-glass', label: '検索' },
    { key: 'random', path: '/random', icon: 'fa-solid fa-shuffle', label: 'ランダムで見る' },
    { key: 'favorites', path: '/favorites', icon: 'fa-solid fa-heart', label: 'お気に入り' }
  ];

  function renderSidebar(activeKey) {
    const navHtml = SIDEBAR_LINKS.map(l => {
      const isActive = activeKey === l.key;
      if (l.action) {
        return `
          <a href="javascript:void(0)" class="sidebar-link ${isActive ? 'active' : ''}" data-sidebar-action="${l.action}">
            <i class="${l.icon}"></i><span>${l.label}</span>
          </a>
        `;
      }
      return `
        <a href="${l.path}" data-link class="sidebar-link ${isActive ? 'active' : ''}">
          <i class="${l.icon}"></i><span>${l.label}</span>
        </a>
      `;
    }).join('');

    return `
      <div class="mobile-topbar">
        <div class="brand-mini">
          <span class="brand-mark" style="width:30px;height:30px;font-size:13px;border-radius:9px;"><i class="fa-solid fa-id-card-clip"></i></span>
          社員図鑑
        </div>
        <button class="mobile-menu-btn" id="sidebar-open-btn" aria-label="メニューを開く"><i class="fa-solid fa-bars"></i></button>
      </div>
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      <aside class="sidebar" id="app-sidebar">
        <a href="/" data-link class="sidebar-brand">
          <span class="brand-mark"><i class="fa-solid fa-id-card-clip"></i></span>
          <span>
            <span class="brand-title">社員図鑑</span>
            <span class="brand-sub">- Our Members Guide -</span>
          </span>
        </a>
        <nav class="sidebar-nav">
          ${navHtml}
          <div class="sidebar-divider"></div>
          <a href="/admin" data-link class="sidebar-link ${activeKey === 'admin' ? 'active' : ''}">
            <i class="fa-solid fa-gear"></i><span>管理</span>
          </a>
        </nav>
        <div class="sidebar-note">
          <strong><i class="fa-solid fa-comments" style="margin-right:6px;color:var(--accent);"></i>このデータベースは</strong>
          社員同士の相互理解とコミュニケーションを促進することを目的としています。
        </div>
      </aside>
    `;
  }

  function bindSidebar(root) {
    const scope = root || document;
    const sidebar = scope.querySelector ? scope.querySelector('#app-sidebar') : document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const openBtn = document.getElementById('sidebar-open-btn');
    if (openBtn && sidebar && overlay) {
      openBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('show');
      });
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
      });
      sidebar.querySelectorAll('[data-link], [data-sidebar-action]').forEach(a => {
        a.addEventListener('click', () => {
          sidebar.classList.remove('open');
          overlay.classList.remove('show');
        });
      });
    }

  }

  function renderFooter() {
    return `
      <footer class="app-footer">
        <p>社員図鑑 &mdash; 社員トレーディングカード図鑑 &middot; 社内コミュニケーション促進プロジェクト</p>
      </footer>
    `;
  }

  function renderRarityBadge(rarityId, masters) {
    const r = (masters.rarities || []).find(x => x.id === rarityId) || { label: rarityId };
    return `<span class="rarity-pill rarity-${escapeHtml(rarityId)}-bg">${escapeHtml(r.label)}</span>`;
  }

  function renderTagChip(tagId, masters, opts) {
    opts = opts || {};
    const t = (masters.tags || []).find(x => x.id === tagId);
    if (!t) return '';
    return `<span class="badge-chip" ${opts.clickable ? `data-tag-filter="${tagId}"` : ''}>${t.emoji} ${escapeHtml(t.label)}</span>`;
  }

  function renderEmployeeCard(emp, masters, opts) {
    opts = opts || {};
    const dept = (masters.departments || []).find(d => d.id === emp.department) || { name: emp.department, color: '#999' };
    const isFav = DataStore.isFavorite(emp.id);
    const delay = (opts.index || 0) * 0.03;
    const tags = (emp.tags || []).slice(0, 3).map(tid => {
      const t = (masters.tags || []).find(x => x.id === tid);
      return t ? `<span class="mini-tag">${t.emoji} ${escapeHtml(t.label)}</span>` : '';
    }).join('');

    return `
      <article class="emp-card" data-emp-id="${emp.id}" style="animation-delay:${delay}s">
        <div class="emp-card-top">
          <div class="emp-card-avatar-wrap">
            <img src="${emp.photo}" alt="${escapeHtml(emp.name)}" loading="lazy" />
            <button class="emp-card-fav-btn ${isFav ? 'active' : ''}" data-fav-toggle="${emp.id}" aria-label="お気に入り登録">
              <i class="fa-solid fa-heart"></i>
            </button>
          </div>
          <div style="min-width:0;">
            <h3 class="emp-card-name">${escapeHtml(emp.name)}</h3>
            <p class="emp-card-nickname">${escapeHtml(emp.nickname)}</p>
          </div>
        </div>
        <div class="emp-card-meta">
          <span class="dept-pill" style="background:${dept.color}">${escapeHtml(dept.name)}</span>
          <span class="mbti-pill">${escapeHtml(emp.mbti)}</span>
          ${renderRarityBadge(emp.rarity, masters)}
        </div>
        <p class="emp-card-catch">${escapeHtml(emp.catchphrase)}</p>
        <div class="emp-card-tags">${tags}</div>
      </article>
    `;
  }

  function bindFavToggles(root) {
    (root || document).querySelectorAll('[data-fav-toggle]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.getAttribute('data-fav-toggle');
        try {
          const nowFav = await DataStore.toggleFavorite(id);
          btn.classList.toggle('active', nowFav);
          showToast(nowFav ? 'お気に入りに追加しました' : 'お気に入りを解除しました', nowFav ? 'success' : 'default');
          document.dispatchEvent(new CustomEvent('favorites-changed'));
        } catch (err) {
          console.error(err);
          showToast('お気に入りの更新に失敗しました', 'error');
        }
      });
    });
  }

  function bindCardLinks(root) {
    (root || document).querySelectorAll('.emp-card[data-emp-id]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-emp-id');
        Router.navigate('/employee/' + id);
      });
    });
  }

  /* ---------------- Toast ---------------- */
  let toastContainer = null;
  function ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }
  function showToast(msg, type) {
    const c = ensureToastContainer();
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' error' : '');
    el.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'}"></i><span>${escapeHtml(msg)}</span>`;
    c.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s ease, transform .3s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(() => el.remove(), 320);
    }, 2200);
  }

  /* ---------------- Modal ---------------- */
  function openModal({ title, bodyHtml, footerHtml, onMount, size }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="${size === 'lg' ? 'max-width:820px;' : ''}">
        <div class="modal-header">
          <h3>${escapeHtml(title || '')}</h3>
          <button class="modal-close-btn" data-modal-close><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">${bodyHtml || ''}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('[data-modal-close]').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    if (onMount) onMount(overlay, close);
    return { overlay, close };
  }

  function confirmDialog(message, onConfirm) {
    const { close } = openModal({
      title: '確認',
      bodyHtml: `<p style="font-size:14.5px;color:var(--text-secondary);">${escapeHtml(message)}</p>`,
      footerHtml: `
        <button class="btn btn-ghost" data-cancel>キャンセル</button>
        <button class="btn btn-danger" data-confirm>実行する</button>
      `,
      onMount: (overlay, closeFn) => {
        overlay.querySelector('[data-cancel]').addEventListener('click', closeFn);
        overlay.querySelector('[data-confirm]').addEventListener('click', () => {
          closeFn();
          onConfirm();
        });
      }
    });
  }

  return {
    escapeHtml, renderSidebar, bindSidebar, renderFooter, renderRarityBadge, renderTagChip,
    renderEmployeeCard, bindFavToggles, bindCardLinks,
    showToast, openModal, confirmDialog
  };
})();

window.Components = Components;
