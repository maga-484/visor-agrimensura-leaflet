// ============================================
// INTERFAZ DE USUARIO Y EVENTOS
// ============================================

import { mapa, TODAS_LAS_CAPAS } from "./config.js";
import * as parcelas from "./parcelas.js";
import { calcularAreaUTM } from "./utm.js";
import { procesarArchivo } from "./parsers.js";
import { guardar } from "./storage.js";
import { t, setLang, getLang } from "./i18n.js";

// DOM refs
const selCapa = document.getElementById("selector-capa");
const selParcela = document.getElementById("selector-parcela");
const btnNueva = document.getElementById("btn-nueva");
const btnRenombrar = document.getElementById("btn-renombrar");
const btnEliminar = document.getElementById("btn-eliminar");
const btnDeshacer = document.getElementById("btn-deshacer");
const btnReiniciar = document.getElementById("btn-reiniciar");
const btnExportar = document.getElementById("btn-exportar");
const btnUbicacion = document.getElementById("btn-ubicacion");
const inputImport = document.getElementById("input-import");
const btnLangEs = document.getElementById("btn-lang-es");
const btnLangEn = document.getElementById("btn-lang-en");

const txtContador = document.getElementById("contador-puntos");
const txtPerimetro = document.getElementById("resultado-perimetro");
const txtArea = document.getElementById("resultado-area");
const txtHectareas = document.getElementById("resultado-hectareas");

// Helper seguro
function setText(selector, text) {
  const el =
    typeof selector === "string" ? document.querySelector(selector) : selector;
  if (el) el.innerText = text;
}

function setHtml(selector, html) {
  const el =
    typeof selector === "string" ? document.querySelector(selector) : selector;
  if (el) el.innerHTML = html;
}

// ============================================
// APLICAR TRADUCCIONES ESTÁTICAS AL DOM
// ============================================

function aplicarTraducciones() {
  try {
    const lang = getLang();

    // Marcar botón activo
    if (btnLangEs) btnLangEs.classList.toggle("active", lang === "es");
    if (btnLangEn) btnLangEn.classList.toggle("active", lang === "en");

    // Textos estáticos
    setText("h2", t("titulo"));
    setText(".seccion-parcelas h3", t("parcelasTitulo"));
    setText(".instrucciones", t("instrucciones"));
    setText(".import-zone label", t("importar"));
    setHtml(
      ".import-zone small",
      `${t("formatos")}: <strong>CSV, KML, GeoJSON, GPX, SHP (.zip), WKT, TopoJSON</strong>`,
    );

    // Labels por orden de aparición
    const labels = document.querySelectorAll(".grupo-control label");
    const labelKeys = ["capaBase", "parcelaActiva", "importar"];
    labels.forEach((lbl, i) => {
      if (labelKeys[i]) setText(lbl, t(labelKeys[i]));
    });

    // Botones
    setText(btnNueva, t("btnNueva"));
    setText(btnRenombrar, t("btnRenombrar"));
    setText(btnEliminar, t("btnEliminar"));
    setText(btnDeshacer, t("btnDeshacer"));
    setText(btnReiniciar, t("btnReiniciar"));
    setText(btnExportar, t("btnExportar"));
    setText(btnUbicacion, t("btnUbicacion"));

    // Métricas labels
    const metricasSpans = document.querySelectorAll(".fila-metrica span");
    const metricKeys = [
      "vertices",
      "perimetro",
      "superficie",
      "superficie",
      "proyeccion",
    ];
    metricasSpans.forEach((span, i) => {
      if (metricKeys[i]) setText(span, t(metricKeys[i]));
    });

    setText(".utm-badge strong", t("utmExacta"));

    // Opciones del selector de capa
    if (selCapa) {
      const opts = selCapa.querySelectorAll("option");
      const capaKeys = ["capaOSM", "capaHOT", "capaVoyager", "capaSatelite"];
      opts.forEach((opt, i) => {
        if (capaKeys[i]) setText(opt, t(capaKeys[i]));
      });
    }

    // Actualizar métricas dinámicas
    calcularMetricas();
  } catch (err) {
    console.error("Error en aplicarTraducciones:", err);
  }
}

// ============================================
// MÉTRICAS
// ============================================

