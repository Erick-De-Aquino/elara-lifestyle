// navegacion.js - Barra lateral y navegación dinámica

// ===== OBTENER RUTA BASE CORRECTA =====
function getRutaBase() {
    const path = window.location.pathname;
    // Si estamos en una subcarpeta (pages/alumno/ o pages/profesor/)
    if (path.includes('/pages/')) {
        return '../../';
    }
    // Si estamos en la raíz
    return './';
}

// ===== CONSTRUIR RUTA COMPLETA =====
function construirRuta(ruta) {
    const base = getRutaBase();
    return base + ruta;
}

// ===== CARGAR BARRA LATERAL =====
async function cargarSidebar(rol, paginaActual = '') {
  const sidebarContainer = document.getElementById('sidebar-container');
  if (!sidebarContainer) return;

  const menus = {
    alumno: [
      { icono: '📚', texto: 'Mi Curso', url: 'pages/alumno/curso.html', id: 'curso' },
      { icono: '👤', texto: 'Mi Perfil', url: 'pages/alumno/perfil.html', id: 'perfil' }
    ],
    profesor: [
      { icono: '📊', texto: 'Dashboard', url: 'pages/profesor/dashboard.html', id: 'dashboard' },
      { icono: '👥', texto: 'Alumnos', url: 'pages/profesor/alumnos.html', id: 'alumnos' },
      { icono: '📅', texto: 'Calendario', url: 'pages/profesor/calendario.html', id: 'calendario' },
      { icono: '📚', texto: 'Curso', url: 'pages/profesor/curso.html', id: 'curso' }
    ]
  };

  const items = menus[rol] || menus.alumno;
  const basePath = getRutaBase();

  let sidebarHtml = `
    <div class="sidebar">
      <div class="sidebar-logo">
        <div style="padding: 20px; text-align: center; font-size: 20px; font-weight: bold; color: var(--primary);">
          ELARA LifeStyle
        </div>
      </div>
      <nav class="sidebar-nav">
  `;

  items.forEach(item => {
    const isActive = paginaActual === item.id;
    const activeClass = isActive ? 'sidebar-link active' : 'sidebar-link';
    sidebarHtml += `
      <a href="${basePath}${item.url}" class="${activeClass}" data-page="${item.id}">
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
          window.location.href = basePath + 'index.html';
        }
      });
    });
  }
}
function actualizarUsuarioNavbar(nombre) {
  const userDisplay = document.getElementById('user-name-display');
  if (userDisplay) {
    userDisplay.textContent = nombre || 'Usuario';
  }
}

function cargarHeader(titulo) {
  const headerContainer = document.getElementById('header-container');
  if (!headerContainer) return;

  const basePath = getRutaBase();

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

async function initNavegacion(rol, paginaActual, nombreUsuario = '') {
  await cargarSidebar(rol, paginaActual);
  cargarHeader(getTituloPagina(paginaActual));
  if (nombreUsuario) {
    actualizarUsuarioNavbar(nombreUsuario);
  }
}

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

if (typeof window !== 'undefined') {
  window.navegacion = {
    cargarSidebar,
    cargarHeader,
    initNavegacion,
    actualizarUsuario: actualizarUsuarioNavbar
  };
}