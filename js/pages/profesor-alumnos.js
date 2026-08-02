// profesor-alumnos.js - Gestión de alumnos (CRUD real con Supabase)

let profesorActual = null;
let todosLosAlumnos = [];
let filtroActual = '';

// ===== INICIALIZAR =====
async function initAlumnos() {
    if (!window.auth || !window.auth.requireAuth('profesor')) {
        return;
    }
    
    const sesion = window.auth.getCurrentUser();
    if (!sesion) {
        window.location.href = '../../index.html';
        return;
    }
    
    profesorActual = sesion;
    await window.navegacion.initNavegacion('profesor', 'alumnos', sesion.nombre);
    await cargarAlumnos();
}

// ===== CARGAR ALUMNOS DESDE SUPABASE =====
async function cargarAlumnos() {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('id, nombre, email, telefono, created_at')
            .eq('rol', 'alumno')
            .order('nombre');
        
        if (error) throw error;
        
        todosLosAlumnos = data || [];
        renderizarListaAlumnos();
        
    } catch (error) {
        console.error('Error cargando alumnos:', error);
        window.modal.mostrar('Error al cargar alumnos', 'error');
    }
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

// ===== RENDERIZAR LISTA =====
function renderizarListaAlumnos() {
    const container = document.getElementById('alumnos-container');
    if (!container) return;
    
    const alumnosFiltrados = filtroActual 
        ? todosLosAlumnos.filter(a => 
            a.nombre.toLowerCase().includes(filtroActual.toLowerCase()) ||
            a.email.toLowerCase().includes(filtroActual.toLowerCase())
          )
        : todosLosAlumnos;
    
    const html = `
        <div class="action-buttons">
            <button id="btnNuevoAlumno" class="btn-primary">+ Nuevo Alumno</button>
            <button id="btnExportarCSV" class="btn-outline">📎 Exportar CSV</button>
        </div>
        
        <div class="search-bar">
            <input type="text" id="searchInput" class="search-input" placeholder="Buscar por nombre o email..." value="${escapeHtml(filtroActual)}">
            <button id="btnBuscar" class="btn-secondary">🔍 Buscar</button>
            ${filtroActual ? '<button id="btnLimpiar" class="btn-outline">✖ Limpiar</button>' : ''}
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
                <tbody>
                    ${renderizarFilas(alumnosFiltrados)}
                </tbody>
            </table>
        </div>
        
        ${alumnosFiltrados.length === 0 ? `
        <div style="text-align: center; padding: var(--spacing-8); color: var(--text-muted);">
            <p>${filtroActual ? 'No se encontraron alumnos.' : 'No hay alumnos registrados.'}</p>
        </div>
        ` : ''}
    `;
    
    container.innerHTML = html;
    
    // Event listeners
    document.getElementById('btnNuevoAlumno')?.addEventListener('click', mostrarModalCrear);
    document.getElementById('btnExportarCSV')?.addEventListener('click', exportarCSV);
    document.getElementById('btnBuscar')?.addEventListener('click', () => {
        filtroActual = document.getElementById('searchInput').value;
        renderizarListaAlumnos();
    });
    document.getElementById('btnLimpiar')?.addEventListener('click', () => {
        filtroActual = '';
        renderizarListaAlumnos();
    });
    
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => editarAlumno(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', () => eliminarAlumno(btn.dataset.id, btn.dataset.nombre));
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

        document.querySelectorAll('.btn-notas').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const nombre = btn.getAttribute('data-nombre');
                obtenerComentariosProfesor(id, nombre);
            });
        });
}

