// ============================================
// PARSERS DE IMPORTACIÓN GEOESPACIAL
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

export async function procesarArchivo(file) {
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
