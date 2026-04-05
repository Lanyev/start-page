/* ================================================================
   CONFIG — Toda la configuración editable de la página
   Este es el único archivo que normalmente necesitas modificar.
   ================================================================ */

/* ── Fondos de pantalla (predeterminados si no hay lista guardada) ─
   Puedes cambiarlos desde la página: menú ⋮ → «Fondos…» o el botón 🖼 junto a las flechas.
   ─────────────────────────────────────────────────────────────── */
const WALLPAPERS = [
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
  "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80",
  "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1920&q=80",
  "https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=1920&q=80",
];

const WALLPAPER_INTERVAL     = 30;
const WALLPAPER_RESUME_AFTER = 120;

/** Proxy para feeds RSS en el navegador (las peticiones salen a Internet). Cadena vacía = sin proxy (puede fallar CORS en algunos feeds). */
const CORS_PROXY = 'https://corsproxy.io/?';

const SEARCH_ENGINES = {
  perplexity: q => `https://www.perplexity.ai/search/new?q=${encodeURIComponent(q)}`,
  google:     q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  duckduckgo: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  bing:       q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  youtube:    q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
};

/* ── Datos iniciales (cajas de favoritos + lectores RSS) ───────────
   Siempre se lee primero el JSON embebido en index.html (misma base en
   cualquier navegador). Por HTTP, si data/start-page-defaults.json responde
   bien y trae cajas o lectores, sustituye ese contenido. Si el archivo
   falla, está vacío o es inválido, se mantienen los datos embebidos.
   ─────────────────────────────────────────────────────────────── */
const START_PAGE_DEFAULTS_URL = 'data/start-page-defaults.json';

/**
 * Guardar copia en localStorage del mismo equipo/navegador. Si usas REMOTE_DASHBOARD_SYNC_URL,
 * puedes poner true para tener caché cuando el servidor falle; false = solo memoria + servidor remoto.
 */
const PERSIST_DASHBOARD_TO_LOCAL_STORAGE = false;

/**
 * Con tools/local-server.mjs (página por http://…), guarda favoritos y RSS en el mismo equipo en
 * data/remote-dashboard.json vía GET/PUT /dashboard. Pon false si publicas solo estáticos sin API.
 */
const SYNC_DASHBOARD_VIA_SAME_ORIGIN = true;

/**
 * Sincronización explícita (opcional): URL que devuelve y acepta el JSON del dashboard.
 * Si no está vacía, se usa en lugar de SYNC_DASHBOARD_VIA_SAME_ORIGIN.
 * tools/sync-server-example.mjs: p. ej. http://127.0.0.1:3847/dashboard
 */
const REMOTE_DASHBOARD_SYNC_URL = '';

/** 'PUT' o 'POST' según lo que acepte tu endpoint al guardar. */
const REMOTE_DASHBOARD_SAVE_METHOD = 'PUT';

/**
 * Cabeceras extra en GET/guardado del dashboard. Con HTTP Basic en local-server.mjs no hace falta:
 * el navegador reutiliza usuario/contraseña del mismo origen. Cualquier token aquí es visible en el cliente.
 */
const REMOTE_DASHBOARD_SYNC_HEADERS = {};

/** Retraso antes de enviar cambios al servidor (ms), para agrupar varias ediciones seguidas. */
const REMOTE_DASHBOARD_SAVE_DEBOUNCE_MS = 600;

const RSS_ARTICLE_LIMIT   = 10;
const RSS_AUTO_REFRESH_MS = 15 * 60 * 1000;
