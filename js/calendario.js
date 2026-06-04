// ===== CALENDARIO CON SUPABASE =====

let fechaSeleccionada = null;
let horaSeleccionada = null;
let eventos = [];
let alumnos = [];
let añoActual = new Date().getFullYear();
let mesActual = new Date().getMonth();

const horariosDisponibles = [
    "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00",
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
];

// ===== FUNCIONES AUXILIARES =====
function esFechaPasada(fechaStr) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaComparar = new Date(fechaStr);
    return fechaComparar < hoy;
}

function calcularHoraSiguiente(hora) {
    const [horas] = hora.split(':').map(Number);
    let nuevaHora = horas + 1;
    if (nuevaHora >= 24) return null;
    return `${nuevaHora.toString().padStart(2, '0')}:00`;
}

function calcularHoraAnterior(hora) {
    const [horas] = hora.split(':').map(Number);
    if (horas === 0) return null;
    let nuevaHora = horas - 1;
    return `${nuevaHora.toString().padStart(2, '0')}:00`;
}

// ===== CRUD CON SUPABASE =====
async function cargarEventos() {
    const { data, error } = await supabaseClient
        .from('eventos')
        .select('*')
        .order('fecha', { ascending: true });
    
    if (error) {
        console.error('Error cargando eventos:', error);
        return [];
    }
    eventos = data || [];
    return eventos;
}

async function cargarAlumnos() {
    const { data, error } = await supabaseClient
        .from('alumnos')
        .select('id, usuario, nombre')
        .eq('es_profesor', false);
    
    if (error) {
        console.error('Error cargando alumnos:', error);
        return [];
    }
    alumnos = data || [];
    return alumnos;
}

async function agregarEvento(evento) {
    const { error } = await supabaseClient
        .from('eventos')
        .insert([evento]);
    
    if (error) {
        console.error('Error creando evento:', error);
        mostrarModalConfirmacion('Error', 'No se pudo agendar la clase: ' + error.message, 'fa-exclamation-circle', 'icono-peligro', null);
        return false;
    }
    await cargarEventos();
    return true;
}

async function eliminarEventoDB(id) {
    const { error } = await supabaseClient
        .from('eventos')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error eliminando evento:', error);
        mostrarModalConfirmacion('Error', 'No se pudo eliminar la clase', 'fa-exclamation-circle', 'icono-peligro', null);
        return false;
    }
    await cargarEventos();
    return true;
}

async function actualizarEventoDB(id, updates) {
    const { error } = await supabaseClient
        .from('eventos')
        .update(updates)
        .eq('id', id);
    
    if (error) {
        console.error('Error actualizando evento:', error);
        mostrarModalConfirmacion('Error', 'No se pudo actualizar la clase', 'fa-exclamation-circle', 'icono-peligro', null);
        return false;
    }
    await cargarEventos();
    return true;
}

