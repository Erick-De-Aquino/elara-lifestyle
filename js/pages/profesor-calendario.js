// profesor-calendario.js - Página de calendario del profesor

let fechaActual = new Date();
let eventosGlobales = [];
let eventosHoyGlobales = [];
let alumnosLista = [];
let clasesLista = [];
let vistaCalendario = 'mes';

// ===== INICIALIZAR =====
async function initCalendarioPage() {
    if (!window.auth || !window.auth.requireAuth('profesor')) return;

    const sesion = window.auth.getCurrentUser();
    if (!sesion) {
        window.location.href = '../../index.html';
        return;
    }

    await window.navegacion.initNavegacion('profesor', 'calendario', sesion.nombre);
    await Promise.all([cargarAlumnos(), cargarClases()]);
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


// ===== CARGAR CLASES DEL CURSO =====
async function cargarClases() {
    try {
        const response = await fetch('../../data/clases.json');
        if (!response.ok) throw new Error('No se pudo cargar el catálogo de clases');

        const data = await response.json();
        clasesLista = Object.values(data)
            .map(clase => ({
                numero: Number(clase.numero),
                titulo: clase.titulo || `Clase ${clase.numero}`
            }))
            .filter(clase => Number.isInteger(clase.numero))
            .sort((a, b) => a.numero - b.numero);
    } catch (error) {
        console.error('Error cargando clases:', error);
        clasesLista = Array.from({ length: 14 }, (_, indice) => ({
            numero: indice + 1,
            titulo: `Clase ${indice + 1}`
        }));
    }
}

function obtenerClasePorNumero(numero) {
    return clasesLista.find(clase => clase.numero === Number(numero));
}

function obtenerEtiquetaClase(numero) {
    const clase = obtenerClasePorNumero(numero);
    return clase ? `Clase ${clase.numero} · ${clase.titulo}` : 'Clase sin asignar';
}

function renderizarOpcionesClases(seleccionada = '') {
    return `
        <option value="">Seleccionar clase</option>
        ${clasesLista.map(clase => `
            <option value="${clase.numero}" ${Number(seleccionada) === clase.numero ? 'selected' : ''}>
                Clase ${clase.numero} · ${escapeHtml(clase.titulo)}
            </option>
        `).join('')}
    `;
}

async function sugerirPrimeraClasePendiente(alumnoId, selectClase) {
    if (!alumnoId || !selectClase) {
        if (selectClase) selectClase.value = '';
        return;
    }

    selectClase.disabled = true;
    const opcionOriginal = selectClase.innerHTML;
    selectClase.innerHTML = '<option value="">Consultando avance...</option>';

    try {
        const supabase = window.supabaseClient;
        const { data, error } = await supabase
            .from('progreso')
            .select('clase_id, completada')
            .eq('usuario_id', alumnoId)
            .eq('completada', true);

        if (error) throw error;

        const completadas = new Set((data || []).map(item => Number(item.clase_id)));
        const primeraPendiente = clasesLista.find(clase => !completadas.has(clase.numero));

        selectClase.innerHTML = opcionOriginal;
        selectClase.value = primeraPendiente ? String(primeraPendiente.numero) : '';

        const ayuda = document.getElementById('modalClaseAyuda');
        if (ayuda) {
            ayuda.textContent = primeraPendiente
                ? `Sugerida automáticamente según el avance: clase ${primeraPendiente.numero}. Puedes cambiarla manualmente.`
                : 'El alumno tiene las 14 clases completadas. Puedes seleccionar una clase manualmente si necesitas repetirla.';
        }
    } catch (error) {
        console.error('Error consultando avance del alumno:', error);
        selectClase.innerHTML = opcionOriginal;
        const ayuda = document.getElementById('modalClaseAyuda');
        if (ayuda) ayuda.textContent = 'No se pudo consultar el avance. Selecciona la clase manualmente.';
    } finally {
        selectClase.disabled = false;
    }
}

// ===== FECHAS =====
function formatearFechaISO(fecha) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function crearFechaLocal(fechaISO, hora = '00:00') {
    if (!fechaISO) return null;
    const [año, mes, dia] = fechaISO.split('-').map(Number);
    const [horas, minutos] = String(hora || '00:00').substring(0, 5).split(':').map(Number);
    return new Date(año, mes - 1, dia, horas || 0, minutos || 0, 0, 0);
}

function obtenerInicioSemana(fecha) {
    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    inicio.setDate(inicio.getDate() - 3);
    return inicio;
}

function obtenerFinSemana(fecha) {
    const fin = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    fin.setDate(fin.getDate() + 3);
    return fin;
}

function obtenerEventosDia(fechaISO) {
    return eventosGlobales
        .filter(evento => evento.fecha === fechaISO)
        .sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));
}

