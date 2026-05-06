// ===== CARGA DINÁMICA DE LA BARRA DE NAVEGACIÓN =====

function getBasePath() {
    // Si estamos en una subcarpeta (pages/), subimos un nivel
    if (window.location.pathname.includes('/pages/')) {
        return '../';
    }
    return '';
}

async function cargarNavegacion() {
    try {
        const basePath = getBasePath();
        const response = await fetch(basePath + 'data/navegacion.json');
        const menuItems = await response.json();
        
        const currentPath = window.location.pathname;
        
        const navHTML = `
            <div class="nav-bar">
                <div class="nav-header">
                    <h2>ELARA METHOD</h2>
                </div>
                <ul class="nav-menu">
                    ${menuItems.map(item => {
                        // Ajustar la URL con la base path
                        const itemUrl = basePath + item.url;
                        
                        let isActive = false;
                        if (item.activeMatch === 'index' && (currentPath.endsWith('/') || currentPath.endsWith('index.html'))) {
                            isActive = true;
                        } else if (item.activeMatch !== 'index' && currentPath.includes(item.activeMatch)) {
                            isActive = true;
                        }
                        
                        return `
                            <li>
                                <a href="${itemUrl}" class="${isActive ? 'active' : ''}">
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
                </ul>
            </div>
            <button class="menu-toggle" id="menuToggle">
                <i class="fas fa-bars"></i>
            </button>
        `;
        
        const toggle = document.getElementById('menuToggle');
        const navBar = document.querySelector('.nav-bar');
        if (toggle) {
            toggle.addEventListener('click', () => {
                navBar.classList.toggle('open');
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', cargarNavegacion);