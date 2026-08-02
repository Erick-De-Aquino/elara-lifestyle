// profesor-dashboard.js - Dashboard del profesor

let profesorActual = null;
let todosLosAlumnos = [];
let proximasClases = [];

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
            .eq('rol', 'alumno')
            .order('nombre', { ascending: true });
        
        if (error) throw error;
        
        todosLosAlumnos = alumnos || [];
        console.log('Alumnos cargados:', todosLosAlumnos);

        const { data: eventos, error: eventosError } = await supabaseClient
            .from('eventos')
            .select('id, titulo, fecha, hora, usuario_id, descripcion')
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });

        if (eventosError) throw eventosError;

        const ahora = new Date();
        proximasClases = (eventos || [])
            .map(evento => ({
                ...evento,
                fechaHora: obtenerFechaHoraEvento(evento)
            }))
            .filter(evento => evento.fechaHora && evento.fechaHora >= ahora)
            .sort((a, b) => a.fechaHora - b.fechaHora);
        
    } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        todosLosAlumnos = [];
        proximasClases = [];
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
        
        <div class="dashboard-main-grid">
            <section class="dashboard-panel" aria-labelledby="dashboard-alumnos-title">
                <div class="dashboard-panel-header">
                    <h2 class="dashboard-panel-title" id="dashboard-alumnos-title">Alumnos</h2>
                    <span class="dashboard-panel-count">${todosLosAlumnos.length}</span>
                </div>
                <div class="dashboard-panel-body">
                    <table class="dashboard-students-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Progreso</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="alumnos-table-body">
                            ${renderizarFilasAlumnos(todosLosAlumnos)}
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="dashboard-panel" aria-labelledby="dashboard-clases-title">
                <div class="dashboard-panel-header">
                    <h2 class="dashboard-panel-title" id="dashboard-clases-title">Próximas clases</h2>
                    <span class="dashboard-panel-count">${proximasClases.length}</span>
                </div>
                <div class="dashboard-panel-body">
                    ${renderizarProximasClases(proximasClases)}
                </div>
            </section>
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
            const nombre = btn.getAttribute('data-nombre');
            verDetalleAlumno(id, nombre);
        });
    });
    
    // Cargar progresos después de renderizar
    cargarTodosLosProgresos();
}