export function calcularMetricas() {
  const p = parcelas.getParcelaActiva();
  const n = p ? p.coordenadas.length : 0;
  if (txtContador) txtContador.innerText = n;

  if (n < 2) {
    if (txtPerimetro) txtPerimetro.innerText = "0" + t("unidadMetros");
    if (txtArea) txtArea.innerText = "0" + t("unidadMetrosCuadrado");
    if (txtHectareas) txtHectareas.innerText = "0" + t("unidadHectareas");
    actualizarBotones(0);
    return;
  }

  let perimetro = 0;
  for (let i = 0; i < n; i++) {
    const a = L.latLng(p.coordenadas[i].lat, p.coordenadas[i].lng);
    const b = L.latLng(
      p.coordenadas[(i + 1) % n].lat,
      p.coordenadas[(i + 1) % n].lng,
    );
    perimetro += a.distanceTo(b);
  }
  if (txtPerimetro)
    txtPerimetro.innerText =
      Math.round(perimetro).toLocaleString(langLocale()) + t("unidadMetros");

  if (n < 3) {
    if (txtArea) txtArea.innerText = "0" + t("unidadMetrosCuadrado");
    if (txtHectareas) txtHectareas.innerText = "0" + t("unidadHectareas");
    actualizarBotones(n);
    return;
  }

  const areaM2 = calcularAreaUTM(p.coordenadas);
  if (txtArea)
    txtArea.innerText =
      areaM2.toLocaleString(langLocale(), { maximumFractionDigits: 2 }) +
      t("unidadMetrosCuadrado");
  if (txtHectareas)
    txtHectareas.innerText =
      (areaM2 / 10000).toLocaleString(langLocale(), {
        maximumFractionDigits: 4,
      }) + t("unidadHectareas");
  actualizarBotones(n);
}

function langLocale() {
  return getLang() === "en" ? "en-US" : "es-AR";
}

function actualizarBotones(n) {
  if (btnDeshacer) btnDeshacer.disabled = n === 0;
  if (btnExportar) btnExportar.disabled = n === 0;
}

// ============================================
// SELECTOR DE PARCELAS
// ============================================

export function actualizarSelectorParcelas() {
  if (!selParcela) return;
  selParcela.innerHTML = "";
  parcelas.getParcelas().forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.nombre;
    if (p.id === parcelas.getActivaId()) opt.selected = true;
    selParcela.appendChild(opt);
  });
}

// ============================================
// EVENTOS DEL MAPA
// ============================================

export function inicializarEventosMapa() {
  mapa.on("click", (e) => {
    const resultado = parcelas.agregarVertice(e.latlng);
    if (resultado === "cerrada") {
      parcelas.crearParcela();
      actualizarSelectorParcelas();
      parcelas.agregarVertice(e.latlng);
    }
    parcelas.renderizarTodo();
    calcularMetricas();
    guardarEnStorage();
  });

  mapa.on("dblclick", (e) => {
    e.originalEvent.stopPropagation();
    if (parcelas.cerrarActiva()) {
      parcelas.renderizarTodo();
      calcularMetricas();
      guardarEnStorage();
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`<b>${t("cerrado")}</b>`)
        .openOn(mapa);
    }
  });
}

// ============================================
// BOTONES
// ============================================

