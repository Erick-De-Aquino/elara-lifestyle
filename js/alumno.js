// ===== GESTIÓN DE ALUMNOS =====

// Obtener todos los alumnos
function getAlumnos() {
    return JSON.parse(localStorage.getItem('alumnos') || '[]');
}

// Guardar alumnos
function saveAlumnos(alumnos) {
    localStorage.setItem('alumnos', JSON.stringify(alumnos));
}

// Obtener progreso de un alumno
function getProgreso(nombreAlumno) {
    const progreso = JSON.parse(localStorage.getItem('progreso_alumnos') || '{}');
    return progreso[nombreAlumno] || { completadas: [], ultimaClase: null };
}

// Guardar progreso de un alumno
function saveProgreso(nombreAlumno, progresoData) {
    const progreso = JSON.parse(localStorage.getItem('progreso_alumnos') || '{}');
    progreso[nombreAlumno] = progresoData;
    localStorage.setItem('progreso_alumnos', JSON.stringify(progreso));
}

// Marcar una clase como completada
// Marcar clase como completada y actualizar vista
function marcarClaseCompletada(nombreAlumno, claseId) {
    const progreso = getProgreso(nombreAlumno);
    if (!progreso.completadas.includes(claseId)) {
        progreso.completadas.push(claseId);
        progreso.ultimaClase = claseId;
        saveProgreso(nombreAlumno, progreso);
        return true; // Indica que se completó
    }
    return false; // Ya estaba completada
}

// Crear o actualizar un alumno
function guardarAlumno(alumnoData) {
    const alumnos = getAlumnos();
    const index = alumnos.findIndex(a => a.nombre === alumnoData.nombre);
    
    if (index !== -1) {
        // Actualizar existente
        alumnos[index] = { ...alumnos[index], ...alumnoData };
    } else {
        // Añadir nuevo
        alumnoData.fechaRegistro = new Date().toLocaleDateString();
        alumnos.push(alumnoData);
    }
    
    saveAlumnos(alumnos);
    return true;
}


// Eliminar alumno (con modal)
function eliminarAlumno(nombreAlumno) {
    mostrarModalConfirmacion(
        'Eliminar alumno',
        `¿Estás seguro de que quieres eliminar a "${nombreAlumno}"? Se perderá todo su progreso.`,
        'fa-trash-alt',
        'icono-peligro',
        () => {
            let alumnos = getAlumnos();
            alumnos = alumnos.filter(a => a.nombre !== nombreAlumno);
            saveAlumnos(alumnos);
            
            const progreso = JSON.parse(localStorage.getItem('progreso_alumnos') || '{}');
            delete progreso[nombreAlumno];
            localStorage.setItem('progreso_alumnos', JSON.stringify(progreso));
            
            if (localStorage.getItem('alumno_actual') === nombreAlumno) {
                localStorage.removeItem('alumno_actual');
            }
            
            mostrarModalConfirmacion(
                'Alumno eliminado',
                `"${nombreAlumno}" ha sido eliminado correctamente.`,
                'fa-check-circle',
                'icono-exito',
                null
            );
            
            // Recargar la lista si estamos en alumnos-lista.html
            if (typeof renderLista === 'function') {
                renderLista();
            } else if (window.location.pathname.includes('alumnos-lista.html')) {
                location.reload();
            }
        }
    );
}

// ===== MODAL DE CONFIRMACIÓN GLOBAL =====
function mostrarModalConfirmacion(titulo, mensaje, icono, tipoIcono, onConfirmar) {
    // Crear modal si no existe
    let modal = document.getElementById('modalConfirmacionPersonalizado');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalConfirmacionPersonalizado';
        modal.className = 'modal-confirmacion';
        modal.innerHTML = `
            <div class="modal-confirmacion-content">
                <i id="modalIcono" class=""></i>
                <h3 id="modalTitulo"></h3>
                <p id="modalMensaje"></p>
                <div id="modalBotones" class="botones-modal"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Configurar contenido
    document.getElementById('modalIcono').className = `fas ${icono} ${tipoIcono}`;
    document.getElementById('modalTitulo').textContent = titulo;
    document.getElementById('modalMensaje').textContent = mensaje;
    
    // Configurar botones
    const botonesContainer = document.getElementById('modalBotones');
    botonesContainer.innerHTML = '';
    
    if (onConfirmar) {
        // Botón confirmar + cancelar
        const btnConfirmar = document.createElement('button');
        btnConfirmar.textContent = 'Sí, eliminar';
        btnConfirmar.className = 'btn-confirmar';
        btnConfirmar.onclick = () => {
            modal.style.display = 'none';
            onConfirmar();
        };
        
        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.className = 'btn-cancelar-modal';
        btnCancelar.onclick = () => {
            modal.style.display = 'none';
        };
        
        botonesContainer.appendChild(btnConfirmar);
        botonesContainer.appendChild(btnCancelar);
    } else {
        // Solo botón de aceptar
        const btnAceptar = document.createElement('button');
        btnAceptar.textContent = 'Aceptar';
        btnAceptar.className = 'btn-aceptar';
        btnAceptar.onclick = () => {
            modal.style.display = 'none';
        };
        botonesContainer.appendChild(btnAceptar);
    }
    
    modal.style.display = 'flex';
}