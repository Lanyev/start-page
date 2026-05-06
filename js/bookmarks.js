/* ================================================================
   BOOKMARKS — Carga, persistencia, CRUD, import/export y renderizado
   Depende de: config.js, dashboard.js, favicon.js
   ================================================================ */

const BOOKMARKS_EXPORT_FILENAME = 'startpage-dashboard.json';

/** Copia de trabajo: categorías con enlaces (se sincroniza con storage o memoria) */
let bookmarksCategories = [];

function syncBookmarksFromDashboard() {
  const d = getDashboard();
  if (d) bookmarksCategories = d.widgets;
}

/** Refleja isDashboardStorageOk() (sin aviso si la persistencia en disco está desactivada en config) */
let bookmarksLocalStorageOk = false;

/** Eliminación pendiente de confirmar en el diálogo { ci, li } */
let pendingDelete = null;

/** Estado para deshacer última eliminación { catIndex, linkIndex, link } */
let deleteUndoState = null;
let deleteUndoTimer = null;

/** Si no es null, el modal de favorito está en modo edición de ese enlace */
let bookmarkModalEdit = null;

function cloneLinkEntry(link) {
  const o = { name: link.name, url: link.url };
  if (link.desc) o.desc = link.desc;
  if (link.icon) o.icon = link.icon;
  return o;
}

/** Si la cadena no tiene protocolo reconocible, antepone https:// */
function normalizeBookmarkUrl(raw) {
  let s = String(raw).trim();
  if (!s) return s;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(s)) s = 'https://' + s;
  return s;
}

/** Comprueba si la URL es válida tras normalizar */
function isValidBookmarkUrl(raw) {
  try {
    new URL(normalizeBookmarkUrl(raw));
    return true;
  } catch {
    return false;
  }
}

/* ────────────────────────────────────────────────────────────────
   loadBookmarks — Carga dashboard (cajas + RSS + columnas)
   ─────────────────────────────────────────────────────────────── */
async function loadBookmarks() {
  await loadDashboardAsync();
  bookmarksLocalStorageOk = isDashboardStorageOk();
  bookmarksCategories = getDashboard().widgets;
}

/* ────────────────────────────────────────────────────────────────
   saveBookmarks — Persiste dashboard completo
   ─────────────────────────────────────────────────────────────── */
function saveBookmarks() {
  saveDashboard();
  bookmarksLocalStorageOk = isDashboardStorageOk();
  if (!bookmarksLocalStorageOk) showPersistenceWarning();
}

/* ────────────────────────────────────────────────────────────────
   addBookmark — Inserta un enlace en la categoría indicada
   ─────────────────────────────────────────────────────────────── */
function addBookmark(categoryIndex, payload) {
  const name = String(payload.name || '').trim();
  let url = String(payload.url || '').trim();
  const desc = String(payload.desc || '').trim();
  const icon = String(payload.icon || '').trim();

  if (!name) throw new Error('El nombre es obligatorio.');
  if (!isValidBookmarkUrl(url)) throw new Error('La URL no es válida.');
  url = normalizeBookmarkUrl(url);
  new URL(url); // por si acaso

  if (!bookmarksCategories.length) throw new Error('Añade primero una caja en «Personalizar página».');

  const cat = bookmarksCategories[categoryIndex];
  if (!cat) throw new Error('Categoría no encontrada.');

  const link = { name, url };
  if (desc) link.desc = desc;
  if (icon) link.icon = icon;

  cat.links.push(link);
  saveBookmarks();
  renderBookmarks();
  showToast('Favorito añadido');
}

/* ────────────────────────────────────────────────────────────────
   updateBookmark — Actualiza un enlace; la categoría del select puede moverlo de caja
   ─────────────────────────────────────────────────────────────── */
function updateBookmark(oldCatIndex, oldLinkIndex, newCatIndex, payload) {
  const name = String(payload.name || '').trim();
  let url = String(payload.url || '').trim();
  const desc = String(payload.desc || '').trim();
  const icon = String(payload.icon || '').trim();

  if (!name) throw new Error('El nombre es obligatorio.');
  if (!isValidBookmarkUrl(url)) throw new Error('La URL no es válida.');
  url = normalizeBookmarkUrl(url);
  new URL(url);

  const oldCat = bookmarksCategories[oldCatIndex];
  if (!oldCat || !oldCat.links[oldLinkIndex]) throw new Error('Favorito no encontrado.');

  const newCat = bookmarksCategories[newCatIndex];
  if (!newCat) throw new Error('Categoría no encontrada.');

  const link = { name, url };
  if (desc) link.desc = desc;
  if (icon) link.icon = icon;

  if (newCatIndex === oldCatIndex) {
    oldCat.links[oldLinkIndex] = link;
  } else {
    oldCat.links.splice(oldLinkIndex, 1);
    newCat.links.push(link);
  }

  saveBookmarks();
  renderBookmarks();
  showToast('Favorito actualizado');
}

