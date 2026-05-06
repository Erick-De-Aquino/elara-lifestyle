// ===== LÓGICA PARA CALENDARIO.HTML =====

let fechaSeleccionada = null;
let horaSeleccionada = null;
let eventos = [];
let añoActual = new Date().getFullYear();
let mesActual = new Date().getMonth();

// Todas las horas del día (00:00 a 23:00)
const horariosDisponibles = [
    "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00",
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
];

function esFechaPasada(fechaStr) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaComparar = new Date(fechaStr);
    return fechaComparar < hoy;
}

function calcularHoraSiguiente(hora) {
    const [horas] = hora.split(':').map(Number);
    let nuevaHora = horas + 1;
    if (nuevaHora >= 24) {
        return null;
    }
    return `${nuevaHora.toString().padStart(2, '0')}:00`;
}

function calcularHoraAnterior(hora) {
    const [horas] = hora.split(':').map(Number);
    if (horas === 0) return null;
    let nuevaHora = horas - 1;
    return `${nuevaHora.toString().padStart(2, '0')}:00`;
}

function getEventos() {
    return JSON.parse(localStorage.getItem('clases_agendadas') || '[]');
}

function saveEventos(eventos) {
    localStorage.setItem('clases_agendadas', JSON.stringify(eventos));
}

