/* ============================================================
   app.js
   簡易SPAルーター + アプリ起動
   ============================================================ */

const Router = (() => {
  const appEl = document.getElementById('app');

  function parseRoute(fullPath) {
    const path = (fullPath || '/').split('?')[0].split('#')[0] || '/';
    if (path === '/' || path === '') return { name: 'home' };
    if (path === '/search') return { name: 'search' };
    if (path === '/random') return { name: 'random' };
    if (path === '/favorites') return { name: 'favorites' };
    if (path === '/admin') return { name: 'admin' };
    const empMatch = path.match(/^\/employee\/([^/]+)$/);
    if (empMatch) return { name: 'detail', id: decodeURIComponent(empMatch[1]) };
    return { name: 'notfound' };
  }

  async function render(path) {
    const route = parseRoute(path);
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

    try {
      if (route.name === 'home') await HomePage.render(appEl);
      else if (route.name === 'search') await SearchPage.render(appEl);
      else if (route.name === 'random') await RandomPage.render(appEl);
      else if (route.name === 'favorites') await FavoritesPage.render(appEl);
      else if (route.name === 'admin') await AdminPage.render(appEl);
      else if (route.name === 'detail') await DetailPage.render(appEl, route.id);
      else renderNotFound();
    } catch (err) {
      console.error('Render error', err);
      renderNotFound();
    }

    bindLinks(appEl);
    hideBootLoader();
  }

  function renderNotFound() {
    appEl.innerHTML = `
      <div class="app-shell">
        ${Components.renderSidebar('')}
        <div class="main-content">
          <div class="main-inner page-enter">
            <div class="empty-state">
              <i class="fa-solid fa-compass"></i>
              <h3>ページが見つかりませんでした</h3>
              <a href="/" data-link class="btn btn-primary" style="margin-top:16px;">図鑑ホームへ戻る</a>
            </div>
          </div>
          ${Components.renderFooter()}
        </div>
      </div>
    `;
    Components.bindSidebar(appEl);
  }

  function hideBootLoader() {
    const loader = document.querySelector('.boot-loader');
    if (loader) loader.classList.add('hide');
  }

  function navigate(path) {
    if (path === location.pathname) { render(path); return; }
    history.pushState({}, '', path);
    render(path);
  }

  function bindLinks(root) {
    (root || document).querySelectorAll('[data-link]').forEach(a => {
      if (a.__routerBound) return;
      a.__routerBound = true;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const href = a.getAttribute('href');
        navigate(href);
      });
    });
  }

  window.addEventListener('popstate', () => render(location.pathname));

  return { navigate, render, bindLinks };
})();

window.Router = Router;

document.addEventListener('DOMContentLoaded', () => {
  Router.render(location.pathname);
});
