# Start Page

Página de inicio personal en el navegador: favoritos en cajas, búsqueda, reloj, tema claro/oscuro, fondos rotativos, **calendario mensual con eventos** y lectores RSS opcionales. Todo configurable desde la propia página.

## Requisitos

- **Navegador actual** (Chrome, Edge, Firefox u otro con JavaScript habilitado).
- **Node.js 18+** (recomendado LTS) **solo si** quieres servidor local con guardado en disco y misma URL siempre (`http://127.0.0.1:…`). Sin Node puedes abrir `index.html` directamente, pero el guardado del tablero dependerá del navegador y de las limitaciones de `file://`.

El proyecto **no declara dependencias npm**; `npm start` ejecuta Node directamente sobre `tools/local-server.mjs`.

## Uso rápido (sin instalar paquetes)

1. Clona o descarga el repositorio.
2. Opcional: copia `data/start-page-defaults.json.example` a `data/start-page-defaults.json` y edítalo a mano o déjalo; la página también usa el JSON embebido en `index.html` como respaldo.
3. Abre `index.html` en el navegador (doble clic o arrastrar al navegador).

Para una experiencia completa (carga del JSON en `data/`, sincronización del tablero en un archivo del proyecto), usa el servidor local descrito abajo.

## Servidor local (recomendado)

Sirve la web y expone `GET`/`PUT`/`POST` en `/dashboard`, que guarda el tablero en `data/remote-dashboard.json` en tu máquina.

```bash
npm start
```

Equivalente:

```bash
node tools/local-server.mjs
```

Por defecto: **http://127.0.0.1:8080/** (solo tu PC). Variables útiles:

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto (por defecto `8080`). |
| `HOST` | `127.0.0.1` por defecto. Usa `0.0.0.0` solo si necesitas acceso desde otros equipos en la red. |
| `START_PAGE_AUTH_USER` / `START_PAGE_AUTH_PASS` | Si defines **ambas**, la página y `/dashboard` piden usuario y contraseña (HTTP Basic). |

En Windows puedes usar `iniciar-servidor.cmd` o `iniciar-servidor-al-inicio.cmd`. Si creas `start-page.local.env.cmd` (partiendo de `start-page.local.env.cmd.example`), esos scripts cargan variables antes de arrancar Node.

### Página de inicio del navegador

Configura el inicio del navegador con la URL del servidor, por ejemplo `http://127.0.0.1:8080/`.

## Cómo usar la página

- **Menú ⋮** (arriba a la derecha): personalizar cajas y columnas, lectores RSS, **eventos del calendario y mostrar u ocultar el widget**, exportar/importar JSON, restablecer a valores por defecto.
- **Buscar**: elige motor en el desplegable y escribe la consulta.
- **Tema**: botón sol/luna.
- **Fondos**: flechas y puntos en los bordes; botón **🖼** (o menú ⋮ → «Fondos…») para añadir o gestionar URLs si hay más de un fondo configurado en `js/config.js` o guardado en el navegador.
- **Favoritos**: clic para abrir; al pasar el ratón se muestra descripción y URL.
- **RSS**: aparece a la derecha si activas columnas y añades feeds en «Personalizar página».
- **Calendario**: vista mensual con navegación; los días con eventos llevan indicador; puedes añadir, editar o borrar eventos (título, fecha, hora opcional y notas) desde el propio widget o desde el diálogo de personalización.

La configuración “de fábrica” sale del JSON embebido en `index.html` y, si sirves por HTTP, de `data/start-page-defaults.json` si existe y es válido. Los cambios del día a día pueden guardarse en `data/remote-dashboard.json` cuando usas el servidor local (ver `SYNC_DASHBOARD_VIA_SAME_ORIGIN` y `REMOTE_DASHBOARD_SYNC_URL` en `js/config.js`).

## Formato del tablero (JSON)

Además de `widgets`, `rssReaders`, `bookmarkColumns` y `rssColumns`, el estado puede incluir:

- **`calendarEvents`**: lista de eventos (`id`, `date` en `YYYY-MM-DD`, `title`, `time` y `notes` opcionales).
- **`showCalendar`**: `false` para ocultar el panel del calendario.

La plantilla en `data/start-page-defaults.json.example` incluye estos campos vacíos o por defecto.

## Personalización avanzada

- **`js/config.js`**: motores de búsqueda, proxy CORS para RSS, URLs de sincronización, fondos por defecto, intervalo de rotación de fondos, límites RSS, etc.
- **`tools/sync-server-example.mjs`**: API mínima solo `/dashboard` en otro puerto, por si no quieres servir la web con `local-server.mjs`.

## Privacidad y datos en Git

No se incluyen listas personales de favoritos, feeds ni eventos en la documentación de este repositorio.

Archivos **ignorados por Git** (ver `.gitignore`):

- `data/remote-dashboard.json` — tablero guardado por el servidor local (favoritos, RSS, calendario, rejilla).
- `data/start-page-defaults.json` — opcional; tus valores por defecto locales. En el repo solo hay plantilla: `data/start-page-defaults.json.example`.
- `start-page.local.env.cmd` — usuario/contraseña u otras variables (no subir).

Si en el pasado ya versionaste `data/start-page-defaults.json` o `data/remote-dashboard.json`, quítalos del índice sin borrarlos del disco:

```bash
git rm --cached data/start-page-defaults.json data/remote-dashboard.json
```

Luego haz commit del `.gitignore` actualizado.

## Estructura del proyecto

```
├── index.html          # Página y JSON embebido de respaldo
├── css/                # Estilos (incl. calendar.css, dashboard.css, rss.css, …)
├── js/                 # Lógica: config, favoritos, RSS, calendario, fondos, etc.
├── data/
│   ├── start-page-defaults.json.example   # Plantilla versionada
│   └── (local) start-page-defaults.json, remote-dashboard.json
├── tools/
│   ├── local-server.mjs
│   └── sync-server-example.mjs
├── iniciar-servidor.cmd
├── iniciar-servidor-al-inicio.cmd
├── start-page.local.env.cmd.example
└── package.json
```

## Licencia

Este repositorio no incluye aún un archivo `LICENSE`. Si publicas el proyecto, añade la licencia que prefieras.
