// ===== CLASE DINÁMICA - CARGA DESDE JSON =====

let claseId = null;
let claseData = null;

// Obtener el ID de la clase desde la URL (ej: ?id=clase1)
function obtenerIdClase() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Cargar los datos de la clase desde el JSON
async function cargarDatosClase() {
    try {
        const response = await fetch('data/clases.json');
        const todasLasClases = await response.json();
        
        claseId = obtenerIdClase();
        
        if (!claseId || !todasLasClases[claseId]) {
            mostrarErrorClaseNoEncontrada();
            return false;
        }
        
        claseData = todasLasClases[claseId];
        return true;
        
    } catch (error) {
        console.error('Error cargando clases:', error);
        mostrarErrorCarga();
        return false;
    }
}

function mostrarErrorClaseNoEncontrada() {
    const container = document.getElementById('clase-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--danger-red);"></i>
                <h2>Clase no encontrada</h2>
                <p>La clase que buscas no existe. Verifica el enlace.</p>
                <a href="curso.html" class="btn-primary" style="margin-top: 20px;">Volver al índice</a>
            </div>
        `;
    }
}

function mostrarErrorCarga() {
    const container = document.getElementById('clase-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-exclamation-circle" style="font-size: 4rem; color: var(--danger-red);"></i>
                <h2>Error al cargar</h2>
                <p>No se pudo cargar el contenido de la clase. Intenta recargar la página.</p>
                <a href="curso.html" class="btn-primary" style="margin-top: 20px;">Volver al índice</a>
            </div>
        `;
    }
}

