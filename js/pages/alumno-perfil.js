// alumno-perfil.js - Perfil del alumno

let alumnoActual = null;
let datosAlumno = null;
let clasesAgendadas = [];
let todasClases = [];
let progresoActual = {};

// ===== INICIALIZAR =====
async function initPerfil() {
    if (!window.auth || !window.auth.requireAuth('alumno')) {
        return;
    }
    
    const sesion = window.auth.getCurrentUser();
    if (!sesion) {
        window.location.href = '../../index.html';
        return;
    }
    
    alumnoActual = sesion;
    
    await window.navegacion.initNavegacion('alumno', 'perfil', sesion.nombre);
    await cargarDatosAlumno();
    await cargarProgreso();
    await cargarClasesAgendadas();
    renderizarPerfil();
}

// ===== CARGAR DATOS DEL ALUMNO =====
async function cargarDatosAlumno() {
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email, telefono, created_at')
        .eq('id', alumnoActual.id)
        .single();
    
    if (!error && data) {
        datosAlumno = data;
    } else {
        datosAlumno = {
            nombre: alumnoActual.nombre,
            email: alumnoActual.email,
            telefono: '',
            created_at: new Date().toISOString()
        };
    }
}

// ===== CARGAR PROGRESO =====
async function cargarProgreso() {
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    // Obtener todas las clases desde el JSON local
    try {
        const response = await fetch('../../data/clases-alumno.json');
        const data = await response.json();
        todasClases = Object.values(data).sort((a, b) => a.numero - b.numero);
    } catch (error) {
        console.error('Error cargando clases:', error);
        todasClases = [];
    }
    
    // Obtener progreso del alumno
    const { data: progreso } = await supabase
        .from('progreso')
        .select('clase_id, completada')
        .eq('usuario_id', alumnoActual.id);
    
    if (progreso) {
        progresoActual = {};
        progreso.forEach(p => {
            // La clase_id en progreso es número (1, 2, 3...)
            progresoActual[p.clase_id] = p.completada;
        });
    }
}

// ===== CARGAR CLASES AGENDADAS DESDE CALENDARIO =====
async function cargarClasesAgendadas() {
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    const { data, error } = await supabase
        .from('eventos')
        .select('id, titulo, fecha, hora')
        .eq('usuario_id', alumnoActual.id)
        .order('fecha', { ascending: true });
    
    if (!error && data) {
        clasesAgendadas = data;
    }
}

