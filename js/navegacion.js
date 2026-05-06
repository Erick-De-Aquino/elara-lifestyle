// ===== CARGA DINÁMICA DE LA BARRA DE NAVEGACIÓN =====

async function cargarNavegacion() {
    try {
        // Usar rutas relativas simples
        const response = await fetch('data/navegacion.json');
        const menuItems = await response.json();
        
        const currentPath = window.location.pathname;
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        
        const navHTML = `
            <div class="nav-bar">
                <div class="nav-header">
                    <h2>ELARA METHOD</h2>
                </div>
                <ul class="nav-menu">
                    ${menuItems.map(item => {
                        let isActive = false;
                        if (item.activeMatch === 'index' && (currentPath.endsWith('/') || currentPath.endsWith('index.html'))) {
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
        // Fallback: menú manual
        document.getElementById('nav-container').innerHTML = `
            <div class="nav-bar">
                <div class="nav-header">
                    <h2>ELARA METHOD</h2>
                </div>
                <ul class="nav-menu">
                    <li><a href="index.html"><i class="fas fa-home"></i><span>Inicio</span></a></li>
                    <li><a href="curso.html"><i class="fas fa-book-open"></i><span>Índice curso</span></a></li>
                    <li><a href="alumno-lista.html"><i class="fas fa-users"></i><span>Alumnos</span></a></li>
                    <li><a href="calendario.html"><i class="fas fa-calendar-alt"></i><span>Calendario</span></a></li>
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