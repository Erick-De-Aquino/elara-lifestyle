// ===== LÓGICA ESPECÍFICA PARA ALUMNO.HTML =====

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('alumnoForm');
    
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nombre = document.getElementById('nombre').value.trim();
        
        if (!nombre) {
            mostrarModalConfirmacion(
                'Error',
                'El nombre es obligatorio.',
                'fa-exclamation-circle',
                'icono-peligro',
                null
            );
            return;
        }
        
        const nuevoAlumno = {
            nombre: nombre,
            edad: document.getElementById('edad').value,
            objetivo: document.getElementById('objetivo').value,
            enfermedades: document.getElementById('enfermedades').value,
            medicacion: document.getElementById('medicacion').value,
            telefono: document.getElementById('telefono').value,
            email: document.getElementById('email').value,
            observaciones: document.getElementById('observaciones').value,
            fechaRegistro: new Date().toLocaleDateString()
        };
        
        const alumnos = getAlumnos();
        
        if (alumnos.find(a => a.nombre === nombre)) {
            mostrarModalConfirmacion(
                'Error',
                'Ya existe un alumno con ese nombre. Usa otro nombre o edita al existente.',
                'fa-exclamation-circle',
                'icono-peligro',
                null
            );
            return;
        }
        
        alumnos.push(nuevoAlumno);
        saveAlumnos(alumnos);
        
        // Modal de éxito personalizado (sin botones de confirmación)
        let modalExito = document.getElementById('modalExitoAlumno');
        if (!modalExito) {
            modalExito = document.createElement('div');
            modalExito.id = 'modalExitoAlumno';
            modalExito.className = 'modal-confirmacion';
            modalExito.innerHTML = `
                <div class="modal-confirmacion-content">
                    <i class="fas fa-check-circle icono-exito"></i>
                    <h3>Alumno guardado</h3>
                    <p id="mensajeExitoAlumno"></p>
                    <div class="botones-modal">
                        <button id="btnCerrarExitoAlumno" class="btn-aceptar">Aceptar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modalExito);
        }
        
        document.getElementById('mensajeExitoAlumno').textContent = `"${nombre}" ha sido guardado correctamente.`;
        modalExito.style.display = 'flex';
        
        document.getElementById('btnCerrarExitoAlumno').onclick = () => {
            modalExito.style.display = 'none';
            window.location.href = 'alumno-lista.html';
        };
    });
});