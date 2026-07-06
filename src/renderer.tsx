import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
        <title>社員図鑑 | EMPLOYEDEX</title>
        <meta name="description" content="社員一人ひとりをキャラクターとして紹介する、社内コミュニケーションのための社員トレーディングカード図鑑" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎴</text></svg>" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

        {/* Icons */}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />

        {/* Styles */}
        <link href="/static/css/style.css" rel="stylesheet" />
      </head>
      <body>
        {children}
        <div id="app">
          <div class="boot-loader">
            <div class="boot-card">
              <div class="boot-shine"></div>
              <i class="fa-solid fa-id-card-clip"></i>
            </div>
            <p>図鑑を読み込み中...</p>
          </div>
        </div>

        {/* Libraries */}
        <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>

        {/* App scripts */}
        <script src="/static/js/dataStore.js"></script>
        <script src="/static/js/components.js"></script>
        <script src="/static/js/card-renderer.js"></script>
        <script src="/static/js/pages/home.js"></script>
        <script src="/static/js/pages/detail.js"></script>
        <script src="/static/js/pages/favorites.js"></script>
        <script src="/static/js/pages/admin.js"></script>
        <script src="/static/js/app.js"></script>
      </body>
    </html>
  )
})
