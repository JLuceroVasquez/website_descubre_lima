/* ============================================================
   app.js · Comportamiento dinámico de "Rutas Locales · Lima"
   ------------------------------------------------------------
   Este archivo da interactividad al sitio manipulando el DOM.
   Los elementos HTML se seleccionan por su id con
   document.getElementById(), y la apariencia se cambia
   agregando o quitando CLASES definidas en estilos.css
   (classList.toggle), no escribiendo estilos desde JavaScript.

   Flujo general
     1. Al cargar la página (evento DOMContentLoaded) se lee el
        atributo data-section del <body>.
     2. En todas las páginas se activa el menú móvil y se marca
        el enlace de la página actual.
     3. En la portada (data-section="inicio") se actualizan los
        contadores con el total real de registros.
     4. En las secciones (atractivos, restaurantes, eventos) se:
          - completan los textos del hero y del encabezado,
          - generan las opciones de los filtros,
          - dibujan las tarjetas filtradas y paginadas,
          - gestionan favoritos (localStorage) y la ficha modal.

   Índice
     1. Configuración de las secciones
     2. Funciones utilitarias
     3. Favoritos (almacenamiento local)
     4. Navegación común a todas las páginas
     5. Portada
     6. Catálogo: inicialización y eventos
     7. Catálogo: filtrado y paginación
     8. Catálogo: plantilla de tarjeta
     9. Ficha de detalle (ventana modal)
    10. Arranque
   ============================================================ */

