// ===== PÁGINA DE CLASE PARA ALUMNOS =====

let claseId = null;
let claseData = null;
let alumnoUsuario = null;
let sidebarGraficoInstance = null;

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

// ===== DATOS DEL SIDEBAR =====
async function cargarDatosSidebar() {
    const alumnoUsuario = localStorage.getItem('alumno_usuario');
    if (!alumnoUsuario) return;
    
    const { data, error } = await supabaseClient
        .from('alumnos')
        .select('progreso, nombre')
        .eq('usuario', alumnoUsuario)
        .single();
    
    if (data) {
        const completadasLength = data.progreso?.completadas?.length || 0;
        const totalClases = 14;
        document.getElementById('sidebar-nombre').textContent = data.nombre || alumnoUsuario;
        document.getElementById('sidebar-progreso-texto').textContent = `Clases: ${completadasLength}/${totalClases}`;
        
        setTimeout(() => {
            dibujarGraficoSidebar(data.progreso?.completadas || [], totalClases);
        }, 100);
    }
}

function dibujarGraficoSidebar(completadasArray, total) {
    const canvas = document.getElementById('sidebarGrafico');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const completadasNum = completadasArray.length;
    const pendientes = total - completadasNum;
    
    if (sidebarGraficoInstance) {
        sidebarGraficoInstance.destroy();
    }
    
    sidebarGraficoInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completadas', 'Pendientes'],
            datasets: [{
                data: [completadasNum, pendientes],
                backgroundColor: ['#2A9D8F', '#E0E0E0'],
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const porcentaje = (value / total) * 100;
                            return `${label}: ${value} (${porcentaje.toFixed(1)}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ===== CARGA PRINCIPAL DE LA CLASE =====
async function cargarDatos() {
    alumnoUsuario = localStorage.getItem('alumno_usuario');
    console.log('1. alumnoUsuario:', alumnoUsuario);
    
    if (!alumnoUsuario) {
        window.location.href = '../index.html';
        return false;
    }
    
    // Cargar datos del sidebar
    cargarDatosSidebar();
    
    // Cargar modo oscuro guardado
    if (localStorage.getItem('modo_oscuro_alumno') === 'true') {
        document.body.classList.add('modo-oscuro-alumno');
    }
    
    // Cargar contenido resumido desde clases-alumno.json
    const responseAlumno = await fetch('../data/clases-alumno.json');
    const todasAlumno = await responseAlumno.json();
    claseId = obtenerIdClase();
    console.log('2. claseId:', claseId);
    
    claseData = todasAlumno[claseId];
    
    if (!claseData) {
        document.getElementById('clase-container').innerHTML = '<div style="text-align:center; padding:50px;"><h2>Clase no encontrada</h2><a href="curso.html" class="btn-primary">Volver</a></div>';
        return false;
    }
    
    // Cargar videos desde clases.json (profesor) para obtener las URLs
    let videosData = { videos: [] };
    try {
        const responseProfesor = await fetch('../data/clases.json');
        const todasProfesor = await responseProfesor.json();
        if (todasProfesor[claseId] && todasProfesor[claseId].videos) {
            videosData = todasProfesor[claseId];
        }
    } catch (err) {
        console.error('Error cargando videos desde clases.json:', err);
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
    
    // Bloques de la clase
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
    
    // Videos - usando datos desde clases.json (con URLs)
    const videosDiv = document.getElementById('videos-container');
    videosDiv.innerHTML = '';
    if (videosData.videos && videosData.videos.length > 0) {
        videosData.videos.forEach(v => {
            const a = document.createElement('a');
            a.href = v.url || '#';
            a.className = 'video-link';
            a.target = '_blank';
            a.innerHTML = `<i class="fab fa-youtube"></i> <span>${v.titulo || v}</span>`;
            videosDiv.appendChild(a);
        });
    }
    
    // ===== VERIFICAR PROGRESO Y CARGAR COMENTARIOS =====
    console.log('3. Consultando Supabase para usuario:', alumnoUsuario);
    
    const { data, error } = await supabaseClient
        .from('alumnos')
        .select('progreso, comentarios')
        .eq('usuario', alumnoUsuario)
        .single();
    
    console.log('4. Datos recibidos:', data);
    console.log('5. Error:', error);
    
    if (data) {
        // Progreso
        const completadas = data.progreso?.completadas || [];
        console.log('6. Clases completadas:', completadas);
        
        if (completadas.includes(claseId)) {
            document.getElementById('completada-badge-container').innerHTML = '<div class="completada-badge"><i class="fas fa-check-circle"></i> Clase completada</div>';
        }
        
        // Cargar comentario guardado en el textarea
        const comentarios = data.comentarios || {};
        console.log('7. Todos los comentarios:', comentarios);
        console.log('8. Comentario para esta clase:', comentarios[claseId]);
        
        if (comentarios[claseId]) {
            document.getElementById('comentariosClase').value = comentarios[claseId];
            console.log('9. Comentario cargado en textarea');
        } else {
            console.log('10. No hay comentario para esta clase');
        }
    } else {
        console.log('11. No se recibieron datos de Supabase');
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
        
        const ordenClases = ["clase1", "clase2", "clase3", "clase4", "clase5", "clase6", "clase7", "clase8", "clase9", "clase10", "clase11", "clase12", "clase13", "clase14"];
        
        let html = '';
        let tieneApuntes = false;
        
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

// ===== DESCARGA DE APUNTES EN PDF =====

async function cargarTodosLosApuntes() {
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

async function descargarApuntesPDF() {
    const usuario = localStorage.getItem('alumno_usuario');
    const nombreAlumno = localStorage.getItem('alumno_nombre') || usuario;
    
    const comentarios = await cargarTodosLosApuntes();
    
    const apuntesExistentes = Object.values(comentarios).some(c => c && c.trim() !== '');
    if (!apuntesExistentes) {
        mostrarModal('No tienes apuntes guardados para descargar', 'error');
        return;
    }
    
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
    
    const ordenClases = ["clase1", "clase2", "clase3", "clase4", "clase5", "clase6", "clase7", "clase8", "clase9", "clase10", "clase11", "clase12", "clase13", "clase14"];
    
    let contenidoHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1D3557;">ELARA METHOD</h1>
                <h2 style="color: #FF8C42;">Mis apuntes del curso</h2>
                <p>Alumno: <strong>${nombreAlumno}</strong></p>
                <p>Fecha: ${new Date().toLocaleDateString()}</p>
                <hr style="border: 1px solid #E0E0E0;">
            </div>
    `;
    
    for (const claseId of ordenClases) {
        const comentario = comentarios[claseId];
        if (comentario && comentario.trim() !== '') {
            const claseTitulo = claseTitulos[claseId];
            contenidoHTML += `
                <div style="margin-bottom: 25px; page-break-inside: avoid;">
                    <h3 style="color: #1D3557; border-bottom: 2px solid #FF8C42; padding-bottom: 5px;">${claseTitulo}</h3>
                    <div style="margin-top: 10px; padding-left: 10px; border-left: 3px solid #FF8C42;">
                        ${comentario.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;
        }
    }
    
    contenidoHTML += `
            <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #6C757D;">
                <hr>
                <p>Apuntes generados desde ELARA METHOD - ${new Date().toLocaleString()}</p>
            </div>
        </div>
    `;
    
    const elemento = document.createElement('div');
    elemento.innerHTML = contenidoHTML;
    elemento.style.position = 'absolute';
    elemento.style.left = '-9999px';
    document.body.appendChild(elemento);
    
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const canvas = await html2canvas(elemento, {
            scale: 2,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const pageHeight = 277;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let position = 10;
        
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        
        let heightLeft = imgHeight - (pageHeight - 20);
        while (heightLeft > 0) {
            position = -(imgHeight - heightLeft);
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - 20);
        }
        
        pdf.save(`mis_apuntes_${nombreAlumno.replace(/\s/g, '_')}.pdf`);
        
    } catch (err) {
        console.error('Error al generar PDF:', err);
        mostrarModal('Error al generar el PDF', 'error');
    }
    
    document.body.removeChild(elemento);
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async () => {
    const ok = await cargarDatos();
    if (ok) {
        document.getElementById('btnGuardarComentarios')?.addEventListener('click', guardarComentario);
        
        // Botones del sidebar derecho
        document.getElementById('btnVerApuntesSidebar')?.addEventListener('click', mostrarModalApuntes);
        document.getElementById('btnDescargarPDFSidebar')?.addEventListener('click', descargarApuntesPDF);
        document.getElementById('btnCerrarSesionSidebar')?.addEventListener('click', () => {
            localStorage.removeItem('alumno_usuario');
            localStorage.removeItem('alumno_nombre');
            window.location.href = '../index.html';
        });
        
        // Modo oscuro sidebar
        const btnModoOscuroSidebar = document.getElementById('btnModoOscuroSidebar');
        if (btnModoOscuroSidebar) {
            btnModoOscuroSidebar.addEventListener('click', () => {
                document.body.classList.toggle('modo-oscuro-alumno');
                const esModoOscuro = document.body.classList.contains('modo-oscuro-alumno');
                localStorage.setItem('modo_oscuro_alumno', esModoOscuro);
                btnModoOscuroSidebar.innerHTML = esModoOscuro ? '<i class="fas fa-sun"></i> Modo claro' : '<i class="fas fa-moon"></i> Modo oscuro';
            });
        }
        
        const btnCerrarApuntes = document.getElementById('btnCerrarApuntes');
        if (btnCerrarApuntes) {
            btnCerrarApuntes.addEventListener('click', () => {
                document.getElementById('modalApuntes').style.display = 'none';
            });
        }
    }

    // Botón volver al índice
    document.getElementById('btnVolverIndiceSidebar')?.addEventListener('click', () => {
        window.location.href = 'curso.html';
    });
});