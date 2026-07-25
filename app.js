// ============================================
// CONFIGURACIÓN DEL MAPA
// ============================================
const mapa = L.map("mapa", {
  zoomControl: true,
  attributionControl: true,
}).setView([-34.6037, -58.3816], 13);

window.addEventListener("load", () => mapa.invalidateSize());
setTimeout(() => mapa.invalidateSize(), 300);

// --- DEFINICIÓN DE LAS 4 CAPAS BASE ---
const capaOSM = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 20,
    maxNativeZoom: 19,
  },
);

const capaHOT = L.tileLayer(
  "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
    maxZoom: 20,
    maxNativeZoom: 19,
  },
);

const capaVoyager = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
    maxNativeZoom: 19,
  },
);

const capaSatelite = L.tileLayer(
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

// ============================================
// ESTADO: MÚLTIPLES PARCELAS
// ============================================
const COLORES = [
  "#e94560",
  "#3498db",
  "#f39c12",
  "#27ae60",
  "#9b59b6",
  "#e74c3c",
  "#1abc9c",
];

let parcelas = [];
let parcelaActivaId = null;
let capasPorParcela = {};

// DOM
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
// LOCALSTORAGE
// ============================================
function guardarEnStorage() {
  localStorage.setItem("visor_parcelas_v3", JSON.stringify(parcelas));
  localStorage.setItem("visor_activa_v3", parcelaActivaId || "");
}

function cargarDesdeStorage() {
  const raw = localStorage.getItem("visor_parcelas_v3");
  const activa = localStorage.getItem("visor_activa_v3");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) parcelas = parsed;
    } catch (e) {
      parcelas = [];
    }
  }
  if (activa && parcelas.find((p) => p.id === activa)) parcelaActivaId = activa;
}

// ============================================
// MÚLTIPLES PARCELAS
// ============================================
function crearParcela(nombre = null, coords = [], cerrada = false) {
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

function getParcelaActiva() {
  return parcelas.find((p) => p.id === parcelaActivaId);
}

function actualizarSelectorParcelas() {
  selParcela.innerHTML = "";
  parcelas.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.nombre;
    if (p.id === parcelaActivaId) opt.selected = true;
    selParcela.appendChild(opt);
  });
}

function eliminarParcela(id) {
  limpiarCapasParcela(id);
  delete capasPorParcela[id];
  parcelas = parcelas.filter((p) => p.id !== id);
  if (parcelas.length > 0) {
    parcelaActivaId = parcelas[parcelas.length - 1].id;
  } else {
    parcelaActivaId = null;
    crearParcela();
  }
  actualizarSelectorParcelas();
  renderizarTodo();
  guardarEnStorage();
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

function renderizarParcela(parcela) {
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
        calcularMetricas();
        guardarEnStorage();
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

function renderizarTodo() {
  parcelas.forEach((p) => renderizarParcela(p));
  calcularMetricas();
  actualizarUI();
}

function actualizarUI() {
  const p = getParcelaActiva();
  const n = p ? p.coordenadas.length : 0;
  btnDeshacer.disabled = n === 0;
  btnExportar.disabled = n === 0;
}

// ============================================
// EVENTOS DEL MAPA
// ============================================
mapa.on("click", function (e) {
  const p = getParcelaActiva();
  if (!p) return;
  if (p.cerrada) {
    crearParcela();
    actualizarSelectorParcelas();
  }
  p.coordenadas.push({ lat: e.latlng.lat, lng: e.latlng.lng });
  renderizarTodo();
  guardarEnStorage();
});

mapa.on("dblclick", function (e) {
  e.originalEvent.stopPropagation();
  const p = getParcelaActiva();
  if (!p) return;
  if (p.coordenadas.length >= 3 && !p.cerrada) {
    p.cerrada = true;
    renderizarTodo();
    guardarEnStorage();
    L.popup().setLatLng(e.latlng).setContent("<b>✅ Cerrado</b>").openOn(mapa);
  }
});

// ============================================
// UTM EXACTA
// ============================================
function latLngToUTM(lat, lng) {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const e2 = 2 * f - f * f;
  const e2p = e2 / (1 - e2);
  const k0 = 0.9996;

  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const zona = Math.floor((lng + 180) / 6) + 1;
  const lng0 = (((zona - 1) * 6 - 180 + 3) * Math.PI) / 180;

  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2);
  const T = Math.tan(latRad) ** 2;
  const C = e2p * Math.cos(latRad) ** 2;
  const A = Math.cos(latRad) * (lngRad - lng0);

  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * latRad -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) *
        Math.sin(2 * latRad) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * latRad) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * latRad));

  let este =
    k0 *
    N *
    (A +
      ((1 - T + C) * A ** 3) / 6 +
      ((5 - 18 * T + T ** 2 + 72 * C - 58 * e2p) * A ** 5) / 120);
  este += 500000;

  let norte =
    k0 *
    (M +
      N *
        Math.tan(latRad) *
        (A ** 2 / 2 +
          ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 +
          ((61 - 58 * T + T ** 2 + 600 * C - 330 * e2p) * A ** 6) / 720));
  if (lat < 0) norte += 10000000;

  return { zona, este, norte };
}

