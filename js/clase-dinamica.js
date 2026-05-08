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
    
    // Título y encabezado
    document.title = `Clase ${claseData.numero}: ${claseData.titulo} | ELARA METHOD`;
    document.getElementById('clase-titulo').innerHTML = `<i class="fas fa-play-circle"></i> Clase ${claseData.numero}: ${claseData.titulo}`;
    document.getElementById('clase-capitulo').textContent = claseData.capitulo;
    document.getElementById('clase-duracion').innerHTML = `<i class="fas fa-clock"></i> Duración: ${claseData.duracion} min`;
    
    // Objetivo
    document.getElementById('clase-objetivo').textContent = claseData.objetivo;
    
    // Palabras clave
    const palabrasClaveUl = document.getElementById('clase-palabras-clave');
    palabrasClaveUl.innerHTML = '';
    claseData.palabrasClave.forEach(palabra => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${palabra.split(' - ')[0]}</strong> - ${palabra.split(' - ')[1]}`;
        palabrasClaveUl.appendChild(li);
    });
    
    // Práctica de la semana
    document.getElementById('practica-texto').innerHTML = claseData.practicaSemana;
    document.getElementById('practica-tip').innerHTML = `<i class="fas fa-lightbulb"></i> ${claseData.practicaTip}`;
    
    // Videos
    const videosContainer = document.getElementById('videos-container');
    videosContainer.innerHTML = '';
    claseData.videos.forEach(video => {
        const videoLink = document.createElement('a');
        videoLink.href = '#';
        videoLink.className = 'video-link';
        videoLink.target = '_blank';
        videoLink.innerHTML = `<i class="fab fa-youtube"></i> <span>${video}</span>`;
        videosContainer.appendChild(videoLink);
    });
    
    // Bloques desplegables
    renderizarBloques();
}

// Configuración de bloques (se genera desde claseData)
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
    
    // Inicializar timers y eventos de despliegue
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
            contenido.classList.toggle('abierto');
        });
    }
}

function inicializarTimer(index, duracionMinutos) {
    const display = document.getElementById(`timer-${index}`);
    const startBtn = document.querySelector(`.start-btn[data-idx="${index}"]`);
    const resetBtn = document.querySelector(`.reset-btn[data-idx="${index}"]`);
    
    if (!display) return;
    
    let tiempoRestante = duracionMinutos * 60;
    let intervalo = null;
    let corriendo = false;
    
    function actualizarDisplay() {
        if (display) {
            display.textContent = formatearTiempo(tiempoRestante);
            if (tiempoRestante <= 60 && tiempoRestante > 0) {
                display.classList.add('rojo');
                if (tiempoRestante <= 30) {
                    display.classList.add('parpadeo');
                } else {
                    display.classList.remove('parpadeo');
                }
            } else {
                display.classList.remove('rojo');
                display.classList.remove('parpadeo');
            }
        }
    }
    
    function iniciarTimer() {
        if (corriendo) return;
        if (tiempoRestante <= 0) return;
        
        corriendo = true;
        intervalo = setInterval(() => {
            if (tiempoRestante > 0) {
                tiempoRestante--;
                actualizarDisplay();
            }
            if (tiempoRestante === 0) {
                clearInterval(intervalo);
                corriendo = false;
                actualizarDisplay();
            }
        }, 1000);
    }
    
    function resetearTimer() {
        if (intervalo) clearInterval(intervalo);
        corriendo = false;
        tiempoRestante = duracionMinutos * 60;
        actualizarDisplay();
    }
    
    if (startBtn) startBtn.onclick = (e) => {
        e.stopPropagation();
        iniciarTimer();
    };
    if (resetBtn) resetBtn.onclick = (e) => {
        e.stopPropagation();
        resetearTimer();
    };
    
    actualizarDisplay();
}

function formatearTiempo(segundos) {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
}

// Mostrar datos del alumno actual
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
    
    const alumnos = getAlumnos();
    const alumno = alumnos.find(a => a.nombre === alumnoActual);
    const progreso = getProgreso(alumnoActual);
    const totalClases = 14;
    const porcentaje = (progreso.completadas.length / totalClases) * 100;
    
    container.innerHTML = `
        <div class="alumno-bar">
            <div class="alumno-info">
                <div class="alumno-avatar"><i class="fas fa-user-graduate"></i></div>
                <div class="alumno-datos">
                    <h4>${alumnoActual}</h4>
                    <p>🎯 ${alumno?.objetivo || 'Sin objetivo'} | 📞 ${alumno?.telefono || 'Sin teléfono'}</p>
                </div>
            </div>
            <div class="alumno-progreso">
                <span style="font-size: 0.8rem;">Progreso: ${progreso.completadas.length}/${totalClases}</span>
                <div class="barra-progreso">
                    <div class="barra-progreso-fill" style="width: ${porcentaje}%;"></div>
                </div>
            </div>
            <button id="btnCambiarAlumno" class="btn-cambiar-alumno"><i class="fas fa-exchange-alt"></i> Cambiar alumno</button>
        </div>
    `;
    
    // CORRECCIÓN AQUÍ: cambiar alumno lleva a la lista, no al inicio
    document.getElementById('btnCambiarAlumno')?.addEventListener('click', () => {
        localStorage.removeItem('alumno_actual');
        window.location.href = 'alumno-lista.html';  // <-- ESTA ES LA LÍNEA CORREGIDA
    });
}

// Cargar comentarios guardados
function cargarComentariosGuardados() {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual || !claseId) return;
    
    const alumnos = getAlumnos();
    const alumno = alumnos.find(a => a.nombre === alumnoActual);
    if (alumno && alumno.comentariosPorClase && alumno.comentariosPorClase[claseId]) {
        document.getElementById('comentariosClase').value = alumno.comentariosPorClase[claseId];
    }
}

// Guardar comentarios
function guardarComentarios() {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual) {
        mostrarModalConfirmacion('Error', 'No hay alumno seleccionado', 'fa-exclamation-circle', 'icono-peligro', null);
        return;
    }
    
    const comentarios = document.getElementById('comentariosClase').value;
    const alumnos = getAlumnos();
    const index = alumnos.findIndex(a => a.nombre === alumnoActual);
    
    if (index !== -1) {
        if (!alumnos[index].comentariosPorClase) {
            alumnos[index].comentariosPorClase = {};
        }
        alumnos[index].comentariosPorClase[claseId] = comentarios;
        saveAlumnos(alumnos);
        mostrarModalConfirmacion('Éxito', 'Comentarios guardados', 'fa-check-circle', 'icono-exito', null);
    }
}

// Marcar clase como completada
function marcarClaseCompletada() {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual) {
        mostrarModalConfirmacion('Error', 'No hay alumno seleccionado', 'fa-exclamation-circle', 'icono-peligro', null);
        return;
    }
    
    const progreso = getProgreso(alumnoActual);
    if (!progreso.completadas.includes(claseId)) {
        progreso.completadas.push(claseId);
        progreso.ultimaClase = claseId;
        saveProgreso(alumnoActual, progreso);
        
        const badgeContainer = document.getElementById('completada-badge-container');
        if (badgeContainer) {
            badgeContainer.innerHTML = '<div class="completada-badge"><i class="fas fa-check-circle"></i> ✅ Clase marcada como completada</div>';
        }
        
        mostrarModalConfirmacion('Felicidades', `Has completado la clase "${claseData.titulo}"`, 'fa-check-circle', 'icono-exito', null);
    } else {
        mostrarModalConfirmacion('Info', `Ya habías completado esta clase`, 'fa-info-circle', 'icono-exito', null);
    }
}

// Verificar si la clase ya está completada
function verificarClaseCompletada() {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual || !claseId) return false;
    
    const progreso = getProgreso(alumnoActual);
    const estaCompletada = progreso.completadas.includes(claseId);
    
    if (estaCompletada) {
        const badgeContainer = document.getElementById('completada-badge-container');
        if (badgeContainer) {
            badgeContainer.innerHTML = '<div class="completada-badge"><i class="fas fa-check-circle"></i> ✅ Clase completada</div>';
        }
    }
    return estaCompletada;
}

// Inicializar la página
async function inicializar() {
    const cargado = await cargarDatosClase();
    if (!cargado) return;
    
    mostrarAlumnoActual();
    renderizarClase();
    cargarComentariosGuardados();
    verificarClaseCompletada();
    
    document.getElementById('btnGuardarComentarios')?.addEventListener('click', guardarComentarios);
    document.getElementById('btnMarcarCompletada')?.addEventListener('click', marcarClaseCompletada);
}

// Iniciar
inicializar();