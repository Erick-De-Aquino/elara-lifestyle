// ===== LÓGICA DEL ÍNDICE CURSO (ACORDEÓN) =====

// Estructura de capítulos y clases
const capitulos = [
    {
        titulo: "Capítulo 1: Tu punto de partida",
        clases: [
            { id: "clase1", titulo: "Clase 1: Introducción y enfoque", url: "pages/clase1.html" }
        ]
    },
    {
        titulo: "Capítulo 2: Los 4 pilares de la salud",
        clases: [
            { id: "clase2", titulo: "Clase 2: Sueño - Reparación nocturna", url: "pages/clase2.html" },
            { id: "clase3", titulo: "Clase 3: Mente - Paz y claridad", url: "pages/clase3.html" },
            { id: "clase4", titulo: "Clase 4: Ejercicio - Movimiento con propósito", url: "pages/clase4.html" },
            { id: "clase5", titulo: "Clase 5: Alimentación - Nutrición inteligente", url: "pages/clase5.html" }
        ]
    },
    {
        titulo: "Capítulo 3: Alimentación sanadora",
        clases: [
            { id: "clase6", titulo: "Clase 6: Qué NO comer", url: "pages/clase6.html" },
            { id: "clase7", titulo: "Clase 7: Macronutrientes y cálculo", url: "pages/clase7.html" },
            { id: "clase8", titulo: "Clase 8: Suplementación", url: "pages/clase8.html" }
        ]
    },
    {
        titulo: "Capítulo 4: Enfermedad, longevidad y prevención",
        clases: [
            { id: "clase9", titulo: "Clase 9: Resistencia a la insulina", url: "pages/clase9.html" },
            { id: "clase10", titulo: "Clase 10: Sarcopenia", url: "pages/clase10.html" },
            { id: "clase11", titulo: "Clase 11: Ayuno intermitente", url: "pages/clase11.html" }
        ]
    },
    {
        titulo: "Capítulo 5: Herramientas prácticas para la vida real",
        clases: [
            { id: "clase12", titulo: "Clase 12: Estructura, sol y frío", url: "pages/clase12.html" },
            { id: "clase13", titulo: "Clase 13: Cómo leer etiquetas", url: "pages/clase13.html" },
            { id: "clase14", titulo: "Clase 14: Prevención de recaídas + cierre", url: "pages/clase14.html" }
        ]
    }
];

// Guardar/recuperar estado del acordeón
// Guardar/recuperar estado del acordeón (inicia vacío)
function getAccordionState() {
    const saved = localStorage.getItem('accordion_state_curso');
    if (saved) {
        return JSON.parse(saved);
    }
    // Si no hay estado guardado, devolver objeto vacío (todos cerrados)
    return {};
}

function saveAccordionState(state) {
    localStorage.setItem('accordion_state_curso', JSON.stringify(state));
}

// Obtener clases completadas del alumno actual
function getClasesCompletadas() {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual) return [];
    const progreso = getProgreso(alumnoActual);
    return progreso.completadas || [];
}

// Mostrar resumen del alumno actual
// Mostrar resumen del alumno actual
function mostrarResumenAlumno() {
    const alumnoActual = localStorage.getItem('alumno_actual');
    const container = document.getElementById('resumen-alumno');
    
    if (!alumnoActual) {
    container.innerHTML = `
        <i class="fas fa-eye"></i>
        <div class="resumen-alumno-info">
            <div class="resumen-alumno-nombre">Modo explorador</div>
            <div class="resumen-alumno-progreso">Estás viendo el curso sin registro. Las clases no se guardarán como completadas.</div>
        </div>
        <button id="btnRegistrar" class="btn-primary" style="padding: 8px 16px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 8px;">
            <i class="fas fa-user-plus" style="font-size: 1rem; color: white;"></i> Registrar alumno
        </button>
    `;
    const btnRegistrar = document.getElementById('btnRegistrar');
    if (btnRegistrar) {
        btnRegistrar.onclick = () => {
            window.location.href = 'alumno.html';
        };
    }
    return;
}
    
    const alumnos = getAlumnos();
    const alumno = alumnos.find(a => a.nombre === alumnoActual);
    const clasesCompletadas = getClasesCompletadas();
    const totalClases = 14;
    const porcentaje = (clasesCompletadas.length / totalClases) * 100;
    
    container.innerHTML = `
        <i class="fas fa-user-graduate"></i>
        <div class="resumen-alumno-info">
            <div class="resumen-alumno-nombre">${alumnoActual}</div>
            <div class="resumen-alumno-progreso">
                ${alumno?.objetivo ? `🎯 ${alumno.objetivo.replace('_', ' ')} | ` : ''}
                Clases completadas: ${clasesCompletadas.length} / ${totalClases}
            </div>
            <div class="barra-progreso">
                <div class="barra-progreso-fill" style="width: ${porcentaje}%;"></div>
            </div>
        </div>
        <button id="btnCambiarAlumno" class="btn-secondary" style="padding: 8px 16px; font-size: 0.85rem;">
            <i class="fas fa-exchange-alt"></i> Cambiar alumno
        </button>
    `;
    
    const btnCambiar = document.getElementById('btnCambiarAlumno');
    if (btnCambiar) {
        btnCambiar.onclick = () => {
            localStorage.removeItem('alumno_actual');
            window.location.href = 'index.html';
        };
    }
}

// Renderizar acordeón (solo un capítulo abierto a la vez, inicia cerrado)
function renderAccordion() {
    const container = document.getElementById('accordion-container');
    const state = getAccordionState();
    const clasesCompletadas = getClasesCompletadas();
    
    let html = '';
    capitulos.forEach((cap, idx) => {
        // Solo abrir si existe openChapter y coincide
        const isOpen = state.openChapter !== undefined && state.openChapter === idx;
        
        const completadasEnCapitulo = cap.clases.filter(c => clasesCompletadas.includes(c.id)).length;
        const totalEnCapitulo = cap.clases.length;
        
        html += `
            <div class="accordion-section" data-cap="${idx}">
                <div class="accordion-header ${isOpen ? 'open' : ''}">
                    <span>${cap.titulo}</span>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 0.8rem; background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 20px;">
                            ${completadasEnCapitulo}/${totalEnCapitulo}
                        </span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="accordion-content" style="${isOpen ? 'max-height: 800px;' : ''}">
                    <div class="accordion-content-inner">
                        ${cap.clases.map(clase => {
                            const estaCompletada = clasesCompletadas.includes(clase.id);
                            return `
                                <a href="${clase.url}" class="clase-link" data-clase-id="${clase.id}">
                                    <div class="clase-info">
                                        <i class="fas ${estaCompletada ? 'fa-check-circle' : 'fa-play-circle'}"></i>
                                        <span>${clase.titulo}</span>
                                    </div>
                                    ${estaCompletada ? '<span class="badge-completada"><i class="fas fa-check"></i> Completada</span>' : ''}
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
                // Si estaba abierto, lo cerramos y no guardamos ninguno
                currentState.openChapter = undefined;
            }
            
            saveAccordionState(currentState);
        });
    });
}

// Botón volver al inicio
const btnVolver = document.getElementById('btnVolverInicio');
if (btnVolver) {
    btnVolver.onclick = () => {
        window.location.href = 'index.html';
    };
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    mostrarResumenAlumno();
    renderAccordion();
});