function calcularAreaUTM(coords) {
  if (coords.length < 3) return 0;
  const utm = coords.map((c) => latLngToUTM(c.lat, c.lng));
  let area = 0;
  const n = utm.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += utm[i].este * utm[j].norte - utm[j].este * utm[i].norte;
  }
  return Math.abs(area) / 2;
}

function calcularMetricas() {
  const p = getParcelaActiva();
  const n = p ? p.coordenadas.length : 0;
  txtContador.innerText = n;

  if (n < 2) {
    txtPerimetro.innerText = "0 m";
    txtArea.innerText = "0 m²";
    txtHectareas.innerText = "0 ha";
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
    return;
  }

  const areaM2 = calcularAreaUTM(p.coordenadas);
  txtArea.innerText =
    areaM2.toLocaleString("es-AR", { maximumFractionDigits: 2 }) + " m²";
  txtHectareas.innerText =
    (areaM2 / 10000).toLocaleString("es-AR", { maximumFractionDigits: 4 }) +
    " ha";
}

// ============================================
// PARSERS DE IMPORTACIÓN
// ============================================
function extraerCoordsDeGeoJSON(geojson) {
  const coords = [];
  function extraer(geom) {
    if (!geom) return;
    if (geom.type === "Polygon") {
      geom.coordinates[0].forEach((c) => coords.push({ lat: c[1], lng: c[0] }));
    } else if (geom.type === "MultiPolygon") {
      geom.coordinates.forEach((poly) =>
        poly[0].forEach((c) => coords.push({ lat: c[1], lng: c[0] })),
      );
    } else if (geom.type === "LineString") {
      geom.coordinates.forEach((c) => coords.push({ lat: c[1], lng: c[0] }));
    } else if (geom.type === "Point") {
      coords.push({ lat: geom.coordinates[1], lng: geom.coordinates[0] });
    }
  }
  if (geojson.type === "FeatureCollection") {
    geojson.features.forEach((f) => extraer(f.geometry));
  } else if (geojson.type === "Feature") {
    extraer(geojson.geometry);
  } else {
    extraer(geojson);
  }
  return coords;
}

function parsearCSV(texto) {
  const coords = [];
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
  for (const linea of lineas) {
    const partes = linea.split(/[,;\t]/);
    if (partes.length >= 2) {
      const lat = parseFloat(
        partes[partes.length - 2].trim().replace(",", "."),
      );
      const lng = parseFloat(
        partes[partes.length - 1].trim().replace(",", "."),
      );
      if (!isNaN(lat) && !isNaN(lng)) coords.push({ lat, lng });
    }
  }
  return coords;
}

function parsearKML(texto) {
  const coords = [];
  const parser = new DOMParser();
  const xml = parser.parseFromString(texto, "text/xml");
  const coordElements = xml.getElementsByTagName("coordinates");
  for (let el of coordElements) {
    const textoCoords = el.textContent.trim();
    const puntos = textoCoords.split(/\s+/);
    for (let pt of puntos) {
      const partes = pt.split(",");
      if (partes.length >= 2) {
        const lng = parseFloat(partes[0]);
        const lat = parseFloat(partes[1]);
        if (!isNaN(lat) && !isNaN(lng)) coords.push({ lat, lng });
      }
    }
  }
  return coords;
}

function parsearGPX(texto) {
  const coords = [];
  const parser = new DOMParser();
  const xml = parser.parseFromString(texto, "text/xml");
  ["trkpt", "wpt", "rtept"].forEach((tag) => {
    const pts = xml.getElementsByTagName(tag);
    for (let pt of pts) {
      const lat = parseFloat(pt.getAttribute("lat"));
      const lon = parseFloat(pt.getAttribute("lon"));
      if (!isNaN(lat) && !isNaN(lon)) coords.push({ lat, lng: lon });
    }
  });
  return coords;
}

function parsearWKT(texto) {
  const coords = [];
  const limpio = texto.replace(/\s+/g, " ").trim();

  const polyMatch = limpio.match(/POLYGON\s*\(\s*\(\s*([^\)]+)\)\s*\)/i);
  if (polyMatch) {
    const nums = polyMatch[1].match(/-?\d+\.?\d*/g);
    for (let i = 0; i < nums.length; i += 2) {
      coords.push({ lng: parseFloat(nums[i]), lat: parseFloat(nums[i + 1]) });
    }
    return coords;
  }

  const multiMatch = limpio.match(
    /MULTIPOLYGON\s*\(\s*\(\s*\(\s*([^\)]+)\)\s*\)\s*\)/i,
  );
  if (multiMatch) {
    const nums = multiMatch[1].match(/-?\d+\.?\d*/g);
    for (let i = 0; i < nums.length; i += 2) {
      coords.push({ lng: parseFloat(nums[i]), lat: parseFloat(nums[i + 1]) });
    }
    return coords;
  }

  const lineMatch = limpio.match(/LINESTRING\s*\(\s*([^\)]+)\)/i);
  if (lineMatch) {
    const nums = lineMatch[1].match(/-?\d+\.?\d*/g);
    for (let i = 0; i < nums.length; i += 2) {
      coords.push({ lng: parseFloat(nums[i]), lat: parseFloat(nums[i + 1]) });
    }
    return coords;
  }

  return coords;
}