// Renderizar el contenido de la clase
function renderizarClase() {
    if (!claseData) return;
    
    document.title = `Clase ${claseData.numero}: ${claseData.titulo} | ELARA METHOD`;
    document.getElementById('clase-titulo').innerHTML = `<i class="fas fa-play-circle"></i> Clase ${claseData.numero}: ${claseData.titulo}`;
    document.getElementById('clase-capitulo').textContent = claseData.capitulo;
    document.getElementById('clase-duracion').innerHTML = `<i class="fas fa-clock"></i> Duración: ${claseData.duracion} min`;
    document.getElementById('clase-objetivo').textContent = claseData.objetivo;
    
    const palabrasClaveUl = document.getElementById('clase-palabras-clave');
    palabrasClaveUl.innerHTML = '';
    claseData.palabrasClave.forEach(palabra => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${palabra.split(' - ')[0]}</strong> - ${palabra.split(' - ')[1]}`;
        palabrasClaveUl.appendChild(li);
    });
    
    document.getElementById('practica-texto').innerHTML = claseData.practicaSemana;
    document.getElementById('practica-tip').innerHTML = `<i class="fas fa-lightbulb"></i> ${claseData.practicaTip}`;
    
    const videosContainer = document.getElementById('videos-container');
    if (videosContainer) {
        videosContainer.innerHTML = '';
        claseData.videos.forEach(video => {
            const videoLink = document.createElement('a');
            videoLink.href = video.url;
            videoLink.className = 'video-link';
            videoLink.target = '_blank';
            videoLink.innerHTML = `<i class="fab fa-youtube"></i> <span>${video.titulo}</span>`;
            videosContainer.appendChild(videoLink);
        });
    }

    renderizarBloques();
}

function renderizarBloques() {
    const container = document.getElementById('bloques-container');
    if (!container) return;
    
    let html = '';
    claseData.bloques.forEach((bloque, index) => {
        html += `
            <div class="bloque-item" data-bloque="${index}">
                <div class="bloque-header">
                    <span class="bloque-nombre">
                        <i class="fas fa-clock"></i> ${bloque.nombre}
                    </span>
                    <div class="timer-controls">
                        <span class="timer-display" id="timer-${index}">${formatearTiempo(bloque.duracion * 60)}</span>
                        <button class="timer-btn start-btn" data-idx="${index}"><i class="fas fa-play"></i></button>
                        <button class="timer-btn reset-btn" data-idx="${index}"><i class="fas fa-undo-alt"></i></button>
                    </div>
                </div>
                <div class="bloque-contenido" id="contenido-${index}">
                    ${bloque.contenido}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    
    claseData.bloques.forEach((bloque, index) => {
        inicializarTimer(index, bloque.duracion);
        inicializarDespliegue(index);
    });
}

function inicializarDespliegue(index) {
    const bloqueItem = document.querySelector(`.bloque-item[data-bloque="${index}"]`);
    if (!bloqueItem) return;
    
    const header = bloqueItem.querySelector('.bloque-header');
    const contenido = document.getElementById(`contenido-${index}`);
    
    if (header && contenido) {
        header.addEventListener('click', (e) => {
            if (e.target.closest('.timer-controls')) return;
            
            const estaAbierto = contenido.classList.contains('abierto');
            document.querySelectorAll('.bloque-contenido').forEach(bloque => {
                bloque.classList.remove('abierto');
            });
            if (!estaAbierto) {
                contenido.classList.add('abierto');
            }
        });
    }
}

function inicializarTimer(index, duracionMinutos) {
    const display = document.getElementById(`timer-${index}`);
    const startBtn = document.querySelector(`.start-btn[data-idx="${index}"]`);
    const resetBtn = document.querySelector(`.reset-btn[data-idx="${index}"]`);
    
    if (!display) return;
    
    let tiempoRestante = duracionMinutos * 60;
    let tiempoTotal = duracionMinutos * 60;
    let intervalo = null;
    let corriendo = false;
    let pausado = false;
    
    function obtenerColor(progreso) {
        const hue = 120 * progreso;
        return `hsl(${hue}, 70%, 55%)`;
    }
    
    function actualizarDisplay() {
        if (display) {
            const minutos = Math.floor(tiempoRestante / 60);
            const segundos = tiempoRestante % 60;
            display.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
            const progreso = tiempoRestante / tiempoTotal;
            display.style.color = obtenerColor(progreso);
            display.style.transition = 'color 0.1s ease';
            
            if (tiempoRestante <= 120 && tiempoRestante > 0) {
                display.classList.add('parpadeo');
            } else {
                display.classList.remove('parpadeo');
            }
        }
    }
    
    function avanzarAlSiguienteBloque() {
        if (intervalo) {
            clearInterval(intervalo);
            corriendo = false;
            pausado = false;
        }
        
        const bloques = document.querySelectorAll('.bloque-item');
        const siguienteBloque = bloques[index + 1];
        
        if (siguienteBloque) {
            const siguienteStartBtn = siguienteBloque.querySelector('.start-btn');
            if (siguienteStartBtn) {
                siguienteStartBtn.click();
            }
        }
    }
    
    function iniciarTimer() {
        if (corriendo) return;
        if (tiempoRestante <= 0) return;
        
        corriendo = true;
        pausado = false;
        
        const bloqueItem = document.querySelector(`.bloque-item[data-bloque="${index}"]`);
        if (bloqueItem) bloqueItem.classList.add('activo');
        
        intervalo = setInterval(() => {
            if (tiempoRestante > 0 && !pausado) {
                tiempoRestante--;
                actualizarDisplay();
            }
            
            if (tiempoRestante === 0) {
                clearInterval(intervalo);
                corriendo = false;
                pausado = false;
                actualizarDisplay();
                
                if (bloqueItem) bloqueItem.classList.remove('activo');
                avanzarAlSiguienteBloque();
            }
        }, 1000);
    }
    
    function pausarTimer() {
        if (corriendo && !pausado) {
            pausado = true;
            const bloqueItem = document.querySelector(`.bloque-item[data-bloque="${index}"]`);
            if (bloqueItem) bloqueItem.style.opacity = '0.7';
        }
    }
    
    function reanudarTimer() {
        if (corriendo && pausado) {
            pausado = false;
            const bloqueItem = document.querySelector(`.bloque-item[data-bloque="${index}"]`);
            if (bloqueItem) bloqueItem.style.opacity = '1';
        }
    }
    
    function resetearTimer() {
        if (intervalo) {
            clearInterval(intervalo);
            corriendo = false;
            pausado = false;
        }
        tiempoRestante = tiempoTotal;
        actualizarDisplay();
        
        const bloqueItem = document.querySelector(`.bloque-item[data-bloque="${index}"]`);
        if (bloqueItem) bloqueItem.classList.remove('activo');
    }
    
    if (startBtn) {
        startBtn.onclick = (e) => {
            e.stopPropagation();
            if (pausado) {
                reanudarTimer();
            } else {
                iniciarTimer();
            }
        };
    }
    
    if (resetBtn) {
        resetBtn.onclick = (e) => {
            e.stopPropagation();
            resetearTimer();
        };
    }
    
    const timerControls = display?.parentElement;
    if (timerControls && !timerControls.querySelector('.pause-btn')) {
        const pauseBtn = document.createElement('button');
        pauseBtn.className = 'timer-btn pause-btn';
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        pauseBtn.onclick = (e) => {
            e.stopPropagation();
            pausarTimer();
        };
        startBtn?.insertAdjacentElement('afterend', pauseBtn);
    }
    
    actualizarDisplay();
}

function formatearTiempo(segundos) {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
}

// Mostrar datos del alumno actual (solo para UI, el progreso viene de Supabase)
function mostrarAlumnoActual() {
    const alumnoActual = localStorage.getItem('alumno_actual');
    const container = document.getElementById('alumno-bar-container');
    if (!container) return;
    
    if (!alumnoActual) {
        container.innerHTML = `
            <div class="alumno-bar">
                <div class="alumno-info">
                    <div class="alumno-avatar"><i class="fas fa-eye"></i></div>
                    <div class="alumno-datos">
                        <h4>Modo visitante</h4>
                        <p>Explorando el curso sin registro</p>
                    </div>
                </div>
                <button id="btnIrARegistro" class="btn-cambiar-alumno"><i class="fas fa-user-plus"></i> Registrar alumno</button>
            </div>
        `;
        document.getElementById('btnIrARegistro')?.addEventListener('click', () => {
            window.location.href = 'alumno.html';
        });
        return;
    }
    
    // Cargar progreso desde Supabase para mostrar en la barra
    cargarProgresoParaBarra(alumnoActual);
    
    container.innerHTML = `
        <div class="alumno-bar">
            <div class="alumno-info">
                <div class="alumno-avatar"><i class="fas fa-user-graduate"></i></div>
                <div class="alumno-datos">
                    <h4>${alumnoActual}</h4>
                    <p>Progreso: <span id="barra-progreso-texto">cargando...</span></p>
                    <div class="barra-progreso">
                        <div class="barra-progreso-fill" id="barra-progreso-fill"></div>
                    </div>
                </div>
            </div>
            <button id="btnCambiarAlumno" class="btn-cambiar-alumno"><i class="fas fa-exchange-alt"></i> Cambiar alumno</button>
        </div>
    `;
    
    document.getElementById('btnCambiarAlumno')?.addEventListener('click', () => {
        localStorage.removeItem('alumno_actual');
        window.location.href = 'alumno-lista.html';
    });
}

async function cargarProgresoParaBarra(alumnoActual) {
    try {
        const { data, error } = await supabaseClient
            .from('alumnos')
            .select('progreso')
            .eq('usuario', alumnoActual)
            .single();
        
        if (error) return;
        
        const completadas = data?.progreso?.completadas || [];
        const totalClases = 14;
        const porcentaje = (completadas.length / totalClases) * 100;
        
        const textoElement = document.getElementById('barra-progreso-texto');
        const fillElement = document.getElementById('barra-progreso-fill');
        
        if (textoElement) textoElement.textContent = `${completadas.length}/${totalClases}`;
        if (fillElement) fillElement.style.width = `${porcentaje}%`;
        
    } catch (err) {
        console.error('Error:', err);
    }
}

// ===== NOTAS DEL PROFESOR (SUPABASE) =====

async function cargarComentariosGuardados() {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual || !claseId) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('alumnos')
            .select('notas_profesor')
            .eq('usuario', alumnoActual)
            .single();
        
        if (error) {
            console.error('Error cargando notas:', error);
            return;
        }
        
        if (data && data.notas_profesor && data.notas_profesor[claseId]) {
            document.getElementById('comentariosClase').value = data.notas_profesor[claseId];
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

async function guardarComentarios() {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual) {
        mostrarModalConfirmacion('Error', 'No hay alumno seleccionado', 'fa-exclamation-circle', 'icono-peligro', null);
        return;
    }
    
    const comentario = document.getElementById('comentariosClase').value;
    
    try {
        const { data, error } = await supabaseClient
            .from('alumnos')
            .select('notas_profesor')
            .eq('usuario', alumnoActual)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error al obtener notas:', error);
            mostrarModalConfirmacion('Error', 'Error al obtener notas', 'fa-exclamation-circle', 'icono-peligro', null);
            return;
        }
        
        const notasProfesor = data?.notas_profesor || {};
        notasProfesor[claseId] = comentario;
        
        const { error: updateError } = await supabaseClient
            .from('alumnos')
            .update({ notas_profesor: notasProfesor })
            .eq('usuario', alumnoActual);
        
        if (updateError) {
            console.error('Error al guardar:', updateError);
            mostrarModalConfirmacion('Error', 'Error al guardar notas', 'fa-exclamation-circle', 'icono-peligro', null);
            return;
        }
        
        mostrarModalConfirmacion('Éxito', 'Notas guardadas correctamente', 'fa-check-circle', 'icono-exito', null);
        
    } catch (err) {
        console.error('Error:', err);
        mostrarModalConfirmacion('Error', 'Error inesperado', 'fa-exclamation-circle', 'icono-peligro', null);
    }
}

