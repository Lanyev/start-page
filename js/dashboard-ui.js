/* ================================================================
   DASHBOARD UI — Modal «Personalizar página»
   Depende de: dashboard.js, bookmarks.js, rss.js, calendar.js (rebuildCalendarDom)
   ================================================================ */

let dialogDraft = null;

function syncBookmarkCategoriesFromDashboard() {
  syncBookmarksFromDashboard();
}

function renderDashboardWidgetEditor() {
  const list = document.getElementById('dash-widgets-list');
  if (!list || !dialogDraft) return;
  list.innerHTML = '';

  dialogDraft.widgets.forEach((w, i) => {
    const row = document.createElement('div');
    row.className = 'dash-widget-row';
    row.dataset.widgetId = w.id;

    const labTitle = document.createElement('label');
    labTitle.className = 'dash-field';
    labTitle.innerHTML = '<span class="dash-field__label">Nombre</span>';
    const inTitle = document.createElement('input');
    inTitle.type = 'text';
    inTitle.className = 'dash-w-title bookmark-modal__input';
    inTitle.value = w.title;
    inTitle.required = true;
    inTitle.maxLength = 80;
    labTitle.appendChild(inTitle);

    const labIcon = document.createElement('label');
    labIcon.className = 'dash-field';
    labIcon.innerHTML = '<span class="dash-field__label">Emoji</span>';
    const inIcon = document.createElement('input');
    inIcon.type = 'text';
    inIcon.className = 'dash-w-icon bookmark-modal__input';
    inIcon.value = w.icon || '📁';
    inIcon.maxLength = 8;
    labIcon.appendChild(inIcon);

    const labUrl = document.createElement('label');
    labUrl.className = 'dash-field dash-field--grow';
    labUrl.innerHTML = '<span class="dash-field__label">Icono URL (opcional)</span>';
    const inUrl = document.createElement('input');
    inUrl.type = 'url';
    inUrl.className = 'dash-w-iconurl bookmark-modal__input';
    inUrl.placeholder = 'https://…';
    inUrl.value = w.iconUrl || '';
    labUrl.appendChild(inUrl);

    const actions = document.createElement('div');
    actions.className = 'dash-row-actions';
    actions.innerHTML = `
      <button type="button" class="dash-icon-btn" data-dash-w="up" data-index="${i}" title="Subir">↑</button>
      <button type="button" class="dash-icon-btn" data-dash-w="down" data-index="${i}" title="Bajar">↓</button>
      <button type="button" class="dash-icon-btn dash-icon-btn--danger" data-dash-w="del" data-index="${i}" title="Eliminar caja">✕</button>`;

    row.appendChild(labTitle);
    row.appendChild(labIcon);
    row.appendChild(labUrl);
    row.appendChild(actions);
    list.appendChild(row);
  });
}

function renderDashboardRssEditor() {
  const list = document.getElementById('dash-rss-readers-list');
  if (!list || !dialogDraft) return;
  list.innerHTML = '';

  dialogDraft.rssReaders.forEach((reader, ri) => {
    const block = document.createElement('div');
    block.className = 'dash-rss-block';
    block.dataset.readerId = reader.id;

    const head = document.createElement('div');
    head.className = 'dash-rss-block__head';

    const lab = document.createElement('label');
    lab.className = 'dash-field dash-field--grow';
    lab.innerHTML = '<span class="dash-field__label">Nombre del lector</span>';
    const inTitle = document.createElement('input');
    inTitle.type = 'text';
    inTitle.className = 'dash-rss-title bookmark-modal__input';
    inTitle.value = reader.title;
    inTitle.required = true;
    lab.appendChild(inTitle);

    const headAct = document.createElement('div');
    headAct.className = 'dash-row-actions';
    headAct.innerHTML = `
      <button type="button" class="dash-icon-btn" data-dash-r="up" data-index="${ri}">↑</button>
      <button type="button" class="dash-icon-btn" data-dash-r="down" data-index="${ri}">↓</button>
      <button type="button" class="dash-icon-btn dash-icon-btn--danger" data-dash-r="del" data-index="${ri}">✕</button>`;

    head.appendChild(lab);
    head.appendChild(headAct);

    const feedsWrap = document.createElement('div');
    feedsWrap.className = 'dash-feeds-wrap';
    const feedsLabel = document.createElement('p');
    feedsLabel.className = 'dash-feeds-label';
    feedsLabel.textContent = 'Feeds (nombre + URL)';
    feedsWrap.appendChild(feedsLabel);

    const feedsList = document.createElement('div');
    feedsList.className = 'dash-feeds-list';
    feedsList.dataset.readerIndex = String(ri);

    reader.feeds.forEach((f, fi) => {
      feedsList.appendChild(createFeedRow(ri, fi, f.name, f.url));
    });
    feedsWrap.appendChild(feedsList);

    const addFeedBtn = document.createElement('button');
    addFeedBtn.type = 'button';
    addFeedBtn.className = 'bookmark-modal__btn bookmark-modal__btn--secondary dash-add-feed';
    addFeedBtn.dataset.readerIndex = String(ri);
    addFeedBtn.textContent = '+ Añadir feed';
    feedsWrap.appendChild(addFeedBtn);

    block.appendChild(head);
    block.appendChild(feedsWrap);
    list.appendChild(block);
  });
}

