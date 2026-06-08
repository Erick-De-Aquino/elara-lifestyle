// utils.js - Utilidades generales

// ===== RUTAS Y PATHS =====

/**
 * Obtiene la ruta base según la ubicación actual
 * @returns {string} Ruta base (ej: '', '../', '../../')
 */
function getBasePath() {
  const path = window.location.pathname;
  const depth = (path.match(/\//g) || []).length - 1;
  
  if (path.includes('/v2/')) {
    const v2Depth = path.split('/v2/')[1].split('/').length - 1;
    return v2Depth > 0 ? '../'.repeat(v2Depth) : './';
  }
  
  if (depth <= 1) return './';
  return '../'.repeat(depth - 1);
}

/**
 * Construye una ruta absoluta desde la base
 * @param {string} relativePath - Ruta relativa
 * @returns {string} Ruta absoluta
 */
function getPath(relativePath) {
  const base = getBasePath();
  return base + relativePath;
}

// ===== FECHAS =====

/**
 * Formatea una fecha a DD/MM/YYYY
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
  if (!fecha) return '';
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return '';
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const año = date.getFullYear();
  
  return `${dia}/${mes}/${año}`;
}

/**
 * Formatea una hora a HH:MM
 * @param {string} hora - Hora en formato HH:MM:SS o HH:MM
 * @returns {string} Hora formateada
 */
function formatearHora(hora) {
  if (!hora) return '';
  return hora.substring(0, 5);
}

/**
 * Obtiene fecha actual en formato YYYY-MM-DD (para inputs date)
 * @returns {string} Fecha actual
 */
function getFechaActualInput() {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

// ===== LOCALSTORAGE CENTRALIZADO =====

/**
 * Guarda una preferencia en localStorage
 * @param {string} clave - Clave de la preferencia
 * @param {any} valor - Valor a guardar
 */
function guardarPreferencia(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    console.error('Error guardando preferencia:', error);
  }
}

/**
 * Obtiene una preferencia de localStorage
 * @param {string} clave - Clave de la preferencia
 * @param {any} defaultValue - Valor por defecto si no existe
 * @returns {any} Valor guardado o defaultValue
 */
function obtenerPreferencia(clave, defaultValue = null) {
  try {
    const item = localStorage.getItem(clave);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error obteniendo preferencia:', error);
    return defaultValue;
  }
}

/**
 * Limpia los datos de sesión del usuario
 */
function limpiarSesion() {
  const keys = ['elara_alumno_actual', 'elara_acceso_tipo', 'elara_sesion'];
  keys.forEach(key => localStorage.removeItem(key));
}

// ===== VALIDACIONES =====

/**
 * Valida si un email tiene formato correcto
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida si una fecha es válida
 * @param {string|Date} fecha - Fecha a validar
 * @returns {boolean}
 */
function isValidDate(fecha) {
  const date = new Date(fecha);
  return !isNaN(date.getTime());
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.utils = {
    getBasePath,
    getPath,
    formatearFecha,
    formatearHora,
    getFechaActualInput,
    guardarPreferencia,
    obtenerPreferencia,
    limpiarSesion,
    isValidEmail,
    isValidDate
  };
}