function obtenerNombreAlumno(evento) {
    const alumno = alumnosLista.find(item => String(item.id) === String(evento.usuario_id));
    if (alumno?.nombre) return alumno.nombre;
    return String(evento.titulo || '').replace(/^Clase con\s+/i, '') || 'Alumno';
}

// ===== CARGAR EVENTOS =====
async function cargarEventos() {
    if (!window.calendario) return;

    let result;
    if (vistaCalendario === 'semana') {
        const inicio = obtenerInicioSemana(fechaActual);
        const fin = obtenerFinSemana(fechaActual);
        result = await window.calendario.obtener(formatearFechaISO(inicio), formatearFechaISO(fin));
        eventosHoyGlobales = [];
    } else {
        const hoyISO = formatearFechaISO(new Date());
        const [resultadoMes, resultadoHoy] = await Promise.all([
            window.calendario.obtenerPorMes(fechaActual.getFullYear(), fechaActual.getMonth() + 1),
            window.calendario.obtener(hoyISO, hoyISO)
        ]);

        result = resultadoMes;
        eventosHoyGlobales = resultadoHoy?.success
            ? ordenarEventos(resultadoHoy.eventos || [])
            : [];
    }

    if (result?.success) {
        eventosGlobales = ordenarEventos(result.eventos || []);
    }
}

function ordenarEventos(eventos) {
    return [...eventos].sort((a, b) => {
        if (a.fecha === b.fecha) {
            return (a.hora || '00:00').localeCompare(b.hora || '00:00');
        }
        return a.fecha.localeCompare(b.fecha);
    });
}

// ===== RENDERIZAR =====
function renderizarCalendario() {
    const container = document.getElementById('calendario-container');
    if (!container) return;

    const esVistaMes = vistaCalendario === 'mes';
    const etiquetaPeriodo = esVistaMes ? obtenerEtiquetaMes() : obtenerEtiquetaSemana();

    container.innerHTML = `
        <div class="calendario-header">
            <h1 class="calendario-titulo">📅 Calendario de Clases</h1>
            <div class="calendario-controles">
                <button id="btnPeriodoAnterior" class="btn-secondary" aria-label="Periodo anterior">◀</button>
                <span class="calendario-periodo">${etiquetaPeriodo}</span>
                <button id="btnPeriodoSiguiente" class="btn-secondary" aria-label="Periodo siguiente">▶</button>
                <button id="btnCambiarVista" class="btn-outline">${esVistaMes ? 'Semana' : 'Mes'}</button>
                <button id="btnNuevoEvento" class="btn-primary">Agendar Clase</button>
            </div>
        </div>

        ${esVistaMes ? renderizarVistaMensual() : renderizarVistaSemanal()}
    `;

    document.getElementById('btnPeriodoAnterior')?.addEventListener('click', async () => {
        if (vistaCalendario === 'mes') {
            fechaActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
        } else {
            fechaActual.setDate(fechaActual.getDate() - 7);
        }
        await actualizarCalendario();
    });

    document.getElementById('btnPeriodoSiguiente')?.addEventListener('click', async () => {
        if (vistaCalendario === 'mes') {
            fechaActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1);
        } else {
            fechaActual.setDate(fechaActual.getDate() + 7);
        }
        await actualizarCalendario();
    });

    document.getElementById('btnCambiarVista')?.addEventListener('click', async () => {
        const cambiarASemana = vistaCalendario === 'mes';
        vistaCalendario = cambiarASemana ? 'semana' : 'mes';

        if (cambiarASemana) {
            fechaActual = new Date();
        }

        await actualizarCalendario();
    });

    document.getElementById('btnNuevoEvento')?.addEventListener('click', mostrarModalCrearEvento);

    document.querySelectorAll('[data-calendario-fecha]').forEach(elemento => {
        elemento.addEventListener('click', () => {
            const fecha = elemento.dataset.calendarioFecha;
            if (fecha) mostrarModalClasesDia(fecha);
        });
    });

    document.querySelectorAll('[data-evento-id]').forEach(elemento => {
        elemento.addEventListener('click', event => {
            event.stopPropagation();
            const id = Number(elemento.dataset.eventoId);
            if (Number.isFinite(id)) window.verDetalleEvento(id);
        });
    });
}

