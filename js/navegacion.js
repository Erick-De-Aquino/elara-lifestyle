// ===== CARGA DINÁMICA DE LA BARRA DE NAVEGACIÓN =====

function getBasePath() {
    // Si estamos en una subcarpeta (pages/), subimos un nivel
    if (window.location.pathname.includes('/pages/')) {
        return '../';
    }
    return '';
}

// Cargar modo oscuro guardado al iniciar
function cargarModoOscuro() {
    const modoGuardado = localStorage.getItem('modo_oscuro');
    if (modoGuardado === 'true') {
        document.body.classList.add('modo-oscuro');
    }
}

async function cargarNavegacion() {
    try {
        const response = await fetch('data/navegacion.json');
        const menuItems = await response.json();
        
        const currentPath = window.location.pathname;
        
        const navHTML = `
            <div class="nav-bar">
                <div class="nav-header">
                    <h2>ELARA METHOD</h2>
                </div>
                <ul class="nav-menu">
                    ${menuItems.map(item => {
                        // Botón de modo oscuro
                        if (item.esModoOscuro) return `
                            <li>
                                <button id="btnModoOscuroNav" class="nav-btn-modo-oscuro">
                                    <i class="fas ${document.body.classList.contains('modo-oscuro') ? 'fa-sun' : 'fa-moon'}"></i>
                                    <span>${document.body.classList.contains('modo-oscuro') ? 'Modo claro' : 'Modo oscuro'}</span>
                                </button>
                            </li>
                        `;
                        
                        // Enlaces normales
                        let isActive = false;
                        if (item.activeMatch === 'index' && (currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/index.html'))) {
                            isActive = true;
                        } else if (item.activeMatch !== 'index' && currentPath.includes(item.activeMatch)) {
                            isActive = true;
                        }
                        
                        return `
                            <li>
                                <a href="${item.url}" class="${isActive ? 'active' : ''}">
                                    <i class="${item.icon}"></i>
                                    <span>${item.texto}</span>
                                </a>
                            </li>
                        `;
                    }).join('')}
                </ul>
            </div>
            <button class="menu-toggle" id="menuToggle">
                <i class="fas fa-bars"></i>
            </button>
        `;
        
        document.getElementById('nav-container').innerHTML = navHTML;
        
        // Evento para el botón de modo oscuro en el nav
        const btnModoOscuroNav = document.getElementById('btnModoOscuroNav');
        if (btnModoOscuroNav) {
            btnModoOscuroNav.addEventListener('click', () => {
                document.body.classList.toggle('modo-oscuro');
                const esModoOscuro = document.body.classList.contains('modo-oscuro');
                localStorage.setItem('modo_oscuro', esModoOscuro);
                
                // Actualizar icono y texto del botón
                const icono = btnModoOscuroNav.querySelector('i');
                const texto = btnModoOscuroNav.querySelector('span');
                if (esModoOscuro) {
                    icono.className = 'fas fa-sun';
                    texto.textContent = 'Modo claro';
                } else {
                    icono.className = 'fas fa-moon';
                    texto.textContent = 'Modo oscuro';
                }
            });
        }
        
        // Toggle menú móvil
        const toggle = document.getElementById('menuToggle');
        const navBar = document.querySelector('.nav-bar');
        if (toggle) {
            toggle.addEventListener('click', () => {
                navBar.classList.toggle('open');
            });
        }
        
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navBar.classList.remove('open');
                }
            });
        });
        
    } catch (error) {
        console.error('Error cargando navegación:', error);
        // Fallback manual
        const basePath = getBasePath();
        document.getElementById('nav-container').innerHTML = `
            <div class="nav-bar">
                <div class="nav-header">
                    <h2>ELARA METHOD</h2>
                </div>
                <ul class="nav-menu">
                    <li><a href="${basePath}index.html"><i class="fas fa-home"></i><span>Inicio</span></a></li>
                    <li><a href="${basePath}curso.html"><i class="fas fa-book-open"></i><span>Índice curso</span></a></li>
                    <li><a href="${basePath}alumno-lista.html"><i class="fas fa-users"></i><span>Alumnos</span></a></li>
                    <li><a href="${basePath}calendario.html"><i class="fas fa-calendar-alt"></i><span>Calendario</span></a></li>
                    <li><button id="btnModoOscuroNavFallback" class="nav-btn-modo-oscuro">
                        <i class="fas fa-moon"></i> <span>Modo oscuro</span>
                    </button></li>
                </ul>
            </div>
            <button class="menu-toggle" id="menuToggle">
                <i class="fas fa-bars"></i>
            </button>
        `;
        
        const btnFallback = document.getElementById('btnModoOscuroNavFallback');
        if (btnFallback) {
            btnFallback.addEventListener('click', () => {
                document.body.classList.toggle('modo-oscuro');
                const esModoOscuro = document.body.classList.contains('modo-oscuro');
                localStorage.setItem('modo_oscuro', esModoOscuro);
                const icono = btnFallback.querySelector('i');
                const texto = btnFallback.querySelector('span');
                if (esModoOscuro) {
                    icono.className = 'fas fa-sun';
                    texto.textContent = 'Modo claro';
                } else {
                    icono.className = 'fas fa-moon';
                    texto.textContent = 'Modo oscuro';
                }
            });
        }
        
        const toggle = document.getElementById('menuToggle');
        const navBar = document.querySelector('.nav-bar');
        if (toggle) {
            toggle.addEventListener('click', () => {
                navBar.classList.toggle('open');
            });
        }
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargarModoOscuro();
    cargarNavegacion();
});