/* ────────────────────────────────────────────────────────────────
   deleteBookmark — Elimina por índices de categoría y enlace
   ─────────────────────────────────────────────────────────────── */
function deleteBookmark(categoryIndex, linkIndex) {
  const cat = bookmarksCategories[categoryIndex];
  if (!cat || !cat.links[linkIndex]) return;
  const linkSnapshot = cloneLinkEntry(cat.links[linkIndex]);
  cat.links.splice(linkIndex, 1);
  saveBookmarks();
  renderBookmarks();
  showBookmarkDeleteUndo(categoryIndex, linkIndex, linkSnapshot);
}

/* ────────────────────────────────────────────────────────────────
   exportBookmarks — Descarga JSON con el estado actual
   ─────────────────────────────────────────────────────────────── */
function exportBookmarks() {
  const json = exportDashboardJson();
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = BOOKMARKS_EXPORT_FILENAME;
  a.rel = 'noopener';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Favoritos exportados');
}

/* ────────────────────────────────────────────────────────────────
   importBookmarks — Aplica datos desde texto JSON validado
   ─────────────────────────────────────────────────────────────── */
function importBookmarks(jsonText) {
  const r = importDashboardFromText(jsonText);
  if (!r.ok) {
    showToast(r.error, true);
    return false;
  }
  bookmarksCategories = getDashboard().widgets;
  bookmarksLocalStorageOk = isDashboardStorageOk();
  applyLayoutToDom();
  renderBookmarks();
  rebuildRssDomAndLoad();
  rebuildCalendarDom();
  showToast('Datos importados');
  return true;
}

/* ────────────────────────────────────────────────────────────────
   resetBookmarks — Vuelve al estado del JSON inicial (data/start-page-defaults.json)
   ─────────────────────────────────────────────────────────────── */
function resetBookmarks() {
  resetDashboardToFactory();
  bookmarksCategories = getDashboard().widgets;
  bookmarksLocalStorageOk = isDashboardStorageOk();
  applyLayoutToDom();
  renderBookmarks();
  rebuildRssDomAndLoad();
  rebuildCalendarDom();
  showToast('Página restablecida a valores de fábrica');
}

/* ────────────────────────────────────────────────────────────────
   renderBookmarks — Pinta el grid desde bookmarksCategories
   ─────────────────────────────────────────────────────────────── */
