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
        
        // Verificar si ya existe
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
        
        mostrarModalConfirmacion(
            'Alumno guardado',
            `"${nombre}" ha sido guardado correctamente.`,
            'fa-check-circle',
            'icono-exito',
            () => {
                if (confirm('¿Ir a la lista de alumnos?')) {
                    window.location.href = 'alumnos-lista.html';
                } else {
                    form.reset();
                }
            }
        );
    });
});