function createFeedRow(readerIndex, feedIndex, name, url) {
  const row = document.createElement('div');
  row.className = 'dash-feed-row';
  row.dataset.readerIndex = String(readerIndex);
  row.dataset.feedIndex = String(feedIndex);

  const n = document.createElement('input');
  n.type = 'text';
  n.className = 'dash-feed-name bookmark-modal__input';
  n.placeholder = 'Nombre';
  n.value = name;

  const u = document.createElement('input');
  u.type = 'url';
  u.className = 'dash-feed-url bookmark-modal__input';
  u.placeholder = 'https://…';
  u.value = url;

  const act = document.createElement('div');
  act.className = 'dash-row-actions';
  act.innerHTML = `
    <button type="button" class="dash-icon-btn" data-dash-f="up" data-ri="${readerIndex}" data-fi="${feedIndex}">↑</button>
    <button type="button" class="dash-icon-btn" data-dash-f="down" data-ri="${readerIndex}" data-fi="${feedIndex}">↓</button>
    <button type="button" class="dash-icon-btn dash-icon-btn--danger" data-dash-f="del" data-ri="${readerIndex}" data-fi="${feedIndex}">✕</button>`;

  row.appendChild(n);
  row.appendChild(u);
  row.appendChild(act);
  return row;
}

function readDraftFromDom() {
  const colsBm = parseInt(document.getElementById('dash-bookmark-cols')?.value || '2', 10);
  const colsRss = parseInt(document.getElementById('dash-rss-cols')?.value || '1', 10);
  dialogDraft.bookmarkColumns = Math.min(3, Math.max(1, colsBm));
  dialogDraft.rssColumns = Math.min(2, Math.max(0, colsRss));

  const oldById = Object.fromEntries(dialogDraft.widgets.map(w => [w.id, w]));

  const widgets = [];
  document.querySelectorAll('#dash-widgets-list .dash-widget-row').forEach(row => {
    const id = row.dataset.widgetId;
    const title = row.querySelector('.dash-w-title')?.value.trim() || '';
    const icon = row.querySelector('.dash-w-icon')?.value.trim() || '📁';
    const iconUrl = row.querySelector('.dash-w-iconurl')?.value.trim() || '';
    const prev = oldById[id];
    const links = prev ? deepClone(prev.links) : [];
    const w = { id, title, links };
    if (icon) w.icon = icon;
    if (iconUrl) w.iconUrl = iconUrl;
    widgets.push(w);
  });
  dialogDraft.widgets = widgets;

  const readers = [];
  document.querySelectorAll('#dash-rss-readers-list .dash-rss-block').forEach(block => {
    const id = block.dataset.readerId;
    const title = block.querySelector('.dash-rss-title')?.value.trim() || '';
    const feeds = [];
    block.querySelectorAll('.dash-feed-row').forEach(fr => {
      const name = fr.querySelector('.dash-feed-name')?.value.trim() || '';
      const url = fr.querySelector('.dash-feed-url')?.value.trim() || '';
      feeds.push({ name, url });
    });
    readers.push({ id, title, feeds });
  });
  dialogDraft.rssReaders = readers;

  const calEvents = [];
  document.querySelectorAll('#dash-calendar-events-list .dash-cal-row').forEach(row => {
    const id = row.dataset.eventId;
    const title = row.querySelector('.dash-cal-title')?.value.trim() || '';
    const date = row.querySelector('.dash-cal-date')?.value || '';
    let timeVal = row.querySelector('.dash-cal-time')?.value || '';
    if (timeVal.length >= 5) timeVal = timeVal.slice(0, 5);
    else timeVal = '';
    const notes = row.querySelector('.dash-cal-notes')?.value.trim() || '';
    const o = { id, title, date };
    if (timeVal) o.time = timeVal;
    if (notes) o.notes = notes;
    calEvents.push(o);
  });
  dialogDraft.calendarEvents = calEvents;
}

function createEmptyCalendarDraftEvent() {
  const t = new Date();
  const ymd = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  return { id: newEntityId('cal'), title: 'Nuevo evento', date: ymd };
}

