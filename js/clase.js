// ===== LÓGICA PARA PÁGINAS DE CLASE =====

// Configuración de bloques con contenido
const bloquesConfig = [
    {
        nombre: "Bienvenida y presentación",
        duracion: 10,
        contenido: `<p>Te presentas y cuentas tu historia: <strong>la camisa rosada</strong>, el sobrepeso, el espejo, la decepción. Explicas que empezaste buscando estética y terminaste en salud y longevidad.</p>
        <p><strong>Puntos clave:</strong></p>
        <ul><li>Conectar emocionalmente con los alumnos</li><li>Mostrar que es posible cambiar a cualquier edad</li><li>La evolución del objetivo: estética → salud → longevidad</li></ul>`
    },
    {
        nombre: "Filosofía del curso",
        duracion: 15,
        contenido: `<p><strong>"Saber vs Entender"</strong> - Ejemplo: saber que hay que comer proteína vs entender que la proteína repara tejidos y evita pérdida de masa muscular.</p>
        <p><strong>Por qué entender potencia los resultados:</strong></p>
        <ul><li>Motivación intrínseca</li><li>Capacidad de tomar decisiones informadas</li><li>Mayor adherencia a largo plazo</li></ul>`
    },
    {
        nombre: "¿Cuál es tu objetivo? (Participación)",
        duracion: 20,
        contenido: `<p>Preguntas uno por uno: adelgazar, ganar músculo, revertir enfermedad (diabetes, hipertensión), longevidad, energía.</p>
        <p><strong>Dinámica:</strong></p>
        <ul><li>Cada alumno comparte su objetivo</li><li>Explicas que según eso ajustarás la alimentación</li><li>Anotas en la ficha de cada alumno</li></ul>`
    },
    {
        nombre: "La integralidad",
        duracion: 15,
        contenido: `<p>Los 4 pilares funcionan juntos. <strong>Metáfora de la silla de 4 patas</strong>. Si una falla, todo tambalea.</p>
        <p><strong>Los 4 pilares:</strong></p>
        <ul><li>Sueño - reparación nocturna</li><li>Mente - paz y claridad</li><li>Ejercicio - movimiento con propósito</li><li>Alimentación - nutrición inteligente</li></ul>`
    },
    {
        nombre: "Cierre y práctica semanal",
        duracion: 15,
        contenido: `<p>Resumen de la clase. Explicas la tarea para la semana: <strong>escribir cada día el objetivo y anotar una cosa que te acerque y una que te aleje</strong>.</p>
        <p>Respondes dudas finales.</p>`
    }
];

// Variables globales
let modalConfirmacion = null;

// Crear modal de confirmación (sin alert)
function crearModalConfirmacion() {
    if (document.getElementById('modalConfirmacion')) return;
    
    modalConfirmacion = document.createElement('div');
    modalConfirmacion.id = 'modalConfirmacion';
    modalConfirmacion.className = 'modal-confirmacion';
    modalConfirmacion.innerHTML = `
        <div class="modal-confirmacion-content">
            <i class="fas fa-check-circle"></i>
            <h3>¡Completado!</h3>
            <p id="modalConfirmacionMensaje">Operación realizada con éxito</p>
            <button id="btnCerrarModalConfirmacion">Aceptar</button>
        </div>
    `;
    document.body.appendChild(modalConfirmacion);
    
    document.getElementById('btnCerrarModalConfirmacion').onclick = () => {
        modalConfirmacion.style.display = 'none';
    };
    
    window.onclick = (event) => {
        if (event.target === modalConfirmacion) {
            modalConfirmacion.style.display = 'none';
        }
    };
}

function mostrarMensaje(mensaje) {
    if (!modalConfirmacion) crearModalConfirmacion();
    document.getElementById('modalConfirmacionMensaje').textContent = mensaje;
    modalConfirmacion.style.display = 'flex';
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
            window.location.href = '../alumno.html';
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
    
    document.getElementById('btnCambiarAlumno')?.addEventListener('click', () => {
        localStorage.removeItem('alumno_actual');
        window.location.href = '../alumno-lista.html';
    });
}

// Renderizar bloques desplegables
function renderizarBloques() {
    const container = document.getElementById('bloques-container');
    if (!container) return;
    
    let html = '';
    bloquesConfig.forEach((bloque, index) => {
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
    bloquesConfig.forEach((bloque, index) => {
        inicializarTimer(index, bloque.duracion);
        inicializarDespliegue(index);
    });
}

function inicializarDespliegue(index) {
    const bloqueItem = document.querySelector(`.bloque-item[data-bloque="${index}"]`);
    const header = bloqueItem.querySelector('.bloque-header');
    const contenido = document.getElementById(`contenido-${index}`);
    
    header.addEventListener('click', (e) => {
        // Evitar que el click en los botones del timer despliegue el contenido
        if (e.target.closest('.timer-controls')) return;
        
        contenido.classList.toggle('abierto');
    });
}

function inicializarTimer(index, duracionMinutos) {
    const display = document.getElementById(`timer-${index}`);
    const startBtn = document.querySelector(`.start-btn[data-idx="${index}"]`);
    const resetBtn = document.querySelector(`.reset-btn[data-idx="${index}"]`);
    
    let tiempoRestante = duracionMinutos * 60;
    let intervalo = null;
    let corriendo = false;
    
    function actualizarDisplay() {
        if (display) {
            display.textContent = formatearTiempo(tiempoRestante);
            // Cambiar color según tiempo restante
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

// Cargar comentarios guardados
function cargarComentariosGuardados(claseId) {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual) return;
    
    const alumnos = getAlumnos();
    const alumno = alumnos.find(a => a.nombre === alumnoActual);
    if (alumno && alumno.comentariosPorClase && alumno.comentariosPorClase[claseId]) {
        document.getElementById('comentariosClase').value = alumno.comentariosPorClase[claseId];
    }
}

// Guardar comentarios (con modal bonito)
function guardarComentarios(claseId) {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual) {
        mostrarMensaje('❌ No hay alumno seleccionado. Los comentarios solo se guardan para alumnos registrados.');
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
        mostrarMensaje('✅ Comentarios guardados correctamente');
    }
}

// Marcar clase como completada
function marcarClaseCompletada(claseId, claseTitulo) {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual) {
        mostrarMensaje('❌ No hay alumno seleccionado. Las clases solo se marcan para alumnos registrados.');
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
        
        mostrarMensaje(`🎉 ¡Felicidades! Has completado la clase "${claseTitulo}"`);
    } else {
        mostrarMensaje(`📌 La clase "${claseTitulo}" ya estaba marcada como completada.`);
    }
    // Mostrar mensaje de éxito con modal
    
}

// Verificar si la clase ya está completada
function verificarClaseCompletada(claseId, claseTitulo) {
    const alumnoActual = localStorage.getItem('alumno_actual');
    if (!alumnoActual) return false;
    
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

// Inicializar página de clase
function inicializarClase(claseId, claseTitulo) {
    mostrarAlumnoActual();
    renderizarBloques();
    cargarComentariosGuardados(claseId);
    verificarClaseCompletada(claseId, claseTitulo);
    
    const btnGuardar = document.getElementById('btnGuardarComentarios');
    if (btnGuardar) {
        btnGuardar.onclick = () => guardarComentarios(claseId);
    }
    
    const btnCompletada = document.getElementById('btnMarcarCompletada');
    if (btnCompletada) {
        btnCompletada.onclick = () => marcarClaseCompletada(claseId, claseTitulo);
    }
    
    crearModalConfirmacion();
}