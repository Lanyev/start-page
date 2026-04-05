/* ================================================================
   FAVICON — Utilidades de carga de iconos con fallback triple
   Usado por bookmarks.js y tooltip.js
   ================================================================ */

/**
 * Crea un <img> para el favicon con tres niveles de fallback:
 *   1. Google Favicon API
 *   2. icon.horse
 *   3. SVG de globo inline (createGlobeSvg)
 *
 * Si se pasa customIcon, se usa directamente (solo fallback al SVG).
 *
 * @param {string}      domain      — hostname sin protocolo
 * @param {number}      size        — ancho/alto en px
 * @param {string|null} customIcon  — URL/ruta de ícono personalizado (opcional)
 * @returns {HTMLImageElement}
 */
function createFaviconImg(domain, size, customIcon = null) {
  const img = document.createElement('img');
  img.width  = size;
  img.height = size;
  img.alt    = '';
  img.style.cssText = 'border-radius:3px;flex-shrink:0;object-fit:contain;';

  let fallbackLevel = 0;

  if (customIcon) {
    img.src = customIcon;
    img.addEventListener('error', () => img.replaceWith(createGlobeSvg(size)));
  } else {
    img.src = `https://www.google.com/s2/favicons?sz=${size}&domain=${domain}`;
    img.addEventListener('error', () => {
      fallbackLevel++;
      if (fallbackLevel === 1) {
        img.src = `https://icon.horse/icon/${domain}`;
      } else {
        img.replaceWith(createGlobeSvg(size));
      }
    });
  }

  return img;
}

/**
 * Crea un <span> con un SVG de globo terráqueo como último recurso.
 * Usa var(--color-primary) para el color de trazo.
 *
 * @param {number} size — ancho/alto en px
 * @returns {HTMLSpanElement}
 */
function createGlobeSvg(size) {
  const wrap = document.createElement('span');
  wrap.className = 'favicon-svg-wrap';
  wrap.style.cssText = `width:${size}px;height:${size}px;`;
  wrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"
    width="${size}" height="${size}" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/>
    <ellipse cx="8" cy="8" rx="2.75" ry="6.5" stroke="currentColor" stroke-width="1"/>
    <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="currentColor" stroke-width="1"/>
    <path d="M2.2 5.2h11.6M2.2 10.8h11.6" stroke="currentColor" stroke-width="1"/>
  </svg>`;
  return wrap;
}