function renderDashboardCalendarEditor() {
  const list = document.getElementById('dash-calendar-events-list');
  if (!list || !dialogDraft) return;
  list.innerHTML = '';

  if (!Array.isArray(dialogDraft.calendarEvents)) dialogDraft.calendarEvents = [];

  dialogDraft.calendarEvents.forEach((ev, i) => {
    const row = document.createElement('div');
    row.className = 'dash-cal-row';
    row.dataset.eventId = ev.id;

    const title = document.createElement('input');
    title.type = 'text';
    title.className = 'dash-cal-title bookmark-modal__input';
    title.placeholder = 'Título';
    title.required = true;
    title.value = ev.title || '';

    const date = document.createElement('input');
    date.type = 'date';
    date.className = 'dash-cal-date bookmark-modal__input';
    date.required = true;
    date.value = ev.date || '';

    const time = document.createElement('input');
    time.type = 'time';
    time.className = 'dash-cal-time bookmark-modal__input';
    time.value = ev.time || '';

    const notes = document.createElement('input');
    notes.type = 'text';
    notes.className = 'dash-cal-notes bookmark-modal__input';
    notes.placeholder = 'Notas (opcional)';
    notes.value = ev.notes || '';

    const act = document.createElement('div');
    act.className = 'dash-row-actions';
    act.innerHTML = `
      <button type="button" class="dash-icon-btn" data-dash-cal="up" data-index="${i}" title="Subir">↑</button>
      <button type="button" class="dash-icon-btn" data-dash-cal="down" data-index="${i}" title="Bajar">↓</button>
      <button type="button" class="dash-icon-btn dash-icon-btn--danger" data-dash-cal="del" data-index="${i}" title="Eliminar">✕</button>`;

    row.appendChild(title);
    row.appendChild(date);
    row.appendChild(time);
    row.appendChild(act);
    row.appendChild(notes);
    list.appendChild(row);
  });
}

function openDashboardCustomize() {
  dialogDraft = deepClone(getDashboard());
  const dlg = document.getElementById('dashboard-customize-dialog');
  const colsBm = document.getElementById('dash-bookmark-cols');
  const colsRss = document.getElementById('dash-rss-cols');
  if (colsBm) colsBm.value = String(dialogDraft.bookmarkColumns);
  if (colsRss) colsRss.value = String(dialogDraft.rssColumns);
  renderDashboardWidgetEditor();
  renderDashboardRssEditor();
  renderDashboardCalendarEditor();
  dlg?.showModal();
}

function applyDashboardDialogSave() {
  readDraftFromDom();
  const v = validateDashboardObject(dialogDraft);
  if (!v) {
    showToast('Revisa los datos: títulos obligatorios y URLs de feeds válidas (https).', true);
    return;
  }
  applyDashboardValidated(v);
  syncBookmarkCategoriesFromDashboard();
  applyLayoutToDom();
  renderBookmarks();
  rebuildRssDomAndLoad();
  rebuildCalendarDom();
  document.getElementById('dashboard-customize-dialog')?.close();
  showToast('Página actualizada');
}

