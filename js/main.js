/* ================================================================
   MAIN — Punto de entrada; inicializa todos los módulos
   Con atributo `defer` en los <script>, el DOM ya está listo aquí.
   Primero se cargan favoritos, RSS y calendario desde JSON (dashboard.js).
   ================================================================ */

async function boot() {
  try {
    await loadStartPageFactoryDefaults();
  } catch (e) {
    console.error('Error cargando datos iniciales:', e);
  }
  initWallpaper();
  initWallpaperSettingsUi();
  initClock();
  initSearch();
  initThemeToggle();
  await initBookmarks();
  initTooltip();
  initRssFeed();
  if (typeof initWidgetDragReorder === 'function') initWidgetDragReorder();
  initCalendar();
  if (typeof initInteractions === 'function') initInteractions();
}

boot();
