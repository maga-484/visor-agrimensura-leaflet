// ============================================
// CONFIGURACIÓN DEL MAPA Y CAPAS BASE
// ============================================

export const mapa = L.map("mapa", {
  zoomControl: false, // Desactivamos el default
  attributionControl: true,
}).setView([-34.6037, -58.3816], 13);

// Zoom a la derecha, donde no hay nada
L.control.zoom({ position: "topright" }).addTo(mapa);

window.addEventListener("load", () => mapa.invalidateSize());
setTimeout(() => mapa.invalidateSize(), 300);

export const COLORES = [
  "#e94560",
  "#3498db",
  "#f39c12",
  "#27ae60",
  "#9b59b6",
  "#e74c3c",
  "#1abc9c",
];

// Capas base
export const capaOSM = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 20,
    maxNativeZoom: 19,
  },
);

export const capaHOT = L.tileLayer(
  "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
    maxZoom: 20,
    maxNativeZoom: 19,
  },
);

export const capaVoyager = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
    maxNativeZoom: 19,
  },
);

export const capaSatelite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Tiles &copy; Esri",
    maxZoom: 20,
    maxNativeZoom: 18,
  },
);

// Capa por defecto
capaOSM.addTo(mapa);

// Barra de escala métrica
L.control
  .scale({ metric: true, imperial: false, position: "bottomright" })
  .addTo(mapa);

// Todas las capas en un array para facilitar el switch
export const TODAS_LAS_CAPAS = [capaOSM, capaHOT, capaVoyager, capaSatelite];
