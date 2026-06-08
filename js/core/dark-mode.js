// dark-mode.js - Sistema unificado de modo oscuro

// ===== INICIALIZAR MODO OSCURO =====
function initDarkMode() {
  const savedTheme = localStorage.getItem('elara_dark_mode');
  const isDark = savedTheme === 'true';
  
  if (isDark) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
  
  actualizarIconoModoOscuro(isDark);
}

// ===== ALTERNAR MODO OSCURO =====
function toggleDarkMode() {
  const isDark = document.documentElement.classList.contains('dark-mode');
  
  if (isDark) {
    document.documentElement.classList.remove('dark-mode');
    localStorage.setItem('elara_dark_mode', 'false');
    actualizarIconoModoOscuro(false);
  } else {
    document.documentElement.classList.add('dark-mode');
    localStorage.setItem('elara_dark_mode', 'true');
    actualizarIconoModoOscuro(true);
  }
}

// ===== ACTUALIZAR ICONO DEL BOTÓN =====
function actualizarIconoModoOscuro(isDark) {
  const darkModeBtn = document.getElementById('dark-mode-toggle');
  if (darkModeBtn) {
    darkModeBtn.innerHTML = isDark ? '☀️' : '🌙';
    darkModeBtn.title = isDark ? 'Modo Claro' : 'Modo Oscuro';
  }
  
  // También actualizar botón del sidebar si existe
  const sidebarDarkBtn = document.getElementById('sidebar-dark-mode-btn');
  if (sidebarDarkBtn) {
    const spanIcono = sidebarDarkBtn.querySelector('.sidebar-icon');
    if (spanIcono) {
      spanIcono.textContent = isDark ? '☀️' : '🌙';
    }
    const spanTexto = sidebarDarkBtn.querySelector('.sidebar-text');
    if (spanTexto) {
      spanTexto.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
    }
  }
}

// ===== VERIFICAR SI ESTÁ EN MODO OSCURO =====
function isDarkMode() {
  return document.documentElement.classList.contains('dark-mode');
}

// ===== AGREGAR BOTÓN DE MODO OSCURO A UN CONTENEDOR =====
function agregarBotonDarkMode(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const isDark = isDarkMode();
  const button = document.createElement('button');
  button.id = 'dark-mode-toggle';
  button.className = 'dark-mode-toggle-btn';
  button.innerHTML = isDark ? '☀️' : '🌙';
  button.title = isDark ? 'Modo Claro' : 'Modo Oscuro';
  button.style.cssText = `
    background: transparent;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: var(--spacing-2);
    border-radius: var(--border-radius-md);
    transition: background var(--transition-fast);
  `;
  
  button.addEventListener('click', toggleDarkMode);
  container.appendChild(button);
}

// Inicializar automáticamente cuando se carga el DOM
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
  });
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.darkMode = {
    init: initDarkMode,
    toggle: toggleDarkMode,
    isActive: isDarkMode,
    agregarBoton: agregarBotonDarkMode
  };
}