export function inicializarBotones() {
  // Selector de idioma
  if (btnLangEs) btnLangEs.addEventListener("click", () => setLang("es"));
  if (btnLangEn) btnLangEn.addEventListener("click", () => setLang("en"));

  if (btnNueva)
    btnNueva.addEventListener("click", () => {
      parcelas.crearParcela();
      actualizarSelectorParcelas();
      parcelas.renderizarTodo();
      calcularMetricas();
      guardarEnStorage();
    });

  if (btnRenombrar)
    btnRenombrar.addEventListener("click", () => {
      const p = parcelas.getParcelaActiva();
      if (!p) return;
      const nuevo = prompt(t("placeholderNombre"), p.nombre);
      if (nuevo && nuevo.trim()) {
        p.nombre = nuevo.trim();
        actualizarSelectorParcelas();
        parcelas.renderizarTodo();
        guardarEnStorage();
      }
    });

  if (btnEliminar)
    btnEliminar.addEventListener("click", () => {
      if (parcelas.getParcelas().length <= 1) {
        alert(t("errorUnicaParcela"));
        return;
      }
      if (confirm(t("eliminarConfirm"))) {
        parcelas.eliminarParcela(parcelas.getActivaId());
        actualizarSelectorParcelas();
        parcelas.renderizarTodo();
        calcularMetricas();
        guardarEnStorage();
      }
    });

  if (selParcela)
    selParcela.addEventListener("change", () => {
      parcelas.setActivaId(selParcela.value);
      parcelas.renderizarTodo();
      calcularMetricas();
      guardarEnStorage();
    });

  if (selCapa)
    selCapa.addEventListener("change", () => {
      TODAS_LAS_CAPAS.forEach((c) => {
        if (mapa.hasLayer(c)) mapa.removeLayer(c);
      });
      const seleccion = selCapa.value;
      if (seleccion === "osm") TODAS_LAS_CAPAS[0].addTo(mapa);
      else if (seleccion === "hot") TODAS_LAS_CAPAS[1].addTo(mapa);
      else if (seleccion === "voyager") TODAS_LAS_CAPAS[2].addTo(mapa);
      else if (seleccion === "satelite") TODAS_LAS_CAPAS[3].addTo(mapa);
    });

  if (btnDeshacer)
    btnDeshacer.addEventListener("click", () => {
      parcelas.deshacerActiva();
      calcularMetricas();
      guardarEnStorage();
    });

  if (btnReiniciar)
    btnReiniciar.addEventListener("click", () => {
      parcelas.limpiarActiva();
      calcularMetricas();
      guardarEnStorage();
    });

  if (btnExportar)
    btnExportar.addEventListener("click", () => {
      const p = parcelas.getParcelaActiva();
      if (!p || p.coordenadas.length === 0) return;

      let csv = "Vertice,Latitud,Longitud\n";
      p.coordenadas.forEach((c, i) => {
        csv += `${i + 1},${c.lat.toFixed(8)},${c.lng.toFixed(8)}\n`;
      });

      const area =
        p.coordenadas.length >= 3 ? calcularAreaUTM(p.coordenadas) : 0;
      let per = 0;
      for (let i = 0; i < p.coordenadas.length; i++) {
        const a = L.latLng(p.coordenadas[i].lat, p.coordenadas[i].lng);
        const b = L.latLng(
          p.coordenadas[(i + 1) % p.coordenadas.length].lat,
          p.coordenadas[(i + 1) % p.coordenadas.length].lng,
        );
        per += a.distanceTo(b);
      }

      csv += `\nTOTALES,,Perimetro_m,${per.toFixed(3)},Area_m2,${area.toFixed(3)},Area_ha,${(area / 10000).toFixed(4)}\n`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${p.nombre.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    });

  if (btnUbicacion)
    btnUbicacion.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert(t("errorGeolocalizacion"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          mapa.setView([latitude, longitude], 17);
          L.marker([latitude, longitude])
            .addTo(mapa)
            .bindPopup(t("tuUbicacion"))
            .openPopup();
        },
        (err) => alert(t("errorPrefijo") + err.message),
      );
    });

  if (inputImport)
    inputImport.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const coords = await procesarArchivo(file);
        if (coords.length >= 3) {
          const p = parcelas.getParcelaActiva();
          const nombreBase = file.name.replace(/\.[^/.]+$/, "");
          if (p && p.coordenadas.length === 0) {
            p.coordenadas = coords;
            p.cerrada = true;
            p.nombre = nombreBase;
          } else {
            parcelas.crearParcela(nombreBase, coords, true);
            actualizarSelectorParcelas();
          }
          parcelas.renderizarTodo();
          calcularMetricas();
          guardarEnStorage();

          const lats = coords.map((c) => c.lat);
          const lngs = coords.map((c) => c.lng);
          mapa.fitBounds([
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)],
          ]);
          inputImport.value = "";
        } else {
          alert(t("errorImportMinimo", { n: coords.length }));
        }
      } catch (err) {
        console.error(err);
        alert(t("errorImport") + err.message);
      }
    });

  // Escuchar actualizaciones desde parcelas.js (drag de marcadores)
  document.addEventListener("parcela:actualizada", () => {
    calcularMetricas();
    guardarEnStorage();
  });

  // Toggle panel en mobile
  const btnToggle = document.getElementById("btn-toggle-panel");
  const panel = document.getElementById("panel");

  if (btnToggle && panel) {
    btnToggle.addEventListener("click", () => {
      panel.classList.toggle("abierto");
      btnToggle.innerHTML = panel.classList.contains("abierto") ? "✕" : "☰";
    });

    mapa.on("click", () => {
      if (window.innerWidth <= 768 && panel.classList.contains("abierto")) {
        panel.classList.remove("abierto");
        btnToggle.innerHTML = "☰";
      }
    });
  }

  // Aplicar traducciones al cargar
  aplicarTraducciones();
}

function guardarEnStorage() {
  guardar(parcelas.getParcelas(), parcelas.getActivaId());
}
