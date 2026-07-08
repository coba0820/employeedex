/* ============================================================
   card-renderer.js
   ダークネイビー・プレミアムトレーディングカードのHTML生成、
   3Dチルト演出、PNGダウンロード
   ============================================================ */

const CardRenderer = (() => {
  const esc = Components.escapeHtml;

  // 1-5段階の能力値を 100点満点表示に変換 (5→100, 4→80 ...)
  function statTo100(val) {
    return Math.round((val || 0) * 20);
  }

  function renderStatItems(stats, statLabels) {
    return (statLabels || []).map(sl => {
      const val = (stats && stats[sl.id]) || 0;
      const pct = statTo100(val);
      return `
        <div class="tcard-stat-item">
          <span class="lbl"><span>${esc(sl.name)}</span><b>${pct}</b></span>
          <div class="tcard-mini-track"><div class="tcard-mini-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    }).join('');
  }

  function sparkleSpans(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
      const top = Math.random() * 90 + 3;
      const left = Math.random() * 90 + 3;
      const delay = (Math.random() * 2.4).toFixed(2);
      html += `<span style="top:${top}%; left:${left}%; animation-delay:${delay}s;"></span>`;
    }
    return html;
  }

  function renderCard(emp, masters, opts) {
    opts = opts || {};
    const dept = (masters.departments || []).find(d => d.id === emp.department) || { name: emp.department };
    const rarity = (masters.rarities || []).find(r => r.id === emp.rarity) || { label: emp.rarity, color: '#888' };
    const cardType = (masters.cardTypes || []).find(t => t.id === emp.cardType) || { name: '', icon: 'fa-star' };
    const tenure = DataStore.calcTenure(emp.joinDate);
    const showSparkle = ['UR', 'Legend', 'SSR'].includes(emp.rarity);
    const miniClass = opts.mini ? ' tcard-mini-preview' : '';

    return `
      <div class="tcard rarity-${esc(emp.rarity)}${miniClass}" id="${opts.idPrefix || 'tcard'}-${emp.id}" data-emp-id="${emp.id}">
        <div class="tcard-rim"></div>

        <div class="tcard-header-row">
          <span class="tcard-rarity-badge" style="background:${rarity.color || '#888'}">${esc(rarity.label)}</span>
        </div>

        <div class="tcard-photo-zone">
          <img src="${emp.photo}" alt="${esc(emp.name)}" crossorigin="anonymous" />
          <div class="tcard-photo-gradient"></div>
          <div class="tcard-type-stack">
            <span class="tcard-type-icon-badge" title="${esc(cardType.name)}"><i class="fa-solid ${cardType.icon}"></i></span>
          </div>
          <span class="tcard-mbti-float">${esc(emp.mbti)}</span>
          <div class="tcard-name-overlay">
            <div class="tcard-name-plate">${esc(emp.name)}</div>
            <div class="tcard-nickname-plate">${esc(emp.nickname)}</div>
          </div>
        </div>

        <div class="tcard-catch-row">${esc(emp.catchphrase)}</div>

        <div class="tcard-dept-row">
          <span>${esc(dept.name)}</span>
          <span>社歴 ${esc(tenure)}</span>
        </div>

        <div class="tcard-stats-panel">
          ${renderStatItems(emp.stats, masters.statLabels)}
        </div>

        <div class="tcard-holo"></div>
        ${showSparkle ? `<div class="tcard-sparkles">${sparkleSpans(10)}</div>` : ''}
      </div>
    `;
  }

  function bindTilt(cardEl) {
    if (!cardEl) return;
    let rect = null;
    const strength = 12;
    function onMove(e) {
      const point = e.touches ? e.touches[0] : e;
      rect = rect || cardEl.getBoundingClientRect();
      const x = (point.clientX - rect.left) / rect.width;
      const y = (point.clientY - rect.top) / rect.height;
      const rotY = (x - 0.5) * strength * 2;
      const rotX = (0.5 - y) * strength * 2;
      cardEl.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
      const holo = cardEl.querySelector('.tcard-holo');
      if (holo) {
        holo.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
      }
    }
    function onEnter() { rect = cardEl.getBoundingClientRect(); cardEl.style.transition = 'none'; }
    function onLeave() {
      cardEl.style.transition = 'transform .5s cubic-bezier(0.16,1,0.3,1)';
      cardEl.style.transform = 'rotateX(0) rotateY(0) scale(1)';
      rect = null;
    }
    cardEl.addEventListener('mouseenter', onEnter);
    cardEl.addEventListener('mousemove', onMove);
    cardEl.addEventListener('mouseleave', onLeave);
    cardEl.addEventListener('touchstart', onEnter, { passive: true });
    cardEl.addEventListener('touchmove', onMove, { passive: true });
    cardEl.addEventListener('touchend', onLeave);
  }

  async function downloadCard(cardEl, filename) {
    if (!window.html2canvas) {
      Components.showToast('ダウンロード機能の読み込みに失敗しました', 'error');
      return;
    }
    Components.showToast('カード画像を生成中...', 'default');
    const prevTransform = cardEl.style.transform;
    cardEl.style.transform = 'none';
    cardEl.classList.add('capture-mode');
    const holo = cardEl.querySelector('.tcard-holo');
    const prevHoloBg = holo ? holo.style.backgroundPosition : null;
    if (holo) { holo.style.animationPlayState = 'paused'; holo.style.backgroundPosition = '0% 0%'; }
    const sparkles = cardEl.querySelector('.tcard-sparkles');
    const prevSparkleDisplay = sparkles ? sparkles.style.display : null;
    if (sparkles) sparkles.style.display = 'none';

    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    try {
      const canvas = await html2canvas(cardEl, {
        backgroundColor: null,
        scale: 3,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = filename || 'employee-card.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      Components.showToast('カード画像を保存しました！', 'success');
    } catch (err) {
      console.error(err);
      Components.showToast('画像の生成に失敗しました', 'error');
    } finally {
      cardEl.style.transform = prevTransform;
      cardEl.classList.remove('capture-mode');
      if (holo) { holo.style.animationPlayState = ''; if (prevHoloBg !== null) holo.style.backgroundPosition = prevHoloBg; }
      if (sparkles && prevSparkleDisplay !== null) sparkles.style.display = prevSparkleDisplay;
    }
  }

  return { renderCard, bindTilt, downloadCard, statTo100 };
})();

window.CardRenderer = CardRenderer;
