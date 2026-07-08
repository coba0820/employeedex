/* ============================================================
   pages/random.js
   ランダム社員カードページ
   ============================================================ */

const RandomPage = (() => {
  let currentId = null;

  function pickEmployee(employees) {
    if (employees.length === 0) return null;
    if (employees.length === 1) return employees[0];

    let pick = employees[Math.floor(Math.random() * employees.length)];
    while (pick.id === currentId) {
      pick = employees[Math.floor(Math.random() * employees.length)];
    }
    currentId = pick.id;
    return pick;
  }

  function renderPick(container, employees, masters) {
    const emp = pickEmployee(employees);
    if (!emp) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-user-slash"></i>
          <h3>表示できる社員がいません</h3>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="random-card-stage">
        <div class="tcard-3d-holder">
          ${CardRenderer.renderCard(emp, masters, { idPrefix: 'random' })}
        </div>
        <div class="random-actions">
          <button class="btn btn-accent" id="random-next-btn"><i class="fa-solid fa-shuffle"></i> もう一人見る</button>
          <a href="/employee/${emp.id}" data-link class="btn btn-outline"><i class="fa-solid fa-arrow-right"></i> 詳しく見る</a>
        </div>
      </div>
    `;

    CardRenderer.bindTilt(document.getElementById('random-' + emp.id));
    Router.bindLinks(container);
    document.getElementById('random-next-btn').addEventListener('click', () => {
      renderPick(container, employees, masters);
    });
  }

  async function render(root) {
    await DataStore.init();
    const [employees, masters] = await Promise.all([DataStore.getEmployees(), DataStore.getMasters()]);

    root.innerHTML = `
      <div class="app-shell">
        ${Components.renderSidebar('random')}
        <div class="main-content">
          <div class="main-inner page-enter">
            <div class="page-header text-center">
              <h1><i class="fa-solid fa-shuffle"></i> ランダムで見る</h1>
              <p>まだ知らない社員との出会いを、カードから始めましょう。</p>
            </div>
            <div id="random-card-container" class="random-page"></div>
          </div>
          ${Components.renderFooter()}
        </div>
      </div>
    `;

    Components.bindSidebar(root);
    renderPick(document.getElementById('random-card-container'), employees, masters);
  }

  return { render };
})();

window.RandomPage = RandomPage;
