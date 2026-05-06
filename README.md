# Start Page

Pagina de inicio personal para el navegador. Permite buscar en la web, organizar favoritos por categorias, leer fuentes RSS, cambiar entre modo claro/oscuro y guardar la configuracion localmente.

## Requisitos

- Un navegador moderno con JavaScript habilitado.
- Node.js 18+ solo si quieres usar el servidor local recomendado.

El proyecto no usa dependencias npm externas.

## Ejecutar

Servidor local recomendado:

```bash
npm start
```

Abre:

```text
http://127.0.0.1:8080/
```

Tambien puedes abrir `index.html` directamente, aunque algunas funciones dependen mas de las restricciones del navegador cuando se usa `file://`.

## Uso

- Menu superior: personalizar categorias, favoritos, RSS, calendario, exportar/importar JSON y restablecer datos.
- Favoritos: usa el boton `+` de cada categoria para agregar un sitio. Cada tarjeta incluye icono, nombre, descripcion y dominio.
- RSS: agrega lectores y feeds desde `Personalizar pagina`; se guardan junto con el resto del tablero.
- Tema: usa el boton de sol/luna para alternar modo claro y oscuro.
- Fondos: gestiona imagenes desde el menu o los controles laterales.

## Persistencia

Sin backend, los cambios se guardan en `localStorage`. Si ejecutas el servidor local, tambien puede sincronizar el tablero con:

```text
data/remote-dashboard.json
```

Puedes exportar/importar un respaldo JSON desde el menu superior.

## Estructura

```text
index.html              Pagina principal
css/                    Estilos modulares
js/                     Logica de favoritos, RSS, tema, busqueda y UI
data/                   Plantillas y datos locales ignorados por Git
tools/local-server.mjs  Servidor local
```