function renderBookmarks() {
  const grid = document.getElementById('bookmarks-grid');
  grid.innerHTML = '';

  if (!bookmarksCategories.length) {
    const empty = document.createElement('p');
    empty.className = 'bookmarks-grid__empty';
    empty.textContent =
      'No hay cajas de favoritos. Abre el menú ⋮ y elige «Personalizar página» para crear una.';
    grid.appendChild(empty);
    return;
  }

  bookmarksCategories.forEach((cat, catIndex) => {
    const card = document.createElement('div');
    card.className = 'card';

    const head = document.createElement('div');
    head.className = 'card__head';

    const title = document.createElement('h2');
    title.className = 'card__title';
    if (cat.iconUrl) {
      const img = document.createElement('img');
      img.className = 'card__title-icon';
      img.src = cat.iconUrl;
      img.alt = '';
      img.width = 22;
      img.height = 22;
      img.loading = 'lazy';
      title.appendChild(img);
    } else {
      const ic = document.createElement('span');
      ic.setAttribute('aria-hidden', 'true');
      ic.textContent = cat.icon || '📁';
      title.appendChild(ic);
    }
    const titleText = document.createElement('span');
    titleText.className = 'card__title-text';
    titleText.textContent = cat.title;
    title.appendChild(titleText);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'card__add-btn';
    addBtn.setAttribute('aria-label', `Añadir favorito a ${cat.title}`);
    addBtn.dataset.catIndex = String(catIndex);
    addBtn.textContent = '+';

    const dragBtn = document.createElement('button');
    dragBtn.type = 'button';
    dragBtn.className = 'card__drag-btn';
    dragBtn.setAttribute('aria-label', `Mover caja ${cat.title}`);
    dragBtn.setAttribute('title', 'Arrastrar para reordenar');
    dragBtn.dataset.dragHandle = 'bookmark-card';
    dragBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M7.25 4a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 6a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm-1.25 7.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zM15.25 4a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm-1.25 7.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zm1.25 5a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z"/></svg>`;

    const headActions = document.createElement('div');
    headActions.className = 'card__head-actions';
    headActions.appendChild(dragBtn);
    headActions.appendChild(addBtn);

    head.appendChild(title);
    head.appendChild(headActions);
    card.appendChild(head);

    const ul = document.createElement('ul');
    ul.className = 'card__links';

    cat.links.forEach((link, linkIndex) => {
      let domain;
      try {
        domain = new URL(link.url).hostname;
      } catch {
        domain = '';
      }

      const li = document.createElement('li');
      li.className = 'card__item';

      const row = document.createElement('div');
      row.className = 'card__link-row';

      const a = document.createElement('a');
      const name = document.createElement('span');
      const fav = createFaviconImg(domain, 16, link.icon || null);
      fav.className = 'card__link-favicon';

      name.className = 'card__link-name';
      name.textContent = link.name;

      const desc = document.createElement('span');
      desc.className = 'card__link-desc';
      desc.textContent = link.desc || 'Favorito guardado';

      const urlLabel = document.createElement('span');
      urlLabel.className = 'card__link-url';
      urlLabel.textContent = domain || link.url;

      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'card__link';
      a.setAttribute('aria-describedby', 'tooltip');
      a._tooltipData = {
        name: link.name,
        url: link.url,
        desc: link.desc || '',
        domain,
        icon: link.icon || null,
      };

      a.appendChild(fav);
      a.appendChild(name);
      a.appendChild(desc);
      a.appendChild(urlLabel);

      const actions = document.createElement('div');
      actions.className = 'card__link-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'card__link-edit';
      editBtn.setAttribute('aria-label', `Editar ${link.name}`);
      editBtn.title = 'Editar';
      editBtn.dataset.catIndex = String(catIndex);
      editBtn.dataset.linkIndex = String(linkIndex);
      editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 4.487l-10.003 10.003-2.051.513.513-2.051 10.003-10.003 1.538 1.538zM3.75 21a.75.75 0 01-.75-.75v-4.5a.75.75 0 01.22-.53L14.467 3.47a.75.75 0 011.06 0L20.53 8.47a.75.75 0 010 1.06L8.53 20.53a.75.75 0 01-.53.22H3.75z"/></svg>`;

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'card__link-delete';
      delBtn.setAttribute('aria-label', `Eliminar ${link.name}`);
      delBtn.dataset.catIndex = String(catIndex);
      delBtn.dataset.linkIndex = String(linkIndex);
      delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.302a.75.75 0 10-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34 0a.75.75 0 10-1.5.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"/></svg>`;

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      row.appendChild(a);
      row.appendChild(actions);
      li.appendChild(row);
      ul.appendChild(li);
    });

    card.appendChild(ul);
    grid.appendChild(card);
  });
}

/* ────────────────────────────────────────────────────────────────
   UI: toast, aviso de persistencia, modal, delegación de clicks
   ─────────────────────────────────────────────────────────────── */

function showToast(message, isError = false) {
  let el = document.getElementById('app-toast');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('app-toast--error', isError);
  el.classList.add('app-toast--visible');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('app-toast--visible'), 2800);
}

function showBookmarkDeleteUndo(catIndex, linkIndex, link) {
  clearTimeout(deleteUndoTimer);
  deleteUndoState = { catIndex, linkIndex, link };

  const dlg = document.getElementById('bookmark-deleted-undo-dialog');
  const msg = document.getElementById('bookmark-deleted-undo-message');
  const btn = document.getElementById('bookmark-deleted-undo-btn');
  if (msg) msg.textContent = `Favorito eliminado: «${link.name}».`;
  dlg?.show();

  btn?.focus({ preventScroll: true });

  deleteUndoTimer = setTimeout(() => closeBookmarkDeleteUndoBar(), 8500);
}

function undoBookmarkDelete() {
  if (!deleteUndoState) return;
  const { catIndex, linkIndex, link } = deleteUndoState;
  const cat = bookmarksCategories[catIndex];
  if (!cat) {
    closeBookmarkDeleteUndoBar();
    return;
  }
  const pos = Math.min(linkIndex, cat.links.length);
  cat.links.splice(pos, 0, link);
  saveBookmarks();
  renderBookmarks();
  showToast('Favorito restaurado');
  closeBookmarkDeleteUndoBar();
}

function closeBookmarkDeleteUndoBar() {
  clearTimeout(deleteUndoTimer);
  deleteUndoTimer = null;
  deleteUndoState = null;
  document.getElementById('bookmark-deleted-undo-dialog')?.close();
}

