// ===== LÓGICA ESPECÍFICA DE LA PÁGINA PRINCIPAL =====

// Elementos del DOM
const btnComenzar = document.getElementById('btn-comenzar');
const modalOpciones = document.getElementById('modalOpciones');
const modalElegirAlumno = document.getElementById('modalElegirAlumno');
const modalNuevoCompleto = document.getElementById('modalNuevoAlumnoCompleto');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeElegirBtn = document.getElementById('closeElegirBtn');
const cancelarElegir = document.getElementById('cancelarElegir');
const cancelarModalNuevo = document.getElementById('cancelarModalNuevo');

// Cerrar modales con la X
if (closeModalBtn) closeModalBtn.onclick = () => modalOpciones.style.display = 'none';
if (closeElegirBtn) closeElegirBtn.onclick = () => modalElegirAlumno.style.display = 'none';

// Cancelar elegir alumno
if (cancelarElegir) {
    cancelarElegir.onclick = () => {
        modalElegirAlumno.style.display = 'none';
        modalOpciones.style.display = 'flex';
    };
}

// Cancelar nuevo alumno (modal grande)
if (cancelarModalNuevo) {
    cancelarModalNuevo.onclick = () => {
        modalNuevoCompleto.style.display = 'none';
        modalOpciones.style.display = 'flex';
    };
}

// Cerrar modales haciendo clic fuera
window.onclick = (event) => {
    if (event.target === modalOpciones) modalOpciones.style.display = 'none';
    if (event.target === modalElegirAlumno) modalElegirAlumno.style.display = 'none';
    if (event.target === modalNuevoCompleto) modalNuevoCompleto.style.display = 'none';
};

// Botón COMENZAR
if (btnComenzar) {
    btnComenzar.onclick = () => {
        modalOpciones.style.display = 'flex';
    };
}

// Opción A: Nuevo alumno (abre modal grande)
const opcionNuevo = document.getElementById('opcionNuevo');
if (opcionNuevo) {
    opcionNuevo.onclick = () => {
        modalOpciones.style.display = 'none';
        limpiarFormularioModal();
        modalNuevoCompleto.style.display = 'flex';
    };
}

function limpiarFormularioModal() {
    document.getElementById('modalNombre').value = '';
    document.getElementById('modalEdad').value = '';
    document.getElementById('modalObjetivo').value = '';
    document.getElementById('modalEnfermedades').value = '';
    document.getElementById('modalMedicacion').value = '';
    document.getElementById('modalTelefono').value = '';
    document.getElementById('modalEmail').value = '';
    document.getElementById('modalObservaciones').value = '';
}

// Guardar alumno desde el modal
const guardarAlumnoModal = document.getElementById('guardarAlumnoModal');
if (guardarAlumnoModal) {
    guardarAlumnoModal.onclick = () => {
        const nombre = document.getElementById('modalNombre').value.trim();
        if (!nombre) {
            alert('El nombre es obligatorio');
            return;
        }
        
        const alumnos = getAlumnos();
        if (alumnos.find(a => a.nombre === nombre)) {
            alert('Ya existe un alumno con ese nombre');
            return;
        }
        
        const nuevoAlumno = {
            nombre: nombre,
            edad: document.getElementById('modalEdad').value,
            objetivo: document.getElementById('modalObjetivo').value,
            enfermedades: document.getElementById('modalEnfermedades').value,
            medicacion: document.getElementById('modalMedicacion').value,
            telefono: document.getElementById('modalTelefono').value,
            email: document.getElementById('modalEmail').value,
            observaciones: document.getElementById('modalObservaciones').value,
            fechaRegistro: new Date().toLocaleDateString()
        };
        
        guardarAlumno(nuevoAlumno);
        localStorage.setItem('alumno_actual', nombre);
        
        modalNuevoCompleto.style.display = 'none';
        window.location.href = 'curso.html';
    };
}

// Opción B: Elegir alumno existente
const opcionElegir = document.getElementById('opcionElegir');
if (opcionElegir) {
    opcionElegir.onclick = () => {
        modalOpciones.style.display = 'none';
        cargarListaAlumnosModal();
        modalElegirAlumno.style.display = 'flex';
    };
}

