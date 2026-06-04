// ===== ÍNDICE DEL CURSO PARA ALUMNOS =====

let alumnoUsuario = null;
let progreso = { completadas: [] };
let graficoInstance = null;

async function cargarDatos() {
    alumnoUsuario = localStorage.getItem('alumno_usuario');
    if (!alumnoUsuario) {
        window.location.href = '../index.html';
        return;
    }
    
    // Cargar modo oscuro guardado
    if (localStorage.getItem('modo_oscuro_alumno') === 'true') {
        document.body.classList.add('modo-oscuro-alumno');
        const btnModoOscuro = document.getElementById('btnModoOscuroAlumno');
        if (btnModoOscuro) {
            btnModoOscuro.innerHTML = '<i class="fas fa-sun"></i> Modo claro';
        }
    }
    
    const { data, error } = await supabaseClient
        .from('alumnos')
        .select('progreso, nombre')
        .eq('usuario', alumnoUsuario)
        .single();
    
    if (data) {
        progreso = data.progreso || { completadas: [] };
        document.getElementById('alumno-nombre').textContent = data.nombre || alumnoUsuario;
        const completadasLength = progreso.completadas.length;
        const totalClases = 14;
        const porcentaje = (completadasLength / totalClases) * 100;
        document.getElementById('clases-completadas').textContent = `${completadasLength}/${totalClases}`;
        
        // Ya no actualizamos la barra de progreso (fue eliminada)
        
        setTimeout(() => {
            dibujarGrafico(progreso.completadas, totalClases);
        }, 100);
    }
}

// Añadir evento del modo oscuro en la inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos().then(() => renderAcordeon());
    
    document.getElementById('btnCerrarSesion')?.addEventListener('click', cerrarSesion);
    
    const btnVerApuntes = document.getElementById('btnVerApuntes');
    if (btnVerApuntes) {
        btnVerApuntes.addEventListener('click', mostrarModalApuntes);
    }
    
    const btnDescargarPDF = document.getElementById('btnDescargarPDF');
    if (btnDescargarPDF) {
        btnDescargarPDF.addEventListener('click', descargarApuntesPDF);
    }
    
    // Modo oscuro
    const btnModoOscuro = document.getElementById('btnModoOscuroAlumno');
    if (btnModoOscuro) {
        btnModoOscuro.addEventListener('click', () => {
            document.body.classList.toggle('modo-oscuro-alumno');
            const esModoOscuro = document.body.classList.contains('modo-oscuro-alumno');
            localStorage.setItem('modo_oscuro_alumno', esModoOscuro);
            
            if (esModoOscuro) {
                btnModoOscuro.innerHTML = '<i class="fas fa-sun"></i> Modo claro';
            } else {
                btnModoOscuro.innerHTML = '<i class="fas fa-moon"></i> Modo oscuro';
            }
        });
    }
    
    const btnCerrarApuntes = document.getElementById('btnCerrarApuntes');
    if (btnCerrarApuntes) {
        btnCerrarApuntes.addEventListener('click', () => {
            document.getElementById('modalApuntes').style.display = 'none';
        });
    }
});

