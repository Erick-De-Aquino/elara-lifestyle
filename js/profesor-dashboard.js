// ===== PANEL DE CONTROL DEL PROFESOR =====

document.addEventListener('DOMContentLoaded', () => {
    // Verificar que sea un profesor
    const acceso = localStorage.getItem('acceso_tipo');
    if (acceso !== 'profesor') {
        window.location.href = 'index.html';
        return;
    }
    
    // Botón cerrar sesión
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            localStorage.removeItem('acceso_tipo');
            localStorage.removeItem('usuario');
            window.location.href = 'index.html';
        });
    }
    
    // Botón ir al curso (versión profesor)
    const btnIrAlCurso = document.getElementById('btnIrAlCurso');
    if (btnIrAlCurso) {
        btnIrAlCurso.addEventListener('click', () => {
            window.location.href = 'curso.html';
        });
    }
});

// ===== EXPORTAR PROGRESO DE ALUMNOS A CSV =====

async function exportarProgresoCSV() {
    // Mostrar mensaje de carga
    mostrarModal('Generando archivo CSV...', 'info');
    
    try {
        // Obtener todos los alumnos (excepto el profesor)
        const { data: alumnos, error } = await supabaseClient
            .from('alumnos')
            .select('*')
            .eq('es_profesor', false);
        
        if (error) throw error;
        
        if (!alumnos || alumnos.length === 0) {
            mostrarModal('No hay alumnos registrados', 'error');
            return;
        }
        
        // Definir las columnas del CSV
        const columnas = [
            'Usuario',
            'Nombre',
            'Clases Completadas',
            'Total Clases',
            'Porcentaje (%)',
            'Última Clase',
            'Fecha Registro'
        ];
        
        // Crear filas de datos
        const filas = alumnos.map(alumno => {
            const completadas = alumno.progreso?.completadas || [];
            const totalClases = 14;
            const porcentaje = ((completadas.length / totalClases) * 100).toFixed(1);
            
            // Obtener el nombre de la última clase completada
            let ultimaClase = '';
            if (completadas.length > 0) {
                const ultimaClaseId = completadas[completadas.length - 1];
                const claseTitulos = {
                    clase1: "Clase 1: Introducción y enfoque",
                    clase2: "Clase 2: Sueño - Reparación nocturna",
                    clase3: "Clase 3: Mente - Paz y claridad",
                    clase4: "Clase 4: Ejercicio - Movimiento con propósito",
                    clase5: "Clase 5: Alimentación - Nutrición inteligente",
                    clase6: "Clase 6: Qué NO comer",
                    clase7: "Clase 7: Macronutrientes y cálculo",
                    clase8: "Clase 8: Suplementación",
                    clase9: "Clase 9: Resistencia a la insulina",
                    clase10: "Clase 10: Sarcopenia",
                    clase11: "Clase 11: Ayuno intermitente",
                    clase12: "Clase 12: Estructura, sol y frío",
                    clase13: "Clase 13: Cómo leer etiquetas",
                    clase14: "Clase 14: Prevención de recaídas + cierre"
                };
                ultimaClase = claseTitulos[ultimaClaseId] || ultimaClaseId;
            } else {
                ultimaClase = 'Ninguna';
            }
            
            return [
                alumno.usuario,
                alumno.nombre || '-',
                completadas.length,
                totalClases,
                porcentaje,
                ultimaClase,
                new Date(alumno.fecha_creacion).toLocaleDateString()
            ];
        });
        
        // Generar contenido CSV
        let csvContent = columnas.join(',') + '\n';
        filas.forEach(fila => {
            // Escapar comillas y comas en los textos
            const filaEscapada = fila.map(celda => {
                if (typeof celda === 'string' && (celda.includes(',') || celda.includes('"'))) {
                    return `"${celda.replace(/"/g, '""')}"`;
                }
                return celda;
            });
            csvContent += filaEscapada.join(',') + '\n';
        });
        
        // Descargar archivo
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `progreso_alumnos_global_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        mostrarModal('Archivo CSV exportado correctamente', 'exito');
        
    } catch (err) {
        console.error('Error exportando CSV:', err);
        mostrarModal('Error al exportar: ' + err.message, 'error');
    }
}

// Asignar evento al botón
document.getElementById('btnExportarCSV')?.addEventListener('click', exportarProgresoCSV);