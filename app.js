// ============================================
// CONFIGURACIÓN INICIAL
// ============================================
const mapa = L.map("mapa").setView([-34.6037, -58.3816], 13);

// Capas base
const capaOSM = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "&copy; OpenStreetMap",
  },
);

const capaSatelite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Tiles &copy; Esri",
  },
);

capaOSM.addTo(mapa);

// ============================================
// ESTADO
// ============================================
let listaCoordenadas = [];
let capaPoligono = null;
let capasMarcadores = [];
let poligonoCerrado = false;

// DOM
const txtContador = document.getElementById("contador-puntos");
const txtPerimetro = document.getElementById("resultado-perimetro");
const txtArea = document.getElementById("resultado-area");
const txtHectareas = document.getElementById("resultado-hectareas");
const btnReiniciar = document.getElementById("btn-reiniciar");
const btnDeshacer = document.getElementById("btn-deshacer");
const btnExportar = document.getElementById("btn-exportar");
const btnUbicacion = document.getElementById("btn-ubicacion");
const selectorCapa = document.getElementById("selector-capa");
const tablaBody = document.querySelector("#tabla-vertices tbody");

// ============================================
// EVENTOS DEL MAPA
// ============================================

// Clic simple: agregar vértice
mapa.on("click", function (e) {
  if (poligonoCerrado) reiniciarTodo();

  const coord = e.latlng;
  listaCoordenadas.push(coord);

  const num = listaCoordenadas.length;
  const marcador = L.marker(coord, { draggable: true }).addTo(mapa);

  marcador.bindPopup(
    `<b>Vértice ${num}</b><br>` +
      `Lat: ${coord.lat.toFixed(6)}<br>Lng: ${coord.lng.toFixed(6)}`,
  );

  // Editar vértice arrastrando
  marcador.on("dragend", function (ev) {
    const nuevoLatLng = ev.target.getLatLng();
    const idx = capasMarcadores.indexOf(marcador);
    if (idx !== -1) {
      listaCoordenadas[idx] = nuevoLatLng;
      actualizarTodo();
    }
  });

  capasMarcadores.push(marcador);
  actualizarTodo();
});

// Doble clic: cerrar polígono
mapa.on("dblclick", function (e) {
  e.originalEvent.stopPropagation();
  if (listaCoordenadas.length >= 3 && !poligonoCerrado) {
    poligonoCerrado = true;
    actualizarTodo();
    L.popup()
      .setLatLng(e.latlng)
      .setContent("<b>✅ Polígono cerrado</b>")
      .openOn(mapa);
  }
});

// ============================================
// CÁLCULOS
// ============================================

function actualizarTodo() {
  actualizarPoligono();
  calcularMetricas();
  actualizarTabla();
  btnDeshacer.disabled = listaCoordenadas.length === 0;
  btnExportar.disabled = listaCoordenadas.length === 0;
}

function actualizarPoligono() {
  if (capaPoligono) mapa.removeLayer(capaPoligono);

  if (listaCoordenadas.length >= 2) {
    const opts = {
      color: poligonoCerrado ? "#27ae60" : "#e94560",
      fillColor: poligonoCerrado ? "#2ecc71" : "#e94560",
      fillOpacity: poligonoCerrado ? 0.35 : 0.12,
      weight: 3,
      dashArray: poligonoCerrado ? null : "6, 8",
    };
    capaPoligono = L.polygon(listaCoordenadas, opts).addTo(mapa);
  }
}

function calcularMetricas() {
  const n = listaCoordenadas.length;
  txtContador.innerText = n;

  if (n < 2) {
    txtPerimetro.innerText = "0 m";
    txtArea.innerText = "0 m²";
    txtHectareas.innerText = "0 ha";
    return;
  }

  // Perímetro
  let perimetro = 0;
  for (let i = 0; i < n; i++) {
    const actual = listaCoordenadas[i];
    const siguiente = listaCoordenadas[(i + 1) % n];
    perimetro += actual.distanceTo(siguiente);
  }
  txtPerimetro.innerText = Math.round(perimetro).toLocaleString("es-AR") + " m";

  // Área
  if (n < 3) {
    txtArea.innerText = "0 m²";
    txtHectareas.innerText = "0 ha";
    return;
  }

  const areaM2 = calcularAreaGauss(listaCoordenadas);
  txtArea.innerText =
    areaM2.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " m²";
  txtHectareas.innerText =
    (areaM2 / 10000).toLocaleString("es-AR", { maximumFractionDigits: 4 }) +
    " ha";
}

/**
 * Fórmula de Gauss (shoelace) con proyección local.
 * Precisión óptima para parcelas hasta ~10 km.
 */
function calcularAreaGauss(coords) {
  if (coords.length < 3) return 0;

  let latSum = 0;
  coords.forEach((c) => (latSum += c.lat));
  const latMedia = latSum / coords.length;
  const latRad = (latMedia * Math.PI) / 180;

  const mPorGradoLat = 111132;
  const mPorGradoLng = 111132 * Math.cos(latRad);

  let area = 0;
  const n = coords.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = coords[i].lng * mPorGradoLng;
    const yi = coords[i].lat * mPorGradoLat;
    const xj = coords[j].lng * mPorGradoLng;
    const yj = coords[j].lat * mPorGradoLat;
    area += xi * yj - xj * yi;
  }

  return Math.abs(area) / 2;
}

