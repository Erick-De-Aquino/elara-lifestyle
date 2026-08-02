// modal.js - Sistema unificado de modales

// ===== ELEMENTOS DEL DOM =====
let modalOverlay = null;
let modalContainer = null;
let modalCerrable = true;

// Registro común para modales personalizados y laterales
const modalesRegistrados = [];
let listenerEscapeInstalado = false;

function modalEstaVisible(registro) {
  const elemento = registro.elemento;
  if (!elemento || !elemento.isConnected) return false;
  if (typeof registro.estaAbierto === 'function') return Boolean(registro.estaAbierto());
  const estilos = window.getComputedStyle(elemento);
  return estilos.display !== 'none' && estilos.visibility !== 'hidden';
}

function obtenerZIndex(elemento) {
  const valor = Number.parseInt(window.getComputedStyle(elemento).zIndex, 10);
  return Number.isFinite(valor) ? valor : 0;
}

function cerrarModalSuperiorConEscape() {
  const candidatos = modalesRegistrados
    .filter(modalEstaVisible)
    .sort((a, b) => obtenerZIndex(b.elemento) - obtenerZIndex(a.elemento));

  const modalSuperior = candidatos[0];
  if (!modalSuperior) return;
  if (typeof modalSuperior.puedeCerrar === 'function' && !modalSuperior.puedeCerrar()) return;
  modalSuperior.cerrar();
}

function instalarListenerEscape() {
  if (listenerEscapeInstalado) return;
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const hayModalVisible = modalesRegistrados.some(modalEstaVisible);
    if (!hayModalVisible) return;
    event.preventDefault();
    cerrarModalSuperiorConEscape();
  });
  listenerEscapeInstalado = true;
}

function registrarModal(elemento, opciones = {}) {
  if (!elemento || typeof opciones.cerrar !== 'function') return () => {};

  const registro = {
    elemento,
    cerrar: opciones.cerrar,
    estaAbierto: opciones.estaAbierto,
    puedeCerrar: opciones.puedeCerrar
  };

  modalesRegistrados.push(registro);
  instalarListenerEscape();

  const fondo = opciones.fondo || elemento;
  const cerrarAlPulsarFondo = opciones.cerrarAlPulsarFondo !== false;
  const onClickFondo = (event) => {
    if (!cerrarAlPulsarFondo) return;
    if (event.target !== fondo) return;
    if (typeof registro.puedeCerrar === 'function' && !registro.puedeCerrar()) return;
    registro.cerrar();
  };

  fondo?.addEventListener('click', onClickFondo);

  return () => {
    fondo?.removeEventListener('click', onClickFondo);
    const indice = modalesRegistrados.indexOf(registro);
    if (indice >= 0) modalesRegistrados.splice(indice, 1);
  };
}