function renderCalendario() {
    const primerDia = new Date(añoActual, mesActual, 1);
    const ultimoDia = new Date(añoActual, mesActual + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();
    
    const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const mesTitulo = document.getElementById('mesTitulo');
    if (mesTitulo) {
        mesTitulo.textContent = `${nombresMeses[mesActual]} ${añoActual}`;
    }
    
    let html = `<div class="mes-calendario">`;
    const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    diasSemana.forEach(d => html += `<div class="dia-nombre">${d}</div>`);
    
    for (let i = 0; i < diaInicioSemana; i++) {
        html += `<div class="dia vacio"></div>`;
    }
    
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
    if (calendarioDiv) {
        calendarioDiv.innerHTML = html;
    }
    
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
    if (mesActual < 0) {
        mesActual = 11;
        añoActual--;
    }
    fechaSeleccionada = null;
    renderCalendario();
}

function mesSiguiente() {
    mesActual++;
    if (mesActual > 11) {
        mesActual = 0;
        añoActual++;
    }
    fechaSeleccionada = null;
    renderCalendario();
}

function mostrarModalHorarios() {
    if (!fechaSeleccionada) return;
    
    if (esFechaPasada(fechaSeleccionada)) {
        mostrarModalConfirmacion(
            'Fecha no válida',
            'No puedes agendar clases en fechas pasadas. Selecciona una fecha actual o futura.',
            'fa-exclamation-circle',
            'icono-peligro',
            null
        );
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
    
    const horasFiltradas = esHoy 
        ? horariosDisponibles.filter(hora => parseInt(hora) >= horaActual)
        : horariosDisponibles;
    
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
        const alumnoOcupante = eventoEnHora ? eventoEnHora.alumno : (eventoEnHoraAnterior ? eventoEnHoraAnterior.alumno : null);
        
        if (estaOcupado) {
            html += `
                <div class="horario-item ocupado" data-hora="${hora}" data-ocupado="true" data-alumno="${alumnoOcupante}">
                    <strong>${hora}</strong>
                    <div class="alumno-nombre">👤 ${alumnoOcupante}</div>
                    <small>Ocupado</small>
                </div>
            `;
        } else {
            html += `
                <div class="horario-item disponible" data-hora="${hora}" data-ocupado="false">
                    <strong>${hora}</strong>
                    <small>Disponible</small>
                </div>
            `;
        }
    });
    
    grid.innerHTML = html;
    
    document.querySelectorAll('.horario-item').forEach(item => {
        item.addEventListener('click', () => {
            const ocupado = item.getAttribute('data-ocupado') === 'true';
            const hora = item.getAttribute('data-hora');
            
            if (ocupado) {
                const alumno = item.getAttribute('data-alumno');
                mostrarModalConfirmacion(
                    'Horario no disponible',
                    `La hora ${hora} no está disponible. ${alumno} ya tiene clase de ${hora} a ${calcularHoraSiguiente(hora) || 'fin del día'}.`,
                    'fa-exclamation-circle',
                    'icono-peligro',
                    null
                );
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
    if (btnCancelar) {
        btnCancelar.onclick = () => {
            modal.style.display = 'none';
            horaSeleccionada = null;
        };
    }
    
    modal.style.display = 'flex';
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            horaSeleccionada = null;
        }
    };
}

function mostrarFormularioAgendar() {
    if (!fechaSeleccionada || !horaSeleccionada) return;
    
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
        <small style="color: var(--gray-dark);">(1.5h de clase + 0.5h de preparación)</small>
    `;
    
    const alumnos = getAlumnos();
    const select = document.getElementById('alumnoSelectAgendar');
    select.innerHTML = '<option value="">Seleccionar alumno</option>';
    alumnos.forEach(a => {
        select.innerHTML += `<option value="${a.nombre}">${a.nombre}</option>`;
    });
    
    modal.style.display = 'flex';
    
    document.getElementById('confirmarAgendar').onclick = () => {
        const alumno = select.value;
        
        if (!alumno) {
            mostrarModalConfirmacion('Error', 'Selecciona un alumno', 'fa-exclamation-circle', 'icono-peligro', null);
            return;
        }
        
        const eventosActuales = getEventos();
        const eventosDelDia = eventosActuales.filter(e => e.fecha === fechaSeleccionada);
        const horaAnterior = calcularHoraAnterior(horaSeleccionada);
        
        const yaOcupado = eventosDelDia.some(e => 
            e.hora === horaSeleccionada || (horaAnterior && e.hora === horaAnterior)
        );
        
        if (yaOcupado) {
            mostrarModalConfirmacion(
                'Horario no disponible',
                'Este horario ya no está disponible. Por favor selecciona otro.',
                'fa-exclamation-circle',
                'icono-peligro',
                () => {
                    modal.style.display = 'none';
                    fechaSeleccionada = null;
                    horaSeleccionada = null;
                    renderCalendario();
                }
            );
            return;
        }
        
        eventos = eventosActuales;
        eventos.push({
            fecha: fechaSeleccionada,
            hora: horaSeleccionada,
            alumno: alumno,
            duracion: "1.5 horas de clase + 0.5 horas de preparación",
            visto: false
        });
        saveEventos(eventos);
        
        modal.style.display = 'none';
        
        mostrarModalConfirmacion(
            '✅ Clase agendada',
            `Clase agendada para ${alumno}<br>el ${fechaLegible} de ${horaSeleccionada} a ${horaFin || 'fin del día'}`,
            'fa-check-circle',
            'icono-exito',
            null
        );
        
        renderCalendario();
        renderListaEventos();
        fechaSeleccionada = null;
        horaSeleccionada = null;
    };
    
    document.getElementById('cancelarAgendar').onclick = () => {
        modal.style.display = 'none';
        fechaSeleccionada = null;
        horaSeleccionada = null;
    };
}

function generarEventoHTML(e, idxGlobal, tipo) {
    const [año, mes, dia] = e.fecha.split('-');
    const fechaLegible = `${dia}/${mes}/${año}`;
    const horaFin = calcularHoraSiguiente(e.hora);
    const claseColor = tipo === 'proximo' ? 'evento-proximo' : 'evento-pasado';
    const vistoClass = e.visto ? 'visto' : '';
    const vistoTexto = e.visto ? '✅ Vista' : '👁️ Marcar como vista';
    
    return `
        <div class="evento-item ${claseColor}" data-idx="${idxGlobal}">
            <strong>📅 ${fechaLegible} - ${e.hora} a ${horaFin || 'fin del día'}</strong><br>
            👤 ${e.alumno}<br>
            ⏰ ${e.duracion}
            <br>
            <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                <button class="btn-reprogramar" data-idx="${idxGlobal}"><i class="fas fa-edit"></i> Reprogramar</button>
                <button class="btn-marcar-vista ${vistoClass}" data-idx="${idxGlobal}"><i class="fas ${e.visto ? 'fa-check-circle' : 'fa-eye'}"></i> ${vistoTexto}</button>
                <button class="btn-eliminar-evento" data-idx="${idxGlobal}"><i class="fas fa-trash"></i> Eliminar</button>
            </div>
        </div>
    `;
}

function eliminarEvento(idx) {
    mostrarModalConfirmacion(
        'Eliminar clase',
        '¿Estás seguro de que quieres eliminar esta clase del calendario?',
        'fa-exclamation-triangle',
        'icono-advertencia',
        () => {
            eventos.splice(idx, 1);
            saveEventos(eventos);
            renderCalendario();
            renderListaEventos();
            
            mostrarModalConfirmacion(
                'Evento eliminado',
                'La clase ha sido eliminada del calendario',
                'fa-check-circle',
                'icono-exito',
                null
            );
        }
    );
}

function reprogramarEvento(idx) {
    const evento = eventos[idx];
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
    
    // Fecha mínima = hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('nuevaFecha').min = hoy;
    document.getElementById('nuevaFecha').value = evento.fecha;
    
    const selectHora = document.getElementById('nuevaHora');
    selectHora.innerHTML = '';
    horariosDisponibles.forEach(hora => {
        selectHora.innerHTML += `<option value="${hora}" ${hora === evento.hora ? 'selected' : ''}>${hora}</option>`;
    });
    
    document.getElementById('alumnoReprogramar').value = evento.alumno;
    
    modal.style.display = 'flex';
    
    document.getElementById('confirmarReprogramar').onclick = () => {
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
        
        const eventosActuales = getEventos();
        const conflicto = eventosActuales.some((e, i) => 
            i !== idx && e.fecha === nuevaFecha && e.hora === nuevaHora
        );
        
        if (conflicto) {
            mostrarModalConfirmacion(
                'Horario no disponible',
                'Ya hay una clase agendada en esa fecha y hora. Selecciona otro horario.',
                'fa-exclamation-circle',
                'icono-peligro',
                null
            );
            return;
        }
        
        eventos[idx].fecha = nuevaFecha;
        eventos[idx].hora = nuevaHora;
        saveEventos(eventos);
        
        modal.style.display = 'none';
        
        // Modal de éxito SIN botones de confirmación adicionales
        let modalExito = document.getElementById('modalExitoReprogramar');
        if (!modalExito) {
            modalExito = document.createElement('div');
            modalExito.id = 'modalExitoReprogramar';
            modalExito.className = 'modal-confirmacion';
            modalExito.innerHTML = `
                <div class="modal-confirmacion-content">
                    <i class="fas fa-check-circle icono-exito"></i>
                    <h3>✅ Clase reprogramada</h3>
                    <p id="mensajeExitoReprogramar"></p>
                    <div class="botones-modal">
                        <button id="btnCerrarExitoReprogramar" class="btn-aceptar">Aceptar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modalExito);
        }
        
        document.getElementById('mensajeExitoReprogramar').innerHTML = `
            Clase reprogramada para ${evento.alumno}<br>el ${nuevaFecha} a las ${nuevaHora}
        `;
        
        modalExito.style.display = 'flex';
        
        document.getElementById('btnCerrarExitoReprogramar').onclick = () => {
            modalExito.style.display = 'none';
            renderCalendario();
            renderListaEventos();
        };
        
        window.onclick = (event) => {
            if (event.target === modalExito) {
                modalExito.style.display = 'none';
                renderCalendario();
                renderListaEventos();
            }
        };
    };
    
    document.getElementById('cancelarReprogramar').onclick = () => {
        modal.style.display = 'none';
    };
}
function marcarComoVisto(idx) {
    eventos[idx].visto = !eventos[idx].visto;
    saveEventos(eventos);
    renderListaEventos();
    
    mostrarModalConfirmacion(
        eventos[idx].visto ? '✅ Clase marcada como vista' : '📝 Clase marcada como pendiente',
        `La clase de ${eventos[idx].alumno} ha sido ${eventos[idx].visto ? 'marcada como vista' : 'marcada como pendiente'}.`,
        'fa-check-circle',
        'icono-exito',
        null
    );
}

