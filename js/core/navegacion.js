// navegacion.js - Barra lateral y navegación dinámica

// ===== CARGAR BARRA LATERAL =====
/**
 * Carga la barra lateral según el rol del usuario
 * @param {string} rol - 'alumno' o 'profesor'
 * @param {string} paginaActual - Nombre de la página actual (para resaltar)
 */
async function cargarSidebar(rol, paginaActual = '') {
  const sidebarContainer = document.getElementById('sidebar-container');
  if (!sidebarContainer) return;

  // Definir menús según rol
  const menus = {
    alumno: [
      { icono: '📚', texto: 'Mi Curso', url: 'curso.html', id: 'curso' },
      { icono: '👤', texto: 'Mi Perfil', url: 'perfil.html', id: 'perfil' }
    ],
    profesor: [
      { icono: '📊', texto: 'Dashboard', url: 'dashboard.html', id: 'dashboard' },
      { icono: '👥', texto: 'Alumnos', url: 'alumnos.html', id: 'alumnos' },
      { icono: '📅', texto: 'Calendario', url: 'calendario.html', id: 'calendario' },
      { icono: '📚', texto: 'Curso', url: 'curso.html', id: 'curso' }
    ]
  };

  const items = menus[rol] || menus.alumno;
  const basePath = window.utils?.getBasePath() || './';

  // Construir HTML del sidebar
  let sidebarHtml = `
    <div class="sidebar">
      <div class="sidebar-logo">
        <img src="${basePath}assets/logos/nombreSolo.png" 
             alt="Elara Method" 
             class="logo-navbar"
             onerror="this.src='${basePath}assets/logos/logoSolo.png'">
      </div>
      <nav class="sidebar-nav">
  `;

  items.forEach(item => {
    const isActive = paginaActual === item.id;
    const activeClass = isActive ? 'sidebar-link active' : 'sidebar-link';
    sidebarHtml += `
      <a href="${basePath}pages/${rol}/${item.url}" class="${activeClass}" data-page="${item.id}">
        <span class="sidebar-icon">${item.icono}</span>
        <span class="sidebar-text">${item.texto}</span>
      </a>
    `;
  });

  sidebarHtml += `
      </nav>
      <div class="sidebar-footer">
        <button id="sidebar-dark-mode-btn" class="sidebar-link">
          <span class="sidebar-icon">🌙</span>
          <span class="sidebar-text">Modo Oscuro</span>
        </button>
        <button id="sidebar-cerrar-sesion" class="sidebar-link">
          <span class="sidebar-icon">🚪</span>
          <span class="sidebar-text">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  `;

  sidebarContainer.innerHTML = sidebarHtml;

  // Agregar event listeners
  const darkModeBtn = document.getElementById('sidebar-dark-mode-btn');
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
      if (window.darkMode && window.darkMode.toggle) {
        window.darkMode.toggle();
      }
    });
  }

  const cerrarSesionBtn = document.getElementById('sidebar-cerrar-sesion');
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', () => {
      window.modal?.confirmar('¿Estás seguro de que quieres cerrar sesión?', () => {
        if (window.auth && window.auth.logout) {
          window.auth.logout();
        } else {
          localStorage.clear();
          window.location.href = window.utils?.getBasePath() + 'index.html';
        }
      });
    });
  }
}

// ===== ACTUALIZAR NOMBRE DE USUARIO =====
/**
 * Actualiza el nombre del usuario en la barra superior
 * @param {string} nombre - Nombre del usuario
 */
function actualizarUsuarioNavbar(nombre) {
  const userDisplay = document.getElementById('user-name-display');
  if (userDisplay) {
    userDisplay.textContent = nombre || 'Usuario';
  }
}

// ===== CARGAR ENCABEZADO SUPERIOR =====
/**
 * Carga el header superior de la página
 * @param {string} titulo - Título de la página
 */
function cargarHeader(titulo) {
  const headerContainer = document.getElementById('header-container');
  if (!headerContainer) return;

  const basePath = window.utils?.getBasePath() || './';

  headerContainer.innerHTML = `
    <div class="top-bar">
      <div class="top-bar-left">
        <button id="mobile-menu-btn" class="mobile-menu-btn">☰</button>
        <h1 class="page-title">${titulo}</h1>
      </div>
      <div class="top-bar-right">
        <span id="user-name-display" class="user-name">Cargando...</span>
      </div>
    </div>
  `;

  // Menú móvil
  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.classList.toggle('mobile-open');
      }
    });
  }
}

// ===== INICIALIZAR NAVEGACIÓN =====
/**
 * Inicializa la navegación de la página
 * @param {string} rol - 'alumno' o 'profesor'
 * @param {string} paginaActual - ID de la página actual
 * @param {string} nombreUsuario - Nombre del usuario
 */
async function initNavegacion(rol, paginaActual, nombreUsuario = '') {
  await cargarSidebar(rol, paginaActual);
  cargarHeader(getTituloPagina(paginaActual));
  if (nombreUsuario) {
    actualizarUsuarioNavbar(nombreUsuario);
  }
}

// ===== OBTENER TÍTULO DE PÁGINA =====
function getTituloPagina(paginaId) {
  const titulos = {
    curso: 'Mi Curso',
    perfil: 'Mi Perfil',
    dashboard: 'Dashboard',
    alumnos: 'Gestión de Alumnos',
    calendario: 'Calendario'
  };
  return titulos[paginaId] || 'Elara Method';
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.navegacion = {
    cargarSidebar,
    cargarHeader,
    initNavegacion,
    actualizarUsuario: actualizarUsuarioNavbar
  };
}