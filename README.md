# Rutas Limeñas

Sitio web estático de "Rutas Limeñas", una guía de atractivos turísticos, restaurantes y eventos de Lima Metropolitana. Proyecto académico del curso *Arquitectura de entornos web*.

Autores: Jimmy Lucero, Jorge Hilasaca, Miguel Infante y Renzo Villalta.

---

## Estructura del proyecto

```
website_descubre_lima/
├── index.html          Portada
├── atractivos.html     Sección de atractivos turísticos
├── restaurantes.html   Sección "¿A dónde comer?" (con filtro por distrito)
├── eventos.html        Sección de eventos
├── css/
│   └── estilos.css     Hoja de estilos única del sitio
├── imagenes/           Logos, favicon, fotos grandes y miniaturas
└── multimedia/         Video del recorrido por el Centro Histórico (MP4 y WebM)
```

---

## Conocimientos de HTML aplicados

- **Documento base:** `<!doctype html>`, idioma (`lang="es"`), codificación `utf-8`, meta viewport para diseño adaptable y metadatos para compartir (Open Graph) y para el buscador (`description`).
- **Estructura semántica:** `header`, `nav`, `main`, `section`, `article`, `figure` / `figcaption`, `footer`, con títulos jerárquicos `h1` a `h3`.
- **Accesibilidad:**
  - Enlace «Saltar al contenido» para navegar con teclado.
  - `aria-current="page"` para marcar la página actual en el menú.
  - `aria-labelledby`, `aria-describedby` y `aria-label` para asociar textos y describir controles.
  - Texto alternativo (`alt`) descriptivo en las imágenes; `alt=""` en los elementos decorativos.
  - Texto oculto a la vista (`.visualmente-oculto`) para lectores de pantalla.
- **Imágenes optimizadas:** `srcset` con `sizes` para elegir la versión adecuada según el ancho de pantalla, `width` y `height` para reservar espacio, y `loading="lazy"` y `decoding="async"` para cargarlas bajo demanda.
- **Multimedia:**
  - `<video>` con `controls`, `preload="metadata"` y `poster`, con dos `<source>` (MP4 y WebM) y un enlace de respaldo para navegadores antiguos.
  - `<iframe>` con un mapa de Google Maps, con `title` y `referrerpolicy`.
- **Formulario de sugerencias:**
  - Campos de texto, `select`, `radio`, `textarea`, `fieldset` y `legend`.
  - Validación nativa con `required`, `minlength`, `maxlength`, `type="url"`, `pattern` y `title`.
  - Envío con `method="get"` hacia `index.html#gracias`, por lo que no se requiere servidor.
- **Enlaces:** enlaces internos entre páginas y enlaces externos con `target="_blank"` y `rel="noopener noreferrer"`.
- **Metadatos y recursos:** favicon en SVG y hoja de estilos externa.

---

## Conocimientos de CSS3 aplicados

- **Variables personalizadas:** la paleta y las medidas se definen en `:root` (`--primary`, `--terra`, `--canvas`, `--radius`, etc.) para cambiar colores en todo el sitio desde un solo lugar.
- **Modelo de caja y tipografía:** `box-sizing: border-box`, familia de fuentes del sistema, tamaños con `clamp()` para títulos fluidos y `letter-spacing` en antetítulos.
- **Diseño con Flexbox:**
  - Barra de navegación (`justify-content: space-between`).
  - Menú de enlaces con `flex-wrap`.
  - Pies de tarjeta alineados con `flex: 1` y `margin-top: auto`.
  - Bloques multimedia que se apilan en pantallas angostas (`flex: 1 1 420px`).
- **Diseño con CSS Grid:**
  - Portada con dos columnas (texto y mosaico de fotos) y mosaico con una foto que ocupa dos filas (`grid-row`).
  - Rejilla de tarjetas de 3 columnas en escritorio, 2 en tablet y 1 en móvil (`repeat(3, minmax(0, 1fr))`).
  - Formulario de dos columnas con `grid-column: 1 / -1` para los campos que ocupan todo el ancho.
