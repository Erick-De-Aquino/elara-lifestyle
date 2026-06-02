// ===== GESTIÓN DE ALUMNOS PARA PROFESOR =====

// Función para mostrar modal de mensaje
function mostrarModal(mensaje, tipo, callback) {
    const modal = document.getElementById('modalMensajeProfesor');
    const icono = document.getElementById('modalIcono');
    const titulo = document.getElementById('modalTitulo');
    const msg = document.getElementById('modalMensaje');
    
    if (tipo === 'exito') {
        icono.className = 'fas fa-check-circle icono-exito';
        titulo.textContent = 'Éxito';
    } else if (tipo === 'error') {
        icono.className = 'fas fa-exclamation-circle icono-peligro';
        titulo.textContent = 'Error';
    } else {
        icono.className = 'fas fa-info-circle icono-advertencia';
        titulo.textContent = 'Información';
    }
    
    msg.textContent = mensaje;
    modal.style.display = 'flex';
    
    const btnCerrar = document.getElementById('modalBtnCerrar');
    btnCerrar.onclick = () => {
        modal.style.display = 'none';
        if (callback) callback();
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            if (callback) callback();
        }
    };
}

// Función para mostrar modal con botón de copiar (para resetear contraseña)
function mostrarModalConCopia(mensaje, textoACopiar, callback) {
    const modal = document.getElementById('modalMensajeProfesor');
    const icono = document.getElementById('modalIcono');
    const titulo = document.getElementById('modalTitulo');
    const msg = document.getElementById('modalMensaje');
    
    icono.className = 'fas fa-check-circle icono-exito';
    titulo.textContent = 'Contraseña restablecida';
    
    msg.innerHTML = `
        <p style="margin-bottom: 8px;">${mensaje}</p>
        <div style="background: #e9ecef; padding: 6px 10px; border-radius: 6px; margin: 8px 0; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <code style="font-size: 0.9rem;">${textoACopiar}</code>
            <button id="btnCopiarPassword" style="background: #1D3557; color: white; border: none; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">
                Copiar
            </button>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    const btnCerrar = document.getElementById('modalBtnCerrar');
    btnCerrar.onclick = () => {
        modal.style.display = 'none';
        if (callback) callback();
    };
    
    const btnCopiar = document.getElementById('btnCopiarPassword');
    if (btnCopiar) {
        btnCopiar.onclick = async () => {
            await navigator.clipboard.writeText(textoACopiar);
            btnCopiar.textContent = '¡Copiado!';
            btnCopiar.style.background = '#2A9D8F';
            setTimeout(() => {
                btnCopiar.textContent = 'Copiar';
                btnCopiar.style.background = '#1D3557';
            }, 1500);
        };
    }
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            if (callback) callback();
        }
    };
}

// Función para mostrar confirmación
function mostrarConfirmacion(mensaje, onConfirm) {
    const modal = document.getElementById('modalConfirmarProfesor');
    const msg = document.getElementById('confirmarMensaje');
    msg.textContent = mensaje;
    modal.style.display = 'flex';
    
    const btnSi = document.getElementById('confirmarSi');
    const btnNo = document.getElementById('confirmarNo');
    
    btnSi.onclick = () => {
        modal.style.display = 'none';
        onConfirm();
    };
    
    btnNo.onclick = () => {
        modal.style.display = 'none';
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Función para mostrar detalles del alumno
function mostrarDetalleAlumno(alumno) {
    const modal = document.getElementById('modalDetalleAlumno');
    const contenido = document.getElementById('detalleContenido');
    
    const completadas = alumno.progreso?.completadas || [];
    
    // Determinar la siguiente clase
    const todasLasClases = ["clase1", "clase2", "clase3", "clase4", "clase5", "clase6", "clase7", "clase8", "clase9", "clase10", "clase11", "clase12", "clase13", "clase14"];
    let siguienteClase = null;
    let siguienteClaseNumero = null;
    
    for (let i = 0; i < todasLasClases.length; i++) {
        if (!completadas.includes(todasLasClases[i])) {
            siguienteClase = todasLasClases[i];
            siguienteClaseNumero = i + 1;
            break;
        }
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
    
    let comentariosHtml = '';
        if (alumno.notas_profesor) {
            for (const [claseId, comentario] of Object.entries(alumno.notas_profesor)) {
                if (comentario) {
                    comentariosHtml += `<div class="comentario-item"><strong>Clase ${claseId}:</strong><p>${comentario}</p></div>`;
                }
            }
    }
    
    contenido.innerHTML = `
        <div class="detalle-campo"><strong>Usuario:</strong> ${alumno.usuario}</div>
        <div class="detalle-campo"><strong>Nombre:</strong> ${alumno.nombre || '-'}</div>
        <div class="detalle-campo"><strong>Progreso:</strong> ${completadas.length}/14</div>
        <div class="detalle-campo"><strong>Fecha registro:</strong> ${new Date(alumno.fecha_creacion).toLocaleDateString() || '-'}</div>
        <div class="detalle-campo"><strong>Mis notas sobre el alumno:</strong></div>
        <div class="comentarios-lista">${comentariosHtml || '<p>No hay comentarios</p>'}</div>
    `;
    
    modal.style.display = 'flex';
    
    // Modificar botones del modal para incluir "Continuar"
    const botonesModal = document.querySelector('#modalDetalleAlumno .botones-modal');
    if (botonesModal) {
        if (siguienteClase) {
            botonesModal.innerHTML = `
                <button id="detalleContinuar" class="btn-primary">✅ Continuar: ${claseTitulos[siguienteClase]}</button>
                <button id="detalleCerrar" class="btn-cancelar-modal">Cerrar</button>
            `;
            
            document.getElementById('detalleContinuar')?.addEventListener('click', () => {
                localStorage.setItem('alumno_actual', alumno.usuario);
                window.location.href = `clase.html?id=${siguienteClase}`;
            });
        } else {
            botonesModal.innerHTML = `
                <button class="btn-success" disabled>🏆 ¡Curso completado!</button>
                <button id="detalleCerrar" class="btn-cancelar-modal">Cerrar</button>
            `;
        }
        
        document.getElementById('detalleCerrar')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
}

function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    return crypto.subtle.digest('SHA-256', data).then(hash => {
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    });
}

function generarContrasena(longitud = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < longitud; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function cargarListaAlumnos() {
    const { data, error } = await supabaseClient
        .from('alumnos')
        .select('*')
        .eq('es_profesor', false)
        .order('fecha_creacion', { ascending: false });
    
    if (error) {
        mostrarModal('Error al cargar alumnos', 'error');
        return;
    }
    
    const container = document.getElementById('lista-alumnos-container');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<p class="text-center">No hay alumnos registrados</p>';
        return;
    }
    
    let html = `<table style="width:100%; border-collapse:collapse; margin-top:15px; background:white; border-radius:12px; overflow:hidden;">
        <thead>
            <tr style="background:#1D3557; color:white;">
                <th style="padding:12px; text-align:left; font-weight:bold;">Usuario</th>
                <th style="padding:12px; text-align:left; font-weight:bold;">Nombre</th>
                <th style="padding:12px; text-align:left; font-weight:bold;">Progreso</th>
                <th style="padding:12px; text-align:left; font-weight:bold;">Acciones</th>
            </tr>
        </thead>
        <tbody>`;
    
    data.forEach(alumno => {
        const completadas = alumno.progreso?.completadas?.length || 0;
        html += `
            <tr style="border-bottom: 1px solid #E0E0E0;">
                <td style="padding:12px;">${alumno.usuario}</td>
                <td style="padding:12px;">${alumno.nombre || '-'}</td>
                <td style="padding:12px;">${completadas}/14</td>
                <td style="padding:12px;">
                    <button class="btn-ver-alumno" data-usuario="${alumno.usuario}" style="margin:0 5px; padding:5px 10px; font-size:0.75rem; border-radius:5px; background:#1D3557; color:white; border:none; cursor:pointer;">Ver</button>
                    <button class="btn-reset-pass" data-usuario="${alumno.usuario}" style="margin:0 5px; padding:5px 10px; font-size:0.75rem; border-radius:5px; background:#F4A261; color:white; border:none; cursor:pointer;">Reset pass</button>
                    <button class="btn-eliminar-alumno" data-usuario="${alumno.usuario}" style="margin:0 5px; padding:5px 10px; font-size:0.75rem; border-radius:5px; background:#E63946; color:white; border:none; cursor:pointer;">Eliminar</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
    document.querySelectorAll('.btn-ver-alumno').forEach(btn => {
        btn.addEventListener('click', () => verAlumno(btn.getAttribute('data-usuario')));
    });
    
    document.querySelectorAll('.btn-reset-pass').forEach(btn => {
        btn.addEventListener('click', () => resetearContrasena(btn.getAttribute('data-usuario')));
    });
    
    document.querySelectorAll('.btn-eliminar-alumno').forEach(btn => {
        btn.addEventListener('click', () => eliminarAlumno(btn.getAttribute('data-usuario')));
    });
}

