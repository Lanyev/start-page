/* ================================================================
   RSS — Varios lectores, feeds configurables por lector
   Depende de: config.js (RSS_CORS_PROXIES, RSS_ARTICLE_LIMIT, RSS_AUTO_REFRESH_MS), dashboard.js, favicon.js
   ================================================================ */

/** @type {Map<string, { outcomes: FeedOutcome[], selectedIndex: number }>} */
const rssReaderFeedCache = new Map();

/**
 * @typedef {{ ok: true, name: string, url: string, articles: object[] } | { ok: false, name: string, url: string, error: unknown }} FeedOutcome
 */

function getRssTabsId(readerId) {
  return `rss-tabs-${readerId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function hostnameFromFeedUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '') || '';
  } catch {
    return '';
  }
}

function rssFeedFaviconEl(url, size) {
  const host = hostnameFromFeedUrl(url);
  if (!host) {
    const g = createGlobeSvg(size);
    g.classList.add('rss-feed-tab__icon');
    return g;
  }
  const img = createFaviconImg(host, size);
  img.className = 'rss-feed-tab__icon';
  return img;
}

function buildRssReadersDom() {
  const zone = document.getElementById('rss-zone');
  if (!zone) return;

  const dash = getDashboard();
  if (!dash) return;

  zone.innerHTML = '';

  dash.rssReaders.forEach(r => {
    const safeId = r.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const aside = document.createElement('aside');
    aside.className = 'rss-widget';
    aside.dataset.readerId = r.id;
    aside.setAttribute('aria-label', r.title);

    const header = document.createElement('div');
    header.className = 'rss-widget__header';

    const h2 = document.createElement('h2');
    h2.className = 'rss-widget__title';
    h2.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
        <path d="M3.75 3a.75.75 0 00-.75.75v.5c0 .414.336.75.75.75H4c6.075 0 11 4.925 11 11v.25c0 .414.336.75.75.75h.5a.75.75 0 00.75-.75V16C17 8.82 11.18 3 4 3h-.25z"/>
        <path d="M3 8.75A.75.75 0 013.75 8H4a8 8 0 018 8v.25a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75V16a6 6 0 00-6-6h-.25A.75.75 0 013 9.25v-.5zM7 15a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>`;
    const titleSpan = document.createElement('span');
    titleSpan.textContent = r.title;
    h2.appendChild(titleSpan);

    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = 'rss-widget__refresh';
    refreshBtn.dataset.rssRefresh = r.id;
    refreshBtn.setAttribute('aria-label', `Actualizar ${r.title}`);
    refreshBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clip-rule="evenodd"/>
      </svg>
      Actualizar`;

    header.appendChild(h2);
    header.appendChild(refreshBtn);

    const body = document.createElement('div');
    body.className = 'rss-widget__body';

    const tabsEl = document.createElement('div');
    tabsEl.className = 'rss-widget__feed-tabs';
    tabsEl.id = getRssTabsId(r.id);
    tabsEl.hidden = true;
    tabsEl.setAttribute('role', 'tablist');
    tabsEl.setAttribute('aria-label', `Fuentes de ${r.title}`);

    const feedEl = document.createElement('div');
    feedEl.className = 'rss-widget__feed';
    feedEl.id = `rss-feed-${safeId}`;

    body.appendChild(tabsEl);
    body.appendChild(feedEl);
    aside.appendChild(header);
    aside.appendChild(body);
    zone.appendChild(aside);

    refreshBtn.addEventListener('click', () => loadRssReader(r.id));
  });
}

function setupRssZoneRetryDelegation() {
  const zone = document.getElementById('rss-zone');
  if (!zone || zone.dataset.retryDelegated === '1') return;
  zone.dataset.retryDelegated = '1';
  zone.addEventListener('click', e => {
    const retry = e.target.closest('.rss-error__btn');
    if (retry?.dataset.readerId) loadRssReader(retry.dataset.readerId);

    const tab = e.target.closest('[data-rss-feed-tab]');
    if (tab?.dataset.readerId != null && tab.dataset.feedIndex != null) {
      selectRssFeedTab(tab.dataset.readerId, Number(tab.dataset.feedIndex));
    }
  });
}

function getFeedContainerId(readerId) {
  const safeId = readerId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `rss-feed-${safeId}`;
}

async function loadRssReader(readerId) {
  const dash = getDashboard();
  const reader = dash?.rssReaders.find(x => x.id === readerId);
  const feedEl = document.getElementById(getFeedContainerId(readerId));
  const refreshBtn = document.querySelector(`[data-rss-refresh="${readerId}"]`);

  if (!reader || !feedEl) return;

  if (!reader.feeds.length) {
    const tabsEmpty = document.getElementById(getRssTabsId(readerId));
    if (tabsEmpty) {
      tabsEmpty.hidden = true;
      tabsEmpty.innerHTML = '';
    }
    rssReaderFeedCache.delete(readerId);
    feedEl.innerHTML = `
      <div class="rss-error rss-error--soft">
        <p>No hay feeds en este lector. Añade URLs en «Personalizar página».</p>
      </div>`;
    refreshBtn?.classList.remove('loading');
    return;
  }

  showRssSkeleton(feedEl);
  refreshBtn?.classList.add('loading');

  try {
    const results = await Promise.allSettled(reader.feeds.map(fetchFeed));

    /** @type {FeedOutcome[]} */
    const outcomes = results.map((result, i) => {
      const { name, url } = reader.feeds[i];
      if (result.status === 'fulfilled') {
        const sorted = result.value
          .slice()
          .sort((a, b) => b.date - a.date)
          .slice(0, RSS_ARTICLE_LIMIT);
        return { ok: true, name, url, articles: sorted };
      }
      console.warn(`Feed "${name}" falló:`, result.reason);
      return { ok: false, name, url, error: result.reason };
    });

    const anyOk = outcomes.some(o => o.ok);
    if (!anyOk) {
      const tabsBad = document.getElementById(getRssTabsId(readerId));
      if (tabsBad) {
        tabsBad.hidden = true;
        tabsBad.innerHTML = '';
      }
      rssReaderFeedCache.delete(readerId);
      showRssError(feedEl, readerId);
      return;
    }

    const tabsEl = document.getElementById(getRssTabsId(readerId));
    let selectedIndex = outcomes.findIndex(o => o.ok);
    if (selectedIndex < 0) selectedIndex = 0;

    const prev = rssReaderFeedCache.get(readerId);
    if (prev && prev.selectedIndex < outcomes.length) {
      const want = outcomes[prev.selectedIndex];
      if (want && want.ok) selectedIndex = prev.selectedIndex;
    }

    rssReaderFeedCache.set(readerId, { outcomes, selectedIndex });

    if (reader.feeds.length > 1 && tabsEl) {
      tabsEl.hidden = false;
      renderRssFeedTabs(tabsEl, readerId, outcomes, selectedIndex);
    } else if (tabsEl) {
      tabsEl.hidden = true;
      tabsEl.innerHTML = '';
    }

    renderRssFeedContent(feedEl, outcomes[selectedIndex]);
  } catch (err) {
    const tabsErr = document.getElementById(getRssTabsId(readerId));
    if (tabsErr) {
      tabsErr.hidden = true;
      tabsErr.innerHTML = '';
    }
    rssReaderFeedCache.delete(readerId);
    console.error('RSS:', err);
    showRssError(feedEl, readerId);
  } finally {
    refreshBtn?.classList.remove('loading');
  }
}

async function loadAllRssReaders() {
  const dash = getDashboard();
  if (!dash || dash.rssColumns === 0 || !dash.rssReaders.length) return;
  for (let i = 0; i < dash.rssReaders.length; i++) {
    await loadRssReader(dash.rssReaders[i].id);
  }
}

function rebuildRssDomAndLoad() {
  applyLayoutToDom();
  buildRssReadersDom();
  loadAllRssReaders();
}

function initRssFeed() {
  setupRssZoneRetryDelegation();
  applyLayoutToDom();
  buildRssReadersDom();
  loadAllRssReaders();
  setInterval(loadAllRssReaders, RSS_AUTO_REFRESH_MS);
}

/* ── Descarga y detecta el formato del feed ─────────────────────── */
async function fetchFeed({ name, url }) {
  const builders =
    typeof RSS_CORS_PROXIES !== 'undefined' && Array.isArray(RSS_CORS_PROXIES) && RSS_CORS_PROXIES.length
      ? RSS_CORS_PROXIES
      : [(u) => `https://corsproxy.io/?${encodeURIComponent(u)}`];

  let lastErr = new Error('Sin proxies RSS configurados');
  for (const build of builders) {
    try {
      const proxyUrl = build(url);
      if (!proxyUrl) continue;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'application/xml');
      if (doc.querySelector('parsererror')) {
        throw new Error('Respuesta no es XML válido (¿proxy bloqueado o HTML de error?)');
      }

      const articles = doc.querySelector('feed')
        ? parseAtom(doc, name, url)
        : parseRss(doc, name, url);
      return articles;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function rssItemLink(item) {
  const linkEl = item.querySelector('link');
  if (linkEl) {
    const href = linkEl.getAttribute('href')?.trim();
    if (href) return href;
    const t = linkEl.textContent?.trim();
    if (t) return t;
  }
  const guid = item.querySelector('guid');
  if (guid?.getAttribute('isPermaLink') === 'true') {
    const g = guid.textContent?.trim();
    if (g && /^https?:\/\//i.test(g)) return g;
  }
  return '#';
}

function parseRss(doc, source, feedUrl) {
  return Array.from(doc.querySelectorAll('item')).map(item => ({
    title: item.querySelector('title')?.textContent?.trim() || 'Sin título',
    link: rssItemLink(item),
    source,
    feedUrl,
    date: new Date(item.querySelector('pubDate')?.textContent?.trim() || 0),
  }));
}

function parseAtom(doc, source, feedUrl) {
  return Array.from(doc.querySelectorAll('entry')).map(entry => ({
    title: entry.querySelector('title')?.textContent?.trim() || 'Sin título',
    link:  entry.querySelector('link[rel="alternate"]')?.getAttribute('href')
           || entry.querySelector('link')?.getAttribute('href') || '#',
    source,
    feedUrl,
    date:  new Date(
      entry.querySelector('updated')?.textContent?.trim()
      || entry.querySelector('published')?.textContent?.trim() || 0
    ),
  }));
}

function renderRssFeedTabs(tabsEl, readerId, outcomes, selectedIndex) {
  tabsEl.innerHTML = '';
  outcomes.forEach((out, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rss-feed-tab' + (out.ok ? '' : ' rss-feed-tab--failed');
    btn.dataset.rssFeedTab = '';
    btn.dataset.readerId = readerId;
    btn.dataset.feedIndex = String(i);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === selectedIndex ? 'true' : 'false');
    btn.title = out.name + (out.ok ? '' : ' (error al cargar)');

    btn.appendChild(rssFeedFaviconEl(out.url, 14));

    const label = document.createElement('span');
    label.className = 'rss-feed-tab__label';
    label.textContent = out.name;
    btn.appendChild(label);

    tabsEl.appendChild(btn);
  });
}

function selectRssFeedTab(readerId, feedIndex) {
  const cached = rssReaderFeedCache.get(readerId);
  const feedEl = document.getElementById(getFeedContainerId(readerId));
  const tabsEl = document.getElementById(getRssTabsId(readerId));
  if (!cached || !feedEl || !tabsEl || !cached.outcomes[feedIndex]) return;

  cached.selectedIndex = feedIndex;
  tabsEl.querySelectorAll('.rss-feed-tab').forEach((btn, i) => {
    btn.setAttribute('aria-selected', i === feedIndex ? 'true' : 'false');
  });
  renderRssFeedContent(feedEl, cached.outcomes[feedIndex]);
}

function renderRssFeedContent(feedEl, outcome) {
  if (!outcome.ok) {
    feedEl.innerHTML = `
      <div class="rss-error rss-error--soft">
        <p>No se pudo cargar «${escapeHtml(outcome.name)}». Pulsa «Actualizar» en la cabecera o revisa la URL del feed.</p>
      </div>`;
    return;
  }
  renderRssArticles(feedEl, outcome.articles);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderRssArticles(feedEl, articles) {
  feedEl.innerHTML = '';

  articles.forEach(art => {
    const item = document.createElement('div');
    item.className = 'rss-item';

    const link = document.createElement('a');
    link.className   = 'rss-item__title';
    link.href        = art.link;
    link.target      = '_blank';
    link.rel         = 'noopener noreferrer';
    link.textContent = art.title;

    const meta = document.createElement('div');
    meta.className = 'rss-item__meta';

    const host = hostnameFromFeedUrl(art.feedUrl || '');
    const fav = host ? createFaviconImg(host, 14) : createGlobeSvg(14);
    fav.classList.add('rss-item__favicon');

    const src = document.createElement('span');
    src.className   = 'rss-item__source';
    src.textContent = art.source;

    const date = document.createElement('span');
    date.className   = 'rss-item__date';
    date.textContent = relativeDate(art.date);

    meta.appendChild(fav);
    meta.appendChild(src);
    meta.appendChild(date);
    item.appendChild(link);
    item.appendChild(meta);
    feedEl.appendChild(item);
  });
}

function relativeDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return 'fecha desconocida';

  const diff = Date.now() - date.getTime();
  const s    = Math.floor(diff / 1000);
  const m    = Math.floor(s  / 60);
  const h    = Math.floor(m  / 60);
  const d    = Math.floor(h  / 24);

  if (s < 60)  return 'hace un momento';
  if (m < 60)  return `hace ${m} min`;
  if (h < 24)  return `hace ${h}h`;
  if (d === 1) return 'ayer';
  if (d < 7)   return `hace ${d} días`;
  if (d < 30)  return `hace ${Math.floor(d / 7)} sem`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function showRssSkeleton(feedEl) {
  const items = Array.from({ length: 5 }, () => `
    <div class="rss-skeleton__item">
      <div class="skeleton-line" style="width:${70 + (Math.random() * 25 | 0)}%"></div>
      <div class="skeleton-line" style="width:40%;height:.55rem;opacity:.6"></div>
    </div>`).join('');
  feedEl.innerHTML = `<div class="rss-skeleton">${items}</div>`;
}

function showRssError(feedEl, readerId) {
  feedEl.innerHTML = `
    <div class="rss-error">
      <span class="rss-error__icon">📡</span>
      <p>No se pudo cargar el feed.<br>Verifica tu conexión o las URLs del lector.</p>
      <button type="button" class="rss-error__btn" data-reader-id="${readerId}">Reintentar</button>
    </div>`;
}