function obtenerEtiquetaMes() {
    const nombreMes = window.calendario?.MESES[fechaActual.getMonth()] || '';
    return `${nombreMes} ${fechaActual.getFullYear()}`;
}

function obtenerEtiquetaSemana() {
    const inicio = obtenerInicioSemana(fechaActual);
    const fin = obtenerFinSemana(fechaActual);
    const meses = window.calendario?.MESES || [];

    if (inicio.getFullYear() === fin.getFullYear() && inicio.getMonth() === fin.getMonth()) {
        return `${inicio.getDate()} – ${fin.getDate()} de ${(meses[inicio.getMonth()] || '').toLowerCase()} de ${inicio.getFullYear()}`;
    }

    if (inicio.getFullYear() === fin.getFullYear()) {
        return `${inicio.getDate()} de ${(meses[inicio.getMonth()] || '').toLowerCase()} – ${fin.getDate()} de ${(meses[fin.getMonth()] || '').toLowerCase()} de ${fin.getFullYear()}`;
    }

    return `${inicio.getDate()} ${(meses[inicio.getMonth()] || '').substring(0, 3)} ${inicio.getFullYear()} – ${fin.getDate()} ${(meses[fin.getMonth()] || '').substring(0, 3)} ${fin.getFullYear()}`;
}

function renderizarVistaMensual() {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1;
    const diasCalendario = window.calendario ? window.calendario.generar(año, mes, eventosGlobales) : [];

    return `
        <div class="calendario-mensual-layout">
            <div class="calendario-grid calendario-grid-mes">
                <div class="calendario-semana">
                    ${(window.calendario?.DIAS || []).map(dia => `<div class="calendario-dia-nombre">${dia}</div>`).join('')}
                </div>
                <div class="calendario-dias">
                    ${diasCalendario.map(dia => renderizarDiaMensual(dia)).join('')}
                </div>
            </div>
            ${renderizarAgendaHoy()}
        </div>
    `;
}

function renderizarAgendaHoy() {
    const hoy = new Date();
    const hoyISO = formatearFechaISO(hoy);
    const clasesHoy = eventosHoyGlobales
        .filter(evento => evento.fecha === hoyISO)
        .sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));
    const etiquetaHoy = hoy.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return `
        <aside class="agenda-hoy-card" aria-label="Clases de hoy">
            <div class="agenda-hoy-header">
                <span class="agenda-hoy-eyebrow">Hoy</span>
                <strong>${escapeHtml(etiquetaHoy.charAt(0).toUpperCase() + etiquetaHoy.slice(1))}</strong>
                <span class="agenda-hoy-count">${clasesHoy.length}</span>
            </div>
            <div class="agenda-hoy-lista">
                ${clasesHoy.length ? clasesHoy.map(evento => `
                    <button type="button" class="semana-evento agenda-hoy-evento" data-evento-id="${evento.id}">
                        <span class="semana-evento-hora">${evento.hora ? evento.hora.substring(0, 5) : 'Sin hora'}</span>
                        <span class="semana-evento-alumno">${escapeHtml(obtenerNombreAlumno(evento))}</span>
                        <span class="semana-evento-clase">${escapeHtml(obtenerEtiquetaClase(evento.clase_id))}</span>
                    </button>
                `).join('') : '<p class="agenda-hoy-vacia">No hay clases agendadas para hoy.</p>'}
            </div>
        </aside>
    `;
}

function renderizarDiaMensual(dia) {
    const hoyISO = formatearFechaISO(new Date());
    const clases = dia.esMesActual ? obtenerEventosDia(dia.fechaStr) : [];
    const clasesCss = [
        'calendario-dia',
        dia.esMesActual ? '' : 'otro-mes',
        hoyISO === dia.fechaStr ? 'hoy' : '',
        clases.length ? 'tiene-eventos' : ''
    ].filter(Boolean).join(' ');

    const puntosVisibles = clases.slice(0, 3);
    const restantes = clases.length - puntosVisibles.length;

    return `
        <button type="button" class="${clasesCss}" data-calendario-fecha="${dia.fechaStr}" ${dia.esMesActual ? '' : 'disabled'}>
            <span class="calendario-dia-numero">${dia.numero || ''}</span>
            ${clases.length ? `
                <span class="calendario-puntos" aria-label="${clases.length} clase${clases.length === 1 ? '' : 's'}">
                    ${puntosVisibles.map(() => '<span class="calendario-punto"></span>').join('')}
                    ${restantes > 0 ? `<span class="calendario-mas">+${restantes}</span>` : ''}
                </span>
            ` : ''}
        </button>
    `;
}

