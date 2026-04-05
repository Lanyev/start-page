/* ================================================================
   CALENDARIO — Vista mensual y eventos en dashboard.calendarEvents[]
   Depende de: dashboard.js, bookmarks.js (showToast)
   ================================================================ */

const CAL_DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

let calViewYear;
let calViewMonth;
/** @type {string} YYYY-MM-DD */
let calSelectedYmd;

function calPad2(n) {
  return String(n).padStart(2, '0');
}

function calTodayYmd() {
  const t = new Date();
  return `${t.getFullYear()}-${calPad2(t.getMonth() + 1)}-${calPad2(t.getDate())}`;
}

function calYmdFromDate(d) {
  return `${d.getFullYear()}-${calPad2(d.getMonth() + 1)}-${calPad2(d.getDate())}`;
}

function calParseYmd(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(y, mo - 1, day);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== day) return null;
  return d;
}

function calEventsWithDotSet() {
  const dash = getDashboard();
  if (!dash || !Array.isArray(dash.calendarEvents)) return new Set();
  return new Set(dash.calendarEvents.map(e => e.date));
}

function calEventsForDay(ymd) {
  const dash = getDashboard();
  if (!dash || !Array.isArray(dash.calendarEvents)) return [];
  return dash.calendarEvents
    .filter(e => e.date === ymd)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

function calEnsureViewState() {
  if (calViewYear == null || calViewMonth == null) {
    const t = new Date();
    calViewYear = t.getFullYear();
    calViewMonth = t.getMonth();
  }
  if (!calSelectedYmd) calSelectedYmd = calTodayYmd();
}

function calMonthLabel(y, m) {
  const d = new Date(y, m, 1);
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function calBuildMonthGridCells(year, month) {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells = [];
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = 0; i < startPad; i++) {
    const day = prevLast - startPad + i + 1;
    const d = new Date(year, month - 1, day);
    cells.push({ ymd: calYmdFromDate(d), inMonth: false });
  }
  for (let day = 1; day <= lastDate; day++) {
    cells.push({ ymd: `${year}-${calPad2(month + 1)}-${calPad2(day)}`, inMonth: true });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const d = new Date(year, month + 1, nextDay);
    cells.push({ ymd: calYmdFromDate(d), inMonth: false });
    nextDay++;
  }
  return cells;
}

function renderCalendarWidget() {
  const zone = document.getElementById('calendar-zone');
  if (!zone) return;

  calEnsureViewState();
  const today = calTodayYmd();
  const dotSet = calEventsWithDotSet();
  const y = calViewYear;
  const mo = calViewMonth;
  const cells = calBuildMonthGridCells(y, mo);

  const selectedEvents = calEventsForDay(calSelectedYmd);
  const selDate = calParseYmd(calSelectedYmd);
  const listHead = selDate
    ? selDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  zone.innerHTML = '';
  zone.className = 'calendar-widget';

  const header = document.createElement('div');
  header.className = 'calendar-widget__header';
  const h2 = document.createElement('h2');
  h2.className = 'calendar-widget__title';
  h2.id = 'calendar-widget-heading';
  h2.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.25 2.25 0 0118 6.25v11.5A2.25 2.25 0 0115.75 20H4.25A2.25 2.25 0 012 17.75V6.25A2.25 2.25 0 014.25 4H5V2.75A.75.75 0 015.75 2zm-1 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h11.5a.75.75 0 00.75-.75v-8.5a.75.75 0 00-.75-.75H4.75z" clip-rule="evenodd"/>
    </svg>
    <span>Calendario</span>`;
  const actions = document.createElement('div');
  actions.className = 'calendar-widget__actions';
  const btnAdd = document.createElement('button');
  btnAdd.type = 'button';
  btnAdd.className = 'calendar-widget__icon-btn';
  btnAdd.dataset.calAdd = '';
  btnAdd.title = 'Añadir evento';
  btnAdd.setAttribute('aria-label', 'Añadir evento');
  btnAdd.textContent = '+';
  actions.appendChild(btnAdd);
  header.appendChild(h2);
  header.appendChild(actions);

  const nav = document.createElement('div');
  nav.className = 'calendar-widget__month-nav';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'calendar-widget__icon-btn';
  prev.dataset.calPrev = '';
  prev.setAttribute('aria-label', 'Mes anterior');
  prev.textContent = '‹';
  const label = document.createElement('p');
  label.className = 'calendar-widget__month-label';
  label.textContent = calMonthLabel(y, mo);
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'calendar-widget__icon-btn';
  next.dataset.calNext = '';
  next.setAttribute('aria-label', 'Mes siguiente');
  next.textContent = '›';
  nav.appendChild(prev);
  nav.appendChild(label);
  nav.appendChild(next);

  const gridWrap = document.createElement('div');
  gridWrap.className = 'calendar-widget__grid-wrap';
  const dow = document.createElement('div');
  dow.className = 'calendar-widget__dow';
  dow.setAttribute('aria-hidden', 'true');
  CAL_DOW.forEach(l => {
    const s = document.createElement('span');
    s.textContent = l;
    dow.appendChild(s);
  });
  const grid = document.createElement('div');
  grid.className = 'calendar-widget__grid';
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-labelledby', 'calendar-widget-heading');

  cells.forEach(({ ymd, inMonth }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'calendar-widget__day';
    btn.dataset.calDay = ymd;
    btn.textContent = String(Number(ymd.slice(8)));
    if (!inMonth) btn.classList.add('calendar-widget__day--muted');
    if (ymd === today) btn.classList.add('calendar-widget__day--today');
    if (ymd === calSelectedYmd) btn.classList.add('calendar-widget__day--selected');
    if (dotSet.has(ymd)) btn.classList.add('calendar-widget__day--has-events');
    grid.appendChild(btn);
  });

  gridWrap.appendChild(dow);
  gridWrap.appendChild(grid);

  const listHeadEl = document.createElement('p');
  listHeadEl.className = 'calendar-widget__list-head';
  listHeadEl.textContent = listHead;

  const list = document.createElement('ul');
  list.className = 'calendar-widget__list';

  if (!selectedEvents.length) {
    const empty = document.createElement('p');
    empty.className = 'calendar-widget__empty';
    empty.textContent = 'Nada este día. Pulsa + para añadir.';
    zone.appendChild(header);
    zone.appendChild(nav);
    zone.appendChild(gridWrap);
    zone.appendChild(listHeadEl);
    zone.appendChild(empty);
  } else {
    selectedEvents.forEach(ev => {
      const li = document.createElement('li');
      li.className = 'calendar-widget__event';
      const main = document.createElement('div');
      main.className = 'calendar-widget__event-main';
      const t = document.createElement('p');
      t.className = 'calendar-widget__event-title';
      t.textContent = ev.title;
      const meta = document.createElement('p');
      meta.className = 'calendar-widget__event-meta';
      meta.textContent = ev.time ? `Hora: ${ev.time}` : 'Todo el día';
      main.appendChild(t);
      main.appendChild(meta);
      if (ev.notes) {
        const n = document.createElement('p');
        n.className = 'calendar-widget__event-notes';
        n.textContent = ev.notes;
        main.appendChild(n);
      }
      const act = document.createElement('div');
      act.className = 'calendar-widget__event-actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'calendar-widget__icon-btn';
      edit.dataset.calEdit = ev.id;
      edit.title = 'Editar';
      edit.setAttribute('aria-label', `Editar ${ev.title}`);
      edit.textContent = '✎';
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'calendar-widget__icon-btn';
      del.dataset.calDel = ev.id;
      del.title = 'Eliminar';
      del.setAttribute('aria-label', `Eliminar ${ev.title}`);
      del.textContent = '✕';
      act.appendChild(edit);
      act.appendChild(del);
      li.appendChild(main);
      li.appendChild(act);
      list.appendChild(li);
    });
    zone.appendChild(header);
    zone.appendChild(nav);
    zone.appendChild(gridWrap);
    zone.appendChild(listHeadEl);
    zone.appendChild(list);
  }
}

function rebuildCalendarDom() {
  renderCalendarWidget();
}

function openCalendarEventDialog(editId) {
  const dlg = document.getElementById('calendar-event-dialog');
  const form = document.getElementById('calendar-event-form');
  const err = document.getElementById('calendar-event-error');
  if (!dlg || !form) return;
  if (err) err.hidden = true;

  form.reset();
  const idEl = document.getElementById('calendar-event-id');
  const titleEl = document.getElementById('calendar-event-title');
  const dateEl = document.getElementById('calendar-event-date');
  const timeEl = document.getElementById('calendar-event-time');
  const notesEl = document.getElementById('calendar-event-notes');

  calEnsureViewState();
  if (editId) {
    const dash = getDashboard();
    const ev = dash?.calendarEvents?.find(e => e.id === editId);
    if (ev) {
      if (idEl) idEl.value = ev.id;
      if (titleEl) titleEl.value = ev.title;
      if (dateEl) dateEl.value = ev.date;
      if (timeEl) timeEl.value = ev.time || '';
      if (notesEl) notesEl.value = ev.notes || '';
    }
  } else {
    if (idEl) idEl.value = '';
    if (dateEl) dateEl.value = calSelectedYmd || calTodayYmd();
    if (timeEl) timeEl.value = '';
  }

  const titleHeading = document.getElementById('calendar-event-dialog-title');
  if (titleHeading) titleHeading.textContent = editId ? 'Editar evento' : 'Nuevo evento';
  dlg.showModal();
}

function applyCalendarEventFromForm() {
  const idEl = document.getElementById('calendar-event-id');
  const titleEl = document.getElementById('calendar-event-title');
  const dateEl = document.getElementById('calendar-event-date');
  const timeEl = document.getElementById('calendar-event-time');
  const notesEl = document.getElementById('calendar-event-notes');
  const err = document.getElementById('calendar-event-error');

  const title = titleEl?.value.trim() || '';
  const dateStr = dateEl?.value || '';
  let timeStr = timeEl?.value || '';
  if (timeStr.length >= 5) timeStr = timeStr.slice(0, 5);
  else timeStr = '';
  const notes = notesEl?.value.trim() || '';
  const editId = idEl?.value?.trim() || '';

  const draft = { title, date: dateStr };
  if (timeStr) draft.time = timeStr;
  if (notes) draft.notes = notes;

  const single = sanitizeCalendarEvents([{ ...draft, id: editId || 'tmp' }]);
  if (!single || !single.length) {
    if (err) {
      err.textContent = 'Revisa título, fecha y hora.';
      err.hidden = false;
    }
    return;
  }

  const dash = getDashboard();
  if (!dash) return;

  const backupCal = deepClone(dash.calendarEvents);
  let next = single[0];
  if (editId) {
    next = { ...next, id: editId };
    const idx = dash.calendarEvents.findIndex(e => e.id === editId);
    if (idx >= 0) dash.calendarEvents[idx] = next;
    else dash.calendarEvents.push(next);
  } else {
    next = { ...next, id: newEntityId('cal') };
    dash.calendarEvents.push(next);
  }

  const v = validateDashboardObject(dash);
  if (!v) {
    dash.calendarEvents = backupCal;
    if (err) {
      err.textContent = 'No se pudo guardar (datos no válidos).';
      err.hidden = false;
    }
    return;
  }

  applyDashboardValidated(v);
  syncBookmarksFromDashboard();
  document.getElementById('calendar-event-dialog')?.close();
  rebuildCalendarDom();
  showToast(editId ? 'Evento actualizado' : 'Evento añadido');
}

function deleteCalendarEventById(id) {
  const dash = getDashboard();
  if (!dash || !id) return;
  const idx = dash.calendarEvents.findIndex(e => e.id === id);
  if (idx < 0) return;
  const backupCal = deepClone(dash.calendarEvents);
  dash.calendarEvents.splice(idx, 1);
  const v = validateDashboardObject(dash);
  if (!v) {
    dash.calendarEvents = backupCal;
    return;
  }
  applyDashboardValidated(v);
  syncBookmarksFromDashboard();
  rebuildCalendarDom();
  showToast('Evento eliminado');
}

function setupCalendarWidgetDelegation() {
  const zone = document.getElementById('calendar-zone');
  if (!zone || zone.dataset.calDelegated === '1') return;
  zone.dataset.calDelegated = '1';

  zone.addEventListener('click', e => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    if (t.dataset.calAdd != null) {
      openCalendarEventDialog(null);
      return;
    }
    if (t.dataset.calPrev != null) {
      calEnsureViewState();
      calViewMonth--;
      if (calViewMonth < 0) {
        calViewMonth = 11;
        calViewYear--;
      }
      rebuildCalendarDom();
      return;
    }
    if (t.dataset.calNext != null) {
      calEnsureViewState();
      calViewMonth++;
      if (calViewMonth > 11) {
        calViewMonth = 0;
        calViewYear++;
      }
      rebuildCalendarDom();
      return;
    }

    const dayBtn = t.closest('[data-cal-day]');
    if (dayBtn instanceof HTMLElement && dayBtn.dataset.calDay) {
      calSelectedYmd = dayBtn.dataset.calDay;
      rebuildCalendarDom();
      return;
    }

    const editId = t.closest('[data-cal-edit]')?.getAttribute('data-cal-edit');
    if (editId) {
      openCalendarEventDialog(editId);
      return;
    }

    const delId = t.closest('[data-cal-del]')?.getAttribute('data-cal-del');
    if (delId && confirm('¿Eliminar este evento?')) {
      deleteCalendarEventById(delId);
    }
  });
}

function setupCalendarEventDialog() {
  const dlg = document.getElementById('calendar-event-dialog');
  const form = document.getElementById('calendar-event-form');
  const cancel = document.getElementById('calendar-event-cancel');

  form?.addEventListener('submit', ev => {
    ev.preventDefault();
    applyCalendarEventFromForm();
  });

  cancel?.addEventListener('click', () => dlg?.close());

  dlg?.addEventListener('click', e => {
    if (e.target === dlg) dlg.close();
  });
}

function initCalendar() {
  setupCalendarEventDialog();
  setupCalendarWidgetDelegation();
  rebuildCalendarDom();
}
