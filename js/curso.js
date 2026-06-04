// ===== LÓGICA DEL ÍNDICE CURSO (ACORDEÓN) - VERSIÓN PROFESOR =====

// Estructura de capítulos y clases
const capitulos = [
    {
        titulo: "Capítulo 1: Tu punto de partida",
        clases: [
            { id: "clase1", titulo: "Clase 1: Introducción y enfoque", url: "clase.html?id=clase1" }
        ]
    },
    {
        titulo: "Capítulo 2: Los 4 pilares de la salud",
        clases: [
            { id: "clase2", titulo: "Clase 2: Sueño - Reparación nocturna", url: "clase.html?id=clase2" },
            { id: "clase3", titulo: "Clase 3: Mente - Paz y claridad", url: "clase.html?id=clase3" },
            { id: "clase4", titulo: "Clase 4: Ejercicio - Movimiento con propósito", url: "clase.html?id=clase4" },
            { id: "clase5", titulo: "Clase 5: Alimentación - Nutrición inteligente", url: "clase.html?id=clase5" }
        ]
    },
    {
        titulo: "Capítulo 3: Alimentación sanadora",
        clases: [
            { id: "clase6", titulo: "Clase 6: Qué NO comer", url: "clase.html?id=clase6" },
            { id: "clase7", titulo: "Clase 7: Macronutrientes y cálculo", url: "clase.html?id=clase7" },
            { id: "clase8", titulo: "Clase 8: Suplementación", url: "clase.html?id=clase8" }
        ]
    },
    {
        titulo: "Capítulo 4: Enfermedad, longevidad y prevención",
        clases: [
            { id: "clase9", titulo: "Clase 9: Resistencia a la insulina", url: "clase.html?id=clase9" },
            { id: "clase10", titulo: "Clase 10: Sarcopenia", url: "clase.html?id=clase10" },
            { id: "clase11", titulo: "Clase 11: Ayuno intermitente", url: "clase.html?id=clase11" }
        ]
    },
    {
        titulo: "Capítulo 5: Herramientas prácticas para la vida real",
        clases: [
            { id: "clase12", titulo: "Clase 12: Estructura, sol y frío", url: "clase.html?id=clase12" },
            { id: "clase13", titulo: "Clase 13: Cómo leer etiquetas", url: "clase.html?id=clase13" },
            { id: "clase14", titulo: "Clase 14: Prevención de recaídas + cierre", url: "clase.html?id=clase14" }
        ]
    }
];

// Guardar/recuperar estado del acordeón (inicia vacío)
function getAccordionState() {
    const saved = localStorage.getItem('accordion_state_curso_profesor');
    if (saved) {
        return JSON.parse(saved);
    }
    return {};
}

function saveAccordionState(state) {
    localStorage.setItem('accordion_state_curso_profesor', JSON.stringify(state));
}

// Función para aplicar estilos unificados al botón cerrar sesión
function aplicarEstiloBotonCerrarSesion(btn) {
    if (!btn) return;
    btn.style.backgroundColor = '#dc3545';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.padding = '10px 20px';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '0.9rem';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '8px';
    btn.style.width = 'auto';
    btn.style.minWidth = '0';
    btn.style.margin = '0';
    btn.style.boxShadow = 'none';
    btn.style.outline = 'none';
}

// Función para cerrar sesión (eliminar datos de sesión y redirigir)
function cerrarSesion() {
    localStorage.removeItem('profesor_actual');
    localStorage.removeItem('alumno_actual');
    localStorage.removeItem('acceso_tipo');
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
}

// Mostrar solo el botón de cerrar sesión (sin recuadro de info)
function mostrarBotonCerrarSesion() {
    const container = document.getElementById('resumen-alumno');
    if (!container) return;
    
    // Limpiar estilos del contenedor
    container.style.background = 'transparent';
    container.style.boxShadow = 'none';
    container.style.padding = '0';
    container.style.margin = '0 0 20px 0';
    container.style.border = 'none';
    
    // Crear botón con el mismo icono que el panel principal
    container.innerHTML = `
        <button id="btnCerrarSesion">
            Cerrar sesión
        </button>
    `;
    
    const btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        aplicarEstiloBotonCerrarSesion(btnCerrar);
        btnCerrar.onclick = cerrarSesion;
    }
}

// Renderizar acordeón (solo un capítulo abierto a la vez, inicia cerrado)
function renderAccordion() {
    const container = document.getElementById('accordion-container');
    if (!container) {
        console.error('No se encontró el contenedor accordion-container');
        return;
    }
    
    const state = getAccordionState();
    
    let html = '';
    capitulos.forEach((cap, idx) => {
        const isOpen = state.openChapter !== undefined && state.openChapter === idx;
        const totalEnCapitulo = cap.clases.length;
        
        html += `
            <div class="accordion-section" data-cap="${idx}">
                <div class="accordion-header ${isOpen ? 'open' : ''}">
                    <span>${cap.titulo}</span>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 0.8rem; background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 20px;">
                            ${totalEnCapitulo} clases
                        </span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="accordion-content" style="${isOpen ? 'max-height: 800px;' : ''}">
                    <div class="accordion-content-inner">
                        ${cap.clases.map(clase => {
                            return `
                                <a href="${clase.url}" class="clase-link" data-clase-id="${clase.id}">
                                    <div class="clase-info">
                                        <i class="fas fa-book-open"></i>
                                        <span>${clase.titulo}</span>
                                    </div>
                                    <span class="badge-profesor"><i class="fas fa-eye"></i> Ver clase</span>
                                </a>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    
    // Eventos para headers (con cierre automático de otros)
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', function(e) {
            if (e.target.tagName === 'SPAN' && e.target.parentElement !== this) return;
            
            const section = this.closest('.accordion-section');
            const clickedIdx = parseInt(section.getAttribute('data-cap'));
            const currentState = getAccordionState();
            const wasOpen = this.classList.contains('open');
            
            // Cerrar TODOS
            document.querySelectorAll('.accordion-header').forEach(h => {
                h.classList.remove('open');
            });
            document.querySelectorAll('.accordion-content').forEach(c => {
                c.style.maxHeight = null;
            });
            
            // Si el que se clickeó NO estaba abierto, lo abrimos
            if (!wasOpen) {
                this.classList.add('open');
                const content = this.nextElementSibling;
                content.style.maxHeight = content.scrollHeight + 'px';
                currentState.openChapter = clickedIdx;
            } else {
                currentState.openChapter = undefined;
            }
            
            saveAccordionState(currentState);
        });
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    mostrarBotonCerrarSesion();
    renderAccordion();
});