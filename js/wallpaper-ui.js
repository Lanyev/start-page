/* ================================================================
   WALLPAPER UI — Diálogo: añadir por URL o archivo, quitar, restaurar
   Depende de: wallpaper.js, bookmarks.js (showToast)
   ================================================================ */

function normalizeWallpaperUrlInput(raw) {
  let s = String(raw).trim();
  if (!s) return null;
  if (s.startsWith('data:image/')) return s;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s, window.location.href);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
  } catch { /* noop */ }
  return null;
}

function wallpaperLabelForList(src, i) {
  if (src.startsWith('data:image/')) return `Imagen local ${i + 1}`;
  try {
    const u = new URL(src);
    return u.hostname + (u.pathname.length > 18 ? u.pathname.slice(0, 16) + '…' : u.pathname);
  } catch {
    return `Fondo ${i + 1}`;
  }
}

function initWallpaperSettingsUi() {
  const dialog = document.getElementById('wp-settings-dialog');
  const listEl = document.getElementById('wp-settings-list');
  const urlInput = document.getElementById('wp-settings-url');
  const urlBtn = document.getElementById('wp-settings-add-url');
  const fileInput = document.getElementById('wp-settings-file');
  const btnReset = document.getElementById('wp-settings-reset');
  const btnClose = document.getElementById('wp-settings-close');
  if (!dialog || !listEl) return;

  function renderList() {
    const items = getWallpaperSources();
    listEl.innerHTML = '';
    if (!items.length) {
      const p = document.createElement('p');
      p.className = 'wp-settings__empty';
      p.textContent = 'No hay fondos. Añade una URL o archivos de imagen.';
      listEl.appendChild(p);
      return;
    }
    items.forEach((src, i) => {
      const row = document.createElement('div');
      row.className = 'wp-settings__row';

      const thumb = document.createElement('div');
      thumb.className = 'wp-settings__thumb';
      thumb.style.backgroundImage = wallpaperCssUrl(src);

      const meta = document.createElement('div');
      meta.className = 'wp-settings__meta';
      const title = document.createElement('span');
      title.className = 'wp-settings__label';
      title.textContent = wallpaperLabelForList(src, i);
      meta.appendChild(title);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'wp-settings__remove';
      del.setAttribute('aria-label', `Quitar fondo ${i + 1}`);
      del.textContent = 'Quitar';
      del.addEventListener('click', () => {
        const next = getWallpaperSources().filter((_, j) => j !== i);
        if (!applyWallpaperSources(next, true)) {
          showToast('No se pudo guardar (p. ej. almacenamiento lleno).', true);
          return;
        }
        renderList();
      });

      row.appendChild(thumb);
      row.appendChild(meta);
      row.appendChild(del);
      listEl.appendChild(row);
    });
  }

  function openDialog() {
    renderList();
    urlInput.value = '';
    fileInput.value = '';
    dialog.showModal();
    urlInput.focus();
  }

  document.querySelectorAll('[data-open-wp-settings]').forEach(el => {
    el.addEventListener('click', () => openDialog());
  });

  urlInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      urlBtn.click();
    }
  });

  urlBtn.addEventListener('click', () => {
    const url = normalizeWallpaperUrlInput(urlInput.value);
    if (!url) {
      showToast('Introduce una URL válida (http o https).', true);
      return;
    }
    const next = getWallpaperSources().concat(url);
    if (!applyWallpaperSources(next, true)) {
      showToast('No se pudo guardar en el navegador (p. ej. almacenamiento lleno).', true);
      return;
    }
    urlInput.value = '';
    renderList();
    showToast('Fondo añadido.');
  });

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(typeof r.result === 'string' ? r.result : '');
      r.onerror = () => reject();
      r.readAsDataURL(file);
    });
  }

  fileInput.addEventListener('change', async () => {
    const picked = Array.from(fileInput.files || []);
    fileInput.value = '';
    const images = picked.filter(f => f.type.startsWith('image/'));
    if (!images.length) {
      if (picked.length) showToast('Usa solo archivos de imagen.', true);
      return;
    }

    const next = getWallpaperSources().slice();
    for (let i = 0; i < images.length; i++) {
      try {
        const data = await readFileAsDataUrl(images[i]);
        if (data) next.push(data);
      } catch {
        showToast('No se pudo leer un archivo.', true);
        return;
      }
    }

    if (!applyWallpaperSources(next, true)) {
      showToast('No hay espacio suficiente en el navegador. Prueba imágenes más pequeñas o menos fondos.', true);
      return;
    }
    renderList();
    showToast(images.length === 1 ? 'Imagen añadida.' : `${images.length} imágenes añadidas.`);
  });

  btnReset.addEventListener('click', () => {
    if (!confirm('¿Volver a los fondos por defecto de la página? Se borrará tu lista personalizada.')) return;
    resetWallpapersToDefaults();
    renderList();
    showToast('Fondos restaurados a los predeterminados.');
  });

  btnClose.addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close();
  });
}
