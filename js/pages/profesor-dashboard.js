// profesor-dashboard.js - Dashboard del profesor

let profesorActual = null;
let todosLosAlumnos = [];

// ===== INICIALIZAR DASHBOARD =====
async function initDashboard() {
    if (!window.auth || !window.auth.requireAuth('profesor')) {
        return;
    }
    
    const sesion = window.auth.getCurrentUser();
    if (!sesion) {
        window.location.href = '../../index.html';
        return;
    }
    
    profesorActual = sesion;
    
    await window.navegacion.initNavegacion('profesor', 'dashboard', sesion.nombre);
    
    await cargarDatosReales();
    renderizarDashboard();
}

// ===== CARGAR DATOS REALES DESDE SUPABASE =====
async function cargarDatosReales() {
    const supabaseClient = window.supabaseClient;
    
    if (!supabaseClient) {
        console.error('No hay cliente Supabase');
        return;
    }
    
    try {
        const { data: alumnos, error } = await supabaseClient
            .from('usuarios')
            .select('id, nombre, email, telefono, created_at')
            .eq('rol', 'alumno');
        
        if (error) throw error;
        
        todosLosAlumnos = alumnos || [];
        console.log('Alumnos cargados:', todosLosAlumnos);
        
    } catch (error) {
        console.error('Error cargando alumnos:', error);
        todosLosAlumnos = [];
    }
}

// ===== CALCULAR TOTAL DE CLASES COMPLETADAS POR TODOS LOS ALUMNOS =====
async function calcularClasesCompletadas() {
    const supabase = window.supabaseClient;
    if (!supabase) return 0;
    
    // Obtener todos los registros de progreso donde completada = true
    const { data, error } = await supabase
        .from('progreso')
        .select('completada')
        .eq('completada', true);
    
    if (error) {
        console.error('Error calculando clases completadas:', error);
        return 0;
    }
    
    return data ? data.length : 0;
}

// ===== CALCULAR PROGRESO PROMEDIO DE TODOS LOS ALUMNOS =====
async function calcularProgresoPromedio() {
    const supabase = window.supabaseClient;
    if (!supabase) return 0;
    
    // Obtener todos los alumnos
    const { data: alumnos } = await supabase
        .from('usuarios')
        .select('id')
        .eq('rol', 'alumno');
    
    if (!alumnos || alumnos.length === 0) return 0;
    
    let totalCompletadas = 0;
    const totalClases = 14;
    
    for (const alumno of alumnos) {
        const { data: progreso } = await supabase
            .from('progreso')
            .select('completada')
            .eq('usuario_id', alumno.id)
            .eq('completada', true);
        
        totalCompletadas += progreso ? progreso.length : 0;
    }
    
    const promedio = (totalCompletadas / (alumnos.length * totalClases)) * 100;
    return Math.round(promedio);
}

// ===== CALCULAR CLASES AGENDADAS PARA HOY =====
async function calcularClasesHoy() {
    const supabase = window.supabaseClient;
    if (!supabase) return 0;
    
    // Obtener fecha local (no UTC)
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const fechaLocal = `${año}-${mes}-${dia}`;
    
    const { data, error } = await supabase
        .from('eventos')
        .select('fecha');
    
    if (error) {
        console.error('Error calculando clases hoy:', error);
        return 0;
    }
    
    const clasesHoy = data.filter(evento => evento.fecha === fechaLocal);
    
    return clasesHoy.length;
}

// ===== CARGAR TODOS LOS PROGRESOS =====
async function cargarTodosLosProgresos() {
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    for (const alumno of todosLosAlumnos) {
        const { data: progreso } = await supabase
            .from('progreso')
            .select('completada')
            .eq('usuario_id', alumno.id);
        
        const completadas = progreso ? progreso.filter(p => p.completada).length : 0;
        const badge = document.querySelector(`.progreso-badge[data-id="${alumno.id}"]`);
        if (badge) {
            badge.textContent = `${completadas}/14`;
            badge.style.cssText = 'background: var(--primary-bg); color: var(--primary); padding: 2px 10px; border-radius: 20px; font-weight: 500;';
        }
    }
}