function renderizarVistaSemanal() {
    const inicio = obtenerInicioSemana(fechaActual);
    const dias = Array.from({ length: 7 }, (_, indice) => {
        const fecha = new Date(inicio);
        fecha.setDate(inicio.getDate() + indice);
        return fecha;
    });

    return `
        <div class="calendario-semanal">
            ${dias.map(fecha => renderizarDiaSemanal(fecha)).join('')}
        </div>
    `;
}

function renderizarDiaSemanal(fecha) {
    const fechaISO = formatearFechaISO(fecha);
    const clases = obtenerEventosDia(fechaISO);
    const esHoy = fechaISO === formatearFechaISO(new Date());
    const indiceDia = fecha.getDay() === 0 ? 6 : fecha.getDay() - 1;
    const nombreDia = window.calendario?.DIAS?.[indiceDia] || '';

    return `
        <section class="semana-dia ${esHoy ? 'hoy' : ''}">
            <button type="button" class="semana-dia-header" data-calendario-fecha="${fechaISO}">
                <span>${nombreDia}</span>
                <strong>${fecha.getDate()}</strong>
            </button>
            <div class="semana-dia-eventos">
                ${clases.length ? clases.map(evento => `
                    <button type="button" class="semana-evento" data-evento-id="${evento.id}">
                        <span class="semana-evento-hora">${evento.hora ? evento.hora.substring(0, 5) : 'Sin hora'}</span>
                        <span class="semana-evento-alumno">${escapeHtml(obtenerNombreAlumno(evento))}</span>
                        <span class="semana-evento-clase">${escapeHtml(obtenerEtiquetaClase(evento.clase_id))}</span>
                    </button>
                `).join('') : '<p class="semana-sin-eventos">Sin clases</p>'}
            </div>
        </section>
    `;
}

function mostrarModalClasesDia(fechaISO) {
    const clases = obtenerEventosDia(fechaISO);
    const fecha = crearFechaLocal(fechaISO);
    const etiqueta = fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const contenido = `
        <div class="modal-dia">
            <div class="modal-dia-header">
                <h3>📅 ${escapeHtml(etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1))}</h3>
                <button type="button" class="modal-dia-cerrar" aria-label="Cerrar">×</button>
            </div>
            <div class="modal-dia-lista">
                ${clases.length ? clases.map(evento => `
                    <div class="modal-dia-evento">
                        <button type="button" class="modal-dia-detalle" data-modal-evento-id="${evento.id}">
                            <span class="modal-dia-hora">${evento.hora ? evento.hora.substring(0, 5) : 'Sin hora'}</span>
                            <span class="modal-dia-alumno">${escapeHtml(obtenerNombreAlumno(evento))}</span>
                            <span class="modal-dia-clase">${escapeHtml(obtenerEtiquetaClase(evento.clase_id))}</span>
                        </button>
                        <div class="modal-dia-acciones">
                            <button type="button" class="action-btn edit" data-modal-editar-id="${evento.id}" aria-label="Editar clase">✏️</button>
                            <button type="button" class="action-btn delete" data-modal-eliminar-id="${evento.id}" aria-label="Eliminar clase">🗑️</button>
                        </div>
                    </div>
                `).join('') : '<p class="modal-dia-vacio">No hay clases agendadas para este día.</p>'}
            </div>
            <div class="modal-dia-footer">
                <button type="button" class="btn-primary modal-dia-agendar">Agendar clase</button>
            </div>
        </div>
    `;

    const overlay = crearOverlay(contenido);
    overlay.classList.add('calendario-modal-overlay');
    document.body.appendChild(overlay);

    const cerrar = () => overlay.remove();
    overlay.querySelector('.modal-dia-cerrar')?.addEventListener('click', cerrar);
    overlay.querySelector('.modal-dia-agendar')?.addEventListener('click', () => {
        cerrar();
        mostrarModalCrearEventoConFecha(fechaISO);
    });

    overlay.querySelectorAll('[data-modal-evento-id]').forEach(boton => {
        boton.addEventListener('click', () => {
            const id = Number(boton.dataset.modalEventoId);
            cerrar();
            window.verDetalleEvento(id);
        });
    });

    overlay.querySelectorAll('[data-modal-editar-id]').forEach(boton => {
        boton.addEventListener('click', () => {
            const id = Number(boton.dataset.modalEditarId);
            cerrar();
            window.editarEvento(id);
        });
    });

    overlay.querySelectorAll('[data-modal-eliminar-id]').forEach(boton => {
        boton.addEventListener('click', () => {
            const id = Number(boton.dataset.modalEliminarId);
            const evento = clases.find(item => item.id === id);
            cerrar();
            window.eliminarEvento(id, evento?.titulo || 'esta clase');
        });
    });
}

