// timer.js - Módulo de temporizador para bloques de clase

let timerInterval = null;
let tiempoActual = 0;
let timerActivo = false;
let onCompletarCallback = null;
let elementoDisplayId = 'timerDisplay';

// ===== FORMATEAR TIEMPO (segundos → mm:ss) =====
function formatearTiempo(segundos) {
    if (isNaN(segundos) || segundos < 0) return '00:00';
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ===== DETENER TIMER =====
function detenerTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerActivo = false;
}

// ===== PAUSAR TIMER =====
function pausarTimer() {
    if (timerActivo) {
        detenerTimer();
        timerActivo = false;
    }
}

// ===== REANUDAR TIMER =====
function reanudarTimer() {
    if (!timerActivo && tiempoActual > 0) {
        timerActivo = true;
        timerInterval = setInterval(() => {
            if (tiempoActual > 0) {
                tiempoActual--;
                actualizarDisplay();
                if (tiempoActual === 0) {
                    detenerTimer();
                    if (onCompletarCallback) onCompletarCallback();
                }
            }
        }, 1000);
    }
}

// ===== ACTUALIZAR DISPLAY =====
function actualizarDisplay() {
    const displayElement = document.getElementById(elementoDisplayId);
    if (displayElement) {
        displayElement.textContent = formatearTiempo(tiempoActual);
    }
}

// ===== INICIALIZAR TIMER DESDE DURACIÓN DEL BLOQUE =====
function iniciarTimerDesdeBloque(bloque, onCompletar, elementoId = 'timerDisplay') {
    const duracionMinutos = bloque.duracion || 0;
    
    if (duracionMinutos <= 0) {
        console.warn('Bloque sin duración definida:', bloque.nombre);
        return false;
    }
    
    elementoDisplayId = elementoId;
    return iniciarTimer(duracionMinutos, onCompletar, elementoId);
}

// ===== INICIALIZAR TIMER =====
function iniciarTimer(duracionMinutos, onCompletar, elementoId = 'timerDisplay') {
    // Detener timer anterior si existe
    detenerTimer();
    
    // Configurar nuevo timer
    tiempoActual = duracionMinutos * 60;
    onCompletarCallback = onCompletar;
    timerActivo = true;
    elementoDisplayId = elementoId;
    
    // Crear o actualizar display
    let display = document.getElementById(elementoId);
    if (!display) {
        display = document.createElement('div');
        display.id = elementoId;
        display.className = 'timer-display';
    }
    actualizarDisplay();
    
    // Iniciar cuenta regresiva
    timerInterval = setInterval(() => {
        if (tiempoActual > 0) {
            tiempoActual--;
            actualizarDisplay();
            if (tiempoActual === 0) {
                detenerTimer();
                if (onCompletarCallback) onCompletarCallback();
            }
        }
    }, 1000);
    
    return true;
}

// ===== REINICIAR TIMER =====
function reiniciarTimer(duracionMinutos) {
    detenerTimer();
    tiempoActual = duracionMinutos * 60;
    timerActivo = true;
    actualizarDisplay();
    
    timerInterval = setInterval(() => {
        if (tiempoActual > 0) {
            tiempoActual--;
            actualizarDisplay();
            if (tiempoActual === 0) {
                detenerTimer();
                if (onCompletarCallback) onCompletarCallback();
            }
        }
    }, 1000);
}

// ===== OBTENER TIEMPO RESTANTE =====
function getTiempoRestante() {
    return tiempoActual;
}

// ===== AGREGAR TIEMPO =====
function agregarTiempo(segundos) {
    tiempoActual += segundos;
    actualizarDisplay();
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.timer = {
        iniciar: iniciarTimer,
        iniciarDesdeBloque: iniciarTimerDesdeBloque,
        pausar: pausarTimer,
        reanudar: reanudarTimer,
        detener: detenerTimer,
        reiniciar: reiniciarTimer,
        formatear: formatearTiempo,
        getTiempo: getTiempoRestante,
        agregar: agregarTiempo
    };
}