// ===== PROGRESO (SUPABASE) =====

async function marcarClaseCompletada() {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual) {
        mostrarModalConfirmacion('Error', 'No hay alumno seleccionado', 'fa-exclamation-circle', 'icono-peligro', null);
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('alumnos')
            .select('progreso')
            .eq('usuario', alumnoActual)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error al obtener progreso:', error);
            mostrarModalConfirmacion('Error', 'Error al obtener progreso', 'fa-exclamation-circle', 'icono-peligro', null);
            return;
        }
        
        const progreso = data?.progreso || { completadas: [] };
        
        if (progreso.completadas.includes(claseId)) {
            mostrarModalConfirmacion('Info', 'Ya habías completado esta clase', 'fa-info-circle', 'icono-exito', null);
            return;
        }
        
        progreso.completadas.push(claseId);
        
        const { error: updateError } = await supabaseClient
            .from('alumnos')
            .update({ progreso: progreso })
            .eq('usuario', alumnoActual);
        
        if (updateError) {
            console.error('Error al guardar progreso:', updateError);
            mostrarModalConfirmacion('Error', 'Error al guardar progreso', 'fa-exclamation-circle', 'icono-peligro', null);
            return;
        }
        
        const badgeContainer = document.getElementById('completada-badge-container');
        if (badgeContainer) {
            badgeContainer.innerHTML = '<div class="completada-badge"><i class="fas fa-check-circle"></i> ✅ Clase completada</div>';
        }
        
        const btnCompletada = document.getElementById('btnMarcarCompletada');
        if (btnCompletada) {
            btnCompletada.disabled = true;
            btnCompletada.style.opacity = '0.5';
        }
        
        // Actualizar la barra de progreso
        cargarProgresoParaBarra(alumnoActual);
        
        mostrarModalConfirmacion('Felicidades', `Has completado la clase "${claseData.titulo}"`, 'fa-check-circle', 'icono-exito', null);
        
    } catch (err) {
        console.error('Error:', err);
        mostrarModalConfirmacion('Error', 'Error inesperado', 'fa-exclamation-circle', 'icono-peligro', null);
    }
}