function renderizarFilas(alumnos) {
    if (!alumnos.length) {
        return `<tr><td colspan="6" style="text-align: center;">No hay alumnos</td></tr>`;
    }
    
    return alumnos.map(a => `
        <tr>
            <td><strong>${escapeHtml(a.nombre)}</strong></td>
            <td>${escapeHtml(a.email)}</td>
            <td>${a.telefono || '—'}</td>
            <td>${window.utils?.formatearFecha(a.created_at) || '—'}</td>
            <td><span class="progreso-badge" data-id="${a.id}">cargando...</span></td>
            <td>
                <div class="table-actions">
                    <button class="action-btn notas btn-notas" data-id="${a.id}" data-nombre="${escapeHtml(a.nombre)}" title="Notas">📝</button>
                    <button class="action-btn edit btn-editar" data-id="${a.id}" data-nombre="${escapeHtml(a.nombre)}">✏️</button>
                    <button class="action-btn delete btn-eliminar" data-id="${a.id}" data-nombre="${escapeHtml(a.nombre)}">🗑️</button>
                    <button class="action-btn next-clase btn-next-clase" data-id="${a.id}" data-nombre="${escapeHtml(a.nombre)}" title="Siguiente clase">▶</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== CREAR ALUMNO =====
function mostrarModalCrear() {
    const modalHtml = `
        <div class="modal-form">
            <h3>➕ Nuevo Alumno</h3>
            <div class="form-group">
                <label>Nombre completo *</label>
                <input type="text" id="modalNombre" class="form-input" placeholder="Ej: Juan Pérez">
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" id="modalEmail" class="form-input" placeholder="juan@ejemplo.com">
            </div>
            <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" id="modalTelefono" class="form-input" placeholder="+56 9 1234 5678">
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
        const email = document.getElementById('modalEmail').value.trim();
        const telefono = document.getElementById('modalTelefono').value.trim();
        
        if (!nombre || !email) {
            window.modal.mostrar('Nombre y email son requeridos', 'warning');
            return;
        }
        
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) return;
        
        const guardarBtn = document.getElementById('modalGuardarBtn');
        guardarBtn.disabled = true;
        guardarBtn.textContent = 'Guardando...';
        
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: 'alumno123'
        });
        
        if (authError) {
            guardarBtn.disabled = false;
            guardarBtn.textContent = 'Guardar';
            window.modal.mostrar('Error creando usuario: ' + authError.message, 'error');
            return;
        }
        
        const { data, error } = await supabaseClient
            .from('usuarios')
            .insert([{
                id: authData.user.id,
                nombre: nombre,
                email: email,
                telefono: telefono || null,
                rol: 'alumno',
                created_at: new Date()
            }])
            .select();
        
        guardarBtn.disabled = false;
        guardarBtn.textContent = 'Guardar';
        
        if (error) {
            window.modal.mostrar(error.message, 'error');
        } else {
            window.modal.mostrar(`Alumno creado. Contraseña: alumno123`, 'exito', 3000);
            overlay.remove();
            await cargarAlumnos();
        }
    };
}

// ===== EDITAR ALUMNO =====
async function editarAlumno(id) {
    const alumno = todosLosAlumnos.find(a => a.id === id);
    if (!alumno) return;
    
    const modalHtml = `
        <div class="modal-form">
            <h3>✏️ Editar Alumno</h3>
            <div class="form-group">
                <label>Nombre *</label>
                <input type="text" id="modalNombre" class="form-input" value="${escapeHtml(alumno.nombre)}">
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" id="modalEmail" class="form-input" value="${escapeHtml(alumno.email)}">
            </div>
            <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" id="modalTelefono" class="form-input" value="${alumno.telefono || ''}">
            </div>
            <div class="modal-buttons">
                <button id="modalCancelarBtn" class="btn-secondary">Cancelar</button>
                <button id="modalGuardarBtn" class="btn-primary">Actualizar</button>
            </div>
        </div>
    `;
    
    const overlay = crearOverlay(modalHtml);
    document.body.appendChild(overlay);
    
    document.getElementById('modalCancelarBtn').onclick = () => overlay.remove();
    document.getElementById('modalGuardarBtn').onclick = async () => {
        const nombre = document.getElementById('modalNombre').value.trim();
        const email = document.getElementById('modalEmail').value.trim();
        const telefono = document.getElementById('modalTelefono').value.trim();
        
        if (!nombre || !email) {
            window.modal.mostrar('Nombre y email son requeridos', 'warning');
            return;
        }
        
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) return;
        
        const guardarBtn = document.getElementById('modalGuardarBtn');
        guardarBtn.disabled = true;
        guardarBtn.textContent = 'Actualizando...';
        
        const { error } = await supabaseClient
            .from('usuarios')
            .update({ nombre, email, telefono: telefono || null })
            .eq('id', id);
        
        guardarBtn.disabled = false;
        guardarBtn.textContent = 'Actualizar';
        
        if (error) {
            window.modal.mostrar(error.message, 'error');
        } else {
            window.modal.mostrar('Alumno actualizado', 'exito');
            overlay.remove();
            await cargarAlumnos();
        }
    };
}