// La función autoejecutable (IIFE) evita crear variables globales
(() => {
  "use strict";

  /* ==========================================================
     1. CONFIGURACIÓN DE LAS SECCIONES
     Un objeto por sección con los textos que se muestran y los
     nombres de las columnas del inventario que se usan.
     ========================================================== */
  const SECCIONES = {
    atractivos: {
      datos: "Atractivos",              // clave dentro de window.INVENTARIO
      nombre: "Atractivos turísticos",
      campoCategoria: "Categoría",
      campoResena: "Reseña e importancia",
      intro: "Patrimonio, cultura, naturaleza y lugares para descubrir en Lima Metropolitana.",
      titulo: "Encuentra tu próximo paseo",
      antetitulo: "Conoce Lima · Patrimonio y experiencias",
      arte: "",                         // clase extra de la ilustración (ninguna = paisaje)
      pagina: "atractivos.html",
    },
    restaurantes: {
      datos: "Restaurantes",
      nombre: "¿A dónde comer?",
      campoCategoria: "Tipo cocina",
      campoResena: "Reseña / especialidad",
      intro: "Explora sabores peruanos y propuestas gastronómicas de distintos distritos.",
      titulo: "Sabores por descubrir",
      antetitulo: "Sabores de Lima · Gastronomía",
      arte: "food",
      pagina: "restaurantes.html",
    },
    eventos: {
      datos: "Eventos",
      nombre: "Eventos en Lima",
      campoCategoria: null,             // en eventos la categoría es el lugar u organizador
      campoResena: "Reseña breve",
      intro: "Cartelera cultural y encuentros para organizar tus próximos planes. Confirma fechas antes de acudir.",
      titulo: "Planes para tu agenda",
      antetitulo: "Lima en movimiento · Agenda",
      arte: "event",
      pagina: "eventos.html",
    },
  };

  // Campos que NO se repiten en la cuadrícula de la ficha porque ya se muestran en otro lugar
  const CAMPOS_OMITIDOS = [
    "Vista", "Nombre", "Distrito", "Categoría", "Tipo cocina",
    "Reseña e importancia", "Reseña / especialidad", "Reseña breve",
    "Fotos (abrir)", "Foto 1 (abrir)", "Foto 2 (abrir)", "Foto 3 (abrir)",
    "Mapa", "Fuente", "Enlace oficial", "Fecha verif.",
  ];

  const POR_PAGINA = 12;                         // tarjetas por página
  const CLAVE_FAVORITOS = "rutas-lima-favoritos"; // clave en localStorage

  // Datos cargados por assets/datos.js
  const INVENTARIO = window.INVENTARIO || {};


  /* ==========================================================
     2. FUNCIONES UTILITARIAS
     ========================================================== */

  // Atajo para seleccionar elementos por id
  const byId = (id) => document.getElementById(id);

  // Escapa caracteres especiales antes de insertar texto con innerHTML
  // (evita que un dato con "<" o comillas rompa el HTML)
  function escapar(texto) {
    const reemplazos = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(texto ?? "").replace(/[&<>"']/g, (c) => reemplazos[c]);
  }

  // Devuelve el valor de un campo como texto sin espacios sobrantes
  function campo(registro, nombreCampo) {
    return String(registro[nombreCampo] ?? "").trim();
  }

  // Normaliza un texto para buscar: minúsculas y sin tildes ("Museo" = "muséo")
  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  }

  // Extrae la primera URL que aparece dentro de un texto
  function extraerURL(texto) {
    const coincidencia = String(texto || "").match(/https?:\/\/[^\s]+/);
    return coincidencia ? coincidencia[0] : "";
  }

  // Solo acepta enlaces https (seguridad básica)
  function urlSegura(url) {
    return /^https:\/\//i.test(url) ? url : "";
  }

  // Recorta un texto largo y agrega "…"
  function recortar(texto, maximo = 145) {
    return texto.length > maximo ? texto.slice(0, maximo).trim() + "…" : texto;
  }

  // Convierte "2026-10-09" en "09/10/2026"
  function formatearFecha(fecha) {
    if (!fecha) return "Por confirmar";
    const partes = String(fecha).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : fecha;
  }

  // Lista de valores únicos, sin vacíos y ordenados alfabéticamente
  function valoresUnicos(lista) {
    return [...new Set(lista.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  }

  // Genera las etiquetas <option> de un <select>
  function opcionesHTML(textoTodos, valores) {
    return (
      `<option value="">${textoTodos}</option>` +
      valores.map((v) => `<option value="${escapar(v)}">${escapar(v)}</option>`).join("")
    );
  }


  /* ==========================================================
     3. FAVORITOS
     Se guardan en localStorage como un arreglo de identificadores
     "seccion::Nombre". try/catch protege los casos en que el
     navegador bloquea el almacenamiento (por ejemplo con file://).
     ========================================================== */
  let favoritos = [];

  try {
    const guardados = JSON.parse(localStorage.getItem(CLAVE_FAVORITOS) || "[]");
    favoritos = Array.isArray(guardados) ? guardados : [];
  } catch {
    favoritos = [];
  }

  function guardarFavoritos() {
    try {
      localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos));
    } catch {
      /* si no se puede guardar, los favoritos duran solo esta visita */
    }
  }


  /* ==========================================================
     4. NAVEGACIÓN COMÚN A TODAS LAS PÁGINAS
     ========================================================== */

  // Menú móvil: al pulsar ☰ se agrega/quita la clase .open de la
  // navegación; el CSS decide si se muestra (ver media query 680px)
  function iniciarMenuMovil() {
    const boton = byId("mobile-menu");
    const menu = byId("nav-links");
    if (!boton || !menu) return;

    boton.addEventListener("click", () => {
      const abierto = menu.classList.toggle("open");
      boton.setAttribute("aria-expanded", String(abierto)); // informa a lectores de pantalla
    });
  }

  // Resalta el enlace de la página actual con la clase .active
  function marcarEnlaceActivo(seccionActual) {
    ["inicio", ...Object.keys(SECCIONES)].forEach((clave) => {
      const enlace = byId("nav-" + clave);
      if (enlace) enlace.classList.toggle("active", clave === seccionActual);
    });
  }


  /* ==========================================================
     5. PORTADA
     Reemplaza los números escritos en el HTML por los totales
     reales del inventario.
     ========================================================== */
  function iniciarPortada() {
    let total = 0;

    Object.entries(SECCIONES).forEach(([clave, config]) => {
      const cantidad = (INVENTARIO[config.datos] || []).length;
      const contador = byId("home-count-" + clave);
      if (contador && cantidad) contador.textContent = cantidad;
      total += cantidad;
    });

    if (total) byId("home-total").textContent = total;
  }


  /* ==========================================================
     6. CATÁLOGO: INICIALIZACIÓN Y EVENTOS
     ========================================================== */

  // Estado del catálogo (variables que cambian con las acciones del usuario)
  let clave = "";            // sección actual
  let config = null;         // configuración de la sección actual
  let registros = [];        // todos los registros de la sección
  let filtrados = [];        // registros que cumplen los filtros
  let pagina = 1;            // página actual
  let soloFavoritos = false; // ¿mostrar solo favoritos?

  // Identificador único de un registro para la lista de favoritos
  const idRegistro = (registro) => clave + "::" + registro.Nombre;

  // Categoría que se usa para filtrar y mostrar en la tarjeta
  function categoria(registro) {
    return config.campoCategoria
      ? campo(registro, config.campoCategoria)
      : campo(registro, "Lugar") || campo(registro, "Organizador");
  }

  function iniciarCatalogo(seccion) {
    clave = seccion;
    config = SECCIONES[seccion];
    registros = INVENTARIO[config.datos] || [];

    // --- Textos del hero y del encabezado ---
    byId("hero-eyebrow").textContent = config.antetitulo;
    byId("hero-title").textContent = config.titulo;
    byId("hero-subtitle").textContent = config.intro;
    byId("section-title").textContent = config.nombre;
    byId("section-description").textContent =
      "Busca por nombre, distrito o interés y consulta los detalles de cada ficha.";
    byId("category-label").textContent =
      seccion === "eventos" ? "Lugar / organizador" : "Categoría / tipo";

    // --- Opciones de los filtros, generadas a partir de los datos ---
    byId("district").innerHTML = opcionesHTML(
      "Todos los distritos",
      valoresUnicos(registros.map((r) => campo(r, "Distrito")))
    );
    byId("category").innerHTML = opcionesHTML(
      "Todas las opciones",
      valoresUnicos(registros.map(categoria))
    );

    // --- Pestañas: marca la actual y muestra cuántas fichas tiene cada sección ---
    Object.entries(SECCIONES).forEach(([k, v]) => {
      byId("tab-" + k).classList.toggle("current", k === seccion);
      byId("count-" + k).textContent = (INVENTARIO[v.datos] || []).length + " fichas";
    });

    // --- Filtro inicial desde la URL (?distrito=Miraflores), usado por "Continúa tu recorrido" ---
    const parametros = new URLSearchParams(location.search);
    if (parametros.get("distrito")) byId("district").value = parametros.get("distrito");

    registrarEventosCatalogo();
    aplicarFiltros();
  }

  function registrarEventosCatalogo() {
    // Evita que Enter recargue la página al enviar el formulario de filtros
    byId("filter-form").addEventListener("submit", (e) => e.preventDefault());

    // Cada cambio en un filtro vuelve a calcular los resultados
    byId("search").addEventListener("input", () => aplicarFiltros());
    byId("district").addEventListener("change", () => aplicarFiltros());
    byId("category").addEventListener("change", () => aplicarFiltros());

    // Botón "Limpiar": restablece todos los filtros
    byId("clear").addEventListener("click", () => {
      byId("filter-form").reset();
      soloFavoritos = false;
      byId("only-favs").textContent = "☆ Ver favoritos";
      aplicarFiltros();
    });

    // Botón "Ver favoritos": alterna entre todos los registros y solo los favoritos
    byId("only-favs").addEventListener("click", () => {
      soloFavoritos = !soloFavoritos;
      byId("only-favs").textContent = soloFavoritos ? "★ Mostrando favoritos" : "☆ Ver favoritos";
      aplicarFiltros();
    });

    // Paginación
    byId("prev").addEventListener("click", () => cambiarPagina(-1));
    byId("next").addEventListener("click", () => cambiarPagina(1));

    // Delegación de eventos: un solo listener en el contenedor #results
    // atiende los clics de todas las tarjetas, incluso de las que se
    // crean después. data-open / data-fav indican qué registro es.
    byId("results").addEventListener("click", (e) => {
      const botonFicha = e.target.closest("[data-open]");
      const botonFav = e.target.closest("[data-fav]");

      if (botonFicha) abrirFicha(filtrados[Number(botonFicha.dataset.open)]);
      if (botonFav) alternarFavorito(filtrados[Number(botonFav.dataset.fav)]);
    });

    // Ventana modal: se cierra con el botón × o al hacer clic en el fondo oscuro
    const modal = byId("detail-modal");
    byId("modal-close").addEventListener("click", () => modal.close());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.close();
    });
  }


  /* ==========================================================
     7. CATÁLOGO: FILTRADO Y PAGINACIÓN
     ========================================================== */

  // Filtra los registros según buscador, distrito, categoría y favoritos.
  // mantenerPagina = true se usa al marcar un favorito para no saltar a la página 1.
  function aplicarFiltros(mantenerPagina = false) {
    const texto = normalizar(byId("search").value.trim());
    const distrito = byId("district").value;
    const cat = byId("category").value;

    filtrados = registros.filter((r) =>
      (!distrito || campo(r, "Distrito") === distrito) &&
      (!cat || categoria(r) === cat) &&
      (!soloFavoritos || favoritos.includes(idRegistro(r))) &&
      (!texto || normalizar(Object.values(r).join(" ")).includes(texto))
    );

    if (!mantenerPagina) pagina = 1;
    mostrarResultados();
  }

  function cambiarPagina(paso) {
    pagina += paso;
    mostrarResultados();
    byId("results").scrollIntoView({ block: "start" });
  }

  // Dibuja en #results las tarjetas de la página actual
  function mostrarResultados() {
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
    pagina = Math.min(pagina, totalPaginas);

    const inicio = (pagina - 1) * POR_PAGINA;
    const visibles = filtrados.slice(inicio, inicio + POR_PAGINA);

    // Contador de resultados
    byId("result-count").textContent =
      `${filtrados.length} ${filtrados.length === 1 ? "resultado" : "resultados"}` +
      ` · ${registros.length} registros en el inventario`;

    // Tarjetas (o mensaje vacío). El índice que se pasa es la posición en "filtrados"
    byId("results").innerHTML = visibles.length
      ? visibles.map((r, i) => tarjetaHTML(r, inicio + i)).join("")
      : `<div class="empty">
           <h3>Sin resultados</h3>
           <p>Prueba con otra palabra, distrito o categoría.</p>
         </div>`;

    // Estado de la paginación
    byId("page-label").textContent = `Página ${pagina} de ${totalPaginas}`;
    byId("prev").disabled = pagina === 1;
    byId("next").disabled = pagina >= totalPaginas;
  }

  // Agrega o quita un registro de favoritos y vuelve a dibujar
  function alternarFavorito(registro) {
    const id = idRegistro(registro);
    favoritos = favoritos.includes(id)
      ? favoritos.filter((f) => f !== id)
      : [...favoritos, id];

    guardarFavoritos();
    aplicarFiltros(true);
  }


  /* ==========================================================
     8. CATÁLOGO: PLANTILLA DE TARJETA
     ========================================================== */

  // Dos datos rápidos que se muestran como "chips" según la sección
  function datosRapidos(r) {
    if (clave === "atractivos") return [campo(r, "Costo / entrada"), campo(r, "Horario y visita")];
    if (clave === "restaurantes") return [campo(r, "Clasificación precio"), campo(r, "Precio estimado")];
    return [formatearFecha(campo(r, "Fecha")), campo(r, "Precio")];
  }

  // Devuelve el HTML de una tarjeta. Solo usa clases definidas en estilos.css
  function tarjetaHTML(r, indice) {
    const esFavorito = favoritos.includes(idRegistro(r));
    const nombre = escapar(r.Nombre);

    const chips = datosRapidos(r)
      .map((v) => `<span class="chip" title="${escapar(v)}">${escapar(recortar(v, 37))}</span>`)
      .join("");

    return `
      <article class="card">
        <div class="card-art ${config.arte}">
          <span class="art-tag">Ilustración decorativa</span>
          <button class="fav" type="button" data-fav="${indice}"
                  aria-pressed="${esFavorito}"
                  aria-label="${esFavorito ? "Quitar de" : "Añadir a"} favoritos: ${nombre}">
            ${esFavorito ? "★" : "☆"}
          </button>
        </div>
        <div class="card-body">
          <div class="kicker">${escapar(r.Distrito || "Lima")} · ${escapar(recortar(categoria(r), 38))}</div>
          <h3>${nombre}</h3>
          <p>${escapar(recortar(campo(r, config.campoResena)))}</p>
          <div class="facts">${chips}</div>
          <div class="card-bottom">
            <span class="stamp">Revisión: ${escapar(formatearFecha(campo(r, "Fecha verif.")))}</span>
            <button class="btn btn-primary small" type="button" data-open="${indice}">Ver ficha ↗</button>
          </div>
        </div>
      </article>`;
  }


  /* ==========================================================
     9. FICHA DE DETALLE (VENTANA MODAL)
     ========================================================== */

  // Una caja "etiqueta + valor" de la cuadrícula de la ficha
  function datoHTML(etiqueta, valor) {
    return valor
      ? `<div class="detail"><strong>${escapar(etiqueta)}</strong><span>${escapar(valor)}</span></div>`
      : "";
  }

  // Botón que abre un enlace externo en una pestaña nueva
  function enlaceHTML(url, texto, variante) {
    return `<a class="btn ${variante}" href="${escapar(url)}" target="_blank" rel="noopener noreferrer">${texto} ↗</a>`;
  }

  function abrirFicha(r) {
    // Encabezado y reseña
    byId("modal-kicker").textContent = `${r.Distrito || "Lima"} · ${categoria(r)}`;
    byId("modal-title").textContent = r.Nombre;
    byId("modal-description").textContent = campo(r, config.campoResena);

    // Resto de campos del registro en la cuadrícula
    byId("modal-fields").innerHTML =
      Object.entries(r)
        .filter(([k, v]) => !CAMPOS_OMITIDOS.includes(k) && v)
        .map(([k, v]) => datoHTML(k, String(v)))
        .join("") +
      datoHTML("Fecha de revisión del inventario", formatearFecha(campo(r, "Fecha verif.")));

    // Enlaces externos disponibles (mapa, fuente oficial y búsqueda de fotos)
    const mapa = urlSegura(campo(r, "Mapa"));
    const fuente = urlSegura(campo(r, "Fuente") || campo(r, "Enlace oficial"));
    const fotos = urlSegura(extraerURL(campo(r, "Foto 1 (abrir)") || campo(r, "Fotos (abrir)")));

    const enlaces = [];
    if (mapa) enlaces.push(enlaceHTML(mapa, "Abrir mapa", "btn-primary"));
    if (fuente) enlaces.push(enlaceHTML(fuente, "Consultar fuente", "btn-light"));
    if (fotos) enlaces.push(enlaceHTML(fotos, "Buscar fotografías", "btn-light"));
    byId("modal-links").innerHTML = enlaces.join("");

    // "Continúa tu recorrido": enlaces a las otras secciones filtradas por el mismo distrito
    const distrito = r.Distrito || "";
    const otras = Object.entries(SECCIONES)
      .filter(([k]) => k !== clave)
      .map(([, v]) =>
        `<a class="btn btn-light small" href="${v.pagina}?distrito=${encodeURIComponent(distrito)}">${escapar(v.nombre)} ↗</a>`
      )
      .join("");

    byId("related").innerHTML = `
      <h3>Continúa tu recorrido</h3>
      <p>Explora también otros planes en ${escapar(distrito || "Lima")}.</p>
      <div class="related-list">${otras}</div>`;

    // Muestra el <dialog> como ventana modal
    byId("detail-modal").showModal();
  }


  /* ==========================================================
     10. ARRANQUE
     Se espera a que el HTML esté listo y se decide qué iniciar
     según el atributo data-section del <body>.
     ========================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    const seccion = document.body.dataset.section || "inicio";

    iniciarMenuMovil();
    marcarEnlaceActivo(seccion);

    if (seccion === "inicio") {
      iniciarPortada();
    } else if (SECCIONES[seccion]) {
      iniciarCatalogo(seccion);
    }
  });
})();