async function verificarClaseCompletada() {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual || !claseId) return false;
    
    try {
        const { data, error } = await supabaseClient
            .from('alumnos')
            .select('progreso')
            .eq('usuario', alumnoActual)
            .single();
        
        if (error) {
            console.error('Error al verificar progreso:', error);
            return false;
        }
        
        const completadas = data?.progreso?.completadas || [];
        const estaCompletada = completadas.includes(claseId);
        
        if (estaCompletada) {
            const badgeContainer = document.getElementById('completada-badge-container');
            if (badgeContainer) {
                badgeContainer.innerHTML = '<div class="completada-badge"><i class="fas fa-check-circle"></i> ✅ Clase completada</div>';
            }
            const btnCompletada = document.getElementById('btnMarcarCompletada');
            if (btnCompletada) {
                btnCompletada.disabled = true;
                btnCompletada.style.opacity = '0.5';
            }
        }
        return estaCompletada;
        
    } catch (err) {
        console.error('Error:', err);
        return false;
    }
}

// Inicializar la página
async function inicializar() {
    const cargado = await cargarDatosClase();
    if (!cargado) return;
    
    mostrarAlumnoActual();
    renderizarClase();
    await cargarComentariosGuardados();
    await verificarClaseCompletada();
    
    document.getElementById('btnGuardarComentarios')?.addEventListener('click', guardarComentarios);
    document.getElementById('btnMarcarCompletada')?.addEventListener('click', marcarClaseCompletada);
}

inicializar();