async function verAlumno(usuario) {
    const { data, error } = await supabaseClient
        .from('alumnos')
        .select('*')
        .eq('usuario', usuario)
        .single();
    
    if (error) {
        mostrarModal('Error al cargar los datos', 'error');
        return;
    }
    
    mostrarDetalleAlumno(data);
}

async function resetearContrasena(usuario) {
    const nuevaPassword = generarContrasena(8);
    const passwordHash = await hashPassword(nuevaPassword);
    
    const { error } = await supabaseClient
        .from('alumnos')
        .update({ contrasena: passwordHash })
        .eq('usuario', usuario);
    
    if (error) {
        mostrarModal('Error al resetear la contraseña', 'error');
        return;
    }
    
    mostrarModalConCopia(`Nueva contraseña para <strong>${usuario}</strong>:`, nuevaPassword);
}

function eliminarAlumno(usuario) {
    // Mostrar modal de confirmación
    const modalConfirm = document.getElementById('modalConfirmarProfesor');
    const msgConfirm = document.getElementById('confirmarMensaje');
    msgConfirm.textContent = `¿Eliminar al alumno "${usuario}"? Esta acción no se puede deshacer.`;
    modalConfirm.style.display = 'flex';
    
    const btnSi = document.getElementById('confirmarSi');
    const btnNo = document.getElementById('confirmarNo');
    
    const eliminar = async () => {
        modalConfirm.style.display = 'none';
        
        const { error } = await supabaseClient
            .from('alumnos')
            .delete()
            .eq('usuario', usuario);
        
        if (error) {
            mostrarModal('Error al eliminar: ' + error.message, 'error');
            return;
        }
        
        mostrarModal('Alumno eliminado correctamente', 'exito', () => {
            cargarListaAlumnos();
        });
    };
    
    const cancelar = () => {
        modalConfirm.style.display = 'none';
    };
    
    // Remover eventos anteriores
    btnSi.removeEventListener('click', eliminar);
    btnNo.removeEventListener('click', cancelar);
    
    btnSi.addEventListener('click', eliminar);
    btnNo.addEventListener('click', cancelar);
    
    modalConfirm.onclick = (e) => {
        if (e.target === modalConfirm) {
            modalConfirm.style.display = 'none';
        }
    };
}
async function crearAlumno(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('nuevoUsuario').value.trim();
    const nombre = document.getElementById('nuevoNombre').value.trim() || usuario;
    const password = document.getElementById('nuevaPassword').value;
    
    if (!usuario || !password) {
        mostrarModal('Usuario y contraseña son obligatorios', 'error');
        return;
    }
    
    if (password.length < 4) {
        mostrarModal('La contraseña debe tener al menos 4 caracteres', 'error');
        return;
    }
    
    const passwordHash = await hashPassword(password);
    
    const { error } = await supabaseClient
        .from('alumnos')
        .insert({
            usuario: usuario,
            nombre: nombre,
            contrasena: passwordHash,
            es_profesor: false,
            progreso: { completadas: [] },
            comentarios: {}
        });
    
    if (error) {
        mostrarModal('Error al crear el alumno. El usuario ya existe?', 'error');
        return;
    }
    
    mostrarModal(`Alumno "${usuario}" creado correctamente`, 'exito', () => {
        document.getElementById('nuevoUsuario').value = '';
        document.getElementById('nuevoNombre').value = '';
        document.getElementById('nuevaPassword').value = '';
        cargarListaAlumnos();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    cargarListaAlumnos();
    document.getElementById('formCrearAlumno')?.addEventListener('submit', crearAlumno);
});