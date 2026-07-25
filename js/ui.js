// ============================================
// INTERFAZ DE USUARIO Y EVENTOS
// ============================================

import { mapa, TODAS_LAS_CAPAS } from "./config.js";
import * as parcelas from "./parcelas.js";
import { calcularAreaUTM } from "./utm.js";
import { procesarArchivo } from "./parsers.js";
import { guardar } from "./storage.js";

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

const txtContador = document.getElementById("contador-puntos");
const txtPerimetro = document.getElementById("resultado-perimetro");
const txtArea = document.getElementById("resultado-area");
const txtHectareas = document.getElementById("resultado-hectareas");

// ============================================
// MÉTRICAS
// ============================================

export function calcularMetricas() {
  const p = parcelas.getParcelaActiva();
  const n = p ? p.coordenadas.length : 0;
  txtContador.innerText = n;

  if (n < 2) {
    txtPerimetro.innerText = "0 m";
    txtArea.innerText = "0 m²";
    txtHectareas.innerText = "0 ha";
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
  txtPerimetro.innerText = Math.round(perimetro).toLocaleString("es-AR") + " m";

  if (n < 3) {
    txtArea.innerText = "0 m²";
    txtHectareas.innerText = "0 ha";
    actualizarBotones(n);
    return;
  }

  const areaM2 = calcularAreaUTM(p.coordenadas);
  txtArea.innerText =
    areaM2.toLocaleString("es-AR", { maximumFractionDigits: 2 }) + " m²";
  txtHectareas.innerText =
    (areaM2 / 10000).toLocaleString("es-AR", { maximumFractionDigits: 4 }) +
    " ha";
  actualizarBotones(n);
}

function actualizarBotones(n) {
  btnDeshacer.disabled = n === 0;
  btnExportar.disabled = n === 0;
}

// ============================================
// SELECTOR DE PARCELAS
// ============================================

export function actualizarSelectorParcelas() {
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
        .setContent("<b>✅ Cerrado</b>")
        .openOn(mapa);
    }
  });
}

// ============================================
// BOTONES
// ============================================

export function inicializarBotones() {
  btnNueva.addEventListener("click", () => {
    parcelas.crearParcela();
    actualizarSelectorParcelas();
    parcelas.renderizarTodo();
    calcularMetricas();
    guardarEnStorage();
  });

  btnRenombrar.addEventListener("click", () => {
    const p = parcelas.getParcelaActiva();
    if (!p) return;
    const nuevo = prompt("Nombre de la parcela:", p.nombre);
    if (nuevo && nuevo.trim()) {
      p.nombre = nuevo.trim();
      actualizarSelectorParcelas();
      parcelas.renderizarTodo();
      guardarEnStorage();
    }
  });

  btnEliminar.addEventListener("click", () => {
    if (parcelas.getParcelas().length <= 1) {
      alert(
        "No podés eliminar la única parcela. Limpiá sus vértices en su lugar.",
      );
      return;
    }
    if (confirm("¿Eliminar esta parcela?")) {
      parcelas.eliminarParcela(parcelas.getActivaId());
      actualizarSelectorParcelas();
      parcelas.renderizarTodo();
      calcularMetricas();
      guardarEnStorage();
    }
  });

  selParcela.addEventListener("change", () => {
    parcelas.setActivaId(selParcela.value);
    parcelas.renderizarTodo();
    calcularMetricas();
    guardarEnStorage();
  });

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

  btnDeshacer.addEventListener("click", () => {
    parcelas.deshacerActiva();
    calcularMetricas();
    guardarEnStorage();
  });

  btnReiniciar.addEventListener("click", () => {
    parcelas.limpiarActiva();
    calcularMetricas();
    guardarEnStorage();
  });

  btnExportar.addEventListener("click", () => {
    const p = parcelas.getParcelaActiva();
    if (!p || p.coordenadas.length === 0) return;

    let csv = "Vertice,Latitud,Longitud\n";
    p.coordenadas.forEach((c, i) => {
      csv += `${i + 1},${c.lat.toFixed(8)},${c.lng.toFixed(8)}\n`;
    });

    const area = p.coordenadas.length >= 3 ? calcularAreaUTM(p.coordenadas) : 0;
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

  btnUbicacion.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("No soportado");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapa.setView([latitude, longitude], 17);
        L.marker([latitude, longitude])
          .addTo(mapa)
          .bindPopup("📍 Tu ubicación")
          .openPopup();
      },
      (err) => alert("Error: " + err.message),
    );
  });

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
        alert(
          `Solo se encontraron ${coords.length} coordenadas válidas. Se requieren al menos 3.`,
        );
      }
    } catch (err) {
      console.error(err);
      alert("Error al importar: " + err.message);
    }
  });

  // Escuchar actualizaciones desde parcelas.js (drag de marcadores)
  document.addEventListener("parcela:actualizada", () => {
    calcularMetricas();
    guardarEnStorage();
  });
}

function guardarEnStorage() {
  guardar(parcelas.getParcelas(), parcelas.getActivaId());
}