function cargarListaAlumnosModal() {
    const alumnos = getAlumnos();
    const container = document.getElementById('listaAlumnosModal');
    
    if (alumnos.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">No hay alumnos registrados. Crea uno primero.</p>';
        return;
    }
    
    let html = '';
    alumnos.forEach(alumno => {
        const progreso = getProgreso(alumno.nombre);
        html += `
            <div class="alumno-item" data-nombre="${alumno.nombre}">
                <strong>${alumno.nombre}</strong><br>
                <small>${alumno.objetivo || 'Sin objetivo'} | Clases: ${progreso.completadas.length}/14</small>
            </div>
        `;
    });
    container.innerHTML = html;
    
    document.querySelectorAll('.alumno-item').forEach(item => {
        item.onclick = () => {
            const nombre = item.getAttribute('data-nombre');
            localStorage.setItem('alumno_actual', nombre);
            modalElegirAlumno.style.display = 'none';
            window.location.href = 'curso.html';
        };
    });
}

// Opción C: Solo explorar
const opcionExplorar = document.getElementById('opcionExplorar');
if (opcionExplorar) {
    opcionExplorar.onclick = () => {
        localStorage.removeItem('alumno_actual');
        modalOpciones.style.display = 'none';
        window.location.href = 'curso.html';
    };
}

// ===== MODAL DE PILARES (diseño bonito) =====
let modalPilar = document.getElementById('modalPilar');
if (!modalPilar) {
    modalPilar = document.createElement('div');
    modalPilar.id = 'modalPilar';
    modalPilar.className = 'modal-pilar';
    modalPilar.innerHTML = `
        <div class="modal-pilar-content">
            <div class="modal-pilar-header">
                <h3><span class="modal-pilar-icon"></span> <span id="modalPilarTitulo"></span></h3>
                <span class="close-pilar">&times;</span>
            </div>
            <div class="modal-pilar-body">
                <p id="modalPilarTexto"></p>
                <button id="btnCerrarPilar" class="btn-cerrar-pilar">Entendido</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalPilar);
}

const closePilar = modalPilar.querySelector('.close-pilar');
const btnCerrarPilar = document.getElementById('btnCerrarPilar');

function cerrarModalPilar() {
    modalPilar.style.display = 'none';
}

if (closePilar) closePilar.onclick = cerrarModalPilar;
if (btnCerrarPilar) btnCerrarPilar.onclick = cerrarModalPilar;

window.addEventListener('click', (event) => {
    if (event.target === modalPilar) cerrarModalPilar();
});

const contenidoPilares = {
    sueño: {
        titulo: 'Sueño reparador',
        texto: '🛌 El sueño no es tiempo perdido. Durante la noche tu cuerpo repara tejidos, regula hormonas (incluyendo las del hambre) y consolida lo aprendido.\n\n⚠️ Dormir mal aumenta cortisol, antojos de azúcar, baja testosterona y empeora la salud mental.\n\n✅ Prioriza 7-8 horas diarias, horario fijo y sin pantallas 1 hora antes de dormir.'
    },
    mente: {
        titulo: 'Mente en calma',
        texto: '🧠 La mente es el filtro por el que interpretas la realidad. El estrés crónico eleva cortisol y favorece la grasa abdominal.\n\n🔧 Herramientas clave: respiración diafragmática (4-4-6), meditación breve, aceptación de lo que no puedes cambiar.\n\n✅ Una mente en calma mejora decisiones, metabolismo y calidad de vida.'
    },
    ejercicio: {
        titulo: 'Movimiento con propósito',
        texto: '💪 El músculo es un órgano endocrino. Al entrenar fuerza, liberas miocinas que reducen inflamación, mejoran sensibilidad a insulina, regulan apetito y mejoran el ánimo.\n\n🏋️ No es solo estética: es salud metabólica, prevención de sarcopenia y longevidad.\n\n✅ Frecuencia: 2-3 veces por semana, priorizando fuerza.'
    },
    alimentacion: {
        titulo: 'Nutrición inteligente',
        texto: '🥗 No se trata de dietas extremas, sino de entender qué necesita tu cuerpo.\n\n🍗 Proteínas para reparar tejidos\n🥑 Grasas saludables para hormonas\n🍚 Carbohidratos para energía\n🥦 Vegetales variados para micronutrientes\n\n✅ Elimina ultraprocesados, azúcares añadidos y aceites industriales.'
    }
};

document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
        const pilar = card.getAttribute('data-pilar');
        const contenido = contenidoPilares[pilar];
        if (contenido) {
            const iconClass = card.querySelector('.feature-icon').className.split(' ')[1];
            document.getElementById('modalPilarTitulo').innerHTML = `<i class="${iconClass}"></i> ${contenido.titulo}`;
            document.getElementById('modalPilarTexto').innerText = contenido.texto;
            modalPilar.style.display = 'flex';
        }
    });
});