function setupDashboardCustomizeUi() {
  const dlg = document.getElementById('dashboard-customize-dialog');
  const btnOpen = document.getElementById('btn-dashboard-customize');
  const btnSave = document.getElementById('dashboard-customize-save');
  const btnCancel = document.getElementById('dashboard-customize-cancel');

  btnOpen?.addEventListener('click', () => {
    openDashboardCustomize();
    document.getElementById('header-fav-menu-panel')?.setAttribute('hidden', '');
    document.getElementById('header-fav-menu-btn')?.setAttribute('aria-expanded', 'false');
  });

  btnSave?.addEventListener('click', () => applyDashboardDialogSave());

  btnCancel?.addEventListener('click', () => dlg?.close());

  document.getElementById('dash-add-widget')?.addEventListener('click', () => {
    if (!dialogDraft) return;
    readDraftFromDom();
    dialogDraft.widgets.push(createEmptyWidget());
    renderDashboardWidgetEditor();
    renderDashboardRssEditor();
    renderDashboardCalendarEditor();
  });

  document.getElementById('dash-add-rss-reader')?.addEventListener('click', () => {
    if (!dialogDraft) return;
    readDraftFromDom();
    dialogDraft.rssReaders.push(createEmptyRssReader());
    renderDashboardWidgetEditor();
    renderDashboardRssEditor();
    renderDashboardCalendarEditor();
  });

  document.getElementById('dash-add-calendar-event')?.addEventListener('click', () => {
    if (!dialogDraft) return;
    readDraftFromDom();
    if (!Array.isArray(dialogDraft.calendarEvents)) dialogDraft.calendarEvents = [];
    dialogDraft.calendarEvents.push(createEmptyCalendarDraftEvent());
    renderDashboardWidgetEditor();
    renderDashboardRssEditor();
    renderDashboardCalendarEditor();
  });

  dlg?.addEventListener('click', e => {
    if (e.target === dlg) {
      dlg.close();
      return;
    }

    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    const w = t.closest('[data-dash-w]');
    if (w && dialogDraft) {
      const act = w.getAttribute('data-dash-w');
      const i = parseInt(w.getAttribute('data-index'), 10);
      if (act === 'up' && i > 0) {
        readDraftFromDom();
        [dialogDraft.widgets[i - 1], dialogDraft.widgets[i]] = [dialogDraft.widgets[i], dialogDraft.widgets[i - 1]];
        renderDashboardWidgetEditor();
        renderDashboardRssEditor();
      }
      if (act === 'down' && i < dialogDraft.widgets.length - 1) {
        readDraftFromDom();
        [dialogDraft.widgets[i + 1], dialogDraft.widgets[i]] = [dialogDraft.widgets[i], dialogDraft.widgets[i + 1]];
        renderDashboardWidgetEditor();
        renderDashboardRssEditor();
      }
      if (act === 'del') {
        if (!confirm('¿Eliminar esta caja de favoritos y todos sus enlaces?')) return;
        readDraftFromDom();
        dialogDraft.widgets.splice(i, 1);
        renderDashboardWidgetEditor();
        renderDashboardRssEditor();
      }
      return;
    }

    const r = t.closest('[data-dash-r]');
    if (r && dialogDraft) {
      const act = r.getAttribute('data-dash-r');
      const i = parseInt(r.getAttribute('data-index'), 10);
      if (act === 'up' && i > 0) {
        readDraftFromDom();
        [dialogDraft.rssReaders[i - 1], dialogDraft.rssReaders[i]] =
          [dialogDraft.rssReaders[i], dialogDraft.rssReaders[i - 1]];
        renderDashboardWidgetEditor();
        renderDashboardRssEditor();
      }
      if (act === 'down' && i < dialogDraft.rssReaders.length - 1) {
        readDraftFromDom();
        [dialogDraft.rssReaders[i + 1], dialogDraft.rssReaders[i]] =
          [dialogDraft.rssReaders[i], dialogDraft.rssReaders[i + 1]];
        renderDashboardWidgetEditor();
        renderDashboardRssEditor();
      }
      if (act === 'del') {
        if (!confirm('¿Eliminar este lector RSS y todos los feeds que contiene?')) return;
        readDraftFromDom();
        dialogDraft.rssReaders.splice(i, 1);
        renderDashboardWidgetEditor();
        renderDashboardRssEditor();
      }
      return;
    }

    const f = t.closest('[data-dash-f]');
    if (f && dialogDraft) {
      const act = f.getAttribute('data-dash-f');
      const ri = parseInt(f.getAttribute('data-ri'), 10);
      const fi = parseInt(f.getAttribute('data-fi'), 10);
      readDraftFromDom();
      const reader = dialogDraft.rssReaders[ri];
      if (!reader) return;
      if (act === 'up' && fi > 0) {
        [reader.feeds[fi - 1], reader.feeds[fi]] = [reader.feeds[fi], reader.feeds[fi - 1]];
      }
      if (act === 'down' && fi < reader.feeds.length - 1) {
        [reader.feeds[fi + 1], reader.feeds[fi]] = [reader.feeds[fi], reader.feeds[fi + 1]];
      }
      if (act === 'del') {
        if (!confirm('¿Eliminar este feed del lector?')) return;
        reader.feeds.splice(fi, 1);
      }
      renderDashboardWidgetEditor();
      renderDashboardRssEditor();
      return;
    }

    const cal = t.closest('[data-dash-cal]');
    if (cal && dialogDraft) {
      const act = cal.getAttribute('data-dash-cal');
      const i = parseInt(cal.getAttribute('data-index'), 10);
      readDraftFromDom();
      const arr = dialogDraft.calendarEvents;
      if (!Array.isArray(arr)) return;
      if (act === 'up' && i > 0) {
        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      }
      if (act === 'down' && i < arr.length - 1) {
        [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
      }
      if (act === 'del') {
        if (!confirm('¿Eliminar este evento del calendario?')) return;
        arr.splice(i, 1);
      }
      renderDashboardWidgetEditor();
      renderDashboardRssEditor();
      renderDashboardCalendarEditor();
      return;
    }

    if (t.classList.contains('dash-add-feed')) {
      const ri = parseInt(t.dataset.readerIndex, 10);
      if (!dialogDraft || !dialogDraft.rssReaders[ri]) return;
      readDraftFromDom();
      dialogDraft.rssReaders[ri].feeds.push({ name: 'Feed', url: 'https://' });
      renderDashboardWidgetEditor();
      renderDashboardRssEditor();
      renderDashboardCalendarEditor();
    }
  });
}
