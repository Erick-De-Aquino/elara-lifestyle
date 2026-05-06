// ===== LÓGICA PARA ALUMNOS-LISTA.HTML =====

// Mapeo de IDs a URLs y títulos
const claseUrls = {
    clase1: "pages/clase1.html",
    clase2: "pages/clase2.html",
    clase3: "pages/clase3.html",
    clase4: "pages/clase4.html",
    clase5: "pages/clase5.html",
    clase6: "pages/clase6.html",
    clase7: "pages/clase7.html",
    clase8: "pages/clase8.html",
    clase9: "pages/clase9.html",
    clase10: "pages/clase10.html",
    clase11: "pages/clase11.html",
    clase12: "pages/clase12.html",
    clase13: "pages/clase13.html",
    clase14: "pages/clase14.html"
};

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

const todasLasClases = [
    "clase1", "clase2", "clase3", "clase4", "clase5",
    "clase6", "clase7", "clase8", "clase9", "clase10",
    "clase11", "clase12", "clase13", "clase14"
];

function mostrarFicha(nombre) {
    const alumnos = getAlumnos();
    const alumno = alumnos.find(a => a.nombre === nombre);
    const progreso = getProgreso(nombre);
    
    // Determinar la próxima clase
    const clasesCompletadas = progreso.completadas || [];
    let siguienteClase = null;
    
    for (let i = 0; i < todasLasClases.length; i++) {
        if (!clasesCompletadas.includes(todasLasClases[i])) {
            siguienteClase = todasLasClases[i];
            break;
        }
    }
    
    // Generar HTML de comentarios por clase
    let comentariosHTML = '';
    if (alumno.comentariosPorClase && Object.keys(alumno.comentariosPorClase).length > 0) {
        comentariosHTML = '<div style="margin-top: 20px;"><h4 style="color: var(--primary-dark); margin-bottom: 15px;"><i class="fas fa-comments"></i> 📝 Comentarios por clase:</h4>';
        for (const [claseId, comentario] of Object.entries(alumno.comentariosPorClase)) {
            if (comentario && comentario.trim() !== '') {
                const claseTitulo = claseTitulos[claseId] || claseId;
                comentariosHTML += `
                    <div class="comentario-item">
                        <div class="comentario-titulo">
                            <i class="fas fa-video"></i> ${claseTitulo}
                        </div>
                        <div class="comentario-texto">${comentario.replace(/\n/g, '<br>')}</div>
                    </div>
                `;
            }
        }
        comentariosHTML += '</div>';
    } else {
        comentariosHTML = '<div class="sin-comentarios"><i class="fas fa-comment-slash"></i> No hay comentarios guardados para las clases.</div>';
    }
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="ficha-contenido">
            <div class="campo-info"><strong>Nombre:</strong> ${alumno.nombre || '-'}</div>
            <div class="campo-info"><strong>Edad:</strong> ${alumno.edad || '-'}</div>
            <div class="campo-info"><strong>Objetivo:</strong> ${alumno.objetivo || '-'}</div>
            <div class="campo-info"><strong>Enfermedades:</strong> ${alumno.enfermedades || '-'}</div>
            <div class="campo-info"><strong>Medicación:</strong> ${alumno.medicacion || '-'}</div>
            <div class="campo-info"><strong>Teléfono:</strong> ${alumno.telefono || '-'}</div>
            <div class="campo-info"><strong>Email:</strong> ${alumno.email || '-'}</div>
            <div class="campo-info"><strong>Clases completadas:</strong> ${progreso.completadas.length}/14</div>
            <div class="campo-info"><strong>Última clase:</strong> ${progreso.ultimaClase ? claseTitulos[progreso.ultimaClase] || progreso.ultimaClase : 'Ninguna'}</div>
            <div class="campo-info"><strong>Fecha registro:</strong> ${alumno.fechaRegistro || '-'}</div>
            
            ${comentariosHTML}
            
            <div class="ficha-botones">
                ${siguienteClase ? `
                    <button id="btnContinuar" class="btn-primary">
                        <i class="fas fa-play-circle"></i> Continuar: ${claseTitulos[siguienteClase]}
                    </button>
                ` : `
                    <button class="btn-success" disabled>
                        <i class="fas fa-trophy"></i> ¡Curso completado!
                    </button>
                `}
                <button id="btnCerrarFicha" class="btn-cancelar">Cerrar</button>
            </div>
        </div>
    `;
    
    document.getElementById('modal').style.display = 'flex';
    
    const btnContinuar = document.getElementById('btnContinuar');
    if (btnContinuar && siguienteClase) {
        btnContinuar.addEventListener('click', () => {
            localStorage.setItem('alumno_actual', nombre);
            window.location.href = claseUrls[siguienteClase];
        });
    }
    
    const btnCerrar = document.getElementById('btnCerrarFicha');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
        });
    }
}

function renderLista() {
    const alumnos = getAlumnos();
    const container = document.getElementById('lista-alumnos');
    
    if (alumnos.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:40px;">No hay alumnos registrados. Haz clic en "+ Nuevo alumno" para comenzar.</p>';
        return;
    }
    
    let html = '';
    alumnos.forEach(alumno => {
        const progreso = getProgreso(alumno.nombre);
        html += `
            <div class="alumno-card">
                <div class="alumno-info" data-nombre="${alumno.nombre}">
                    <div class="alumno-nombre">${alumno.nombre}</div>
                    <div class="alumno-detalle">
                        ${alumno.telefono || '📞 Sin teléfono'} | 
                        ${alumno.email || '✉️ Sin email'} |
                        Clases: ${progreso.completadas.length}/14
                    </div>
                </div>
                <button class="btn-eliminar" data-nombre="${alumno.nombre}"><i class="fas fa-user-minus"></i> Eliminar</button>
            </div>
        `;
    });
    container.innerHTML = html;
    
    document.querySelectorAll('.alumno-info').forEach(el => {
        el.addEventListener('click', () => {
            const nombre = el.getAttribute('data-nombre');
            mostrarFicha(nombre);
        });
    });
    
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const nombre = btn.getAttribute('data-nombre');
            eliminarAlumno(nombre);
        });
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Añadir estilo para header-actions si no existe
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        headerActions.style.display = 'flex';
        headerActions.style.justifyContent = 'space-between';
        headerActions.style.alignItems = 'center';
        headerActions.style.marginBottom = '20px';
        headerActions.style.flexWrap = 'wrap';
        headerActions.style.gap = '15px';
    }
    
    renderLista();
    
    // Exportar
    document.getElementById('exportarBtn')?.addEventListener('click', exportarDatos);
    
    // Importar
    document.getElementById('importarInput')?.addEventListener('change', importarDatos);
    
    // Resetear
    document.getElementById('resetearBtn')?.addEventListener('click', () => {
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
    });
    
    // Botón nuevo alumno
    document.getElementById('btnNuevoAlumno')?.addEventListener('click', () => {
        window.location.href = 'alumno.html';
    });
    
    // Cerrar modal
    document.querySelector('.close-modal')?.addEventListener('click', () => {
        document.getElementById('modal').style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal')) {
            document.getElementById('modal').style.display = 'none';
        }
    });
});