function setupBookmarkDeleteUi() {
  const confirmDlg = document.getElementById('bookmark-delete-confirm-dialog');
  const cancelBtn    = document.getElementById('bookmark-delete-cancel');
  const confirmBtn   = document.getElementById('bookmark-delete-confirm');
  const undoBtn      = document.getElementById('bookmark-deleted-undo-btn');

  cancelBtn?.addEventListener('click', () => {
    pendingDelete = null;
    confirmDlg?.close();
  });

  confirmBtn?.addEventListener('click', () => {
    if (!pendingDelete) return;
    const { ci, li } = pendingDelete;
    pendingDelete = null;
    confirmDlg?.close();
    deleteBookmark(ci, li);
  });

  confirmDlg?.addEventListener('click', ev => {
    if (ev.target === confirmDlg) {
      pendingDelete = null;
      confirmDlg.close();
    }
  });

  confirmDlg?.addEventListener('cancel', () => {
    pendingDelete = null;
  });

  undoBtn?.addEventListener('click', () => undoBookmarkDelete());
}

function showPersistenceWarning() {
  const el = document.getElementById('storage-warning');
  if (el) el.hidden = false;
}

function hidePersistenceWarning() {
  const el = document.getElementById('storage-warning');
  if (el) el.hidden = true;
}

function updatePersistenceBanner() {
  if (!bookmarksLocalStorageOk) showPersistenceWarning();
  else hidePersistenceWarning();
}

/**
 * @param {number} [preselectedCategoryIndex]
 * @param {{ catIndex: number, linkIndex: number } | null} [editTarget]  Modo edición si se pasa
 */
function openBookmarkModal(preselectedCategoryIndex, editTarget = null) {
  const dlg = document.getElementById('bookmark-modal');
  const form = document.getElementById('bookmark-form');
  const sel = document.getElementById('bookmark-category');
  const err = document.getElementById('bookmark-form-error');
  const titleEl = document.getElementById('bookmark-modal-title');
  if (!dlg || !form) return;

  if (!bookmarksCategories.length) {
    showToast('Crea primero una caja en «Personalizar página».', true);
    return;
  }

  form.reset();
  if (err) { err.textContent = ''; err.hidden = true; }

  sel.innerHTML = '';
  bookmarksCategories.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = c.title;
    sel.appendChild(opt);
  });

  if (editTarget && Number.isFinite(editTarget.catIndex) && Number.isFinite(editTarget.linkIndex)) {
    const { catIndex: ci, linkIndex: li } = editTarget;
    const link = bookmarksCategories[ci]?.links[li];
    if (!link) {
      showToast('No se encontró el favorito.', true);
      return;
    }
    bookmarkModalEdit = { catIndex: ci, linkIndex: li };
    if (titleEl) titleEl.textContent = 'Editar favorito';
    document.getElementById('bookmark-name').value = link.name;
    document.getElementById('bookmark-url').value = link.url;
    document.getElementById('bookmark-desc').value = link.desc || '';
    document.getElementById('bookmark-icon').value = link.icon || '';
    sel.value = String(Math.min(ci, bookmarksCategories.length - 1));
  } else {
    bookmarkModalEdit = null;
    if (titleEl) titleEl.textContent = 'Añadir favorito';
    let idx = Number(preselectedCategoryIndex);
    if (!Number.isFinite(idx) || idx < 0) idx = 0;
    idx = Math.min(idx, Math.max(0, bookmarksCategories.length - 1));
    sel.value = String(idx);
  }

  dlg.showModal();
  document.getElementById('bookmark-name')?.focus();
}

function closeBookmarkModal() {
  document.getElementById('bookmark-modal')?.close();
}

function handleBookmarkFormSubmit(e) {
  e.preventDefault();
  const err = document.getElementById('bookmark-form-error');
  const name = document.getElementById('bookmark-name')?.value || '';
  const url = document.getElementById('bookmark-url')?.value || '';
  const desc = document.getElementById('bookmark-desc')?.value || '';
  const icon = document.getElementById('bookmark-icon')?.value || '';
  const catIdx = parseInt(document.getElementById('bookmark-category')?.value || '0', 10);

  if (err) { err.textContent = ''; err.hidden = true; }

  try {
    if (bookmarkModalEdit) {
      const { catIndex: oci, linkIndex: oli } = bookmarkModalEdit;
      updateBookmark(oci, oli, catIdx, { name, url, desc, icon });
    } else {
      addBookmark(catIdx, { name, url, desc, icon });
    }
    closeBookmarkModal();
  } catch (ex) {
    if (err) {
      err.textContent = ex.message || 'No se pudo guardar.';
      err.hidden = false;
    }
  }
}