// ===== RENDERIZAR PERFIL =====
function renderizarPerfil() {
    const container = document.getElementById('perfil-container');
    if (!container) return;
    
    const fechaRegistro = new Date(datosAlumno.created_at).toLocaleDateString('es-CL');
    const totalClases = todasClases.length;
    const completadas = Object.values(progresoActual).filter(v => v === true).length;
    const progresoTotal = totalClases > 0 ? Math.round((completadas / totalClases) * 100) : 0;
    const clasesRestantes = totalClases - completadas;
    
    // Encontrar próxima clase pendiente
    let proximaClase = null;
    for (const clase of todasClases) {
        if (!progresoActual[clase.id]) {
            proximaClase = clase;
            break;
        }
    }
    
    // Función para obtener estado de una clase
    function getEstadoClase(clase) {
        const fechaClase = new Date(clase.fecha);
        fechaClase.setHours(0, 0, 0, 0);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const esPasada = fechaClase < hoy;
        const completada = progresoActual[`clase${clase.id}`] || false;
        
        if (!esPasada) return '<span style="color: var(--primary);">📌 Próxima</span>';
        if (completada) return '<span style="color: var(--success);">✓ Completada</span>';
        return '<span style="color: var(--error);">❌ No vista</span>';
    }
    
    // Clases agendadas (futuras o hoy)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const clasesFuturas = clasesAgendadas.filter(c => {
        const fechaClase = new Date(c.fecha);
        fechaClase.setHours(0, 0, 0, 0);
        return fechaClase >= hoy;
    });
    
    const clasesHistorial = clasesAgendadas.filter(c => {
        const fechaClase = new Date(c.fecha);
        fechaClase.setHours(0, 0, 0, 0);
        return fechaClase < hoy;
    });
    
    // Obtener el nombre del capítulo
    const nombreCapitulo = proximaClase ? (proximaClase.capitulo || '') : '';
    
    const html = `
        <div class="progress-card">
            <div class="progress-header">
                <h2 class="progress-title">👤 Mi Perfil</h2>
                <button id="btnEditarPerfil" class="btn-secondary">✏️ Editar Perfil</button>
            </div>
            
            <div style="display: flex; align-items: center; gap: var(--spacing-4); margin-top: var(--spacing-4); flex-wrap: wrap;">
                <div style="width: 80px; height: 80px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white;">
                    ${getIniciales(datosAlumno.nombre)}
                </div>
                <div>
                    <h3 style="font-size: var(--font-size-xl);">${escapeHtml(datosAlumno.nombre)}</h3>
                    <p style="color: var(--text-muted);">${escapeHtml(datosAlumno.email)}</p>
                    <p style="color: var(--text-muted); font-size: var(--font-size-sm);">Miembro desde: ${fechaRegistro}</p>
                </div>
            </div>
        </div>
        
        <!-- Tarjeta de progreso mejorada -->
        <div class="progress-card" style="margin-top: var(--spacing-4);">
            <h3 class="progress-title">📊 Mi Progreso</h3>
            <div class="progress-stats" style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-2);">
                <span>Progreso general</span>
                <span class="progress-value" style="font-weight: bold; color: var(--primary);">${progresoTotal}%</span>
            </div>
            <div class="progress-bar" style="background: var(--gray-200); border-radius: 10px; height: 12px; overflow: hidden;">
                <div class="progress-fill" style="width: ${progresoTotal}%; height: 100%; background: var(--primary); border-radius: 10px;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: var(--spacing-3);">
                <span>✅ Completadas: ${completadas}</span>
                <span>📚 Total: ${totalClases}</span>
                <span>⏳ Restantes: ${clasesRestantes}</span>
            </div>
        </div>
        
        <!-- Próxima clase destacada -->
        ${proximaClase ? `
        <div class="proxima-clase-card" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); border-radius: var(--border-radius-lg); padding: var(--spacing-4); margin-bottom: var(--spacing-4); color: white; cursor: pointer;" onclick="window.location.href='clase.html?id=${proximaClase.numero}'">
            <div class="proxima-clase-titulo" style="font-size: var(--font-size-sm); opacity: 0.9;">📅 Próxima clase pendiente</div>
            <div class="proxima-clase-nombre" style="font-weight: bold; font-size: var(--font-size-lg);">${escapeHtml(proximaClase.titulo)}</div>
            <div class="proxima-clase-fecha" style="font-size: var(--font-size-sm); opacity: 0.9;">${escapeHtml(nombreCapitulo)} ${nombreCapitulo ? '|' : ''} Clase ${proximaClase.numero}</div>
        </div>
        ` : '<div class="progress-card" style="margin-bottom: var(--spacing-4);"><p style="text-align: center;">🎉 ¡Felicidades! Has completado todas las clases.</p></div>'}
        
        <!-- Clases agendadas próximas -->
        <div class="progress-card" style="margin-top: var(--spacing-4);">
            <h3 class="progress-title">📅 Clases Agendadas</h3>
            ${clasesFuturas.length > 0 ? `
                <div class="alumnos-table-container" style="overflow-x: auto;">
                    <table class="alumnos-table" style="width: 100%;">
                        <thead>
                            <tr><th>Fecha</th><th>Hora</th><th>Estado</th></tr>
                        </thead>
                        <tbody>
                            ${clasesFuturas.map(c => `
                                <tr>
                                    <td>${formatearFecha(c.fecha)}</td>
                                    <td>${c.hora ? c.hora.substring(0,5) : '—'}</td>
                                    <td>${getEstadoClase(c)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p style="text-align: center; color: var(--text-muted);">No hay clases agendadas próximamente.</p>'}
        </div>
        
        <!-- Historial de clases -->
        ${clasesHistorial.length > 0 ? `
        <div class="progress-card" style="margin-top: var(--spacing-4);">
            <h3 class="progress-title">📋 Historial de Clases</h3>
            <div class="alumnos-table-container" style="overflow-x: auto;">
                <table class="alumnos-table" style="width: 100%;">
                    <thead>
                        <tr><th>Fecha</th><th>Hora</th><th>Estado</th></tr>
                    </thead>
                    <tbody>
                        ${clasesHistorial.map(c => `
                            <tr>
                                <td>${formatearFecha(c.fecha)}</td>
                                <td>${c.hora ? c.hora.substring(0,5) : '—'}</td>
                                <td>${getEstadoClase(c)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}
        
        <!-- Información de contacto -->
        <div class="progress-card" style="margin-top: var(--spacing-4);">
            <h3 class="progress-title">ℹ️ Información de Contacto</h3>
            <div style="margin-top: var(--spacing-4);">
                <div style="display: flex; justify-content: space-between; padding: var(--spacing-2) 0; border-bottom: 1px solid var(--border-color);">
                    <span style="color: var(--text-muted);">Teléfono:</span>
                    <span>${datosAlumno.telefono || 'No registrado'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: var(--spacing-2) 0;">
                    <span style="color: var(--text-muted);">Tipo de cuenta:</span>
                    <span style="font-weight: var(--font-weight-medium);">Alumno</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    document.getElementById('btnEditarPerfil')?.addEventListener('click', mostrarModalEditar);
}

function formatearFecha(fecha) {
    if (!fecha) return '—';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CL');
}

// ===== MODAL EDITAR PERFIL =====
function mostrarModalEditar() {
    const modalHtml = `
        <div class="modal-form">
            <h3>✏️ Editar Perfil</h3>
            <div class="form-group">
                <label>Nombre completo</label>
                <input type="text" id="modalNombre" class="form-input" value="${escapeHtml(datosAlumno.nombre)}">
            </div>
            <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" id="modalTelefono" class="form-input" value="${datosAlumno.telefono || ''}" placeholder="+56 9 1234 5678">
            </div>
            <div class="modal-buttons">
                <button id="modalCancelarBtn" class="btn-secondary">Cancelar</button>
                <button id="modalGuardarBtn" class="btn-primary">Guardar</button>
            </div>
        </div>
    `;
    
    const overlay = crearOverlay(modalHtml);
    document.body.appendChild(overlay);
    
    document.getElementById('modalCancelarBtn').onclick = () => overlay.remove();
    document.getElementById('modalGuardarBtn').onclick = async () => {
        const nombre = document.getElementById('modalNombre').value.trim();
        const telefono = document.getElementById('modalTelefono').value.trim();
        
        if (!nombre) {
            window.modal.mostrar('El nombre es requerido', 'warning');
            return;
        }
        
        const guardarBtn = document.getElementById('modalGuardarBtn');
        guardarBtn.disabled = true;
        guardarBtn.textContent = 'Guardando...';
        
        const supabase = window.supabaseClient;
        const { error } = await supabase
            .from('usuarios')
            .update({ nombre, telefono: telefono || null })
            .eq('id', datosAlumno.id);
        
        guardarBtn.disabled = false;
        guardarBtn.textContent = 'Guardar';
        
        if (error) {
            window.modal.mostrar(error.message, 'error');
        } else {
            datosAlumno.nombre = nombre;
            datosAlumno.telefono = telefono;
            
            const sesion = window.auth.getCurrentUser();
            sesion.nombre = nombre;
            localStorage.setItem('elara_sesion', JSON.stringify(sesion));
            
            window.modal.mostrar('Perfil actualizado', 'exito');
            overlay.remove();
            renderizarPerfil();
            window.navegacion.actualizarUsuario(nombre);
        }
    };
}

// ===== UTILIDADES =====
function getIniciales(nombre) {
    if (!nombre) return '?';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

function crearOverlay(contenidoHtml) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1200;';
    const modal = document.createElement('div');
    modal.style.cssText = 'background:var(--bg-card);border-radius:var(--border-radius-lg);max-width:500px;width:90%;padding:var(--spacing-6);';
    modal.innerHTML = contenidoHtml;
    overlay.appendChild(modal);

    window.elaraModals?.registrar(overlay, {
        cerrar: () => overlay.remove()
    });

    return overlay;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', initPerfil);