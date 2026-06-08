// profesor-calendario.js - Página de calendario del profesor

let fechaActual = new Date();
let eventosGlobales = [];
let alumnosLista = [];

// ===== INICIALIZAR =====
async function initCalendarioPage() {
    if (!window.auth || !window.auth.requireAuth('profesor')) return;
    
    const sesion = window.auth.getCurrentUser();
    if (!sesion) {
        window.location.href = '../../index.html';
        return;
    }
    
    await window.navegacion.initNavegacion('profesor', 'calendario', sesion.nombre);
    await cargarAlumnos();
    await cargarEventos();
    renderizarCalendario();
}

// ===== CARGAR ALUMNOS =====
async function cargarAlumnos() {
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('rol', 'alumno')
        .order('nombre');
    
    if (!error && data) alumnosLista = data;
}

// ===== CARGAR EVENTOS =====
// ===== CARGAR EVENTOS =====
async function cargarEventos() {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1;
    
    if (window.calendario) {
        const result = await window.calendario.obtenerPorMes(año, mes);
        if (result.success) {
            // Ordenar eventos por fecha y hora
            eventosGlobales = result.eventos.sort((a, b) => {
                if (a.fecha === b.fecha) {
                    return (a.hora || '00:00').localeCompare(b.hora || '00:00');
                }
                return a.fecha.localeCompare(b.fecha);
            });
        }
    }
}

