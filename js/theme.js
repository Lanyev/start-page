/* ================================================================
   THEME  Toggle entre tema oscuro y claro
   ================================================================ */

function initThemeToggle() {
  const btn      = document.getElementById('theme-toggle');
  const iconMoon = document.getElementById('theme-icon-moon');
  const iconSun  = document.getElementById('theme-icon-sun');

  btn.addEventListener('click', () => {
    const html     = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);

    iconMoon.style.display = newTheme === 'dark'  ? 'block' : 'none';
    iconSun.style.display  = newTheme === 'light' ? 'block' : 'none';
  });
}
