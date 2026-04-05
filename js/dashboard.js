/* ================================================================
   DASHBOARD — Estado unificado: cajas de favoritos, lectores RSS y rejilla
   Depende de: config.js (START_PAGE_DEFAULTS_URL, PERSIST_…, REMOTE_DASHBOARD_SYNC_*)
   ================================================================ */

const DASHBOARD_STORAGE_KEY = 'startPage_dashboard_v1';
const OLD_BOOKMARKS_KEY = 'startPage_bookmarks_v1';
const DASHBOARD_VERSION = 1;

/** @type {{ version: number, bookmarkColumns: number, rssColumns: number, widgets: object[], rssReaders: object[] } | null} */
let dashboard = null;
let dashboardStorageOk = false;

/** Copia validada del JSON inicial; reset y primer arranque sin storage */
let factoryDefaultsSnapshot = null;

function newEntityId(prefix) {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rnd}`;
}

function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

function createEmptyWidget() {
  return {
    id: newEntityId('w'),
    title: 'Nueva caja',
    icon: '📁',
    iconUrl: '',
    links: [],
  };
}

function createEmptyRssReader() {
  return {
    id: newEntityId('r'),
    title: 'Nuevo lector',
    feeds: [],
  };
}

function normalizeBookmarkUrl(raw) {
  let s = String(raw).trim();
  if (!s) return s;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(s)) s = 'https://' + s;
  return s;
}

function isValidHttpUrl(raw) {
  try {
    const u = new URL(normalizeBookmarkUrl(raw));
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateLinkEntry(L) {
  if (!L || typeof L !== 'object') return null;
  const name = typeof L.name === 'string' ? L.name.trim() : '';
  let url = typeof L.url === 'string' ? L.url.trim() : '';
  if (!name || !url) return null;
  try {
    url = normalizeBookmarkUrl(url);
    new URL(url);
  } catch {
    return null;
  }
  const desc = typeof L.desc === 'string' ? L.desc.trim() : '';
  const iconL = typeof L.icon === 'string' ? L.icon.trim() : '';
  const iconUrl = typeof L.iconUrl === 'string' ? L.iconUrl.trim() : '';
  const entry = { name, url };
  if (desc) entry.desc = desc;
  if (iconL) entry.icon = iconL;
  if (iconUrl) entry.iconUrl = iconUrl;
  return entry;
}

/** Valida cajas de favoritos; permite array vacío; cada caja con links[] (puede vacío) */
function sanitizeWidgets(data) {
  if (!Array.isArray(data)) return null;
  const out = [];
  for (let i = 0; i < data.length; i++) {
    const cat = data[i];
    if (!cat || typeof cat !== 'object') return null;
    const title = typeof cat.title === 'string' ? cat.title.trim() : '';
    if (!title) return null;
    const icon = typeof cat.icon === 'string' ? cat.icon : '';
    const iconUrl = typeof cat.iconUrl === 'string' ? cat.iconUrl.trim() : '';
    let id = typeof cat.id === 'string' && cat.id ? cat.id : newEntityId('w');
    const linksIn = Array.isArray(cat.links) ? cat.links : [];
    const links = [];
    for (let j = 0; j < linksIn.length; j++) {
      const L = validateLinkEntry(linksIn[j]);
      if (!L) return null;
      links.push(L);
    }
    const w = { id, title, links };
    if (icon) w.icon = icon;
    if (iconUrl) w.iconUrl = iconUrl;
    out.push(w);
  }
  return out;
}

function sanitizeRssReaders(data) {
  if (!Array.isArray(data)) return null;
  const out = [];
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (!r || typeof r !== 'object') return null;
    const title = typeof r.title === 'string' ? r.title.trim() : '';
    if (!title) return null;
    let id = typeof r.id === 'string' && r.id ? r.id : newEntityId('r');
    const feedsIn = Array.isArray(r.feeds) ? r.feeds : [];
    const feeds = [];
    for (let j = 0; j < feedsIn.length; j++) {
      const f = feedsIn[j];
      if (!f || typeof f !== 'object') return null;
      const name = typeof f.name === 'string' ? f.name.trim() : '';
      let url = typeof f.url === 'string' ? f.url.trim() : '';
      if (!name || !url) return null;
      if (!isValidHttpUrl(url)) return null;
      url = normalizeBookmarkUrl(url);
      feeds.push({ name, url });
    }
    out.push({ id, title, feeds });
  }
  return out;
}

function validateDashboardObject(d) {
  if (!d || typeof d !== 'object') return null;
  const bc = Math.min(3, Math.max(1, parseInt(d.bookmarkColumns, 10) || 2));
  const rc = Math.min(2, Math.max(0, parseInt(d.rssColumns, 10) || 1));
  const widgets = sanitizeWidgets(d.widgets);
  const rssReaders = sanitizeRssReaders(d.rssReaders);
  if (widgets === null || rssReaders === null) return null;
  return {
    version: DASHBOARD_VERSION,
    bookmarkColumns: bc,
    rssColumns: rc,
    widgets,
    rssReaders,
  };
}

/** Compatibilidad: array antiguo de categorías sin id */
function migrateLegacyBookmarksArray(arr) {
  const widgets = sanitizeWidgets(
    arr.map((c, i) => ({
      ...c,
      id: c.id || newEntityId('w'),
    })),
  );
  return widgets;
}

function minimalEmptyDashboard() {
  return {
    version: DASHBOARD_VERSION,
    bookmarkColumns: 2,
    rssColumns: 2,
    widgets: [],
    rssReaders: [],
  };
}

function cloneRssReadersWithNewIds(readers) {
  if (!Array.isArray(readers) || !readers.length) return [];
  return readers.map(r => ({
    id: newEntityId('r'),
    title: r.title,
    feeds: deepClone(r.feeds),
  }));
}

/** JSON embebido en index.html (#start-page-defaults-embed); sirve con file:// y si fetch falla */
function parseEmbeddedStartPageDefaults() {
  const el = document.getElementById('start-page-defaults-embed');
  if (!el) return null;
  let raw = el.textContent.trim().replace(/^\uFEFF/, '');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return validateDashboardObject(parsed);
  } catch {
    return null;
  }
}

function dashboardLooksEmpty(d) {
  return !d.widgets.length && !d.rssReaders.length;
}

/**
 * Datos iniciales: primero el JSON embebido en index (misma vista en todos
 * los navegadores). Por HTTP, si data/start-page-defaults.json carga bien y
 * no viene vacío, sustituye; si falla, es inválido o está vacío mientras el
 * embebido tiene datos, se mantienen los embebidos.
 */
async function loadStartPageFactoryDefaults() {
  const applyFallback = () => {
    const empty = minimalEmptyDashboard();
    const v = validateDashboardObject(empty);
    factoryDefaultsSnapshot = v || empty;
  };

  const embedded = parseEmbeddedStartPageDefaults();
  if (embedded) {
    factoryDefaultsSnapshot = embedded;
  } else {
    applyFallback();
  }

  if (location.protocol === 'file:') {
    if (!embedded) {
      console.warn(
        'Añade el bloque #start-page-defaults-embed en index.html o abre la carpeta con un servidor HTTP local.',
      );
    }
    return;
  }

  try {
    const url = new URL(START_PAGE_DEFAULTS_URL, document.baseURI).href;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = await res.json();
    const v = validateDashboardObject(parsed);
    if (!v) {
      console.warn('start-page-defaults.json: estructura no válida; se usan datos embebidos.');
      return;
    }
    if (dashboardLooksEmpty(v) && embedded && !dashboardLooksEmpty(embedded)) {
      console.warn(
        'start-page-defaults.json está vacío; se usan los datos embebidos en index.html (revisa el despliegue de la carpeta data/).',
      );
      return;
    }
    factoryDefaultsSnapshot = v;
  } catch (e) {
    console.warn(
      'No se pudo cargar start-page-defaults.json; se usan datos embebidos:',
      e && e.message ? e.message : e,
    );
  }
}

function dashboardFromFactorySnapshot() {
  return deepClone(factoryDefaultsSnapshot || minimalEmptyDashboard());
}

function getRemoteDashboardSyncUrl() {
  const explicit =
    typeof REMOTE_DASHBOARD_SYNC_URL === 'string' ? REMOTE_DASHBOARD_SYNC_URL.trim() : '';
  if (explicit) return explicit;
  const useSameOrigin =
    typeof SYNC_DASHBOARD_VIA_SAME_ORIGIN !== 'undefined' && SYNC_DASHBOARD_VIA_SAME_ORIGIN;
  if (
    useSameOrigin &&
    typeof location !== 'undefined' &&
    (location.protocol === 'http:' || location.protocol === 'https:')
  ) {
    return new URL('/dashboard', location.origin).href;
  }
  return '';
}

function remoteSyncHeaders() {
  const base =
    typeof REMOTE_DASHBOARD_SYNC_HEADERS === 'object' && REMOTE_DASHBOARD_SYNC_HEADERS !== null
      ? REMOTE_DASHBOARD_SYNC_HEADERS
      : {};
  return { ...base };
}

async function fetchRemoteDashboard() {
  const url = getRemoteDashboardSyncUrl();
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers: remoteSyncHeaders(),
    });
    if (!res.ok) return null;
    const parsed = await res.json();
    return validateDashboardObject(parsed);
  } catch (e) {
    console.warn('Sync GET:', e?.message || e);
    return null;
  }
}

function pushRemoteDashboard(jsonString) {
  const url = getRemoteDashboardSyncUrl();
  if (!url) return Promise.resolve();
  const method = String(REMOTE_DASHBOARD_SAVE_METHOD || 'PUT').toUpperCase() === 'POST' ? 'POST' : 'PUT';
  const headers = {
    'Content-Type': 'application/json',
    ...remoteSyncHeaders(),
  };
  return fetch(url, { method, headers, body: jsonString, credentials: 'include' }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });
}

let remoteSaveTimer = null;
let remoteSaveLastJson = null;

function scheduleRemoteDashboardSave(jsonString) {
  if (!getRemoteDashboardSyncUrl()) return;
  remoteSaveLastJson = jsonString;
  const delay =
    typeof REMOTE_DASHBOARD_SAVE_DEBOUNCE_MS === 'number' ? REMOTE_DASHBOARD_SAVE_DEBOUNCE_MS : 600;
  if (remoteSaveTimer) clearTimeout(remoteSaveTimer);
  remoteSaveTimer = setTimeout(() => {
    remoteSaveTimer = null;
    const body = remoteSaveLastJson;
    remoteSaveLastJson = null;
    if (!body) return;
    pushRemoteDashboard(body).catch(e => {
      console.warn('Sync guardado:', e?.message || e);
      if (typeof showToast === 'function') {
        showToast('No se pudo guardar en el servidor de sincronización.', true);
      }
    });
  }, delay);
}

function detectLocalStorage() {
  try {
    const k = '__ls_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

async function loadDashboardAsync() {
  dashboard = null;
  dashboardStorageOk = false;

  if (PERSIST_DASHBOARD_TO_LOCAL_STORAGE) {
    dashboardStorageOk = detectLocalStorage();
  }

  const remoteUrl = getRemoteDashboardSyncUrl();
  if (remoteUrl) {
    const remote = await fetchRemoteDashboard();
    if (remote) {
      dashboard = remote;
      if (PERSIST_DASHBOARD_TO_LOCAL_STORAGE && dashboardStorageOk) {
        try {
          localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashboard));
        } catch {
          dashboardStorageOk = false;
        }
      }
      return;
    }
  }

  if (PERSIST_DASHBOARD_TO_LOCAL_STORAGE) {
    if (dashboardStorageOk) {
      try {
        const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const v = validateDashboardObject(parsed);
          if (v) dashboard = v;
        }
      } catch {
        dashboard = null;
      }

      if (!dashboard) {
        try {
          const oldRaw = localStorage.getItem(OLD_BOOKMARKS_KEY);
          if (oldRaw) {
            const oldParsed = JSON.parse(oldRaw);
            if (Array.isArray(oldParsed)) {
              const widgets = migrateLegacyBookmarksArray(oldParsed);
              if (widgets) {
                const base = factoryDefaultsSnapshot || minimalEmptyDashboard();
                dashboard = {
                  version: DASHBOARD_VERSION,
                  bookmarkColumns: base.bookmarkColumns,
                  rssColumns: base.rssColumns,
                  widgets,
                  rssReaders: cloneRssReadersWithNewIds(base.rssReaders),
                };
              }
            }
          }
        } catch {
          /* ignore */
        }
      }
    }
  }

  if (!dashboard) dashboard = dashboardFromFactorySnapshot();
}

function saveDashboard() {
  if (!dashboard) return;
  const json = JSON.stringify(dashboard);

  if (PERSIST_DASHBOARD_TO_LOCAL_STORAGE && dashboardStorageOk) {
    try {
      localStorage.setItem(DASHBOARD_STORAGE_KEY, json);
    } catch {
      dashboardStorageOk = false;
      if (typeof showPersistenceWarning === 'function') showPersistenceWarning();
    }
  }

  if (getRemoteDashboardSyncUrl()) {
    scheduleRemoteDashboardSave(json);
  }
}

function getDashboard() {
  return dashboard;
}

function isDashboardStorageOk() {
  if (!PERSIST_DASHBOARD_TO_LOCAL_STORAGE) return true;
  return dashboardStorageOk;
}

/** Aplica columnas y visibilidad al DOM principal */
function applyLayoutToDom() {
  if (!dashboard) return;
  const main = document.getElementById('main-layout');
  const rssZone = document.getElementById('rss-zone');
  if (!main) return;

  main.style.setProperty('--bookmark-cols', String(dashboard.bookmarkColumns));
  main.style.setProperty('--rss-cols', String(dashboard.rssColumns));

  if (dashboard.rssColumns >= 2) {
    main.style.setProperty('--rss-track-min', '280px');
    main.style.setProperty('--rss-track-vw', '52vw');
    main.style.setProperty('--rss-track-max', '680px');
  } else {
    main.style.setProperty('--rss-track-min', '260px');
    main.style.setProperty('--rss-track-vw', '38vw');
    main.style.setProperty('--rss-track-max', '400px');
  }

  const hideRss =
    dashboard.rssColumns === 0 || !dashboard.rssReaders.length;
  main.classList.toggle('main-layout--no-rss', hideRss);
  if (rssZone) {
    rssZone.hidden = hideRss;
    /* Sticky solo si hay como máximo un widget por columna; si no, se empalman al scroll */
    const stickyOk =
      !hideRss && dashboard.rssReaders.length <= dashboard.rssColumns;
    rssZone.classList.toggle('rss-zone--sticky-widgets', stickyOk);
  }
}

function exportDashboardJson() {
  return dashboard ? JSON.stringify(dashboard, null, 2) : '{}';
}

/** Importa JSON: dashboard completo o solo array de widgets (legacy) */
function importDashboardFromText(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: 'El archivo no es JSON válido' };
  }
  if (Array.isArray(parsed)) {
    const widgets = migrateLegacyBookmarksArray(parsed);
    if (!widgets) return { ok: false, error: 'Estructura de favoritos no válida' };
    dashboard.widgets = widgets;
    saveDashboard();
    return { ok: true };
  }
  const v = validateDashboardObject(parsed);
  if (!v) return { ok: false, error: 'Estructura de página no válida' };
  dashboard = v;
  saveDashboard();
  return { ok: true };
}

function resetDashboardToFactory() {
  dashboard = dashboardFromFactorySnapshot();
  saveDashboard();
}

function applyDashboardValidated(next) {
  if (!next) return;
  dashboard = next;
  saveDashboard();
}