function mostrarModalCrearEventoConFecha(fechaISO) {
    mostrarModalCrearEvento(fechaISO);
}

// ===== MODAL CREAR EVENTO (simplificado) =====
function mostrarModalCrearEvento(fechaPreseleccionada = null) {
    const hoy = new Date();
    const fechaDefault = fechaPreseleccionada || `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    
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
                <label>Clase correspondiente *</label>
                <select id="modalClaseId" class="form-select" required>
                    ${renderizarOpcionesClases()}
                </select>
                <small id="modalClaseAyuda" class="form-help">Selecciona un alumno para sugerir automáticamente su próxima clase pendiente.</small>
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

    const alumnoSelect = document.getElementById('modalAlumnoId');
    const claseSelect = document.getElementById('modalClaseId');
    alumnoSelect.addEventListener('change', () => sugerirPrimeraClasePendiente(alumnoSelect.value, claseSelect));

    document.getElementById('modalGuardarBtn').onclick = async () => {
        const alumnoId = document.getElementById('modalAlumnoId').value;
        const claseId = Number(document.getElementById('modalClaseId').value);
        const fecha = document.getElementById('modalFecha').value;
        const hora = document.getElementById('modalHora').value;
        const descripcion = document.getElementById('modalDescripcion').value;
        
        if (!alumnoId || !Number.isInteger(claseId) || !fecha || !hora) {
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
            clase_id: claseId,
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
    
    const mensaje = `${evento.titulo}\n📚 ${obtenerEtiquetaClase(evento.clase_id)}\n📅 ${fechaFormateada}\n🕐 ${evento.hora?.substring(0,5) || 'No especificada'}\n👤 ${alumno?.nombre || 'Alumno no encontrado'}\n📝 ${evento.descripcion || 'Sin descripción'}`;
    
    // PRIMER MODAL: Ver detalles
    const overlay1 = document.createElement('div');
    overlay1.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1200;';
    
    const modal1 = document.createElement('div');
    modal1.style.cssText = 'background:var(--bg-card);border-radius:var(--border-radius-lg);max-width:500px;width:90%;padding:var(--spacing-6);';
    modal1.innerHTML = `
        <h3 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-4);">Clase agendada</h3>
        <p style="white-space: pre-line; margin-bottom: var(--spacing-6);">${mensaje}</p>
        <div style="display: flex; gap: var(--spacing-3); justify-content: flex-end; flex-wrap: wrap;">
            <button id="modalCancelarBtn" class="btn-secondary">Cerrar</button>
            <button id="modalEditarBtn" class="btn-primary">Editar / Reagendar</button>
            <button id="modalEliminarBtn" style="background: var(--error); color: white; border: none; padding: var(--spacing-2) var(--spacing-4); border-radius: var(--border-radius-md); cursor: pointer;">Eliminar</button>
        </div>
    `;
    
    overlay1.appendChild(modal1);
    document.body.appendChild(overlay1);
    window.elaraModals?.registrar(overlay1, { cerrar: () => overlay1.remove() });
    
    document.getElementById('modalCancelarBtn').onclick = () => overlay1.remove();

    document.getElementById('modalEditarBtn').onclick = () => {
        overlay1.remove();
        window.editarEvento(id);
    };
    
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
        window.elaraModals?.registrar(overlay2, { cerrar: () => overlay2.remove() });
        
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
                <label>Clase correspondiente *</label>
                <select id="modalClaseId" class="form-select" required>
                    ${renderizarOpcionesClases(evento.clase_id)}
                </select>
                <small class="form-help">Puedes corregir manualmente la clase asignada.</small>
            </div>
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
        const claseId = Number(document.getElementById('modalClaseId').value);
        const fecha = document.getElementById('modalFecha').value;
        const hora = document.getElementById('modalHora').value;
        const descripcion = document.getElementById('modalDescripcion').value;
        
        if (!Number.isInteger(claseId) || !fecha || !hora) {
            window.modal.mostrar('Completa todos los campos requeridos', 'warning');
            return;
        }

        const guardarBtn = document.getElementById('modalGuardarBtn');
        guardarBtn.disabled = true;
        guardarBtn.textContent = 'Actualizando...';
        
        const result = await window.calendario.actualizar(id, { clase_id: claseId, fecha, hora, descripcion });
        
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

document.addEventListener('DOMContentLoaded', initCalendarioPage);