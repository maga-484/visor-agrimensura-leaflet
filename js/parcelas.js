// ============================================
// LÓGICA DE PARCELAS
// ============================================

import { mapa, COLORES } from "./config.js";

let parcelas = [];
let parcelaActivaId = null;
const capasPorParcela = {};

export function getParcelas() {
  return parcelas;
}
export function getParcelaActiva() {
  return parcelas.find((p) => p.id === parcelaActivaId);
}
export function getActivaId() {
  return parcelaActivaId;
}
export function setActivaId(id) {
  parcelaActivaId = id;
}

export function inicializarParcelas(datosIniciales, activaInicial) {
  parcelas = datosIniciales;
  if (activaInicial && parcelas.find((p) => p.id === activaInicial)) {
    parcelaActivaId = activaInicial;
  }
  parcelas.forEach((p) => {
    if (!capasPorParcela[p.id])
      capasPorParcela[p.id] = { marcadores: [], poligono: null };
  });
}

export function crearParcela(nombre = null, coords = [], cerrada = false) {
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const color = COLORES[parcelas.length % COLORES.length];
  const parcela = {
    id,
    nombre: nombre || `Parcela ${parcelas.length + 1}`,
    color,
    coordenadas: coords.map((c) => ({
      lat: c.lat ?? c[0],
      lng: c.lng ?? c[1],
    })),
    cerrada,
    fecha: Date.now(),
  };
  parcelas.push(parcela);
  parcelaActivaId = id;
  capasPorParcela[id] = { marcadores: [], poligono: null };
  return parcela;
}

export function eliminarParcela(id) {
  limpiarCapasParcela(id);
  delete capasPorParcela[id];
  parcelas = parcelas.filter((p) => p.id !== id);
  if (parcelas.length > 0) {
    parcelaActivaId = parcelas[parcelas.length - 1].id;
  } else {
    parcelaActivaId = null;
    crearParcela();
  }
  return parcelaActivaId;
}

function limpiarCapasParcela(id) {
  const capas = capasPorParcela[id];
  if (!capas) return;
  capas.marcadores.forEach((m) => {
    if (mapa.hasLayer(m)) mapa.removeLayer(m);
  });
  if (capas.poligono && mapa.hasLayer(capas.poligono))
    mapa.removeLayer(capas.poligono);
  capas.marcadores = [];
  capas.poligono = null;
}

export function renderizarParcela(parcela) {
  if (!parcela) return;
  const capas = capasPorParcela[parcela.id];
  if (!capas) return;

  capas.marcadores.forEach((m) => {
    if (mapa.hasLayer(m)) mapa.removeLayer(m);
  });
  if (capas.poligono && mapa.hasLayer(capas.poligono))
    mapa.removeLayer(capas.poligono);
  capas.marcadores = [];
  capas.poligono = null;

  const coords = parcela.coordenadas;
  if (coords.length === 0) return;

  coords.forEach((c, idx) => {
    const esActiva = parcela.id === parcelaActivaId;
    const marcador = L.marker([c.lat, c.lng], {
      draggable: esActiva,
      opacity: esActiva ? 1 : 0.5,
    }).addTo(mapa);

    marcador.bindPopup(`<b>${parcela.nombre}</b><br>Vértice ${idx + 1}`);

    if (esActiva) {
      marcador.on("dragend", (ev) => {
        const nuevo = ev.target.getLatLng();
        coords[idx] = { lat: nuevo.lat, lng: nuevo.lng };
        renderizarParcela(parcela);
        // Notificar a UI para recalcular métricas
        document.dispatchEvent(new CustomEvent("parcela:actualizada"));
      });
    }
    capas.marcadores.push(marcador);
  });

  if (coords.length >= 2) {
    const opts = {
      color: parcela.color,
      fillColor: parcela.color,
      fillOpacity: parcela.cerrada ? 0.35 : 0.12,
      weight: parcela.id === parcelaActivaId ? 3 : 2,
      dashArray: parcela.cerrada ? null : "6, 8",
      opacity: parcela.id === parcelaActivaId ? 1 : 0.5,
    };
    capas.poligono = L.polygon(
      coords.map((c) => [c.lat, c.lng]),
      opts,
    ).addTo(mapa);
  }
}

export function renderizarTodo() {
  parcelas.forEach((p) => renderizarParcela(p));
}

export function limpiarActiva() {
  const p = getParcelaActiva();
  if (!p) return;
  p.coordenadas = [];
  p.cerrada = false;
  renderizarTodo();
}

export function deshacerActiva() {
  const p = getParcelaActiva();
  if (!p || p.coordenadas.length === 0) return;
  p.coordenadas.pop();
  if (p.cerrada) p.cerrada = false;
  renderizarTodo();
}

export function agregarVertice(latlng) {
  const p = getParcelaActiva();
  if (!p) return false;
  if (p.cerrada) return "cerrada";
  p.coordenadas.push({ lat: latlng.lat, lng: latlng.lng });
  return true;
}

export function cerrarActiva() {
  const p = getParcelaActiva();
  if (!p || p.coordenadas.length < 3 || p.cerrada) return false;
  p.cerrada = true;
  return true;
}