- **Posicionamiento:** `sticky` para la cabecera fija, `relative` y `absolute` para etiquetas sobre las fotos y el panel del menú móvil.
- **Selectores avanzados:**
  - `:has()` para ocultar tarjetas según el filtro elegido (`.catalog:has(#f-barranco:checked) .card:not(.f-barranco)`).
  - `:checked` con el hermano adyacente (`+`) para resaltar la opción elegida.
  - `:target` para mostrar el mensaje de confirmación del formulario.
  - `:user-invalid` para marcar en rojo solo los campos que el usuario ya modificó.
  - `:focus-visible` para mostrar un contorno de foco al usar el teclado.
- **Menú móvil sin JavaScript:** una casilla oculta (`input type="checkbox"`) con su `label`, y la regla `.menu-check:checked ~ .links` que muestra la navegación.
- **Imágenes responsivas:** `object-fit: cover` para recortar fotos sin deformarlas, `object-position` para encuadrar, y `aspect-ratio: 16 / 9` para el video y el mapa.
- **Efectos y transiciones:** `transition` y `transform` en botones, tarjetas y fotos (hover), y `@keyframes` para la entrada suave del texto de portada.
- **Media queries:** dos puntos de ruptura, 920 px (tablet) y 680 px (móvil), con ajustes de rejilla, altura de imágenes y menú.
- **Accesibilidad visual:** `accent-color` para teñir radios y casillas con el color del sitio, y `@media (prefers-reduced-motion: reduce)` para desactivar animaciones a quien lo pida.
- **Otros:** `rgb()` con transparencia, `box-shadow`, `border-radius`, `clip-path` para ocultar elementos sin quitarlos del foco, y `scroll-behavior: smooth` con `scroll-padding-top` para que los anclajes no queden bajo la cabecera.

---

## Cómo visualizar el sitio con Live Server (VS Code)

Live Server levanta un servidor local y recarga la página automáticamente cada vez que guardas un cambio. Es la forma recomendada de probar el sitio, porque algunas funciones (como las rutas relativas y el formulario) se comportan mejor con un servidor que abriendo el archivo directamente.

1. **Instala Visual Studio Code** si aún no lo tienes.
2. **Instala la extensión Live Server:**
   - Abre VS Code y ve a la pestaña *Extensiones* (`Ctrl + Shift + X`).
   - Busca **Live Server** (autor: Ritwick Dey) e instálala.
3. **Abre la carpeta del proyecto:** en VS Code elige *Archivo → Abrir carpeta…* y selecciona `website_descubre_lima`. Debe ser la carpeta principal, no la de `imagenes` ni `css`, para que las rutas funcionen.
4. **Inicia el servidor** con cualquiera de estas opciones:
   - Haz clic derecho sobre `index.html` en el explorador y elige **Open with Live Server**.
   - O bien, abre `index.html` y pulsa **Go Live** en la barra de estado inferior derecha.
5. El navegador se abre automáticamente con una dirección como `http://127.0.0.1:5500/index.html`. Si no se abre, copia esa dirección en tu navegador.
6. Para **detener el servidor**, pulsa **Port: 5500** o **Go Live** en la barra inferior.

**Notas:**
- El video y el mapa de Google Maps necesitan conexión a internet.
- El formulario de sugerencias no guarda datos: solo valida los campos y muestra un mensaje de confirmación.
- Antes de publicar el sitio, reemplaza `SU-DOMINIO` en las etiquetas `og:image` de los archivos HTML por el dominio real.

---

## Créditos

Proyecto académico desarrollado en el curso *Arquitectura de entornos web* por:
- Jimmy Octavio Lucero Vasquez
- Jorge Luis Hilasaca Sueros
- Miguel Christian Infante López
- Renzo Omar Villalta Castillo
