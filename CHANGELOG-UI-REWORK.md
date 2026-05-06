# UI Rework 2026 — Premium Futuristic Dashboard

**Fecha:** 2026-04-14
**Alcance:** Rediseño visual y UX completo de la start page (RSS + favoritos)

---

## Archivos modificados

| Archivo | Tipo de cambio |
|---------|---------------|
| `css/base.css` | Reescritura completa |
| `css/layout.css` | Reescritura completa |
| `css/header.css` | Reescritura completa |
| `css/bookmarks.css` | Reescritura completa |
| `css/rss.css` | Reescritura completa |
| `css/calendar.css` | Reescritura completa |
| `css/tooltip.css` | Reescritura completa |
| `css/dashboard.css` | Reescritura completa |
| `css/wallpaper.css` | Reescritura completa |
| `index.html` | Fuente, aura background, script |
| `js/main.js` | Llamada a `initInteractions()` |
| `js/interactions.js` | **Archivo nuevo** |

---

## 1. Sistema de diseño (`base.css`)

- **Paleta dark-first** con base `#07070a` (near-black puro).
- **Acento violeta eléctrico** `#8b5cf6` + azul neón complementario `#38bdf8`.
- **Tipografía**: Satoshi → **Inter** (Google Fonts), con `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'`.
- **Border radius ampliados**: `--radius-card: 20px`, `--radius-lg: 24px`, `--radius-xl: 28px`.
- **Sistema de sombras en capas**:
  - `--shadow-card`: doble sombra difusa.
  - `--shadow-elevated`: sombra profunda para modales/tooltips.
  - `--shadow-inset`: borde superior interno sutil (luz).
  - `--glow-primary`: glow violeta de 40-80px para énfasis.
- **Glassmorphism 2.0**: `blur(16px)` estándar, `blur(24px)` para elementos elevados. Bordes `rgba(255,255,255,0.08)`.
- **Variables de motion**: `--ease-out-expo` y `--ease-spring` para transiciones naturales.
- **Scrollbar global** personalizado con acento violeta.
- Clase utilitaria `.glass-panel` reutilizable.
- Tema claro (`[data-theme="light"]`) actualizado con nuevas variables.

### Aura background

Tres orbes radiales con `filter: blur(120px)` y animación `aura-drift` de 20s:
- Orbe 1: violeta, esquina superior derecha.
- Orbe 2: azul, esquina inferior izquierda.
- Orbe 3: gradiente violeta→azul, centro, más tenue.

Opacidad reducida en tema claro.

---

## 2. Header (`header.css`)

- Reloj con **gradient text** (texto base → violeta).
- Barra de búsqueda unificada visualmente (engine + input + button como bloque continuo sin gaps).
- Botón de búsqueda con **shimmer overlay** (`::before` con gradiente blanco) visible en hover.
- Botón de búsqueda con `translateY(-1px)` + `shadow-primary` en hover.
- Toggle de tema y trigger de menú: `border-radius: 12px` (cuadrado redondeado, no círculo).
- Toggle de tema con **glow orbital** + rotación 20° + scale 1.1 en hover.
- Menú desplegable con animación `scale(0.96) → scale(1)` + `translateY(-6px) → 0`.
- Todos los items interactivos con `:active { transform: scale(...) }`.

---

## 3. Bookmarks / Favoritos (`bookmarks.css`)

- Cards con **radial gradient que sigue el cursor** vía `::before` (usa `--mouse-x`, `--mouse-y` inyectadas por JS).
- `transform-style: preserve-3d` + `will-change: transform, box-shadow` para tilt 3D.
- **Hover**: lift `-2px`, borde violeta sutil `rgba(139, 92, 246, 0.2)`, sombra ampliada.
- Botón `+` con glow (`box-shadow: 0 0 12px`) y `scale(1.08)` en hover.
- Links con fondo `--color-primary-subtle` en hover de la fila.
- Botón eliminar con fondo `--color-danger-glow` en hover.
- Toast, modales, undo bar: todos con `--blur-heavy` (24px) y `--shadow-elevated`.
- Títulos de modal con gradient text.

---

## 4. RSS Feed (`rss.css`)

