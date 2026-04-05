/* ================================================================
   SEARCH — Barra de búsqueda con selector de motor
   Depende de: config.js (SEARCH_ENGINES)
   ================================================================ */

let currentEngine = 'perplexity'; // persiste en memoria durante la sesión

function initSearch() {
  const engineSelect = document.getElementById('search-engine');
  const input        = document.getElementById('search-input');
  const btn          = document.getElementById('search-btn');

  engineSelect.addEventListener('change', () => {
    currentEngine = engineSelect.value;
  });

  btn.addEventListener('click', doSearch);

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });

  input.focus();
}

function doSearch() {
  const q = document.getElementById('search-input').value.trim();
  if (!q) return;
  window.open(SEARCH_ENGINES[currentEngine](q), '_blank', 'noopener,noreferrer');
}