// ===== ELIMINAR ALUMNO =====
function eliminarAlumno(id, nombre) {
    window.modal.confirmar(`¿Eliminar a "${nombre}"?`, async () => {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) return;
        
        const { error } = await supabaseClient
            .from('usuarios')
            .delete()
            .eq('id', id);
        
        if (error) {
            window.modal.mostrar(error.message, 'error');
        } else {
            window.modal.mostrar('Alumno eliminado', 'exito');
            await cargarAlumnos();
        }
    });
}

// ===== EXPORTAR CSV =====
function exportarCSV() {
    if (todosLosAlumnos.length === 0) {
        window.modal.mostrar('No hay alumnos para exportar', 'warning');
        return;
    }
    
    const columnas = ['ID', 'Nombre', 'Email', 'Teléfono', 'Fecha Registro'];
    const filas = todosLosAlumnos.map(a => [
        a.id,
        a.nombre,
        a.email,
        a.telefono || '',
        new Date(a.created_at).toLocaleDateString('es-CL')
    ]);
    
    const csv = [columnas.join(','), ...filas.map(f => f.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `alumnos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    window.modal.mostrar('Exportación completada', 'exito');
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
            if (!completadas.has(i)) {
                siguienteClaseNumero = i;
                break;
            }
        }
    
    if (siguienteClaseNumero) {
        window.location.href = `clase-preview.html?id=${siguienteClaseNumero}&alumnoId=${alumnoId}&alumnoNombre=${encodeURIComponent(alumnoNombre)}`;
    } else {
        window.modal.mostrar(`🎉 ¡${alumnoNombre} ha completado todas las clases!`, 'exito');
    }
}

// ===== UTILIDADES =====
function crearOverlay(contenidoHtml) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000;';
    const modal = document.createElement('div');
    modal.style.cssText = 'background:var(--bg-card);border-radius:var(--border-radius-lg);max-width:600px;width:90%;max-height:80vh;overflow-y:auto;padding:var(--spacing-6);';
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

// ===== OBTENER COMENTARIOS DEL PROFESOR =====
async function obtenerComentariosProfesor(alumnoId, alumnoNombre) {
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    const { data: comentarios, error } = await supabase
        .from('comentarios_profesor')
        .select('*')
        .eq('alumno_id', alumnoId)
        .order('clase_id', { ascending: true });
    
    if (error) {
        window.modal.mostrar('Error al cargar comentarios', 'error');
        return;
    }
    
    const response = await fetch('../../data/clases-alumno.json');
    const todasClases = await response.json();
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0;">📝 Notas sobre ${escapeHtml(alumnoNombre)}</h3>
            <button id="modalCerrarNotas" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>
    `;
    
    if (!comentarios || comentarios.length === 0) {
        html += `<p style="text-align: center; padding: 20px;">No hay notas registradas para este alumno.</p>`;
    } else {
        html += `<div style="max-height: 400px; overflow-y: auto;">`;
        for (const coment of comentarios) {
            const clase = todasClases[coment.clase_id];
            const tituloClase = clase ? `Clase ${clase.numero}: ${clase.titulo}` : coment.clase_id;
            html += `
                <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-body); color: var(--text-primary); border-radius: 8px; border-left: 3px solid var(--primary);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong>${escapeHtml(tituloClase)}</strong>
                    </div>
                    <p style="margin: 0 0 8px 0; white-space: pre-wrap;">${escapeHtml(coment.comentario)}</p>
                    <small style="color: var(--text-muted);">📅 ${new Date(coment.created_at).toLocaleDateString('es-CL')}</small>
                </div>
            `;
        }
        html += `</div>`;
    }
    
    const overlay = crearOverlay(html);
    document.body.appendChild(overlay);
    
    document.getElementById('modalCerrarNotas')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

document.addEventListener('DOMContentLoaded', initAlumnos);