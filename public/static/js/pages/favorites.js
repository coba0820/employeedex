/* ============================================================
   pages/favorites.js
   お気に入り一覧ページ
   ============================================================ */

const FavoritesPage = (() => {
  async function render(root) {
    await DataStore.init();
    const [employees, masters] = await Promise.all([DataStore.getEmployees(), DataStore.getMasters()]);
    const favIds = DataStore.getFavorites();
    const favEmployees = employees.filter(e => favIds.includes(e.id));

    root.innerHTML = `
      <div class="app-shell">
        ${Components.renderSidebar('favorites')}
        <div class="main-content">
          <div class="main-inner page-enter">
            <div class="page-header">
              <h1><i class="fa-solid fa-heart" style="color:#ff4d6d;"></i> お気に入り社員</h1>
              <p>気になる社員、まだ話したことのない社員をお気に入り登録しておこう。</p>
            </div>
            <div class="employee-grid" id="favorites-grid"></div>
          </div>
          ${Components.renderFooter()}
        </div>
      </div>
    `;

    Components.bindSidebar(root);
    renderGrid(favEmployees, masters);

    document.addEventListener('favorites-changed', async () => {
      const currentFavIds = DataStore.getFavorites();
      const currentFavEmployees = employees.filter(e => currentFavIds.includes(e.id));
      renderGrid(currentFavEmployees, masters);
    });
  }

  function renderGrid(favEmployees, masters) {
    const grid = document.getElementById('favorites-grid');
    if (favEmployees.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <i class="fa-regular fa-heart"></i>
          <h3>まだお気に入りがありません</h3>
          <p>図鑑ホームで気になる社員のハートマークを押してみましょう</p>
          <a href="/" data-link class="btn btn-primary" style="margin-top:20px;">図鑑ホームへ</a>
        </div>
      `;
      Router.bindLinks(grid);
      return;
    }
    grid.innerHTML = favEmployees.map((emp, i) => Components.renderEmployeeCard(emp, masters, { index: i })).join('');
    Components.bindFavToggles(grid);
    Components.bindCardLinks(grid);
  }

  return { render };
})();

window.FavoritesPage = FavoritesPage;