// ===== CREAR ESTRUCTURA DEL MODAL (si no existe) =====
function crearEstructuraModal() {
  // Verificar si ya existe
  if (document.getElementById('elara-modal-overlay')) {
    modalOverlay = document.getElementById('elara-modal-overlay');
    modalContainer = document.getElementById('elara-modal-container');
    return;
  }

  // Crear overlay
  modalOverlay = document.createElement('div');
  modalOverlay.id = 'elara-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: var(--z-modal, 9999);
  `;

  // Crear contenedor del modal
  modalContainer = document.createElement('div');
  modalContainer.id = 'elara-modal-container';
  modalContainer.style.cssText = `
    background: var(--bg-card, white);
    border-radius: var(--border-radius-lg, 0.75rem);
    max-width: 500px;
    width: 90%;
    margin: var(--spacing-4);
    box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.1));
    animation: modalFadeIn 0.2s ease;
  `;

  modalOverlay.appendChild(modalContainer);
  document.body.appendChild(modalOverlay);

  registrarModal(modalOverlay, {
    cerrar: cerrarModal,
    estaAbierto: () => modalOverlay?.style.display === 'flex',
    puedeCerrar: () => modalCerrable
  });

  // Agregar animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;
  document.head.appendChild(style);
}

// ===== MOSTRAR MODAL =====
/**
 * Muestra un modal de notificación
 * @param {string} mensaje - Texto del mensaje
 * @param {string} tipo - 'exito', 'error', 'info', 'warning'
 * @param {number} duracion - Tiempo en ms (0 = no auto cerrar)
 */
function mostrarModal(mensaje, tipo = 'info', duracion = 3000) {
  crearEstructuraModal();

  // Colores según tipo
  const colores = {
    exito: { bg: '#22c55e', icono: '✓' },
    error: { bg: '#ef4444', icono: '✗' },
    warning: { bg: '#f59e0b', icono: '⚠' },
    info: { bg: '#3b82f6', icono: 'ℹ' }
  };

  const color = colores[tipo] || colores.info;

  modalContainer.innerHTML = `
    <div style="padding: var(--spacing-6); text-align: center;">
      <div style="
        width: 48px;
        height: 48px;
        background: ${color.bg};
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin: 0 auto var(--spacing-4);
      ">
        ${color.icono}
      </div>
      <p style="
        color: var(--text-primary);
        margin-bottom: var(--spacing-4);
        font-size: var(--font-size-base);
      ">${mensaje}</p>
      <button id="modalCerrarBtn" style="
        background: var(--primary, #2563eb);
        color: white;
        border: none;
        padding: var(--spacing-2) var(--spacing-6);
        border-radius: var(--border-radius-md, 0.5rem);
        cursor: pointer;
        font-size: var(--font-size-sm);
      ">Cerrar</button>
    </div>
  `;

  modalCerrable = true;
  modalOverlay.style.display = 'flex';

  // Cerrar con botón
  document.getElementById('modalCerrarBtn').addEventListener('click', cerrarModal);

  // Auto cerrar
  if (duracion > 0) {
    setTimeout(() => cerrarModal(), duracion);
  }
}

// ===== MOSTRAR CONFIRMACIÓN =====
/**
 * Muestra un modal de confirmación
 * @param {string} mensaje - Texto del mensaje
 * @param {Function} onConfirm - Función al confirmar
 * @param {Function} onCancel - Función al cancelar
 */
function mostrarConfirmacion(mensaje, onConfirm, onCancel) {
  crearEstructuraModal();

  modalContainer.innerHTML = `
    <div style="padding: var(--spacing-6);">
      <h3 style="
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--spacing-4);
        color: var(--text-primary);
      ">Confirmar</h3>
      <p style="
        color: var(--text-secondary);
        margin-bottom: var(--spacing-6);
      ">${mensaje}</p>
      <div style="display: flex; gap: var(--spacing-3); justify-content: flex-end;">
        <button id="modalCancelarBtn" style="
          background: var(--gray-200, #e2e8f0);
          color: var(--gray-700, #334155);
          border: none;
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: var(--border-radius-md, 0.5rem);
          cursor: pointer;
        ">Cancelar</button>
        <button id="modalConfirmarBtn" style="
          background: var(--primary, #2563eb);
          color: white;
          border: none;
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: var(--border-radius-md, 0.5rem);
          cursor: pointer;
        ">Confirmar</button>
      </div>
    </div>
  `;

  modalCerrable = true;
  modalOverlay.style.display = 'flex';

  document.getElementById('modalConfirmarBtn').addEventListener('click', () => {
    cerrarModal();
    if (onConfirm) onConfirm();
  });

  document.getElementById('modalCancelarBtn').addEventListener('click', () => {
    cerrarModal();
    if (onCancel) onCancel();
  });
}

// ===== CERRAR MODAL =====
function cerrarModal() {
  if (modalOverlay) {
    modalOverlay.style.display = 'none';
    modalCerrable = true;
  }
}

// ===== MODAL DE CARGA =====
function mostrarModalCarga(mensaje = 'Cargando...') {
  crearEstructuraModal();

  modalContainer.innerHTML = `
    <div style="padding: var(--spacing-6); text-align: center;">
      <div style="
        width: 40px;
        height: 40px;
        border: 3px solid var(--gray-200, #e2e8f0);
        border-top-color: var(--primary, #2563eb);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto var(--spacing-4);
      "></div>
      <p style="color: var(--text-secondary);">${mensaje}</p>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  if (!document.querySelector('#modal-spin-style')) {
    style.id = 'modal-spin-style';
    document.head.appendChild(style);
  }

  modalCerrable = false;
  modalOverlay.style.display = 'flex';
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.modal = {
    mostrar: mostrarModal,
    confirmar: mostrarConfirmacion,
    cerrar: cerrarModal,
    mostrarCarga: mostrarModalCarga
  };

  window.elaraModals = {
    registrar: registrarModal
  };
}