// ===== RENDERIZAR DASHBOARD =====
async function renderizarDashboard() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;
    
    const totalAlumnos = todosLosAlumnos.length;
    
    // Calcular clases completadas
    const clasesCompletadas = await calcularClasesCompletadas();
    
    // Calcular progreso promedio
    const progresoPromedio = await calcularProgresoPromedio();
    
    // Calcular clases agendadas para hoy
    const clasesHoy = await calcularClasesHoy();
    
    const html = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-title">👥 Total Alumnos</div>
                <div class="stat-value">${totalAlumnos}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">✅ Clases Completadas</div>
                <div class="stat-value">${clasesCompletadas}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">📊 Progreso Promedio</div>
                <div class="stat-value">${progresoPromedio}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">📅 Clases Hoy</div>
                <div class="stat-value">${clasesHoy}</div>
            </div>
        </div>
        
        <div class="action-buttons">
            <button id="btnVerAlumnos" class="btn-primary">👥 Gestionar Alumnos</button>
            <button id="btnVerCalendario" class="btn-secondary">📅 Ver Calendario</button>
            <button id="btnExportarCSV" class="btn-outline">📎 Exportar Alumnos</button>
        </div>
        
        <div class="alumnos-table-container">
            <table class="alumnos-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Fecha Registro</th>
                        <th>Progreso</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="alumnos-table-body">
                    ${renderizarFilasAlumnos(todosLosAlumnos.slice(0, 5))}
                </tbody>
            </table>
        </div>
        
        ${todosLosAlumnos.length === 0 ? `
        <div style="text-align: center; padding: var(--spacing-8); color: var(--text-muted);">
            <p>No hay alumnos registrados aún.</p>
            <button id="btnCrearPrimerAlumno" class="btn-primary" style="margin-top: var(--spacing-4);">+ Crear primer alumno</button>
        </div>
        ` : ''}
    `;
    
    container.innerHTML = html;
    
    // Event listeners
    document.getElementById('btnVerAlumnos')?.addEventListener('click', () => {
        window.location.href = 'alumnos.html';
    });
    
    document.getElementById('btnVerCalendario')?.addEventListener('click', () => {
        window.location.href = 'calendario.html';
    });
    
    document.getElementById('btnExportarCSV')?.addEventListener('click', exportarAlumnos);
    
    const btnCrearPrimerAlumno = document.getElementById('btnCrearPrimerAlumno');
    if (btnCrearPrimerAlumno) {
        btnCrearPrimerAlumno.addEventListener('click', () => {
            window.location.href = 'alumnos.html';
        });
    }
    
    document.querySelectorAll('.btn-ver-alumno').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            window.modal.mostrar(`Funcionalidad en desarrollo. ID: ${id}`, 'info');
        });
    });
    
    document.querySelectorAll('.btn-next-clase').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const nombre = btn.getAttribute('data-nombre');
            irSiguienteClaseAlumno(id, nombre);
        });
    });
    
    // Cargar progresos después de renderizar
    cargarTodosLosProgresos();
}

// ===== RENDERIZAR FILAS =====
function renderizarFilasAlumnos(alumnos) {
    if (!alumnos || alumnos.length === 0) {
        return `<tr><td colspan="6" style="text-align: center;">No hay alumnos registrados</td><tr>`;
    }
    
    return alumnos.map(alumno => `
        <tr>
            <td><strong>${escapeHtml(alumno.nombre || 'Sin nombre')}</strong></td>
            <td>${escapeHtml(alumno.email || '—')}</td>
            <td>${alumno.telefono || '—'}</td>
            <td>${window.utils?.formatearFecha(alumno.created_at) || '—'}</td>
            <td><span class="progreso-badge" data-id="${alumno.id}">cargando...</span></td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit btn-ver-alumno" data-id="${alumno.id}" title="Ver detalles">👁️</button>
                    <button class="action-btn next-clase btn-next-clase" data-id="${alumno.id}" data-nombre="${escapeHtml(alumno.nombre)}" title="Siguiente clase">▶</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== EXPORTAR ALUMNOS =====
function exportarAlumnos() {
    if (todosLosAlumnos.length === 0) {
        window.modal.mostrar('No hay alumnos para exportar', 'warning');
        return;
    }
    
    const csv = window.alumnos?.exportarCSV(todosLosAlumnos);
    if (csv) {
        window.alumnos?.descargarCSV(csv, `alumnos_${new Date().toISOString().split('T')[0]}.csv`);
        window.modal.mostrar('Exportación completada', 'exito');
    }
}


// ===== IR A LA SIGUIENTE CLASE DEL ALUMNO =====
async function irSiguienteClaseAlumno(alumnoId, alumnoNombre) {
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    const { data: progreso } = await supabase
        .from('progreso')
        .select('clase_id, completada')
        .eq('usuario_id', alumnoId);
    
    const completadas = new Set();
    if (progreso) {
        progreso.forEach(p => {
            if (p.completada) completadas.add(p.clase_id);
        });
    }
    
    let siguienteClaseNumero = null;
    for (let i = 1; i <= 14; i++) {
        const claseKey = `clase${i}`;
        if (!completadas.has(claseKey)) {
            siguienteClaseNumero = i;
            break;
        }
    }
    
    if (siguienteClaseNumero) {
        window.open(`clase-preview.html?id=${siguienteClaseNumero}&alumnoId=${alumnoId}&alumnoNombre=${encodeURIComponent(alumnoNombre)}`, '_blank');
    } else {
        window.modal.mostrar(`🎉 ¡${alumnoNombre} ha completado todas las clases!`, 'exito');
    }
}

// ===== ESCAPE HTML =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Inicializar
document.addEventListener('DOMContentLoaded', initDashboard);