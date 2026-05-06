// ===== FUNCIONES COMUNES PARA TODO EL SITIO =====

// Exportar datos a JSON
function exportarDatos() {
    const alumnos = JSON.parse(localStorage.getItem('alumnos') || '[]');
    const progreso = JSON.parse(localStorage.getItem('progreso_alumnos') || '{}');
    const clases = JSON.parse(localStorage.getItem('clases_agendadas') || '[]');
    
    const data = {
        alumnos: alumnos,
        progreso: progreso,
        clases_agendadas: clases,
        fecha_exportacion: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elara_backup_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Importar datos desde JSON
function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.alumnos) localStorage.setItem('alumnos', JSON.stringify(data.alumnos));
            if (data.progreso) localStorage.setItem('progreso_alumnos', JSON.stringify(data.progreso));
            if (data.clases_agendadas) localStorage.setItem('clases_agendadas', JSON.stringify(data.clases_agendadas));
            alert('Datos importados correctamente');
            location.reload();
        } catch (err) {
            alert('Error al importar: archivo inválido');
        }
    };
    reader.readAsText(file);
}


// Resetear todos los datos (con modal)
function resetearTodo() {
    mostrarModalConfirmacion(
        '⚠️ Resetear todos los datos',
        'Esta acción ELIMINARÁ TODOS los alumnos, progreso y clases agendadas. Esta operación NO se puede deshacer.',
        'fa-exclamation-triangle',
        'icono-advertencia',
        () => {
            mostrarModalConfirmacion(
                'Última advertencia',
                '¿Estás ABSOLUTAMENTE SEGURO de que quieres borrar todo?',
                'fa-exclamation-circle',
                'icono-peligro',
                () => {
                    localStorage.removeItem('alumnos');
                    localStorage.removeItem('progreso_alumnos');
                    localStorage.removeItem('clases_agendadas');
                    localStorage.removeItem('alumno_actual');
                    
                    mostrarModalConfirmacion(
                        'Datos eliminados',
                        'Todos los datos han sido eliminados correctamente.',
                        'fa-check-circle',
                        'icono-exito',
                        () => {
                            location.reload();
                        }
                    );
                }
            );
        }
    );
}