- **Featured first item** (`:first-child`): fondo `--color-primary-subtle`, borde propio, tipografía `--text-sm` (más grande), `font-weight: 600`.
- **Source badges** con pill shape (`border-radius: 9999px`), tamaño `--text-2xs`.
- Tabs activos con `box-shadow: 0 0 8px rgba(139, 92, 246, 0.1)`.
- Skeleton shimmer con tonos violeta.
- Widget container con hover sutil en borde.
- Botón retry con shimmer overlay igual que el de búsqueda.

---

## 5. Calendario (`calendar.css`)

- Día de hoy con `inset box-shadow` de `1.5px` violeta + `font-weight: 600`.
- Indicador de eventos: dot con `box-shadow: 0 0 6px` (luminoso).
- Eventos con hover `--color-primary-subtle` + borde transparente→violeta.
- Notas con color `--color-text-dim` (más tenue que muted).

---

## 6. Tooltip (`tooltip.css`)

- `--blur-heavy` (24px) + `--shadow-elevated`.
- Animación de entrada: `translateY(6px) scale(0.97) → translateY(0) scale(1)`.
- URL con `font-weight: 500` y tamaño `--text-2xs`.

---

## 7. Dashboard modal (`dashboard.css`)

- `--radius-lg` (24px) para el modal.
- Título con gradient text.
- Fieldsets con `--radius-md` (12px).
- Selects con focus ring violeta (`box-shadow: 0 0 0 3px`).
- Botón primario con shimmer overlay.
- Labels de campos con `font-weight: 700` y `letter-spacing: 0.06em`.

---

## 8. Wallpaper (`wallpaper.css`)

- Arrows con `--radius-sm` (8px), hover violeta con glow `16px`.
- Dots activos con `box-shadow: 0 0 10px` (glow violeta), ancho 22px.
- Settings dialog con `--radius-md` en filas, hover en borde.
- Botón remove con `:active` scale.

---

## 9. Interacciones (`js/interactions.js`) — NUEVO

### 3D Tilt
- Las cards de favoritos se inclinan hasta ±3° siguiendo la posición del cursor.
- Usa `perspective(600px)` para profundidad realista.
- Se resetea al salir del card (`mouseout`/`mouseleave`).

### Glow tracking
- Un gradiente radial violeta sigue la posición del mouse dentro de cada card.
- Inyecta `--mouse-x` y `--mouse-y` como custom properties en el elemento.

### Button feedback
- Listener global en `mousedown`: todos los botones escalan a `scale(0.96)`.
- Se restaura en `mouseup` o `mouseleave`.

### Aura parallax
- Los 3 orbes de fondo se desplazan suavemente siguiendo el mouse.
- Desplazamiento máximo: 30px horizontal, 20px vertical.
- Cada orbe tiene un factor de parallax diferente (1.0, 0.7, 0.4).
- Optimizado con `requestAnimationFrame`.

---

## 10. HTML (`index.html`)

- **Font swap**: Fontshare Satoshi → Google Fonts Inter (400, 500, 600, 700).
- **Aura background**: 3 divs `.aura-bg__orb` dentro de `.aura-bg` (antes de wallpaper layers).
- **Script**: `js/interactions.js` añadido con `defer` antes de `js/main.js`.

---

## 11. Boot (`js/main.js`)

- `initInteractions()` se llama al final de `boot()` (con guard `typeof` por si el script falta).

---

## Principios de diseño aplicados

| Principio | Implementación |
|-----------|---------------|
| Glassmorphism 2.0 dark-first | Todas las superficies: blur 16-24px, bordes 0.08 alpha, múltiples niveles de elevación |
| Bento grid | Grid CSS con `repeat(var(--bookmark-cols))`, gap fluido `clamp()` |
| Micro-interacciones | Hover: glow + lift. Click: scale 0.96. Cards: tilt 3D + cursor glow tracking |
| Neumorphism selectivo | `shadow-inset` en cards, scale en botones, no en superficies planas |
| Minimalismo inteligente | Jerarquía visual clara con 4 niveles de texto, gradients solo en acentos |
| Aura background | Orbes blur 120px con parallax, drift animation 20s |
| Featured content | Primer artículo RSS destacado con fondo y tipografía diferenciados |
| Sin dependencias | CSS vanilla + JS nativo, sin frameworks ni librerías |
| Performance | `will-change`, `contain`, `requestAnimationFrame`, `font-display: swap` |
