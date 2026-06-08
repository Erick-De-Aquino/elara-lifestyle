// profesor-clase-preview.js - Vista previa de clase para profesor

let claseId = null;
let claseData = null;
let alumnoActualId = null;
let alumnoActualNombre = null;
let timersActivos = {};
let notaAutoguardado = null;

// ===== INICIALIZAR =====
async function initPreview() {
    if (!window.auth || !window.auth.requireAuth('profesor')) {
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    claseId = urlParams.get('id');
    alumnoActualId = urlParams.get('alumnoId');
    alumnoActualNombre = urlParams.get('alumnoNombre');
    
    // Hacer globales para onclick
    window.currentClaseId = claseId;
    window.currentAlumnoId = alumnoActualId;
    window.currentAlumnoNombre = alumnoActualNombre;
    
    const sesion = window.auth.getCurrentUser();
    if (!sesion) {
        window.location.href = '../../index.html';
        return;
    }
    
    await window.navegacion.initNavegacion('profesor', 'curso', sesion.nombre);
    await cargarClase();
    renderizarClase();
    
    if (alumnoActualId) {
        await cargarProgresoAlumno();
        await cargarNotaExistente();
    }
}

// ===== CARGAR CLASE =====
async function cargarClase() {
    try {
        const response = await fetch('../../data/clases.json');
        const todasClases = await response.json();
        claseData = todasClases[`clase${claseId}`];
        
        if (!claseData) {
            window.modal.mostrar('Clase no encontrada', 'error');
            setTimeout(() => window.location.href = 'curso.html', 1500);
        }
    } catch (error) {
        console.error('Error cargando clase:', error);
    }
}

// ===== CARGAR PROGRESO DEL ALUMNO =====
async function cargarProgresoAlumno() {
    const supabase = window.supabaseClient;
    if (!supabase || !alumnoActualId) return;
    
    const { data: progreso } = await supabase
        .from('progreso')
        .select('completada')
        .eq('usuario_id', alumnoActualId)
        .eq('clase_id', parseInt(claseId));
    
    const estaCompletada = progreso && progreso.length > 0 && progreso[0].completada;
    
    const btnCompletada = document.getElementById('btnMarcarCompletada');
    if (btnCompletada) {
        if (estaCompletada) {
            btnCompletada.innerHTML = '✅ Clase vista';
            btnCompletada.disabled = true;
            btnCompletada.style.opacity = '0.6';
        } else {
            btnCompletada.innerHTML = '📌 Marcar clase como vista';
            btnCompletada.disabled = false;
            btnCompletada.style.opacity = '1';
        }
    }
}

// ===== MARCAR CLASE COMO VISTA (FUNCIÓN GLOBAL) =====
window.marcarClaseComoVista = async function() {
    console.log('🔵 Botón clickeado');
    
    const supabase = window.supabaseClient;
    if (!supabase || !window.currentAlumnoId) {
        window.modal.mostrar('No hay un alumno seleccionado', 'warning');
        return;
    }
    
    const btn = document.getElementById('btnMarcarCompletada');
    if (!btn) {
        console.error('Botón no encontrado');
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = 'Guardando...';
    
    const { data: existente } = await supabase
        .from('progreso')
        .select('id')
        .eq('usuario_id', window.currentAlumnoId)
        .eq('clase_id', parseInt(window.currentClaseId))
        .maybeSingle();
    
    let error;
    if (existente) {
        const { error: updateError } = await supabase
            .from('progreso')
            .update({ completada: true, fecha_completado: new Date() })
            .eq('id', existente.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('progreso')
            .insert({
                usuario_id: window.currentAlumnoId,
                clase_id: parseInt(window.currentClaseId),
                completada: true,
                fecha_completado: new Date()
            });
        error = insertError;
    }
    
    if (error) {
        window.modal.mostrar('Error al guardar: ' + error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '📌 Marcar clase como vista';
    } else {
        window.modal.mostrar(`✅ Clase marcada como vista para ${window.currentAlumnoNombre}`, 'exito');
        btn.innerHTML = '✅ Clase vista';
        btn.disabled = true;
        btn.style.opacity = '0.6';
    }
};

// ===== CARGAR NOTA EXISTENTE =====
async function cargarNotaExistente() {
    const supabase = window.supabaseClient;
    if (!supabase || !alumnoActualId) return;
    
    const { data } = await supabase
        .from('comentarios_profesor')
        .select('comentario')
        .eq('alumno_id', alumnoActualId)
        .eq('clase_id', `clase${claseId}`)
        .maybeSingle();
    
    const textarea = document.getElementById('notaProfesorTextarea');
    if (textarea && data) {
        textarea.value = data.comentario;
        notaAutoguardado = data.comentario;
    }
}

// ===== GUARDAR NOTA (autoguardado) =====
async function guardarNotaAutomatico() {
    const textarea = document.getElementById('notaProfesorTextarea');
    if (!textarea || !alumnoActualId) return;
    
    const contenido = textarea.value;
    if (notaAutoguardado === contenido) return;
    
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    const { data: existente } = await supabase
        .from('comentarios_profesor')
        .select('id')
        .eq('alumno_id', alumnoActualId)
        .eq('clase_id', `clase${claseId}`)
        .maybeSingle();
    
    if (existente) {
        await supabase
            .from('comentarios_profesor')
            .update({ comentario: contenido, updated_at: new Date() })
            .eq('id', existente.id);
    } else if (contenido.trim()) {
        await supabase
            .from('comentarios_profesor')
            .insert([{
                alumno_id: alumnoActualId,
                clase_id: `clase${claseId}`,
                comentario: contenido
            }]);
    }
    
    notaAutoguardado = contenido;
}

// ===== RENDERIZAR CLASE =====
function renderizarClase() {
    const container = document.getElementById('clase-container');
    if (!container || !claseData) return;
    
    let selectorAlumnoHtml = '';
    if (!alumnoActualId) {
        selectorAlumnoHtml = `
            <div class="progress-card" style="margin-bottom: var(--spacing-4); background: var(--primary-bg);">
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <span>👨‍🎓 Alumno:</span>
                    <select id="selectorAlumno" style="flex: 1; padding: 8px; border-radius: 8px;">
                        <option value="">Seleccionar alumno...</option>
                    </select>
                    <button id="btnSeleccionarAlumno" class="btn-primary">Seleccionar</button>
                </div>
            </div>
        `;
    } else {
        selectorAlumnoHtml = `
            <div class="progress-card" style="margin-bottom: var(--spacing-4); background: var(--primary-bg);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <span>👨‍🎓 Alumno actual: <strong>${escapeHtml(alumnoActualNombre)}</strong></span>
                    <button id="btnCambiarAlumno" class="btn-secondary">Cambiar alumno</button>
                </div>
            </div>
        `;
    }
    
    let bloquesHtml = '';
    if (claseData.bloques && Array.isArray(claseData.bloques)) {
        claseData.bloques.forEach((bloque, index) => {
            let contenidoBloque = '';
            if (bloque.contenido) {
                contenidoBloque = bloque.contenido;
            } else if (bloque.subtitulos && bloque.subtitulos.length > 0) {
                contenidoBloque = `<ul class="lista-subtemas">${bloque.subtitulos.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`;
            }
            
            const duracionBloque = bloque.duracion || 0;
            const timerId = `timer-${index}`;
            
            bloquesHtml += `
                <div class="bloque-tema" id="bloque-${index}">
                    <div class="bloque-titulo" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <span>${escapeHtml(bloque.nombre)}</span>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            ${duracionBloque > 0 ? `
                            <div class="timer-en-header" style="display: flex; gap: 6px; align-items: center;">
                                <span id="${timerId}" class="timer-display-header" style="font-family: monospace; font-size: 0.85rem; font-weight: bold; background: var(--gray-200); padding: 2px 8px; border-radius: 20px; min-width: 55px; text-align: center;">${formatTiempoInicial(duracionBloque * 60)}</span>
                                <button class="btn-timer-action btn-iniciar-timer" data-bloque="${index}" data-duracion="${duracionBloque}" data-timer-id="${timerId}" style="padding: 2px 6px; font-size: 10px;">▶</button>
                                <button class="btn-timer-action btn-pausar-timer" data-bloque="${index}" data-timer-id="${timerId}" style="display: none; padding: 2px 6px; font-size: 10px;">⏸</button>
                                <button class="btn-timer-action btn-reanudar-timer" data-bloque="${index}" data-timer-id="${timerId}" style="display: none; padding: 2px 6px; font-size: 10px;">▶</button>
                                <button class="btn-timer-action btn-detener-timer" data-bloque="${index}" data-timer-id="${timerId}" style="display: none; padding: 2px 6px; font-size: 10px;">⏹</button>
                            </div>
                            ` : ''}
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </div>
                    <div class="bloque-contenido-alumno">
                        ${contenidoBloque}
                    </div>
                </div>
            `;
        });
    }
    
    let palabrasHtml = '';
    if (claseData.palabrasClave && Array.isArray(claseData.palabrasClave)) {
        palabrasHtml = `<ul class="lista-subtemas">${claseData.palabrasClave.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>`;
    }
    
    let videosHtml = '';
    if (claseData.videos && Array.isArray(claseData.videos)) {
        videosHtml = `<div class="videos-container">${claseData.videos.map(v => {
            const titulo = typeof v === 'object' ? v.titulo : v;
            const url = typeof v === 'object' ? v.url : '#';
            return `<a href="${url}" class="video-link" target="_blank" rel="noopener noreferrer"><i class="fab fa-youtube"></i> <span>${escapeHtml(titulo)}</span></a>`;
        }).join('')}</div>`;
    }
    
    const html = `
        ${selectorAlumnoHtml}
        
        <div class="progress-card">
            <div class="progress-header">
                <h2 class="progress-title">Clase ${claseData.numero}: ${escapeHtml(claseData.titulo)}</h2>
                <div>
                    <button id="btnMarcarCompletada" class="btn-primary" onclick="window.marcarClaseComoVista()">📌 Marcar clase como vista</button>
                    <button id="btnVolver" class="btn-secondary">← Volver</button>
                </div>
            </div>
            <p class="clase-capitulo">📘 ${escapeHtml(claseData.capitulo)}</p>
            <p class="clase-duracion"><i class="fas fa-clock"></i> Duración total: ${claseData.duracion} min</p>
        </div>
        
        <div class="progress-card">
            <h3>🎯 Objetivo de la clase</h3>
            <p>${escapeHtml(claseData.objetivo)}</p>
            
            <h3>📚 Palabras clave</h3>
            ${palabrasHtml}
            
            <h3>📋 Temas de la clase</h3>
            <div class="bloques-container">
                ${bloquesHtml}
            </div>
            
            <h3>✍️ Práctica de la semana</h3>
            <div class="practica-card">
                <p>${escapeHtml(claseData.practicaSemana)}</p>
                <p class="practica-tip"><i class="fas fa-lightbulb"></i> ${escapeHtml(claseData.practicaTip)}</p>
            </div>
            
            <h3>📺 Videos recomendados</h3>
            ${videosHtml}
        </div>
    `;
    
    container.innerHTML = html;
    
    document.getElementById('btnVolver')?.addEventListener('click', () => {
        if (notaAutoguardado !== undefined) {
            guardarNotaAutomatico();
        }
        window.location.href = 'curso.html';
    });
    
    document.getElementById('btnCambiarAlumno')?.addEventListener('click', () => {
        if (notaAutoguardado !== undefined) {
            guardarNotaAutomatico();
        }
        window.location.href = 'alumnos.html';
    });
    
    if (!alumnoActualId) {
        cargarSelectorAlumnos();
    }
    
    document.querySelectorAll('.bloque-tema').forEach(bloque => {
        const titulo = bloque.querySelector('.bloque-titulo');
        titulo?.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-timer-action') ||
                e.target.classList.contains('btn-iniciar-timer') ||
                e.target.classList.contains('btn-pausar-timer') ||
                e.target.classList.contains('btn-reanudar-timer') ||
                e.target.classList.contains('btn-detener-timer')) {
                return;
            }
            bloque.classList.toggle('abierto');
        });
    });
    
    inicializarTimers();
    
    if (alumnoActualId) {
        crearModalNotasLateral();
        crearBotonNotasFlotante();
    }
}

function formatTiempoInicial(segundos) {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function crearModalNotasLateral() {
    if (document.getElementById('modalNotasLateral')) return;
    
    const modalHTML = `
        <div id="modalNotasLateral" class="modal-apuntes-lateral" style="z-index: 1300;">
            <div class="modal-apuntes-overlay"></div>
            <div class="modal-apuntes-content">
                <div class="modal-apuntes-header">
                    <h3><i class="fas fa-sticky-note"></i> Notas sobre ${escapeHtml(alumnoActualNombre)}</h3>
                    <button id="btnCerrarNotasLateral" class="btn-cerrar-apuntes">&times;</button>
                </div>
                <div class="modal-apuntes-body">
                    <textarea id="notaProfesorTextarea" class="apuntes-textarea" placeholder="Escribe notas sobre el alumno durante la clase...\nSe guardan automáticamente al cerrar.">${notaAutoguardado || ''}</textarea>
                </div>
                <div class="modal-apuntes-footer">
                    <small>💾 Se guardan automáticamente</small>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const cerrarYGuardar = async () => {
        await guardarNotaAutomatico();
        document.getElementById('modalNotasLateral')?.classList.remove('active');
    };
    
    document.getElementById('btnCerrarNotasLateral')?.addEventListener('click', cerrarYGuardar);
    document.getElementById('modalNotasLateral')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-apuntes-overlay')) {
            cerrarYGuardar();
        }
    });
    
    const textarea = document.getElementById('notaProfesorTextarea');
    let timeoutGuardar;
    textarea?.addEventListener('input', () => {
        clearTimeout(timeoutGuardar);
        timeoutGuardar = setTimeout(() => {
            guardarNotaAutomatico();
        }, 2000);
    });
}

async function cargarSelectorAlumnos() {
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    const { data: alumnos } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('rol', 'alumno')
        .order('nombre');
    
    const selector = document.getElementById('selectorAlumno');
    if (selector && alumnos) {
        selector.innerHTML = '<option value="">Seleccionar alumno...</option>' +
            alumnos.map(a => `<option value="${a.id}" data-nombre="${escapeHtml(a.nombre)}">${escapeHtml(a.nombre)}</option>`).join('');
    }
    
    document.getElementById('btnSeleccionarAlumno')?.addEventListener('click', () => {
        const selectedOption = selector.options[selector.selectedIndex];
        const alumnoId = selector.value;
        const alumnoNombre = selectedOption?.getAttribute('data-nombre') || '';
        if (alumnoId) {
            window.location.href = `clase-preview.html?id=${claseId}&alumnoId=${alumnoId}&alumnoNombre=${encodeURIComponent(alumnoNombre)}`;
        } else {
            window.modal.mostrar('Selecciona un alumno', 'warning');
        }
    });
}

function inicializarTimers() {
    document.querySelectorAll('.btn-iniciar-timer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bloqueIndex = parseInt(btn.getAttribute('data-bloque'));
            const duracion = parseInt(btn.getAttribute('data-duracion'));
            const timerId = btn.getAttribute('data-timer-id');
            
            if (timersActivos[bloqueIndex]) {
                clearInterval(timersActivos[bloqueIndex].interval);
            }
            
            const displayElement = document.getElementById(timerId);
            let tiempoRestante = duracion * 60;
            
            const actualizar = () => {
                const mins = Math.floor(tiempoRestante / 60);
                const secs = tiempoRestante % 60;
                displayElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                if (tiempoRestante <= 180) {
                    displayElement.style.animation = 'parpadeo 0.5s ease-in-out infinite';
                    displayElement.style.backgroundColor = '#dc2626';
                    displayElement.style.color = '#ffffff';
                }
            };
            
            actualizar();
            
            const intervalo = setInterval(() => {
                if (tiempoRestante > 0) {
                    tiempoRestante--;
                    const mins = Math.floor(tiempoRestante / 60);
                    const secs = tiempoRestante % 60;
                    displayElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    if (tiempoRestante <= 180) {
                        displayElement.style.animation = 'parpadeo 0.5s ease-in-out infinite';
                        displayElement.style.backgroundColor = '#dc2626';
                        displayElement.style.color = '#ffffff';
                    }
                    if (tiempoRestante === 0) {
                        clearInterval(intervalo);
                        delete timersActivos[bloqueIndex];
                        window.modal.mostrar(`✅ Tiempo completado: ${claseData.bloques[bloqueIndex].nombre}`, 'exito');
                        const siguienteBloque = bloqueIndex + 1;
                        const siguienteBtnIniciar = document.querySelector(`.btn-iniciar-timer[data-bloque="${siguienteBloque}"]`);
                        if (siguienteBtnIniciar && claseData.bloques[siguienteBloque]) {
                            setTimeout(() => {
                                window.modal.mostrar(`⏭️ Iniciando: ${claseData.bloques[siguienteBloque].nombre}`, 'info', 2000);
                                siguienteBtnIniciar.click();
                            }, 1500);
                        }
                    }
                }
            }, 1000);
            
            timersActivos[bloqueIndex] = { interval: intervalo };
            
            btn.style.display = 'none';
            const btnPausar = document.querySelector(`.btn-pausar-timer[data-bloque="${bloqueIndex}"]`);
            const btnDetener = document.querySelector(`.btn-detener-timer[data-bloque="${bloqueIndex}"]`);
            if (btnPausar) btnPausar.style.display = 'inline-flex';
            if (btnDetener) btnDetener.style.display = 'inline-flex';
        });
    });
    
    document.querySelectorAll('.btn-pausar-timer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bloqueIndex = btn.getAttribute('data-bloque');
            if (timersActivos[bloqueIndex]) {
                clearInterval(timersActivos[bloqueIndex].interval);
                timersActivos[bloqueIndex].interval = null;
            }
            btn.style.display = 'none';
            const btnReanudar = document.querySelector(`.btn-reanudar-timer[data-bloque="${bloqueIndex}"]`);
            if (btnReanudar) btnReanudar.style.display = 'inline-flex';
        });
    });
    
    document.querySelectorAll('.btn-reanudar-timer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bloqueIndex = btn.getAttribute('data-bloque');
            const timerId = btn.getAttribute('data-timer-id');
            const displayElement = document.getElementById(timerId);
            
            if (timersActivos[bloqueIndex] && !timersActivos[bloqueIndex].interval) {
                let tiempoRestante = 0;
                const partes = displayElement.textContent.split(':');
                tiempoRestante = parseInt(partes[0]) * 60 + parseInt(partes[1]);
                timersActivos[bloqueIndex].tiempo = tiempoRestante;
                
                const intervalo = setInterval(() => {
                    if (tiempoRestante > 0) {
                        tiempoRestante--;
                        timersActivos[bloqueIndex].tiempo = tiempoRestante;
                        const mins = Math.floor(tiempoRestante / 60);
                        const secs = tiempoRestante % 60;
                        displayElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                        if (tiempoRestante <= 180) {
                            displayElement.style.animation = 'parpadeo 0.5s ease-in-out infinite';
                            displayElement.style.backgroundColor = '#dc2626';
                            displayElement.style.color = '#ffffff';
                        }
                        if (tiempoRestante === 0) {
                            clearInterval(intervalo);
                            delete timersActivos[bloqueIndex];
                            window.modal.mostrar(`✅ Tiempo completado: ${claseData.bloques[bloqueIndex].nombre}`, 'exito');
                            const siguienteBloque = parseInt(bloqueIndex) + 1;
                            const siguienteBtnIniciar = document.querySelector(`.btn-iniciar-timer[data-bloque="${siguienteBloque}"]`);
                            if (siguienteBtnIniciar && claseData.bloques[siguienteBloque]) {
                                setTimeout(() => {
                                    window.modal.mostrar(`⏭️ Iniciando: ${claseData.bloques[siguienteBloque].nombre}`, 'info', 2000);
                                    siguienteBtnIniciar.click();
                                }, 1500);
                            }
                        }
                    }
                }, 1000);
                
                timersActivos[bloqueIndex].interval = intervalo;
            }
            
            btn.style.display = 'none';
            const btnPausar = document.querySelector(`.btn-pausar-timer[data-bloque="${bloqueIndex}"]`);
            if (btnPausar) btnPausar.style.display = 'inline-flex';
        });
    });
    
    document.querySelectorAll('.btn-detener-timer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bloqueIndex = btn.getAttribute('data-bloque');
            if (timersActivos[bloqueIndex]) {
                clearInterval(timersActivos[bloqueIndex].interval);
                delete timersActivos[bloqueIndex];
            }
            const timerId = btn.getAttribute('data-timer-id');
            const displayElement = document.getElementById(timerId);
            const duracion = parseInt(document.querySelector(`.btn-iniciar-timer[data-bloque="${bloqueIndex}"]`).getAttribute('data-duracion'));
            displayElement.textContent = formatTiempoInicial(duracion * 60);
            displayElement.style.animation = 'none';
            displayElement.style.backgroundColor = '';
            displayElement.style.color = '';
            
            btn.style.display = 'none';
            const btnIniciar = document.querySelector(`.btn-iniciar-timer[data-bloque="${bloqueIndex}"]`);
            const btnPausar = document.querySelector(`.btn-pausar-timer[data-bloque="${bloqueIndex}"]`);
            const btnReanudar = document.querySelector(`.btn-reanudar-timer[data-bloque="${bloqueIndex}"]`);
            if (btnIniciar) btnIniciar.style.display = 'inline-flex';
            if (btnPausar) btnPausar.style.display = 'none';
            if (btnReanudar) btnReanudar.style.display = 'none';
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function crearBotonNotasFlotante() {
    const btnExistente = document.getElementById('btnNotasFlotante');
    if (btnExistente) btnExistente.remove();
    
    const btn = document.createElement('button');
    btn.id = 'btnNotasFlotante';
    btn.innerHTML = '✏️';
    btn.title = 'Notas sobre el alumno';
    btn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--primary);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 100;
        transition: all 0.3s ease;
    `;
    
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.05)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
    });
    
    btn.addEventListener('click', () => {
        const modal = document.getElementById('modalNotasLateral');
        if (modal) {
            modal.classList.add('active');
        }
    });
    
    document.body.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', initPreview);