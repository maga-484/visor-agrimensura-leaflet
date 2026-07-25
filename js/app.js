// ============================================
// ENTRY POINT — ORQUESTADOR
// ============================================

import { mapa } from "./config.js";
import * as parcelas from "./parcelas.js";
import { cargar } from "./storage.js";
import {
  calcularMetricas,
  actualizarSelectorParcelas,
  inicializarEventosMapa,
  inicializarBotones,
} from "./ui.js";

function init() {
  // Cargar desde localStorage
  const { parcelas: datos, activaId } = cargar();

  if (datos.length === 0) {
    parcelas.crearParcela();
  } else {
    parcelas.inicializarParcelas(datos, activaId);
  }

  // UI inicial
  actualizarSelectorParcelas();
  parcelas.renderizarTodo();
  calcularMetricas();

  // Eventos
  inicializarEventosMapa();
  inicializarBotones();
}

init();
