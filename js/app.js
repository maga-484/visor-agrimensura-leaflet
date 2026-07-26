// ============================================
// ENTRY POINT — ORQUESTADOR
// ============================================
import { cargar } from "./storage.js";
import * as parcelas from "./parcelas.js";
import {
  actualizarSelectorParcelas,
  calcularMetricas,
  inicializarEventosMapa,
  inicializarBotones,
} from "./ui.js";

function init() {
  const { parcelas: datos, activaId } = cargar();
  if (datos.length === 0) {
    parcelas.crearParcela();
  } else {
    parcelas.inicializarParcelas(datos, activaId);
  }
  actualizarSelectorParcelas();
  parcelas.renderizarTodo();
  calcularMetricas();
  inicializarEventosMapa();
  inicializarBotones();
}

init();