// ===== RENDERIZAR FILAS DE ALUMNOS =====
function renderizarFilasAlumnos(alumnos) {
    if (!alumnos || alumnos.length === 0) {
        return '<tr><td colspan="3" class="dashboard-empty-state">No hay alumnos registrados</td></tr>';
    }
    
    return alumnos.map(alumno => `
        <tr>
            <td><strong>${escapeHtml(alumno.nombre || 'Sin nombre')}</strong></td>
            <td><span class="progreso-badge" data-id="${alumno.id}">cargando...</span></td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit btn-ver-alumno" data-id="${alumno.id}" data-nombre="${escapeHtml(alumno.nombre || '')}" title="Ver detalles" aria-label="Ver detalles de ${escapeHtml(alumno.nombre || 'alumno')}">👁️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== RENDERIZAR PRÓXIMAS CLASES =====
function renderizarProximasClases(eventos) {
    if (!eventos || eventos.length === 0) {
        return '<div class="dashboard-empty-state">No hay clases futuras agendadas.</div>';
    }

    return `
        <div class="upcoming-classes-list">
            ${eventos.map(evento => {
                const fecha = evento.fechaHora;
                const dia = String(fecha.getDate()).padStart(2, '0');
                const mes = fecha.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
                const hora = evento.hora ? evento.hora.substring(0, 5) : 'Sin hora';
                const alumno = todosLosAlumnos.find(item => String(item.id) === String(evento.usuario_id));
                const alumnoNombre = alumno?.nombre || 'Alumno no identificado';

                return `
                    <article class="upcoming-class-item">
                        <div class="upcoming-class-date" aria-hidden="true">
                            <span class="upcoming-class-day">${dia}</span>
                            <span class="upcoming-class-month">${escapeHtml(mes)}</span>
                        </div>
                        <div class="upcoming-class-content">
                            <button
                                type="button"
                                class="upcoming-class-student btn-ver-alumno"
                                data-id="${escapeHtml(String(evento.usuario_id || ''))}"
                                data-nombre="${escapeHtml(alumnoNombre)}"
                                aria-label="Ver detalles de ${escapeHtml(alumnoNombre)}"
                            >
                                ${escapeHtml(alumnoNombre)}
                            </button>

                            <div class="upcoming-class-meta">
                                <span>🕐 ${escapeHtml(hora)}</span>
                            </div>
                        </div>
                    </article>
                `;
            }).join('')}
        </div>
    `;
}

// Construye la fecha y hora en horario local para evitar desplazamientos por UTC.
function obtenerFechaHoraEvento(evento) {
    if (!evento?.fecha) return null;

    const partesFecha = evento.fecha.split('-').map(Number);
    if (partesFecha.length !== 3 || partesFecha.some(Number.isNaN)) return null;

    const [anio, mes, dia] = partesFecha;
    const partesHora = (evento.hora || '23:59').substring(0, 5).split(':').map(Number);
    const [hora = 23, minutos = 59] = partesHora;
    const fechaHora = new Date(anio, mes - 1, dia, hora, minutos, 0, 0);

    return Number.isNaN(fechaHora.getTime()) ? null : fechaHora;
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

// ===== VER DETALLE COMPLETO DEL ALUMNO =====
async function verDetalleAlumno(alumnoId, alumnoNombre) {
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    // Mostrar loading
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1300;';
    loadingOverlay.innerHTML = '<div style="background:var(--bg-card);padding:20px;border-radius:12px;">Cargando datos...</div>';
    document.body.appendChild(loadingOverlay);
    
    try {
        // 1. Obtener datos del alumno
        const { data: alumno } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', alumnoId)
            .single();
        
        // 2. Obtener progreso del alumno
        const { data: progreso } = await supabase
            .from('progreso')
            .select('clase_id, completada, fecha_completado')
            .eq('usuario_id', alumnoId);
        
        // 3. Obtener todas las clases
        const response = await fetch('../../data/clases-alumno.json');
        const todasClases = await response.json();
        const clasesArray = Object.values(todasClases).sort((a, b) => a.numero - b.numero);
        
        // 4. Obtener notas del profesor
        const { data: notas } = await supabase
            .from('comentarios_profesor')
            .select('clase_id, comentario, created_at')
            .eq('alumno_id', alumnoId)
            .order('clase_id', { ascending: true });
        
        // Mapa de progreso
        const progresoMap = {};
        if (progreso) {
            progreso.forEach(p => {
                progresoMap[p.clase_id] = {
                    completada: p.completada,
                    fecha: p.fecha_completado ? new Date(p.fecha_completado).toLocaleDateString('es-CL') : null
                };
            });
        }
        
        // Mapa de notas
        const notasMap = {};
        if (notas) {
            notas.forEach(n => {
                notasMap[n.clase_id] = n.comentario;
            });
        }
        
        // Calcular estadísticas
        const totalClases = clasesArray.length;
        const completadas = Object.values(progresoMap).filter(p => p.completada).length;
        const porcentaje = Math.round((completadas / totalClases) * 100);
        
        // Generar HTML del detalle de progreso (solo clases completadas)
        let detalleHtml = '';
        const clasesCompletadas = clasesArray.filter(clase => progresoMap[clase.numero]?.completada);
        const clasesPendientesCount = clasesArray.length - clasesCompletadas.length;
        
        if (clasesCompletadas.length === 0) {
            detalleHtml = '<p style="color: var(--text-muted);">No hay clases completadas aún.</p>';
        } else {
            for (const clase of clasesCompletadas) {
                const estado = progresoMap[clase.numero];
                const fecha = estado?.fecha || '';
                
                detalleHtml += `
                    <div style="margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: var(--success);">✅</span>
                            <strong>Clase ${clase.numero}: ${escapeHtml(clase.titulo)}</strong>
                        </div>
                        <div style="margin-left: 28px; font-size: var(--font-size-sm); color: var(--text-muted);">
                            Completada: ${fecha}
                        </div>
                    </div>
                `;
            }
            
            if (clasesPendientesCount > 0) {
                detalleHtml += `
                    <div style="margin-top: 12px; padding: 8px; text-align: center; color: var(--text-muted);">
                        ⏳ ${clasesPendientesCount} clases pendientes por completar
                    </div>
                `;
            }
        }
        
        // Generar HTML de notas
        let notasHtml = '';
        if (notas && notas.length > 0) {
            for (const nota of notas) {
                const clase = clasesArray.find(c => c.id === nota.clase_id);
                notasHtml += `
                    <div style="margin-bottom: 16px; padding: 12px; background: var(--gray-50); border-radius: 8px; border-left: 3px solid var(--primary);">
                        <strong>${clase ? `Clase ${clase.numero}: ${clase.titulo}` : nota.clase_id}</strong>
                        <p style="margin: 8px 0 4px 0; white-space: pre-wrap;">${escapeHtml(nota.comentario)}</p>
                        <small style="color: var(--text-muted);">📅 ${new Date(nota.created_at).toLocaleDateString('es-CL')}</small>
                    </div>
                `;
            }
        } else {
            notasHtml = '<p style="color: var(--text-muted);">No hay notas registradas.</p>';
        }
        
        // Construir modal
        const modalHtml = `
            <div style="max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="margin: 0;">📊 Detalle del Alumno</h2>
                    <button id="modalDetalleCerrar" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                
                <div style="background: var(--bg-body); color: var(--text-primary); padding: 16px; border-radius: 12px; margin-bottom: 20px; border-left: 3px solid var(--primary);">
                    <h3 style="margin: 0 0 8px 0;">👤 Datos Personales</h3>
                    <p><strong>Nombre:</strong> ${escapeHtml(alumno.nombre)}</p>
                    <p><strong>Email:</strong> ${escapeHtml(alumno.email)}</p>
                    <p><strong>Teléfono:</strong> ${alumno.telefono || 'No registrado'}</p>
                    <p><strong>Registro:</strong> ${new Date(alumno.created_at).toLocaleDateString('es-CL')}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3>📈 Progreso General</h3>
                    <div style="background: var(--gray-200); border-radius: 10px; height: 20px; overflow: hidden;">
                        <div style="width: ${porcentaje}%; height: 100%; background: var(--success);"></div>
                    </div>
                    <p style="margin-top: 8px;"><strong>${completadas}</strong> de <strong>${totalClases}</strong> clases completadas (${porcentaje}%)</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3>📚 Detalle de Progreso</h3>
                    ${detalleHtml}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3>📝 Notas del Profesor</h3>
                    ${notasHtml}
                </div>
            </div>
        `;
        
        // Remover loading
        loadingOverlay.remove();
        
        // Mostrar modal
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1300;';
        const modal = document.createElement('div');
        modal.style.cssText = 'background:var(--bg-card);border-radius:12px;max-width:600px;width:90%;max-height:85vh;overflow-y:auto;padding:20px;';
        modal.innerHTML = modalHtml;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        window.elaraModals?.registrar(overlay, { cerrar: () => overlay.remove() });
        
        document.getElementById('modalDetalleCerrar')?.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        
    } catch (error) {
        console.error('Error:', error);
        loadingOverlay.remove();
        window.modal.mostrar('Error al cargar los datos', 'error');
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