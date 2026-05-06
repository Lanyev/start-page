/* ================================================================
   WIDGET DRAG — Reordenar cajas de favoritos y lectores RSS (HTML5 DnD)
   Solo viewports anchos (min-width: 901px), alineado con layout móvil ≤900px.
   Depende de: dashboard.js, bookmarks.js (saveBookmarks, renderBookmarks),
               rss.js (rebuildRssDomAndLoad)
   ================================================================ */

(function initWidgetDragModule() {
  function desktopDragEnabled() {
    return true;
  }

  function sortByVisualOrder(container, itemSelector) {
    return [...container.querySelectorAll(itemSelector)].sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      if (Math.abs(ra.top - rb.top) > 6) return ra.top - rb.top;
      return ra.left - rb.left;
    });
  }

  /**
   * Evita que <a> e <img> nativos roben el gesto de arrastre del padre.
   */
  function disableNativeDragOnDescendants(root) {
    if (!root) return;
    root.querySelectorAll('a[href], img').forEach(el => {
      el.draggable = false;
    });
  }

  /**
   * Índice de inserción en la lista sin el elemento arrastrado (0..n).
   * @returns {number}
   */
  function insertIndexFromPointer(container, itemSelector, dragEl, clientX, clientY) {
    const sorted = sortByVisualOrder(container, itemSelector).filter(n => n !== dragEl);
    if (!sorted.length) return 0;

    const stack = document.elementsFromPoint(clientX, clientY);
    let hit = null;
    for (let i = 0; i < stack.length; i++) {
      const el = stack[i];
      if (el === dragEl) continue;
      if (dragEl && dragEl.contains(el)) continue;
      const c = el.closest?.(itemSelector);
      if (c && container.contains(c) && c !== dragEl) {
        hit = c;
        break;
      }
    }

    if (hit) {
      const j = sorted.indexOf(hit);
      if (j === -1) return fallbackInsertIndex(sorted, clientX, clientY);
      const r = hit.getBoundingClientRect();
      const distTL = Math.hypot(clientX - r.left, clientY - r.top);
      const distBR = Math.hypot(clientX - r.right, clientY - r.bottom);
      const insertAt = distTL <= distBR ? j : j + 1;
      return Math.max(0, Math.min(insertAt, sorted.length));
    }

    return fallbackInsertIndex(sorted, clientX, clientY);
  }

  function fallbackInsertIndex(sorted, clientX, clientY) {
    if (!sorted.length) return 0;
    let closest = 0;
    let minD = Infinity;
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i].getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(clientX - cx, clientY - cy);
      if (d < minD) {
        minD = d;
        closest = i;
      }
    }
    const r = sorted[closest].getBoundingClientRect();
    const distTL = Math.hypot(clientX - r.left, clientY - r.top);
    const distBR = Math.hypot(clientX - r.right, clientY - r.bottom);
    const insertAt = distTL <= distBR ? closest : closest + 1;
    return Math.max(0, Math.min(insertAt, sorted.length));
  }

  function applyDraggableAttributes(grid, rssZone) {
    const on = desktopDragEnabled();
    if (grid) {
      grid.querySelectorAll('.card').forEach(card => {
        card.draggable = on;
      });
      grid.querySelectorAll('[data-drag-handle="bookmark-card"]').forEach(handle => {
        handle.draggable = on;
      });
      disableNativeDragOnDescendants(grid);
    }
    if (rssZone) {
      rssZone.querySelectorAll('.rss-widget').forEach(w => {
        w.draggable = on;
      });
      rssZone.querySelectorAll('[data-drag-handle="rss-widget"]').forEach(handle => {
        handle.draggable = on;
      });
      disableNativeDragOnDescendants(rssZone);
    }
  }

  function bindBookmarkGrid(grid) {
    if (!grid || grid.dataset.widgetDndBookmarks === '1') return;
    grid.dataset.widgetDndBookmarks = '1';

    let dragEl = null;
    let fromIdx = -1;
    let armedCard = null;

    grid.addEventListener('pointerdown', e => {
      if (!desktopDragEnabled()) {
        armedCard = null;
        return;
      }
      const handle = e.target.closest('[data-drag-handle="bookmark-card"]');
      if (!handle || !grid.contains(handle)) {
        armedCard = null;
        return;
      }
      const card = handle.closest('.card');
      armedCard = card && grid.contains(card) ? card : null;
    });

    grid.addEventListener('dragenter', e => {
      if (!desktopDragEnabled() || !dragEl) return;
      e.preventDefault();
    });

    grid.addEventListener('dragstart', e => {
      if (!desktopDragEnabled()) return;
      const card = e.target.closest('.card');
      if (!card || !grid.contains(card)) return;
      if (!armedCard || armedCard !== card) {
        e.preventDefault();
        return;
      }

      dragEl = card;
      fromIdx = sortByVisualOrder(grid, '.card').indexOf(card);
      if (fromIdx < 0) {
        e.preventDefault();
        return;
      }

      dragEl.classList.add('widget-drag--active');
      dragEl.style.pointerEvents = 'none';

      try {
        e.dataTransfer.setData('text/plain', 'startpage-bookmark');
        e.dataTransfer.effectAllowed = 'move';
      } catch {
        /* ignore */
      }
    });

    grid.addEventListener('dragover', e => {
      if (!desktopDragEnabled() || !dragEl) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    grid.addEventListener('drop', e => {
      if (!desktopDragEnabled() || !dragEl || fromIdx < 0) return;
      e.preventDefault();
      e.stopPropagation();

      const d = typeof getDashboard === 'function' ? getDashboard() : null;
      const arr = d?.widgets;
      if (!arr || !arr.length) return;

      let to = insertIndexFromPointer(grid, '.card', dragEl, e.clientX, e.clientY);

      const from = fromIdx;
      if (from === to) return;

      const [item] = arr.splice(from, 1);
      to = Math.max(0, Math.min(to, arr.length));
      arr.splice(to, 0, item);

      if (typeof saveBookmarks === 'function') saveBookmarks();
      if (typeof renderBookmarks === 'function') renderBookmarks();
    });

    grid.addEventListener('dragend', () => {
      if (dragEl) {
        dragEl.classList.remove('widget-drag--active');
        dragEl.style.pointerEvents = '';
      }
      dragEl = null;
      fromIdx = -1;
      armedCard = null;
    });
  }

  function bindRssZone(zone) {
    if (!zone || zone.dataset.widgetDndRss === '1') return;
    zone.dataset.widgetDndRss = '1';

    let dragEl = null;
    let fromIdx = -1;
    let armedWidget = null;

    zone.addEventListener('pointerdown', e => {
      if (!desktopDragEnabled()) {
        armedWidget = null;
        return;
      }
      const handle = e.target.closest('[data-drag-handle="rss-widget"]');
      if (!handle || !zone.contains(handle)) {
        armedWidget = null;
        return;
      }
      const widget = handle.closest('.rss-widget');
      armedWidget = widget && zone.contains(widget) ? widget : null;
    });

    zone.addEventListener('dragenter', e => {
      if (!desktopDragEnabled() || !dragEl) return;
      e.preventDefault();
    });

    zone.addEventListener('dragstart', e => {
      if (!desktopDragEnabled()) return;
      const w = e.target.closest('.rss-widget');
      if (!w || !zone.contains(w)) return;
      if (!armedWidget || armedWidget !== w) {
        e.preventDefault();
        return;
      }

      dragEl = w;
      fromIdx = sortByVisualOrder(zone, '.rss-widget').indexOf(w);
      if (fromIdx < 0) {
        e.preventDefault();
        return;
      }

      dragEl.classList.add('widget-drag--active');
      dragEl.style.pointerEvents = 'none';

      try {
        e.dataTransfer.setData('text/plain', 'startpage-rss');
        e.dataTransfer.effectAllowed = 'move';
      } catch {
        /* ignore */
      }
    });

    zone.addEventListener('dragover', e => {
      if (!desktopDragEnabled() || !dragEl) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    zone.addEventListener('drop', e => {
      if (!desktopDragEnabled() || !dragEl || fromIdx < 0) return;
      e.preventDefault();
      e.stopPropagation();

      const dash = typeof getDashboard === 'function' ? getDashboard() : null;
      const arr = dash?.rssReaders;
      if (!arr || !arr.length) return;

      let to = insertIndexFromPointer(zone, '.rss-widget', dragEl, e.clientX, e.clientY);

      const from = fromIdx;
      if (from === to) return;

      const [item] = arr.splice(from, 1);
      to = Math.max(0, Math.min(to, arr.length));
      arr.splice(to, 0, item);

      if (typeof saveDashboard === 'function') saveDashboard();
      if (typeof rebuildRssDomAndLoad === 'function') rebuildRssDomAndLoad();
      if (typeof updatePersistenceBanner === 'function') updatePersistenceBanner();
    });

    zone.addEventListener('dragend', () => {
      if (dragEl) {
        dragEl.classList.remove('widget-drag--active');
        dragEl.style.pointerEvents = '';
      }
      dragEl = null;
      fromIdx = -1;
      armedWidget = null;
    });
  }

  window.initWidgetDragReorder = function initWidgetDragReorder() {
    const grid = document.getElementById('bookmarks-grid');
    const rssZone = document.getElementById('rss-zone');

    bindBookmarkGrid(grid);
    bindRssZone(rssZone);

    const refresh = () => applyDraggableAttributes(grid, rssZone);

    if (grid) {
      const mo = new MutationObserver(refresh);
      mo.observe(grid, { childList: true, subtree: true });
    }
    if (rssZone) {
      const mo = new MutationObserver(refresh);
      mo.observe(rssZone, { childList: true, subtree: true });
    }

    refresh();
  };
})();
