/* ================================================================
   WALLPAPER — Slideshow con transición crossfade + lista en localStorage
   Depende de: config.js (WALLPAPERS, WALLPAPER_INTERVAL, WALLPAPER_RESUME_AFTER)
   ================================================================ */

const WALLPAPERS_STORAGE_KEY = 'startPage_wallpapers_v1';

function wallpaperCssUrl(u) {
  return `url("${String(u).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
}

function readWallpapersStorage() {
  try {
    const raw = localStorage.getItem(WALLPAPERS_STORAGE_KEY);
    if (raw == null) return null;
    const p = JSON.parse(raw);
    if (!Array.isArray(p)) return null;
    return p.filter(x => typeof x === 'string' && x.trim());
  } catch {
    return null;
  }
}

/** @returns {boolean} false si quota u otro error */
function writeWallpapersStorage(urls) {
  try {
    localStorage.setItem(WALLPAPERS_STORAGE_KEY, JSON.stringify(urls));
    return true;
  } catch {
    return false;
  }
}

function clearWallpapersStorage() {
  try {
    localStorage.removeItem(WALLPAPERS_STORAGE_KEY);
  } catch { /* noop */ }
}

const _wp = (() => {
  const layerA = document.getElementById('wallpaper-a');
  const layerB = document.getElementById('wallpaper-b');

  let sources       = [];
  let index         = 0;
  let transitioning = false;
  let autoTimer     = null;
  let resumeTimer   = null;
  let navBound      = false;

  const FADE_MS = 1550;

  function bindNavOnce() {
    if (navBound) return;
    navBound = true;
    document.getElementById('wp-prev').addEventListener('click', () => {
      go((index - 1 + sources.length) % sources.length, true);
    });
    document.getElementById('wp-next').addEventListener('click', () => {
      go((index + 1) % sources.length, true);
    });
  }

  function setSources(next) {
    transitioning = false;
    clearTimeout(autoTimer);
    clearTimeout(resumeTimer);
    layerB.classList.remove('wp-transitioning');
    layerB.style.opacity = '0';

    sources = Array.isArray(next) ? next.filter(Boolean) : [];
    index = 0;

    if (!sources.length) {
      layerA.style.backgroundImage = '';
      layerB.style.backgroundImage = '';
      const dots = document.getElementById('wp-dots');
      if (dots) dots.innerHTML = '';
      return;
    }

    layerA.style.backgroundImage = wallpaperCssUrl(sources[0]);
    layerB.style.backgroundImage = '';
    buildDots();
    updateDots(0);
    preload(1);
    scheduleAuto();
  }

  function bootstrap(initial) {
    bindNavOnce();
    setSources(initial);
  }

  function go(newIndex, isManual = false) {
    if (transitioning || newIndex === index || sources.length < 2) return;

    transitioning = true;
    index         = newIndex;

    layerB.style.backgroundImage = wallpaperCssUrl(sources[newIndex]);

    layerB.classList.add('wp-transitioning');
    layerB.offsetHeight;
    layerB.style.opacity = '1';

    setTimeout(() => {
      layerA.style.backgroundImage = wallpaperCssUrl(sources[newIndex]);
      layerB.classList.remove('wp-transitioning');
      layerB.style.opacity = '0';
      transitioning = false;
      preload((newIndex + 1) % sources.length);
    }, FADE_MS);

    updateDots(newIndex);

    if (isManual) pauseAndResume();
  }

  function buildDots() {
    const container = document.getElementById('wp-dots');
    container.innerHTML = '';
    sources.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'wp-dot';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `Fondo ${i + 1}`);
      btn.addEventListener('click', () => go(i, true));
      container.appendChild(btn);
    });
  }

  function updateDots(i) {
    document.querySelectorAll('.wp-dot').forEach((dot, j) => {
      dot.classList.toggle('active', j === i);
      dot.setAttribute('aria-selected', String(j === i));
    });
  }

  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (sources.length < 2) return;
    autoTimer = setTimeout(() => {
      go((index + 1) % sources.length);
      scheduleAuto();
    }, WALLPAPER_INTERVAL * 1000);
  }

  function pauseAndResume() {
    clearTimeout(autoTimer);
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(scheduleAuto, WALLPAPER_RESUME_AFTER * 1000);
  }

  function preload(i) {
    if (!sources[i]) return;
    new Image().src = sources[i];
  }

  function getSources() {
    return sources.slice();
  }

  return { bootstrap, setSources, getSources };
})();

function getWallpaperSources() {
  return _wp.getSources();
}

/**
 * Aplica lista en pantalla y opcionalmente la guarda en localStorage.
 * @returns {boolean} false si falló el guardado
 */
function applyWallpaperSources(urls, persist) {
  const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (persist) {
    if (!writeWallpapersStorage(list)) return false;
  }
  _wp.setSources(list);
  return true;
}

function resetWallpapersToDefaults() {
  clearWallpapersStorage();
  _wp.setSources(WALLPAPERS.slice());
}

function initWallpaper() {
  const stored = readWallpapersStorage();
  const list = stored === null ? WALLPAPERS.slice() : stored;
  _wp.bootstrap(list);
}
