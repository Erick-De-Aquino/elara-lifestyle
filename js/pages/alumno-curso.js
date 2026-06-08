// alumno-curso.js - Página principal del curso (vista alumno)

let alumnoActual = null;
let progresoActual = {};
let clasesData = [];
let modulosAgrupados = {};

// ===== INICIALIZAR PÁGINA =====
async function initCurso() {
    if (!window.auth || !window.auth.requireAuth('alumno')) {
        return;
    }
    
    const sesion = window.auth.getCurrentUser();
    if (!sesion) {
        window.location.href = '../../index.html';
        return;
    }
    
    alumnoActual = sesion;
    await window.navegacion.initNavegacion('alumno', 'curso', sesion.nombre);
    
    await cargarClases();
    await cargarProgreso();
    renderizarCurso();
}

// ===== CARGAR CLASES DESDE JSON LOCAL =====
async function cargarClases() {
    try {
        const response = await fetch('../../data/clases-alumno.json');
        const data = await response.json();
        
        // Convertir objeto a array
        clasesData = Object.values(data).sort((a, b) => a.numero - b.numero);
        
        // Agrupar por capítulo
        modulosAgrupados = {};
        clasesData.forEach(clase => {
            const capitulo = clase.capitulo || 'Capítulo sin título';
            if (!modulosAgrupados[capitulo]) {
                modulosAgrupados[capitulo] = [];
            }
            modulosAgrupados[capitulo].push(clase);
        });
    } catch (error) {
        console.error('Error cargando clases:', error);
    }
}

// ===== CARGAR PROGRESO DEL ALUMNO =====
async function cargarProgreso() {
    const supabase = window.supabaseClient;
    if (!supabase || !alumnoActual) return;
    
    const { data, error } = await supabase
        .from('progreso')
        .select('clase_id, completada')
        .eq('usuario_id', alumnoActual.id);
    
    if (!error && data) {
        progresoActual = {};
        data.forEach(p => {
            // clase_id es número (1, 2, 3...)
            progresoActual[p.clase_id] = p.completada;
        });
    }
}

// ===== RENDERIZAR CURSO =====
function renderizarCurso() {
    const container = document.getElementById('curso-container');
    if (!container) return;
    
    const totalClases = clasesData.length;
    const completadas = Object.values(progresoActual).filter(v => v === true).length;
    const progresoTotal = totalClases > 0 ? Math.round((completadas / totalClases) * 100) : 0;
    
    // Encontrar próxima clase no completada (usando número directamente)
    let proximaClase = null;
    for (const clase of clasesData) {
        if (!progresoActual[clase.numero]) {
            proximaClase = clase;
            break;
        }
    }
    
    let html = `
        <div class="curso-header">
            <h1 class="curso-titulo">Elara LifeStyle</h1>
            <p class="curso-descripcion">Los 4 pilares de la salud</p>
        </div>
        
        <div class="progress-card">
            <div class="progress-stats">
                <span class="progress-label">Tu progreso general</span>
                <span class="progress-value">${progresoTotal}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progresoTotal}%"></div>
            </div>
            <p style="margin-top: var(--spacing-2); font-size: var(--font-size-sm); color: var(--text-muted);">${completadas} de ${totalClases} clases completadas</p>
        </div>
    `;
    
    if (proximaClase) {
        html += `
            <div class="proxima-clase-card" onclick="irAClase(${proximaClase.numero})">
                <div class="proxima-clase-titulo">📅 Próxima clase</div>
                <div class="proxima-clase-nombre">Clase ${proximaClase.numero}: ${escapeHtml(proximaClase.titulo)}</div>
                <div class="proxima-clase-fecha">Duración: ${proximaClase.duracion} min</div>
            </div>
        `;
    }
    
    html += `<div class="modulos-list">`;
    
    for (const [capitulo, clases] of Object.entries(modulosAgrupados)) {
        // Usar número directamente para contar completadas del módulo
        const completadasModulo = clases.filter(c => progresoActual[c.numero]).length;
        
        html += `
            <div class="modulo-card">
                <div class="modulo-header" onclick="toggleModulo(this)">
                    <span class="modulo-titulo">📘 ${escapeHtml(capitulo)}</span>
                    <span class="modulo-info">${completadasModulo}/${clases.length}</span>
                    <span class="modulo-icono">▶</span>
                </div>
                <div class="modulo-contenido">
                    <div class="clases-list">
        `;
        
        clases.forEach(clase => {
            // Usar número directamente para verificar si está completada
            const isCompleted = progresoActual[clase.numero] || false;
            html += `
                <div class="clase-item ${isCompleted ? 'completed' : ''}" onclick="irAClase(${clase.numero})">
                    <div class="clase-check">${isCompleted ? '✓' : clase.numero}</div>
                    <div class="clase-info">
                        <div class="clase-nombre">Clase ${clase.numero}: ${escapeHtml(clase.titulo)}</div>
                        <div class="clase-duracion">${clase.duracion} min</div>
                    </div>
                    ${!isCompleted ? '<div class="clase-estado">Pendiente</div>' : ''}
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
    moduloCard.classList.toggle('open');
}

function irAClase(numero) {
    window.location.href = `clase.html?id=${numero}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', initCurso);