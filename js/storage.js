// ============================================
// PERSISTENCIA EN LOCALSTORAGE
// ============================================

const KEY_PARCELAS = "visor_parcelas_v3";
const KEY_ACTIVA = "visor_activa_v3";

export function guardar(parcelas, parcelaActivaId) {
  localStorage.setItem(KEY_PARCELAS, JSON.stringify(parcelas));
  localStorage.setItem(KEY_ACTIVA, parcelaActivaId || "");
}

export function cargar() {
  const raw = localStorage.getItem(KEY_PARCELAS);
  const activa = localStorage.getItem(KEY_ACTIVA);
  let parcelas = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) parcelas = parsed;
    } catch (e) {
      parcelas = [];
    }
  }

  return {
    parcelas,
    activaId: activa && parcelas.find((p) => p.id === activa) ? activa : null,
  };
}