function setupBookmarksGridDelegation() {
  const grid = document.getElementById('bookmarks-grid');
  if (!grid) return;

  grid.addEventListener('click', e => {
    const addBtn = e.target.closest('.card__add-btn');
    if (addBtn) {
      const i = parseInt(addBtn.dataset.catIndex, 10);
      openBookmarkModal(Number.isFinite(i) ? i : 0);
      return;
    }

    const editBtn = e.target.closest('.card__link-edit');
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      const ci = parseInt(editBtn.dataset.catIndex, 10);
      const li = parseInt(editBtn.dataset.linkIndex, 10);
      if (!bookmarksCategories[ci]?.links[li]) return;
      openBookmarkModal(ci, { catIndex: ci, linkIndex: li });
      return;
    }

    const delBtn = e.target.closest('.card__link-delete');
    if (delBtn) {
      e.preventDefault();
      e.stopPropagation();
      const ci = parseInt(delBtn.dataset.catIndex, 10);
      const li = parseInt(delBtn.dataset.linkIndex, 10);
      const link = bookmarksCategories[ci]?.links[li];
      if (!link) return;

      const textEl = document.getElementById('bookmark-delete-confirm-text');
      const dlg    = document.getElementById('bookmark-delete-confirm-dialog');
      if (textEl) {
        textEl.textContent = `¿Eliminar «${link.name}» de tus favoritos? Esta acción se puede deshacer durante unos segundos.`;
      }
      pendingDelete = { ci, li };
      dlg?.showModal();
    }
  });
}

function setupBookmarkModal() {
  const dlg = document.getElementById('bookmark-modal');
  const form = document.getElementById('bookmark-form');
  const cancel = document.getElementById('bookmark-cancel');

  form?.addEventListener('submit', handleBookmarkFormSubmit);
  cancel?.addEventListener('click', () => closeBookmarkModal());

  dlg?.addEventListener('close', () => {
    bookmarkModalEdit = null;
  });

  dlg?.addEventListener('click', ev => {
    if (ev.target === dlg) closeBookmarkModal();
  });
}

function setupBookmarksImportExport() {
  const menu    = document.getElementById('header-fav-menu');
  const trigger = document.getElementById('header-fav-menu-btn');
  const panel   = document.getElementById('header-fav-menu-panel');
  const fileInput = document.getElementById('bookmark-import-file');

  function closeFavMenu() {
    if (!menu || !trigger || !panel) return;
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  function openFavMenu() {
    if (!menu || !trigger || !panel) return;
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  }

  if (menu && trigger && panel) {
    trigger.addEventListener('click', ev => {
      ev.stopPropagation();
      if (panel.hidden) openFavMenu();
      else closeFavMenu();
    });

    menu.addEventListener('click', ev => ev.stopPropagation());

    document.addEventListener('click', () => closeFavMenu());
    document.addEventListener('keydown', ev => {
      if (ev.key === 'Escape' && !panel.hidden) {
        closeFavMenu();
        trigger.focus();
      }
    });
  }

  document.getElementById('btn-export-bookmarks')?.addEventListener('click', () => {
    exportBookmarks();
    closeFavMenu();
  });

  document.getElementById('btn-import-bookmarks')?.addEventListener('click', () => {
    fileInput?.click();
    closeFavMenu();
  });

  fileInput?.addEventListener('change', () => {
    const f = fileInput.files?.[0];
    fileInput.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      importBookmarks(text);
    };
    reader.onerror = () => showToast('No se pudo leer el archivo', true);
    reader.readAsText(f);
  });

  const resetDlg = document.getElementById('dashboard-reset-confirm-dialog');
  document.getElementById('btn-reset-bookmarks')?.addEventListener('click', () => {
    closeFavMenu();
    resetDlg?.showModal();
  });
  document.getElementById('dashboard-reset-cancel')?.addEventListener('click', () => resetDlg?.close());
  document.getElementById('dashboard-reset-confirm')?.addEventListener('click', () => {
    resetDlg?.close();
    resetBookmarks();
  });
  resetDlg?.addEventListener('click', e => {
    if (e.target === resetDlg) resetDlg.close();
  });
}

/** Punto de entrada: carga datos, UI y primer render */
async function initBookmarks() {
  await loadBookmarks();
  updatePersistenceBanner();
  applyLayoutToDom();
  setupBookmarkModal();
  setupBookmarkDeleteUi();
  setupBookmarksGridDelegation();
  setupBookmarksImportExport();
  setupDashboardCustomizeUi();
  renderBookmarks();
}