async function procesarArchivo(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  let coords = [];

  if (ext === "zip") {
    const buffer = await file.arrayBuffer();
    const geojson = await shp(buffer);
    coords = extraerCoordsDeGeoJSON(geojson);
  } else if (ext === "json" || ext === "geojson") {
    const text = await file.text();
    const json = JSON.parse(text);
    if (json.type === "Topology") {
      const features = [];
      for (const key in json.objects) {
        const feat = topojson.feature(json, json.objects[key]);
        if (feat.type === "FeatureCollection") {
          feat.features.forEach((f) => features.push(f));
        } else {
          features.push(feat);
        }
      }
      coords = extraerCoordsDeGeoJSON({ type: "FeatureCollection", features });
    } else {
      coords = extraerCoordsDeGeoJSON(json);
    }
  } else if (ext === "kml") {
    coords = parsearKML(await file.text());
  } else if (ext === "gpx") {
    coords = parsearGPX(await file.text());
  } else if (ext === "wkt" || ext === "txt") {
    coords = parsearWKT(await file.text());
  } else if (ext === "csv") {
    coords = parsearCSV(await file.text());
  }

  return coords;
}

inputImport.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const coords = await procesarArchivo(file);

    if (coords.length >= 3) {
      const p = getParcelaActiva();
      const nombreBase = file.name.replace(/\.[^/.]+$/, "");
      if (p && p.coordenadas.length === 0) {
        p.coordenadas = coords;
        p.cerrada = true;
        p.nombre = nombreBase;
      } else {
        crearParcela(nombreBase, coords, true);
        actualizarSelectorParcelas();
      }
      renderizarTodo();
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

// ============================================
// BOTONES
// ============================================
btnNueva.addEventListener("click", () => {
  crearParcela();
  actualizarSelectorParcelas();
  renderizarTodo();
  guardarEnStorage();
});

btnRenombrar.addEventListener("click", () => {
  const p = getParcelaActiva();
  if (!p) return;
  const nuevo = prompt("Nombre de la parcela:", p.nombre);
  if (nuevo && nuevo.trim()) {
    p.nombre = nuevo.trim();
    actualizarSelectorParcelas();
    renderizarParcela(p);
    guardarEnStorage();
  }
});

btnEliminar.addEventListener("click", () => {
  if (parcelas.length <= 1) {
    alert(
      "No podés eliminar la única parcela. Limpiá sus vértices en su lugar.",
    );
    return;
  }
  if (confirm("¿Eliminar esta parcela?")) eliminarParcela(parcelaActivaId);
});

selParcela.addEventListener("change", () => {
  parcelaActivaId = selParcela.value;
  renderizarTodo();
  guardarEnStorage();
});

// --- EVENTO DE CAPA BASE: 4 OPCIONES ---
selCapa.addEventListener("change", () => {
  // Quitar todas las capas base primero
  [capaOSM, capaHOT, capaVoyager, capaSatelite].forEach((c) => {
    if (mapa.hasLayer(c)) mapa.removeLayer(c);
  });
  // Agregar la seleccionada
  const seleccion = selCapa.value;
  if (seleccion === "osm") capaOSM.addTo(mapa);
  else if (seleccion === "hot") capaHOT.addTo(mapa);
  else if (seleccion === "voyager") capaVoyager.addTo(mapa);
  else if (seleccion === "satelite") capaSatelite.addTo(mapa);
});

btnDeshacer.addEventListener("click", () => {
  const p = getParcelaActiva();
  if (!p || p.coordenadas.length === 0) return;
  p.coordenadas.pop();
  if (p.cerrada) p.cerrada = false;
  renderizarTodo();
  guardarEnStorage();
});

btnReiniciar.addEventListener("click", () => {
  const p = getParcelaActiva();
  if (!p) return;
  p.coordenadas = [];
  p.cerrada = false;
  renderizarTodo();
  guardarEnStorage();
});

btnExportar.addEventListener("click", () => {
  const p = getParcelaActiva();
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

// ============================================
// INICIALIZACIÓN
// ============================================
cargarDesdeStorage();
if (parcelas.length === 0) crearParcela();
parcelas.forEach((p) => {
  if (!capasPorParcela[p.id])
    capasPorParcela[p.id] = { marcadores: [], poligono: null };
});
actualizarSelectorParcelas();
renderizarTodo();