function renderListaEventos() {
    eventos = getEventos();
    const container = document.getElementById('listaEventos');
    if (!container) return;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const eventosProximos = [];
    const eventosPasados = [];
    
    eventos.forEach(e => {
        const [año, mes, dia] = e.fecha.split('-');
        const fechaEvento = new Date(año, parseInt(mes) - 1, dia);
        if (fechaEvento >= hoy) {
            eventosProximos.push(e);
        } else {
            eventosPasados.push(e);
        }
    });
    
    eventosProximos.sort((a, b) => a.fecha.localeCompare(b.fecha));
    eventosPasados.sort((a, b) => b.fecha.localeCompare(a.fecha));
    
    let html = '';
    
    if (eventosProximos.length > 0) {
        html += `<h4 style="color: var(--success-green); margin: 15px 0 10px;"><i class="fas fa-calendar-week"></i> 📅 Próximas clases</h4>`;
        eventosProximos.forEach(e => {
            const idxGlobal = eventos.findIndex(ev => ev === e);
            html += generarEventoHTML(e, idxGlobal, 'proximo');
        });
    }
    
    if (eventosPasados.length > 0) {
        html += `<h4 style="color: var(--gray-dark); margin: 20px 0 10px;"><i class="fas fa-history"></i> 📜 Clases pasadas</h4>`;
        eventosPasados.forEach(e => {
            const idxGlobal = eventos.findIndex(ev => ev === e);
            html += generarEventoHTML(e, idxGlobal, 'pasado');
        });
    }
    
    if (eventos.length === 0) {
        html = '<p style="text-align:center; padding:20px;">No hay clases programadas</p>';
    }
    
    container.innerHTML = html;
    
    document.querySelectorAll('.btn-eliminar-evento').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute('data-idx'));
            eliminarEvento(idx);
        });
    });
    
    document.querySelectorAll('.btn-reprogramar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute('data-idx'));
            reprogramarEvento(idx);
        });
    });
    
    document.querySelectorAll('.btn-marcar-vista').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute('data-idx'));
            marcarComoVisto(idx);
        });
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    eventos = getEventos();
    renderCalendario();
    renderListaEventos();
    
    document.getElementById('btnNuevoAlumno')?.addEventListener('click', () => {
        window.location.href = 'alumno.html';
    });
    document.getElementById('btnListaAlumnos')?.addEventListener('click', () => {
        window.location.href = 'alumnos-lista.html';
    });
    document.getElementById('btnMesAnterior')?.addEventListener('click', mesAnterior);
    document.getElementById('btnMesSiguiente')?.addEventListener('click', mesSiguiente);
});