// ===== RENDERIZADO DEL CALENDARIO =====
function renderCalendario() {
    const primerDia = new Date(añoActual, mesActual, 1);
    const ultimoDia = new Date(añoActual, mesActual + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();
    
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const mesTitulo = document.getElementById('mesTitulo');
    if (mesTitulo) mesTitulo.textContent = `${nombresMeses[mesActual]} ${añoActual}`;
    
    let html = `<div class="mes-calendario">`;
    const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    diasSemana.forEach(d => html += `<div class="dia-nombre">${d}</div>`);
    
    for (let i = 0; i < diaInicioSemana; i++) html += `<div class="dia vacio"></div>`;
    
    for (let d = 1; d <= diasEnMes; d++) {
        const fechaStr = `${añoActual}-${String(mesActual + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const tieneClase = eventos.some(e => e.fecha === fechaStr);
        const esSeleccionado = (fechaSeleccionada === fechaStr);
        const esPasado = esFechaPasada(fechaStr);
        const claseDia = `dia ${tieneClase ? 'con-clase' : ''} ${esSeleccionado ? 'seleccionado' : ''} ${esPasado ? 'dia-pasado' : ''}`;
        const dataAttr = esPasado ? '' : `data-fecha="${fechaStr}"`;
        html += `<div class="${claseDia}" ${dataAttr}>${d}</div>`;
    }
    html += `</div>`;
    
    const calendarioDiv = document.getElementById('calendario');
    if (calendarioDiv) calendarioDiv.innerHTML = html;
    
    document.querySelectorAll('.dia[data-fecha]').forEach(el => {
        el.addEventListener('click', () => {
            fechaSeleccionada = el.getAttribute('data-fecha');
            renderCalendario();
            mostrarModalHorarios();
        });
    });
}

function mesAnterior() {
    mesActual--;
    if (mesActual < 0) { mesActual = 11; añoActual--; }
    fechaSeleccionada = null;
    renderCalendario();
}

function mesSiguiente() {
    mesActual++;
    if (mesActual > 11) { mesActual = 0; añoActual++; }
    fechaSeleccionada = null;
    renderCalendario();
}

// ===== MODAL DE HORARIOS =====
function mostrarModalHorarios() {
    if (!fechaSeleccionada) return;
    
    if (esFechaPasada(fechaSeleccionada)) {
        mostrarModalConfirmacion('Fecha no válida', 'No puedes agendar clases en fechas pasadas.', 'fa-exclamation-circle', 'icono-peligro', null);
        fechaSeleccionada = null;
        renderCalendario();
        return;
    }
    
    const [año, mes, dia] = fechaSeleccionada.split('-');
    const fechaLegible = `${dia}/${mes}/${año}`;
    const eventosDelDia = eventos.filter(e => e.fecha === fechaSeleccionada);
    
    const hoy = new Date();
    const esHoy = fechaSeleccionada === `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const horaActual = hoy.getHours();
    const horasFiltradas = esHoy ? horariosDisponibles.filter(hora => parseInt(hora) >= horaActual) : horariosDisponibles;
    
    let modal = document.getElementById('modalHorario');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalHorario';
        modal.className = 'modal-horario';
        modal.innerHTML = `
            <div class="modal-horario-content">
                <h3><i class="fas fa-calendar-day"></i> Seleccionar horario</h3>
                <div class="fecha-seleccionada" id="modalFecha"></div>
                <div id="horariosGrid" class="horarios-grid"></div>
                <div class="modal-horario-botones">
                    <button id="btnCancelarHorario" class="btn-cancelar-horario">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('modalFecha').textContent = `📅 ${fechaLegible}`;
    const grid = document.getElementById('horariosGrid');
    let html = '';
    
    horasFiltradas.forEach(hora => {
        const eventoEnHora = eventosDelDia.find(e => e.hora === hora);
        const horaAnterior = calcularHoraAnterior(hora);
        const eventoEnHoraAnterior = horaAnterior ? eventosDelDia.find(e => e.hora === horaAnterior) : null;
        const estaOcupado = !!eventoEnHora || (horaAnterior !== null && !!eventoEnHoraAnterior);
        const alumnoOcupante = eventoEnHora ? eventoEnHora.alumno_nombre : (eventoEnHoraAnterior ? eventoEnHoraAnterior.alumno_nombre : null);
        
        if (estaOcupado) {
            html += `<div class="horario-item ocupado" data-hora="${hora}" data-ocupado="true" data-alumno="${alumnoOcupante}">
                        <strong>${hora}</strong>
                        <div class="alumno-nombre">👤 ${alumnoOcupante}</div>
                        <small>Ocupado</small>
                    </div>`;
        } else {
            html += `<div class="horario-item disponible" data-hora="${hora}" data-ocupado="false">
                        <strong>${hora}</strong>
                        <small>Disponible</small>
                    </div>`;
        }
    });
    grid.innerHTML = html;
    
    document.querySelectorAll('.horario-item').forEach(item => {
        item.addEventListener('click', async () => {
            const ocupado = item.getAttribute('data-ocupado') === 'true';
            const hora = item.getAttribute('data-hora');
            
            if (ocupado) {
                const alumno = item.getAttribute('data-alumno');
                mostrarModalConfirmacion('Horario no disponible', `La hora ${hora} no está disponible. ${alumno} ya tiene clase.`, 'fa-exclamation-circle', 'icono-peligro', null);
                return;
            }
            
            horaSeleccionada = hora;
            document.querySelectorAll('.horario-item').forEach(h => {
                h.classList.remove('seleccionado');
                h.style.border = '';
            });
            item.classList.add('seleccionado');
            item.style.border = '2px solid var(--primary-orange)';
            
            const botonesDiv = document.querySelector('#modalHorario .modal-horario-botones');
            if (botonesDiv && !document.getElementById('btnConfirmarHorario')) {
                botonesDiv.innerHTML = `
                    <button id="btnCancelarHorario" class="btn-cancelar-horario">Cancelar</button>
                    <button id="btnConfirmarHorario" class="btn-confirmar-horario">Confirmar y continuar</button>
                `;
                document.getElementById('btnCancelarHorario').onclick = () => {
                    modal.style.display = 'none';
                    horaSeleccionada = null;
                };
                document.getElementById('btnConfirmarHorario').onclick = () => {
                    modal.style.display = 'none';
                    mostrarFormularioAgendar();
                };
            }
        });
    });
    
    const btnCancelar = document.getElementById('btnCancelarHorario');
    if (btnCancelar) btnCancelar.onclick = () => {
        modal.style.display = 'none';
        horaSeleccionada = null;
    };
    
    modal.style.display = 'flex';
    window.onclick = (event) => { if (event.target === modal) { modal.style.display = 'none'; horaSeleccionada = null; } };
}

// ===== FORMULARIO PARA AGENDAR =====
async function mostrarFormularioAgendar() {
    if (!fechaSeleccionada || !horaSeleccionada) return;
    
    await cargarAlumnos();
    
    const [año, mes, dia] = fechaSeleccionada.split('-');
    const fechaLegible = `${dia}/${mes}/${año}`;
    const horaFin = calcularHoraSiguiente(horaSeleccionada);
    
    let modal = document.getElementById('modalAgendar');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalAgendar';
        modal.className = 'modal-nuevo-alumno';
        modal.innerHTML = `
            <div class="modal-nuevo-alumno-content">
                <h2><i class="fas fa-calendar-plus"></i> Agendar clase</h2>
                <div class="form-group">
                    <label>Horario seleccionado</label>
                    <div id="fechaHoraSeleccionada" style="background: var(--bg-light); padding: 12px; border-radius: 10px;"></div>
                </div>
                <div class="form-group">
                    <label>Alumno *</label>
                    <select id="alumnoSelectAgendar" required></select>
                </div>
                <div class="botones-modal">
                    <button id="confirmarAgendar" class="btn-guardar-modal">✅ Agendar clase</button>
                    <button id="cancelarAgendar" class="btn-cancelar-modal">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('fechaHoraSeleccionada').innerHTML = `
        <i class="fas fa-calendar-day"></i> ${fechaLegible}<br>
        <i class="fas fa-clock"></i> ${horaSeleccionada} a ${horaFin || 'fin del día'}<br>
        <small>(1.5h de clase + 0.5h de preparación)</small>
    `;
    
    const select = document.getElementById('alumnoSelectAgendar');
    select.innerHTML = '<option value="">Seleccionar alumno</option>';
    alumnos.forEach(a => {
        const nombreMostrar = a.nombre || a.usuario;
        select.innerHTML += `<option value="${a.id}" data-nombre="${nombreMostrar}">${nombreMostrar}</option>`;
    });
    
    modal.style.display = 'flex';
    
    document.getElementById('confirmarAgendar').onclick = async () => {
        const alumnoId = select.value;
        const selectedOption = select.options[select.selectedIndex];
        const alumnoNombre = selectedOption?.getAttribute('data-nombre') || '';
        
        if (!alumnoId) {
            mostrarModalConfirmacion('Error', 'Selecciona un alumno', 'fa-exclamation-circle', 'icono-peligro', null);
            return;
        }
        
        const eventosDelDia = eventos.filter(e => e.fecha === fechaSeleccionada);
        const horaAnterior = calcularHoraAnterior(horaSeleccionada);
        const yaOcupado = eventosDelDia.some(e => e.hora === horaSeleccionada || (horaAnterior && e.hora === horaAnterior));
        
        if (yaOcupado) {
            mostrarModalConfirmacion('Horario no disponible', 'Este horario ya no está disponible.', 'fa-exclamation-circle', 'icono-peligro', () => {
                modal.style.display = 'none';
                fechaSeleccionada = null;
                horaSeleccionada = null;
                renderCalendario();
            });
            return;
        }
        
        const exito = await agregarEvento({
            alumno_id: parseInt(alumnoId),
            alumno_nombre: alumnoNombre,
            fecha: fechaSeleccionada,
            hora: horaSeleccionada,
            duracion: "1.5 horas de clase + 0.5 horas de preparación",
            visto: false
        });
        
        if (exito) {
            modal.style.display = 'none';
            mostrarModalConfirmacion('✅ Clase agendada', `Clase agendada para ${alumnoNombre}<br>el ${fechaLegible} de ${horaSeleccionada} a ${horaFin || 'fin del día'}`, 'fa-check-circle', 'icono-exito', null);
            renderCalendario();
            renderListaEventos();
        }
        fechaSeleccionada = null;
        horaSeleccionada = null;
    };
    
    document.getElementById('cancelarAgendar').onclick = () => {
        modal.style.display = 'none';
        fechaSeleccionada = null;
        horaSeleccionada = null;
    };
}

// ===== LISTA DE EVENTOS =====
function generarEventoHTML(e) {
    const [año, mes, dia] = e.fecha.split('-');
    const fechaLegible = `${dia}/${mes}/${año}`;
    const horaFin = calcularHoraSiguiente(e.hora);
    const claseColor = 'evento-proximo';
    const vistoClass = e.visto ? 'visto' : '';
    const vistoTexto = e.visto ? '✅ Vista' : '👁️ Marcar como vista';
    
    return `
        <div class="evento-item ${claseColor}" data-id="${e.id}">
            <strong>📅 ${fechaLegible} - ${e.hora} a ${horaFin || 'fin del día'}</strong><br>
            👤 ${e.alumno_nombre}<br>
            ⏰ ${e.duracion}
            <br>
            <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                <button class="btn-reprogramar" data-id="${e.id}"><i class="fas fa-edit"></i> Reprogramar</button>
                <button class="btn-marcar-vista ${vistoClass}" data-id="${e.id}"><i class="fas ${e.visto ? 'fa-check-circle' : 'fa-eye'}"></i> ${vistoTexto}</button>
                <button class="btn-eliminar-evento" data-id="${e.id}"><i class="fas fa-trash"></i> Eliminar</button>
            </div>
        </div>
    `;
}

async function eliminarEventoUI(id) {
    mostrarModalConfirmacion('Eliminar clase', '¿Estás seguro de que quieres eliminar esta clase?', 'fa-exclamation-triangle', 'icono-advertencia', async () => {
        await eliminarEventoDB(id);
        renderCalendario();
        renderListaEventos();
        mostrarModalConfirmacion('Evento eliminado', 'La clase ha sido eliminada.', 'fa-check-circle', 'icono-exito', null);
    });
}

async function reprogramarEventoUI(id) {
    const evento = eventos.find(e => e.id === id);
    if (!evento) return;
    
    let modal = document.getElementById('modalReprogramar');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalReprogramar';
        modal.className = 'modal-nuevo-alumno';
        modal.innerHTML = `
            <div class="modal-nuevo-alumno-content">
                <h2><i class="fas fa-edit"></i> Reprogramar clase</h2>
                <div class="form-group">
                    <label>Nueva fecha</label>
                    <input type="date" id="nuevaFecha" min="">
                </div>
                <div class="form-group">
                    <label>Nueva hora</label>
                    <select id="nuevaHora"></select>
                </div>
                <div class="form-group">
                    <label>Alumno</label>
                    <input type="text" id="alumnoReprogramar" readonly style="background: var(--bg-light);">
                </div>
                <div class="botones-modal">
                    <button id="confirmarReprogramar" class="btn-guardar-modal">✅ Guardar cambios</button>
                    <button id="cancelarReprogramar" class="btn-cancelar-modal">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('nuevaFecha').min = hoy;
    document.getElementById('nuevaFecha').value = evento.fecha;
    
    const selectHora = document.getElementById('nuevaHora');
    selectHora.innerHTML = '';
    horariosDisponibles.forEach(hora => {
        selectHora.innerHTML += `<option value="${hora}" ${hora === evento.hora ? 'selected' : ''}>${hora}</option>`;
    });
    document.getElementById('alumnoReprogramar').value = evento.alumno_nombre;
    
    modal.style.display = 'flex';
    
    document.getElementById('confirmarReprogramar').onclick = async () => {
        const nuevaFecha = document.getElementById('nuevaFecha').value;
        const nuevaHora = document.getElementById('nuevaHora').value;
        
        if (!nuevaFecha || !nuevaHora) {
            mostrarModalConfirmacion('Error', 'Selecciona fecha y hora', 'fa-exclamation-circle', 'icono-peligro', null);
            return;
        }
        
        if (esFechaPasada(nuevaFecha)) {
            mostrarModalConfirmacion('Error', 'No puedes reprogramar a una fecha pasada', 'fa-exclamation-circle', 'icono-peligro', null);
            return;
        }
        
        const conflicto = eventos.some(e => e.id !== id && e.fecha === nuevaFecha && e.hora === nuevaHora);
        if (conflicto) {
            mostrarModalConfirmacion('Horario no disponible', 'Ya hay una clase en esa fecha y hora.', 'fa-exclamation-circle', 'icono-peligro', null);
            return;
        }
        
        await actualizarEventoDB(id, { fecha: nuevaFecha, hora: nuevaHora });
        modal.style.display = 'none';
        mostrarModalConfirmacion('✅ Clase reprogramada', `Clase reprogramada para ${evento.alumno_nombre}<br>el ${nuevaFecha} a las ${nuevaHora}`, 'fa-check-circle', 'icono-exito', null);
        renderCalendario();
        renderListaEventos();
    };
    
    document.getElementById('cancelarReprogramar').onclick = () => modal.style.display = 'none';
}

async function marcarComoVistoUI(id) {
    const evento = eventos.find(e => e.id === id);
    if (!evento) return;
    
    mostrarModalConfirmacion(
        'Confirmar clase vista',
        `¿Marcar como vista la clase de ${evento.alumno_nombre} del ${evento.fecha} a las ${evento.hora}?`,
        'fa-question-circle',
        'icono-advertencia',
        async () => {
            await actualizarEventoDB(id, { visto: true });
            renderListaEventos();
            mostrarModalConfirmacion('✅ Clase marcada como vista', `La clase ha pasado al historial.`, 'fa-check-circle', 'icono-exito', null);
        }
    );
}

async function renderListaEventos() {
    const container = document.getElementById('listaEventos');
    if (!container) return;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Separar clases: futuras no vistas, pasadas + vistas
    const clasesFuturas = eventos.filter(e => new Date(e.fecha) >= hoy && !e.visto).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const clasesHistoricas = eventos.filter(e => new Date(e.fecha) < hoy || e.visto).sort((a, b) => b.fecha.localeCompare(a.fecha));
    
    let html = '';
    
    // Clases futuras
    if (clasesFuturas.length > 0) {
        html += `<h4 style="color: var(--success-green); margin: 15px 0 10px;"><i class="fas fa-calendar-week"></i> 📅 Clases agendadas</h4>`;
        clasesFuturas.forEach(e => html += generarEventoHTML(e));
    } else {
        html += `<p style="text-align:center; padding:10px; color: var(--gray-dark);">No hay clases agendadas</p>`;
    }
    
    // Clases históricas (colapsable)
    if (clasesHistoricas.length > 0) {
        html += `
            <div id="historial-colapsable" style="margin-top: 20px;">
                <div id="historial-header" style="cursor: pointer; padding: 10px; background: var(--gray-medium); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fas fa-history"></i> 📜 Historial de clases (${clasesHistoricas.length})</span>
                    <i id="historial-icono" class="fas fa-chevron-down"></i>
                </div>
                <div id="historial-contenido" style="display: block; margin-top: 10px;">
                    ${clasesHistoricas.map(e => generarEventoHTML(e)).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Evento para colapsar/expandir historial
    const historialHeader = document.getElementById('historial-header');
    if (historialHeader) {
        historialHeader.addEventListener('click', () => {
            const contenido = document.getElementById('historial-contenido');
            const icono = document.getElementById('historial-icono');
            if (contenido.style.display === 'none') {
                contenido.style.display = 'block';
                icono.className = 'fas fa-chevron-down';
            } else {
                contenido.style.display = 'none';
                icono.className = 'fas fa-chevron-right';
            }
        });
    }
    
    // Eventos de botones
    document.querySelectorAll('.btn-eliminar-evento').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); eliminarEventoUI(parseInt(btn.getAttribute('data-id'))); });
    });
    document.querySelectorAll('.btn-reprogramar').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); reprogramarEventoUI(parseInt(btn.getAttribute('data-id'))); });
    });
    document.querySelectorAll('.btn-marcar-vista').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); marcarComoVistoUI(parseInt(btn.getAttribute('data-id'))); });
    });
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async () => {
    await cargarEventos();
    await cargarAlumnos();
    renderCalendario();
    renderListaEventos();
    
    // Botón cerrar sesión (nuevo)
    document.getElementById('btnCerrarSesion')?.addEventListener('click', () => {
        localStorage.removeItem('acceso_tipo');
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    });
    
    document.getElementById('btnMesAnterior')?.addEventListener('click', mesAnterior);
    document.getElementById('btnMesSiguiente')?.addEventListener('click', mesSiguiente);
});