// ===== PÁGINA DE CLASE PARA ALUMNOS =====

let claseId = null;
let claseData = null;
let alumnoUsuario = null;

function obtenerIdClase() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function mostrarModal(mensaje, tipo) {
    let modal = document.getElementById('modalConfirmacionAlumno');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalConfirmacionAlumno';
        modal.className = 'modal-confirmacion';
        modal.innerHTML = `
            <div class="modal-confirmacion-content">
                <i id="modalIcono" class=""></i>
                <h3 id="modalTitulo"></h3>
                <p id="modalMensaje"></p>
                <div class="botones-modal">
                    <button id="modalBtnAceptar" class="btn-aceptar">Aceptar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    let icono = tipo === 'exito' ? 'fa-check-circle' : 'fa-exclamation-circle';
    let iconoClass = tipo === 'exito' ? 'icono-exito' : 'icono-peligro';
    let titulo = tipo === 'exito' ? 'Completado' : 'Error';
    
    document.getElementById('modalIcono').className = `${icono} ${iconoClass}`;
    document.getElementById('modalTitulo').textContent = titulo;
    document.getElementById('modalMensaje').textContent = mensaje;
    
    modal.style.display = 'flex';
    document.getElementById('modalBtnAceptar').onclick = () => {
        modal.style.display = 'none';
    };
}

async function cargarDatos() {
    alumnoUsuario = localStorage.getItem('alumno_usuario');
    if (!alumnoUsuario) {
        window.location.href = '../index.html';
        return false;
    }
    
    const response = await fetch('../data/clases-alumno.json');
    const todas = await response.json();
    claseId = obtenerIdClase();
    claseData = todas[claseId];
    
    if (!claseData) {
        document.getElementById('clase-container').innerHTML = '<div style="text-align:center; padding:50px;"><h2>Clase no encontrada</h2><a href="curso.html" class="btn-primary">Volver</a></div>';
        return false;
    }
    
    document.title = `Clase ${claseData.numero}: ${claseData.titulo} | ELARA METHOD`;
    document.getElementById('clase-titulo').innerHTML = `<i class="fas fa-play-circle"></i> Clase ${claseData.numero}: ${claseData.titulo}`;
    document.getElementById('clase-capitulo').textContent = claseData.capitulo;
    document.getElementById('clase-duracion').innerHTML = `<i class="fas fa-clock"></i> Duración: ${claseData.duracion} min`;
    document.getElementById('clase-objetivo').textContent = claseData.objetivo;
    
    const palabrasUl = document.getElementById('clase-palabras-clave');
    palabrasUl.innerHTML = '';
    claseData.palabrasClave.forEach(p => {
        const li = document.createElement('li');
        const partes = p.split(' - ');
        li.innerHTML = `<strong>${partes[0]}</strong> - ${partes[1]}`;
        palabrasUl.appendChild(li);
    });
    
    const bloquesContainer = document.getElementById('bloques-container');
    if (bloquesContainer && claseData.bloques && claseData.bloques.length > 0) {
        let bloquesHtml = '<h3>📋 Temas de la clase</h3>';
        
        claseData.bloques.forEach((bloque, index) => {
            const subtitulos = bloque.subtitulos || [];
            const bloqueId = `bloque-${index}`;
            
            bloquesHtml += `
                <div class="bloque-tema" id="${bloqueId}">
                    <div class="bloque-titulo">
                        <span>${bloque.nombre}</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="bloque-contenido-alumno">
                        ${subtitulos.length > 0 ? `<ul class="lista-subtemas">${subtitulos.map(s => `<li>${s}</li>`).join('')}</ul>` : '<p class="sin-subtitulos">Sin subtítulos disponibles</p>'}
                    </div>
                </div>
            `;
        });
        
        bloquesContainer.innerHTML = bloquesHtml;
        
        document.querySelectorAll('.bloque-tema').forEach(bloque => {
            const titulo = bloque.querySelector('.bloque-titulo');
            const contenido = bloque.querySelector('.bloque-contenido-alumno');
            
            titulo.addEventListener('click', () => {
                const isOpen = bloque.classList.contains('abierto');
                document.querySelectorAll('.bloque-tema').forEach(b => {
                    b.classList.remove('abierto');
                });
                if (!isOpen) {
                    bloque.classList.add('abierto');
                }
            });
        });
    }
    
    document.getElementById('practica-texto').innerHTML = claseData.practicaSemana;
    document.getElementById('practica-tip').innerHTML = `<i class="fas fa-lightbulb"></i> ${claseData.practicaTip}`;
    
    const videosDiv = document.getElementById('videos-container');
    videosDiv.innerHTML = '';
    if (claseData.videos) {
        claseData.videos.forEach(v => {
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'video-link';
            a.innerHTML = `<i class="fab fa-youtube"></i> <span>${v.titulo || v}</span>`;
            videosDiv.appendChild(a);
        });
    }
    
    // === CORREGIDO: seleccionar progreso Y comentarios ===
    const { data, error } = await supabaseClient
        .from('alumnos')
        .select('progreso, comentarios')
        .eq('usuario', alumnoUsuario)
        .single();
    
    if (data) {
        // Progreso
        const completadas = data.progreso?.completadas || [];
        if (completadas.includes(claseId)) {
            document.getElementById('completada-badge-container').innerHTML = '<div class="completada-badge"><i class="fas fa-check-circle"></i> Clase completada</div>';
        }
        
        // Comentario guardado
        const comentarios = data.comentarios || {};
        if (comentarios[claseId]) {
            document.getElementById('comentariosClase').value = comentarios[claseId];
        }
    }
    
    return true;
}
async function guardarComentario() {
    const comentario = document.getElementById('comentariosClase').value;
    const { data, error } = await supabaseClient
        .from('alumnos')
        .select('comentarios')
        .eq('usuario', alumnoUsuario)
        .single();
    
    const comentarios = data?.comentarios || {};
    comentarios[claseId] = comentario;
    
    const { error: updateError } = await supabaseClient
        .from('alumnos')
        .update({ comentarios })
        .eq('usuario', alumnoUsuario);
    
    if (updateError) {
        mostrarModal('Error al guardar comentario', 'error');
        return;
    }
    
    mostrarModal('Comentario guardado', 'exito');
}

// ===== VER MIS APUNTES =====

async function cargarApuntes() {
    const usuario = localStorage.getItem('alumno_usuario');
    if (!usuario) return {};
    
    const { data, error } = await supabaseClient
        .from('alumnos')
        .select('comentarios')
        .eq('usuario', usuario)
        .single();
    
    if (error) {
        console.error('Error cargando apuntes:', error);
        return {};
    }
    
    return data?.comentarios || {};
}

function mostrarModalApuntes() {
    const modal = document.getElementById('modalApuntes');
    const contenido = document.getElementById('apuntesContenido');
    
    cargarApuntes().then(comentarios => {
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
        
        // Orden de las clases (del 1 al 14)
        const ordenClases = ["clase1", "clase2", "clase3", "clase4", "clase5", "clase6", "clase7", "clase8", "clase9", "clase10", "clase11", "clase12", "clase13", "clase14"];
        
        let html = '';
        let tieneApuntes = false;
        
        // Recorrer en orden de clase
        for (const claseId of ordenClases) {
            const comentario = comentarios[claseId];
            if (comentario && comentario.trim() !== '') {
                tieneApuntes = true;
                const claseTitulo = claseTitulos[claseId];
                html += `
                    <div class="campo-info" style="margin-bottom: 15px;">
                        <strong style="color: var(--primary-orange);">${claseTitulo}</strong>
                        <div style="margin-top: 8px; padding-left: 10px; border-left: 3px solid var(--primary-orange);">
                            ${comentario.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                `;
            }
        }
        
        if (!tieneApuntes) {
            html = '<p style="text-align: center; padding: 20px;">No tienes apuntes guardados. Escribe notas en cada clase y aparecerán aquí.</p>';
        }
        
        contenido.innerHTML = html;
        modal.style.display = 'flex';
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const ok = await cargarDatos();
    if (ok) {
        document.getElementById('btnGuardarComentarios')?.addEventListener('click', guardarComentario);
        
        const btnVerApuntes = document.getElementById('btnVerApuntesClase');
        if (btnVerApuntes) {
            btnVerApuntes.addEventListener('click', mostrarModalApuntes);
        }
        
        const btnCerrarApuntes = document.getElementById('btnCerrarApuntes');
        if (btnCerrarApuntes) {
            btnCerrarApuntes.addEventListener('click', () => {
                document.getElementById('modalApuntes').style.display = 'none';
            });
        }
    }
});