// Dibujar gráfico de progreso
function dibujarGrafico(completadasArray, total) {
    const canvas = document.getElementById('graficoProgreso');
    if (!canvas) {
        console.error('Canvas no encontrado');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const completadasNum = completadasArray.length;
    const pendientes = total - completadasNum;
    
    if (graficoInstance) {
        graficoInstance.destroy();
    }
    
    graficoInstance = new Chart(ctx, {
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
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12 }
                    }
                },
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

const capitulos = [
    { titulo: "Capítulo 1: Tu punto de partida", clases: [{ id: "clase1", titulo: "Clase 1: Introducción y enfoque", url: "clase.html?id=clase1" }] },
    { titulo: "Capítulo 2: Los 4 pilares da la salud", clases: [
        { id: "clase2", titulo: "Clase 2: Sueño - Reparación nocturna", url: "clase.html?id=clase2" },
        { id: "clase3", titulo: "Clase 3: Mente - Paz y claridad", url: "clase.html?id=clase3" },
        { id: "clase4", titulo: "Clase 4: Ejercicio - Movimiento con propósito", url: "clase.html?id=clase4" },
        { id: "clase5", titulo: "Clase 5: Alimentación - Nutrición inteligente", url: "clase.html?id=clase5" }
    ] },
    { titulo: "Capítulo 3: Alimentación sanadora", clases: [
        { id: "clase6", titulo: "Clase 6: Qué NO comer", url: "clase.html?id=clase6" },
        { id: "clase7", titulo: "Clase 7: Macronutrientes y cálculo", url: "clase.html?id=clase7" },
        { id: "clase8", titulo: "Clase 8: Suplementación", url: "clase.html?id=clase8" }
    ] },
    { titulo: "Capítulo 4: Enfermedad, longevidad y prevención", clases: [
        { id: "clase9", titulo: "Clase 9: Resistencia a la insulina", url: "clase.html?id=clase9" },
        { id: "clase10", titulo: "Clase 10: Sarcopenia", url: "clase.html?id=clase10" },
        { id: "clase11", titulo: "Clase 11: Ayuno intermitente", url: "clase.html?id=clase11" }
    ] },
    { titulo: "Capítulo 5: Herramientas prácticas para la vida real", clases: [
        { id: "clase12", titulo: "Clase 12: Estructura, sol y frío", url: "clase.html?id=clase12" },
        { id: "clase13", titulo: "Clase 13: Cómo leer etiquetas", url: "clase.html?id=clase13" },
        { id: "clase14", titulo: "Clase 14: Prevención de recaídas + cierre", url: "clase.html?id=clase14" }
    ] }
];

function renderAcordeon() {
    const container = document.getElementById('accordion-container');
    let html = '';
    capitulos.forEach(cap => {
        const completadasEnCap = cap.clases.filter(c => progreso.completadas.includes(c.id)).length;
        html += `
            <div class="accordion-section">
                <div class="accordion-header">
                    <span>${cap.titulo}</span>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size:0.8rem; background:rgba(255,255,255,0.2); padding:3px 10px; border-radius:20px;">${completadasEnCap}/${cap.clases.length}</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="accordion-content">
                    <div class="accordion-content-inner">
                        ${cap.clases.map(c => `
                            <a href="${c.url}" class="clase-link">
                                <span><i class="fas ${progreso.completadas.includes(c.id) ? 'fa-check-circle' : 'fa-play-circle'}"></i> ${c.titulo}</span>
                                ${progreso.completadas.includes(c.id) ? '<span class="badge-completada">Completada</span>' : ''}
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isOpen = header.classList.contains('open');
            document.querySelectorAll('.accordion-header').forEach(h => h.classList.remove('open'));
            document.querySelectorAll('.accordion-content').forEach(c => c.style.maxHeight = null);
            if (!isOpen) {
                header.classList.add('open');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
}

function cerrarSesion() {
    localStorage.removeItem('alumno_usuario');
    localStorage.removeItem('alumno_nombre');
    window.location.href = '../index.html';
}

// ===== APUNTES DEL ALUMNO =====

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
    let titulo = tipo === 'exito' ? 'Éxito' : 'Error';
    
    document.getElementById('modalIcono').className = `${icono} ${iconoClass}`;
    document.getElementById('modalTitulo').textContent = titulo;
    document.getElementById('modalMensaje').textContent = mensaje;
    
    modal.style.display = 'flex';
    document.getElementById('modalBtnAceptar').onclick = () => {
        modal.style.display = 'none';
    };
}

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
        
        // Recorrer en orden ascendente de clase
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
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos().then(() => renderAcordeon());
    
    document.getElementById('btnCerrarSesion')?.addEventListener('click', cerrarSesion);
    
    const btnVerApuntes = document.getElementById('btnVerApuntes');
    if (btnVerApuntes) {
        btnVerApuntes.addEventListener('click', mostrarModalApuntes);
    }
    
    const btnDescargarPDF = document.getElementById('btnDescargarPDF');
    if (btnDescargarPDF) {
        btnDescargarPDF.addEventListener('click', descargarApuntesPDF);
    }
    
    const btnCerrarApuntes = document.getElementById('btnCerrarApuntes');
    if (btnCerrarApuntes) {
        btnCerrarApuntes.addEventListener('click', () => {
            document.getElementById('modalApuntes').style.display = 'none';
        });
    }
});