/**
 * Azimuth geodésico entre dos puntos (0° = Norte, clockwise)
 */
function calcularAzimuth(p1, p2) {
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Convierte azimuth (0-360) a rumbo agrimensor:
 * N θ E, S θ E, S θ W, N θ W
 */
function azimuthARumbo(az) {
  if (az <= 90) return `N ${az.toFixed(2)}° E`;
  if (az <= 180) return `S ${(180 - az).toFixed(2)}° E`;
  if (az <= 270) return `S ${(az - 180).toFixed(2)}° W`;
  return `N ${(360 - az).toFixed(2)}° W`;
}

// ============================================
// TABLA DE VÉRTICES
// ============================================

function actualizarTabla() {
  tablaBody.innerHTML = "";
  const n = listaCoordenadas.length;

  for (let i = 0; i < n; i++) {
    const p = listaCoordenadas[i];
    const pSig = listaCoordenadas[(i + 1) % n];

    const dist = p.distanceTo(pSig).toFixed(2);
    const az = calcularAzimuth(p, pSig);
    const rumbo = azimuthARumbo(az);

    const fila = document.createElement("tr");
    fila.innerHTML = `
            <td><b>${i + 1}</b></td>
            <td>${p.lat.toFixed(6)}</td>
            <td>${p.lng.toFixed(6)}</td>
            <td>${dist}</td>
            <td>${rumbo}</td>
        `;
    tablaBody.appendChild(fila);
  }
}

// ============================================
// EXPORTAR CSV
// ============================================

btnExportar.addEventListener("click", function () {
  if (listaCoordenadas.length === 0) return;

  let csv = "Vertice,Latitud,Longitud,Distancia_siguiente_m,Rumbo\n";
  const n = listaCoordenadas.length;

  for (let i = 0; i < n; i++) {
    const p = listaCoordenadas[i];
    const pSig = listaCoordenadas[(i + 1) % n];
    const dist = p.distanceTo(pSig).toFixed(3);
    const az = calcularAzimuth(p, pSig);
    const rumbo = azimuthARumbo(az);
    csv += `${i + 1},${p.lat.toFixed(8)},${p.lng.toFixed(8)},${dist},"${rumbo}"\n`;
  }

  // Agregar totales al final
  let perimetro = 0;
  for (let i = 0; i < n; i++) {
    perimetro += listaCoordenadas[i].distanceTo(listaCoordenadas[(i + 1) % n]);
  }
  const area = calcularAreaGauss(listaCoordenadas);

  csv += `\nTOTALES,,,${perimetro.toFixed(3)} m,${area.toFixed(2)} m2 (${(area / 10000).toFixed(4)} ha)\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `parcela_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
});

// ============================================
// BOTONES DE CONTROL
// ============================================

btnDeshacer.addEventListener("click", function () {
  if (listaCoordenadas.length === 0) return;
  listaCoordenadas.pop();
  const ultimo = capasMarcadores.pop();
  if (ultimo) mapa.removeLayer(ultimo);
  poligonoCerrado = false;
  actualizarTodo();
});

btnReiniciar.addEventListener("click", reiniciarTodo);

function reiniciarTodo() {
  capasMarcadores.forEach((m) => mapa.removeLayer(m));
  if (capaPoligono) mapa.removeLayer(capaPoligono);

  listaCoordenadas = [];
  capasMarcadores = [];
  capaPoligono = null;
  poligonoCerrado = false;

  txtContador.innerText = "0";
  txtPerimetro.innerText = "0 m";
  txtArea.innerText = "0 m²";
  txtHectareas.innerText = "0 ha";
  tablaBody.innerHTML = "";
  btnDeshacer.disabled = true;
  btnExportar.disabled = true;
}

// Geolocalización
btnUbicacion.addEventListener("click", function () {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }
  btnUbicacion.innerText = "⏳ Buscando...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      mapa.setView([latitude, longitude], 17);
      L.marker([latitude, longitude])
        .addTo(mapa)
        .bindPopup("📍 Tu ubicación")
        .openPopup();
      btnUbicacion.innerText = "📍 Mi ubicación";
    },
    (err) => {
      alert("No se pudo obtener tu ubicación: " + err.message);
      btnUbicacion.innerText = "📍 Mi ubicación";
    },
  );
});

// Cambiar capa base
selectorCapa.addEventListener("change", function () {
  if (this.value === "satelite") {
    mapa.removeLayer(capaOSM);
    capaSatelite.addTo(mapa);
  } else {
    mapa.removeLayer(capaSatelite);
    capaOSM.addTo(mapa);
  }
});

// Inicializar
btnDeshacer.disabled = true;
btnExportar.disabled = true;
