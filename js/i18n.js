// ============================================
// INTERNACIONALIZACIÓN (i18n)
// ============================================

const TRANSLATIONS = {
  es: {
    titulo: "🧭 Visor del Agrimensor",
    capaBase: "Capa base:",
    capaOSM: "🗺️ OpenStreetMap",
    capaHOT: "🗺️ OSM Humanitario (Urbano)",
    capaVoyager: "🗺️ CartoDB Voyager (Urbano)",
    capaSatelite: "🛰️ Esri Satelital",
    parcelasTitulo: "📍 Parcelas / Mis áreas de trabajo",
    parcelaActiva: "Parcela activa:",
    btnNueva: "➕ Nueva",
    btnRenombrar: "✏️",
    btnEliminar: "🗑️",
    instrucciones: "Clic = vértice · Doble clic = cerrar · Arrastrar = editar",
    vertices: "Vértices:",
    perimetro: "Perímetro:",
    superficie: "Superficie:",
    proyeccion: "Proyección:",
    utmExacta: "UTM exacta (WGS84)",
    btnUbicacion: "📍 Mi ubicación",
    btnDeshacer: "↩️ Deshacer",
    btnReiniciar: "🗑️ Limpiar parcela",
    btnExportar: "📥 Exportar CSV",
    importar: "📂 Importar coordenadas (colegas):",
    formatos: "Formatos:",
    cerrado: "✅ Cerrado",
    eliminarConfirm: "¿Eliminar esta parcela?",
    errorUnicaParcela:
      "No podés eliminar la única parcela. Limpiá sus vértices en su lugar.",
    errorImportMinimo:
      "Solo se encontraron {n} coordenadas válidas. Se requieren al menos 3.",
    errorImport: "Error al importar: ",
    errorGeolocalizacion: "No soportado",
    errorPrefijo: "Error: ",
    placeholderNombre: "Nombre de la parcela:",
    tuUbicacion: "📍 Tu ubicación",
    unidadMetros: " m",
    unidadMetrosCuadrado: " m²",
    unidadHectareas: " ha",
    nuevaParcela: "Parcela",
  },
  en: {
    titulo: "🧭 Surveyor Viewer",
    capaBase: "Base layer:",
    capaOSM: "🗺️ OpenStreetMap",
    capaHOT: "🗺️ OSM Humanitarian (Urban)",
    capaVoyager: "🗺️ CartoDB Voyager (Urban)",
    capaSatelite: "🛰️ Esri Satellite",
    parcelasTitulo: "📍 Parcels / My Work Areas",
    parcelaActiva: "Active parcel:",
    btnNueva: "➕ New",
    btnRenombrar: "✏️",
    btnEliminar: "🗑️",
    instrucciones: "Click = vertex · Double-click = close · Drag = edit",
    vertices: "Vertices:",
    perimetro: "Perimeter:",
    superficie: "Area:",
    proyeccion: "Projection:",
    utmExacta: "Exact UTM (WGS84)",
    btnUbicacion: "📍 My location",
    btnDeshacer: "↩️ Undo",
    btnReiniciar: "🗑️ Clear parcel",
    btnExportar: "📥 Export CSV",
    importar: "📂 Import coordinates (pros):",
    formatos: "Formats:",
    cerrado: "✅ Closed",
    eliminarConfirm: "Delete this parcel?",
    errorUnicaParcela:
      "Cannot delete the only parcel. Clear its vertices instead.",
    errorImportMinimo: "Only {n} valid coordinates found. At least 3 required.",
    errorImport: "Import error: ",
    errorGeolocalizacion: "Not supported",
    errorPrefijo: "Error: ",
    placeholderNombre: "Parcel name:",
    tuUbicacion: "📍 Your location",
    unidadMetros: " m",
    unidadMetrosCuadrado: " m²",
    unidadHectareas: " ha",
    nuevaParcela: "Parcel",
  },
};

let currentLang = localStorage.getItem("visor_lang") || "es";

export function t(key, vars = {}) {
  let text =
    TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["es"]?.[key] || key;
  // Reemplazar variables tipo {n}
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });
  return text;
}

export function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("visor_lang", lang);
  window.location.reload();
}

export function getLang() {
  return currentLang;
}
