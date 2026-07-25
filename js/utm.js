// ============================================
// PROYECCIÓN UTM EXACTA (WGS84)
// ============================================

/**
 * Convierte lat/lng a UTM (zona, este, norte)
 * Fórmula de Redfearn/Thomas completa
 */
export function latLngToUTM(lat, lng) {
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

/**
 * Calcula área con fórmula de Gauss sobre coordenadas UTM
 */
export function calcularAreaUTM(coords) {
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
