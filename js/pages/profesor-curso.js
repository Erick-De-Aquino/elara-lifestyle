// profesor-curso.js - Editor del curso (vista profesor)

let datosCurso = null;
let capitulosAgrupados = {};

// ===== INICIALIZAR =====
async function initProfesorCurso() {
    if (!window.auth || !window.auth.requireAuth('profesor')) {
        return;
    }
    
    const sesion = window.auth.getCurrentUser();
    if (!sesion) {
        window.location.href = '../../index.html';
        return;
    }
    
    await window.navegacion.initNavegacion('profesor', 'curso', sesion.nombre);
    await cargarDatosCurso();
    renderizarEditor();
}

// ===== CARGAR DATOS =====
async function cargarDatosCurso() {
    try {
        const response = await fetch('../../data/clases.json');
        datosCurso = await response.json();
        
        // Agrupar por capítulo
        capitulosAgrupados = {};
        Object.values(datosCurso).forEach(clase => {
            const capitulo = clase.capitulo;
            if (!capitulosAgrupados[capitulo]) {
                capitulosAgrupados[capitulo] = [];
            }
            capitulosAgrupados[capitulo].push(clase);
        });
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// ===== RENDERIZAR =====
function renderizarEditor() {
    const container = document.getElementById('curso-container');
    if (!container) return;
    
    const totalClases = Object.keys(datosCurso).length;
    
    let html = `
        <div class="stats-grid" style="margin-bottom: var(--spacing-6);">
            <div class="stat-card">
                <div class="stat-title">📚 Capítulos</div>
                <div class="stat-value">${Object.keys(capitulosAgrupados).length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">📖 Clases</div>
                <div class="stat-value">${totalClases}</div>
            </div>
        </div>
        
        <div class="modulos-list">
    `;
    
    for (const [capitulo, clases] of Object.entries(capitulosAgrupados)) {
        html += `
            <div class="modulo-card">
                <div class="modulo-header" onclick="toggleModulo(this)">
                    <span class="modulo-titulo">📘 ${escapeHtml(capitulo)}</span>
                    <span class="modulo-info">${clases.length} clases</span>
                    <span class="modulo-icono">▶</span>
                </div>
                <div class="modulo-contenido">
                    <div class="clases-list">
        `;
        
        clases.sort((a, b) => a.numero - b.numero).forEach(clase => {
            html += `
                <div class="clase-item" onclick="verClase('${clase.id}')">
                    <div class="clase-check">${clase.numero}</div>
                    <div class="clase-info">
                        <div class="clase-nombre">Clase ${clase.numero}: ${escapeHtml(clase.titulo)}</div>
                        <div class="clase-duracion">${clase.duracion} min</div>
                    </div>
                    <div class="clase-estado">👁️ Ver</div>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
    }
    
    html += `</div>`;
    
    container.innerHTML = html;
}

function toggleModulo(element) {
    const moduloCard = element.closest('.modulo-card');
    const isOpen = moduloCard.classList.contains('open');
    
    // Cerrar todos los módulos
    document.querySelectorAll('.modulo-card').forEach(card => {
        card.classList.remove('open');
    });
    
    // Si no estaba abierto, abrir el actual
    if (!isOpen) {
        moduloCard.classList.add('open');
    }
}

function verClase(claseId) {
    const numero = claseId.replace('clase', '');
    window.location.href = `clase-preview.html?id=${numero}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', initProfesorCurso);