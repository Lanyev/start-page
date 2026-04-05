/* ================================================================
   CLOCK — Reloj digital con fecha en español
   ================================================================ */

function initClock() {
  updateClock();
  function scheduleNextMinute() {
    const now = new Date();
    const ms =
      60_000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    setTimeout(function tick() {
      updateClock();
      scheduleNextMinute();
    }, ms);
  }
  scheduleNextMinute();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') updateClock();
  });
}

function updateClock() {
  const now = new Date();

  const h    = now.getHours();
  const m    = String(now.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = String(h % 12 || 12).padStart(2, '0');

  const timeStr = `${h12}:${m} ${ampm}`;
  const timeEl  = document.getElementById('clock-time');
  if (timeEl.textContent !== timeStr) timeEl.textContent = timeStr;

  const raw = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
  const dateStr =
    raw.charAt(0).toUpperCase() + raw.slice(1);
  const dateEl = document.getElementById('clock-date');
  if (dateEl.textContent !== dateStr) dateEl.textContent = dateStr;
}
