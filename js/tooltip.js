/* ================================================================
   TOOLTIP — Elemento único con posicionamiento inteligente
   Depende de: favicon.js (fallback de favicon dentro del tooltip)
   ================================================================ */

function initTooltip() {
  const el = document.getElementById('tooltip');
  let showTimer = null;

  /* Delegación de eventos: un solo listener para todos los links */
  document.addEventListener('mouseover', e => {
    const anchor = e.target.closest('.card__link[aria-describedby="tooltip"]');
    if (!anchor?._tooltipData) return;

    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      _fillTooltip(el, anchor._tooltipData);
      el.style.display = 'block';
      requestAnimationFrame(() => {
        _positionTooltip(el, anchor);
        el.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => el.classList.add('visible'));
      });
    }, 300);
  });

  document.addEventListener('mouseout', e => {
    if (!e.target.closest('.card__link[aria-describedby="tooltip"]')) return;
    clearTimeout(showTimer);
    _hideTooltip(el);
  });

  /* Ocultar al hacer scroll */
  window.addEventListener('scroll', () => {
    clearTimeout(showTimer);
    _hideTooltip(el);
  }, { passive: true });
}

/* ── Rellena el contenido del tooltip ──────────────────────────── */
function _fillTooltip(el, data) {
  const favImg = el.querySelector('.tooltip__favicon');
  let fallback = 0;

  favImg.style.display = '';

  if (data.icon) {
    favImg.src     = data.icon;
    favImg.onerror = () => { favImg.style.display = 'none'; };
  } else {
    favImg.src = `https://www.google.com/s2/favicons?sz=32&domain=${data.domain}`;
    favImg.onerror = () => {
      fallback++;
      if (fallback === 1) {
        favImg.src = `https://icon.horse/icon/${data.domain}`;
      } else {
        favImg.style.display = 'none';
      }
    };
  }

  el.querySelector('.tooltip__name').textContent = data.name;
  el.querySelector('.tooltip__url').textContent  = data.url;

  const descEl = el.querySelector('.tooltip__desc');
  descEl.textContent    = data.desc;
  descEl.style.display  = data.desc ? 'block' : 'none';
}

/* ── Posicionamiento adaptativo ─────────────────────────────────── */
function _positionTooltip(el, anchor) {
  const rect = anchor.getBoundingClientRect();
  const tw   = el.offsetWidth  || 280;
  const th   = el.offsetHeight || 90;
  const vw   = window.innerWidth;
  const vh   = window.innerHeight;
  const gap  = 10;

  /* Horizontal: mostrar a la derecha si el enlace está en la mitad izquierda */
  let left = rect.right + gap;
  if (rect.left > vw / 2) left = rect.left - tw - gap;

  /* Vertical: alinear con el top del enlace, corregir si se sale */
  let top = rect.top;
  if (top + th > vh - 8) top = vh - th - 8;
  if (top < 8) top = 8;

  /* Clamp horizontal dentro del viewport */
  left = Math.max(8, Math.min(vw - tw - 8, left));

  el.style.left = `${left}px`;
  el.style.top  = `${top}px`;
}

/* ── Oculta el tooltip con transición ──────────────────────────── */
function _hideTooltip(el) {
  el.classList.remove('visible');
  el.setAttribute('aria-hidden', 'true');
  setTimeout(() => { el.style.display = 'none'; }, 160);
}