// ===== RENDERIZAR =====
function renderizarCalendario() {
    const container = document.getElementById('calendario-container');
    if (!container) return;
    
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const mesActual = mes + 1;
    
    const diasCalendario = window.calendario 
        ? window.calendario.generar(año, mesActual, eventosGlobales)
        : [];
    
    const nombreMes = window.calendario?.MESES[mes] || '';
    
    const html = `
        <div class="calendario-header">
            <h1 class="calendario-titulo">📅 Calendario de Clases</h1>
            <div class="calendario-controles">
                <button id="btnMesAnterior" class="btn-secondary">◀</button>
                <span style="font-weight: var(--font-weight-semibold); min-width: 150px; text-align: center;">${nombreMes} ${año}</span>
                <button id="btnMesSiguiente" class="btn-secondary">▶</button>
                <button id="btnHoy" class="btn-outline">Hoy</button>
                <button id="btnNuevoEvento" class="btn-primary">Agendar Clase</button>
            </div>
        </div>
        
        <div class="calendario-grid">
            <div class="calendario-semana">
                ${window.calendario?.DIAS.map(dia => `<div class="calendario-dia-nombre">${dia}</div>`).join('')}
            </div>
            <div class="calendario-dias">
                ${diasCalendario.map(dia => renderizarDia(dia)).join('')}
            </div>
        </div>
        
        <div class="eventos-lista">
            <div class="eventos-lista-titulo">📋 Próximas Clases</div>
            <div class="eventos-lista-items" id="eventosLista">
                ${renderizarListaEventos()}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    document.getElementById('btnMesAnterior')?.addEventListener('click', () => {
        fechaActual.setMonth(fechaActual.getMonth() - 1);
        actualizarCalendario();
    });
    
    document.getElementById('btnMesSiguiente')?.addEventListener('click', () => {
        fechaActual.setMonth(fechaActual.getMonth() + 1);
        actualizarCalendario();
    });
    
    document.getElementById('btnHoy')?.addEventListener('click', () => {
        fechaActual = new Date();
        actualizarCalendario();
    });
    
    document.getElementById('btnNuevoEvento')?.addEventListener('click', mostrarModalCrearEvento);
}

function renderizarDia(dia) {
    const esHoy = new Date().toISOString().split('T')[0] === dia.fechaStr;
    const claseHoy = esHoy ? 'calendario-dia hoy' : 'calendario-dia';
    const claseMes = dia.esMesActual ? '' : 'otro-mes';
    
    let eventosHtml = '';
    if (dia.eventos && dia.eventos.length > 0) {
        eventosHtml = dia.eventos.map(evento => `
            <div class="evento" onclick="verDetalleEvento(${evento.id})">
                <div class="evento-titulo">${escapeHtml(evento.titulo)}</div>
                ${evento.hora ? `<div class="evento-hora">${evento.hora.substring(0, 5)}</div>` : ''}
            </div>
        `).join('');
    }
    
    return `
        <div class="${claseMes} ${claseHoy}" data-fecha="${dia.fechaStr}">
            <div class="calendario-dia-numero">${dia.numero || ''}</div>
            ${eventosHtml}
        </div>
    `;
}

function renderizarListaEventos() {
    const eventosFuturos = eventosGlobales
        .filter(e => new Date(e.fecha) >= new Date())
        .sort((a, b) => {
            if (a.fecha === b.fecha) {
                return (a.hora || '00:00').localeCompare(b.hora || '00:00');
            }
            return a.fecha.localeCompare(b.fecha);
        })
        .slice(0, 10);
    
    if (eventosFuturos.length === 0) {
        return '<div style="text-align: center; padding: var(--spacing-6); color: var(--text-muted);">No hay clases programadas</div>';
    }
    
    return eventosFuturos.map(evento => `
        <div class="evento-item">
            <div class="evento-info">
                <div class="evento-nombre">${escapeHtml(evento.titulo)}</div>
                <div class="evento-fecha">${window.calendario?.formatearFecha(evento.fecha) || evento.fecha} ${evento.hora ? `- ${evento.hora.substring(0, 5)}` : ''}</div>
            </div>
            <div class="evento-actions">
                <button class="action-btn edit" onclick="editarEvento(${evento.id})">✏️</button>
                <button class="action-btn delete" onclick="eliminarEvento(${evento.id}, '${escapeHtml(evento.titulo)}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ===== MODAL CREAR EVENTO (simplificado) =====
function mostrarModalCrearEvento() {
    const hoy = new Date();
    const fechaDefault = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    
    const modalHtml = `
        <div class="modal-form">
            <h3>📅 Agendar Clase</h3>
            <div class="form-group">
                <label>Alumno *</label>
                <select id="modalAlumnoId" class="form-select" required>
                    <option value="">Seleccionar alumno</option>
                    ${alumnosLista.map(a => `<option value="${a.id}">${escapeHtml(a.nombre)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Fecha *</label>
                <input type="date" id="modalFecha" class="form-input" value="${fechaDefault}">
            </div>
            <div class="form-group">
                <label>Hora *</label>
                <input type="time" id="modalHora" class="form-input" value="16:00">
            </div>
            <div class="form-group">
                <label>Descripción (opcional)</label>
                <textarea id="modalDescripcion" class="form-textarea" rows="2" placeholder="Notas adicionales..."></textarea>
            </div>
            <div class="modal-buttons">
                <button id="modalCancelarBtn" class="btn-secondary">Cancelar</button>
                <button id="modalGuardarBtn" class="btn-primary">Agendar Clase</button>
            </div>
        </div>
    `;
    
    const overlay = crearOverlay(modalHtml);
    document.body.appendChild(overlay);
    
    document.getElementById('modalCancelarBtn').onclick = () => overlay.remove();
    document.getElementById('modalGuardarBtn').onclick = async () => {
        const alumnoId = document.getElementById('modalAlumnoId').value;
        const fecha = document.getElementById('modalFecha').value;
        const hora = document.getElementById('modalHora').value;
        const descripcion = document.getElementById('modalDescripcion').value;
        
        if (!alumnoId || !fecha || !hora) {
            window.modal.mostrar('Completa todos los campos requeridos', 'warning');
            return;
        }
        
        const alumno = alumnosLista.find(a => a.id == alumnoId);
        const titulo = `Clase con ${alumno.nombre}`;
        
        const guardarBtn = document.getElementById('modalGuardarBtn');
        guardarBtn.disabled = true;
        guardarBtn.textContent = 'Agendando...';
        
        const result = await window.calendario.crear({
            titulo: titulo,
            fecha: fecha,
            hora: hora,
            usuario_id: alumnoId,
            descripcion: descripcion
        });
        
        guardarBtn.disabled = false;
        guardarBtn.textContent = 'Agendar Clase';
        
        if (result.success) {
            window.modal.mostrar('Clase agendada', 'exito');
            overlay.remove();
            await actualizarCalendario();
        } else {
            window.modal.mostrar(result.error || 'Error al agendar', 'error');
        }
    };
}

// ===== ACTUALIZAR CALENDARIO =====
async function actualizarCalendario() {
    await cargarEventos();
    renderizarCalendario();
}

// ===== FUNCIONES GLOBALES PARA EVENTOS =====
window.verDetalleEvento = async (id) => {
    const evento = eventosGlobales.find(e => e.id === id);
    if (!evento) return;
    
    const alumno = alumnosLista.find(a => a.id == evento.usuario_id);
    
    // Formatear fecha
    const fechaObj = new Date(evento.fecha);
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const diaSemana = diasSemana[fechaObj.getDay()];
    const diaNumero = fechaObj.getDate();
    const mes = meses[fechaObj.getMonth()];
    const año = fechaObj.getFullYear();
    const fechaFormateada = `${diaSemana} ${diaNumero} de ${mes} de ${año}`;
    
    const mensaje = `${evento.titulo}\n📅 ${fechaFormateada}\n🕐 ${evento.hora?.substring(0,5) || 'No especificada'}\n👤 ${alumno?.nombre || 'Alumno no encontrado'}\n📝 ${evento.descripcion || 'Sin descripción'}`;
    
    // PRIMER MODAL: Ver detalles
    const overlay1 = document.createElement('div');
    overlay1.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1200;';
    
    const modal1 = document.createElement('div');
    modal1.style.cssText = 'background:var(--bg-card);border-radius:var(--border-radius-lg);max-width:500px;width:90%;padding:var(--spacing-6);';
    modal1.innerHTML = `
        <h3 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-4);">Clase agendada</h3>
        <p style="white-space: pre-line; margin-bottom: var(--spacing-6);">${mensaje}</p>
        <div style="display: flex; gap: var(--spacing-3); justify-content: flex-end;">
            <button id="modalCancelarBtn" class="btn-secondary">Cancelar</button>
            <button id="modalEliminarBtn" style="background: var(--error); color: white; border: none; padding: var(--spacing-2) var(--spacing-4); border-radius: var(--border-radius-md); cursor: pointer;">Eliminar</button>
        </div>
    `;
    
    overlay1.appendChild(modal1);
    document.body.appendChild(overlay1);
    
    document.getElementById('modalCancelarBtn').onclick = () => overlay1.remove();
    
    document.getElementById('modalEliminarBtn').onclick = () => {
        overlay1.remove();
        
        // SEGUNDO MODAL: Confirmar eliminación
        const overlay2 = document.createElement('div');
        overlay2.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1200;';
        
        const modal2 = document.createElement('div');
        modal2.style.cssText = 'background:var(--bg-card);border-radius:var(--border-radius-lg);max-width:500px;width:90%;padding:var(--spacing-6);';
        modal2.innerHTML = `
            <h3 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-4);">Confirmar eliminación</h3>
            <p style="margin-bottom: var(--spacing-6);">¿Seguro que deseas eliminar esta clase agendada?</p>
            <div style="display: flex; gap: var(--spacing-3); justify-content: flex-end;">
                <button id="modalConfirmarCancelarBtn" class="btn-secondary">Cancelar</button>
                <button id="modalConfirmarEliminarBtn" style="background: var(--error); color: white; border: none; padding: var(--spacing-2) var(--spacing-4); border-radius: var(--border-radius-md); cursor: pointer;">Sí, eliminar</button>
            </div>
        `;
        
        overlay2.appendChild(modal2);
        document.body.appendChild(overlay2);
        
        document.getElementById('modalConfirmarCancelarBtn').onclick = () => overlay2.remove();
        
        document.getElementById('modalConfirmarEliminarBtn').onclick = async () => {
            overlay2.remove();
            const result = await window.calendario.eliminar(id);
            if (result.success) {
                window.modal.mostrar('Clase eliminada', 'exito');
                await actualizarCalendario();
            } else {
                window.modal.mostrar(result.error || 'Error al eliminar', 'error');
            }
        };
    };
};

window.editarEvento = async (id) => {
    const evento = eventosGlobales.find(e => e.id === id);
    if (!evento) return;
    
    const modalHtml = `
        <div class="modal-form">
            <h3>✏️ Editar Clase</h3>
            <div class="form-group">
                <label>Fecha *</label>
                <input type="date" id="modalFecha" class="form-input" value="${evento.fecha}">
            </div>
            <div class="form-group">
                <label>Hora *</label>
                <input type="time" id="modalHora" class="form-input" value="${evento.hora || '16:00'}">
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea id="modalDescripcion" class="form-textarea" rows="2">${escapeHtml(evento.descripcion || '')}</textarea>
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
        const fecha = document.getElementById('modalFecha').value;
        const hora = document.getElementById('modalHora').value;
        const descripcion = document.getElementById('modalDescripcion').value;
        
        const guardarBtn = document.getElementById('modalGuardarBtn');
        guardarBtn.disabled = true;
        guardarBtn.textContent = 'Actualizando...';
        
        const result = await window.calendario.actualizar(id, { fecha, hora, descripcion });
        
        guardarBtn.disabled = false;
        guardarBtn.textContent = 'Actualizar';
        
        if (result.success) {
            window.modal.mostrar('Clase actualizada', 'exito');
            overlay.remove();
            await actualizarCalendario();
        } else {
            window.modal.mostrar(result.error || 'Error al actualizar', 'error');
        }
    };
};

window.eliminarEvento = (id, titulo) => {
    window.modal.confirmar(`¿Eliminar "${titulo}"?`, async () => {
        const result = await window.calendario.eliminar(id);
        if (result.success) {
            window.modal.mostrar('Clase eliminada', 'exito');
            await actualizarCalendario();
        } else {
            window.modal.mostrar(result.error || 'Error al eliminar', 'error');
        }
    });
};

// ===== UTILIDADES =====
function crearOverlay(contenidoHtml) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000;';
    const modal = document.createElement('div');
    modal.style.cssText = 'background:var(--bg-card);border-radius:var(--border-radius-lg);max-width:500px;width:90%;padding:var(--spacing-6);';
    modal.innerHTML = contenidoHtml;
    overlay.appendChild(modal);
    return overlay;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', initCalendarioPage);