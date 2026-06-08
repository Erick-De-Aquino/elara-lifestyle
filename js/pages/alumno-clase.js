// alumno-clase.js - Página de clase individual (vista alumno)

let claseId = null;
let claseData = null;
let alumnoActual = null;
let apuntes = '';

// ===== INICIALIZAR PÁGINA =====
async function initClase() {
    if (!window.auth || !window.auth.requireAuth('alumno')) {
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    claseId = urlParams.get('id');
    
    if (!claseId) {
        window.modal.mostrar('Clase no encontrada', 'error');
        setTimeout(() => window.location.href = 'curso.html', 1500);
        return;
    }
    
    const sesion = window.auth.getCurrentUser();
    if (!sesion) {
        window.location.href = '../../index.html';
        return;
    }
    
    alumnoActual = sesion;
    await window.navegacion.initNavegacion('alumno', 'curso', sesion.nombre);
    
    await cargarContenidoClase();
    await cargarApuntes();
    renderizarClase();
}

// ===== CARGAR CONTENIDO DE LA CLASE DESDE JSON LOCAL =====
async function cargarContenidoClase() {
    try {
        const response = await fetch('../../data/clases-alumno.json');
        const todasClases = await response.json();
        
        // Buscar la clase por número (clase1, clase2, etc.)
        const claseKey = `clase${claseId}`;
        claseData = todasClases[claseKey];
        
        if (!claseData) {
            window.modal.mostrar('Clase no encontrada', 'error');
            setTimeout(() => window.location.href = 'curso.html', 1500);
        }
    } catch (error) {
        console.error('Error cargando clase:', error);
        window.modal.mostrar('Error al cargar el contenido de la clase', 'error');
    }
}

// ===== CARGAR APUNTES DEL ALUMNO =====
async function cargarApuntes() {
    const supabase = window.supabaseClient;
    if (!supabase || !alumnoActual) return;
    
    const { data, error } = await supabase
        .from('apuntes')
        .select('contenido')
        .eq('usuario_id', alumnoActual.id)
        .eq('clase_id', `clase${claseId}`)
        .single();
    
    if (!error && data) {
        apuntes = data.contenido || '';
    }
}

// ===== RENDERIZAR CLASE =====
function renderizarClase() {
    const container = document.getElementById('clase-container');
    if (!container || !claseData) return;
    
    // Generar HTML de los bloques acordeón
    let bloquesHtml = '';
    if (claseData.bloques && Array.isArray(claseData.bloques)) {
        claseData.bloques.forEach((bloque, index) => {
            // Si el bloque tiene contenido HTML, usarlo; si no, usar subtitulos
            let contenidoBloque = '';
            if (bloque.contenido) {
                contenidoBloque = bloque.contenido;
            } else if (bloque.subtitulos && bloque.subtitulos.length > 0) {
                contenidoBloque = `<ul class="lista-subtemas">${bloque.subtitulos.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`;
            } else {
                contenidoBloque = '<p>Sin contenido disponible</p>';
            }
            
            bloquesHtml += `
                <div class="bloque-tema" id="bloque-${index}">
                    <div class="bloque-titulo">
                        <span>${escapeHtml(bloque.nombre)}</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="bloque-contenido-alumno">
                        ${contenidoBloque}
                    </div>
                </div>
            `;
        });
    }
    
    // Generar HTML de palabras clave
    let palabrasHtml = '';
    if (claseData.palabrasClave && Array.isArray(claseData.palabrasClave)) {
        palabrasHtml = `<ul class="lista-subtemas">${claseData.palabrasClave.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>`;
    }
    
    // Generar HTML de videos
    let videosHtml = '';
    if (claseData.videos && Array.isArray(claseData.videos)) {
        videosHtml = `<div class="videos-container">${claseData.videos.map(v => {
            const url = typeof v === 'object' ? v.url : '#';
            const titulo = typeof v === 'object' ? v.titulo : v;
            return `<a href="${url}" class="video-link" target="_blank" rel="noopener noreferrer"><i class="fab fa-youtube"></i> <span>${escapeHtml(titulo)}</span></a>`;
        }).join('')}</div>`;
    }
    
    const html = `
        <div class="progress-card">
            <div class="progress-header">
                <h2 class="progress-title">Clase ${claseData.numero}: ${escapeHtml(claseData.titulo)}</h2>
            </div>
            <p class="clase-capitulo">📘 ${escapeHtml(claseData.capitulo)}</p>
            <p class="clase-duracion"><i class="fas fa-clock"></i> Duración: ${claseData.duracion} min</p>
        </div>
        
        <div class="tabs-container">
            <div class="tabs-header">
                <button class="tab-btn active" data-tab="contenido">📖 Contenido</button>
            </div>
            
            <div class="tab-content active" id="tab-contenido">
                <div class="progress-card" style="margin-top: 0;">
                    <h3>🎯 Objetivo de la clase</h3>
                    <p>${escapeHtml(claseData.objetivo)}</p>
                    
                    <h3>📚 Palabras clave</h3>
                    ${palabrasHtml}
                    
                    <h3>📋 Temas de la clase</h3>
                    <div class="bloques-container">
                        ${bloquesHtml}
                    </div>
                    
                    <h3>✍️ Práctica de la semana</h3>
                    <div class="practica-card">
                        <p>${escapeHtml(claseData.practicaSemana)}</p>
                        <p class="practica-tip"><i class="fas fa-lightbulb"></i> ${escapeHtml(claseData.practicaTip)}</p>
                    </div>
                    
                    <h3>📺 Videos recomendados</h3>
                    ${videosHtml}
                </div>
            </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: var(--spacing-6);">
            <button id="btnAnterior" class="btn-secondary" ${claseId <= 1 ? 'disabled' : ''}>◀ Clase anterior</button>
            <button id="btnSiguiente" class="btn-primary" ${claseId >= 14 ? 'disabled' : ''}>Siguiente clase ▶</button>
        </div>
    `;
    
    container.innerHTML = html;
    
    crearModalApuntes();
    crearBotonApuntesFlotante();
    inicializarTabs();
    inicializarAcordeones();
    
    
    document.getElementById('btnAnterior')?.addEventListener('click', () => {
        if (claseId > 1) window.location.href = `clase.html?id=${parseInt(claseId) - 1}`;
    });
    
    document.getElementById('btnSiguiente')?.addEventListener('click', () => {
        if (claseId < 14) window.location.href = `clase.html?id=${parseInt(claseId) + 1}`;
    });
}

function inicializarTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${tabName}`)?.classList.add('active');
        });
    });
}

function inicializarAcordeones() {
    document.querySelectorAll('.bloque-tema').forEach(bloque => {
        const titulo = bloque.querySelector('.bloque-titulo');
        titulo?.addEventListener('click', () => {
            bloque.classList.toggle('abierto');
        });
    });
}

// ===== MODAL LATERAL DE APUNTES =====
function crearModalApuntes() {
    if (document.getElementById('modalApuntesLateral')) return;
    
    const modalHTML = `
        <div id="modalApuntesLateral" class="modal-apuntes-lateral">
            <div class="modal-apuntes-overlay"></div>
            <div class="modal-apuntes-content">
                <div class="modal-apuntes-header">
                    <h3><i class="fas fa-pen"></i> Mis Apuntes</h3>
                    <button id="btnCerrarApuntes" class="btn-cerrar-apuntes">&times;</button>
                </div>
                <div class="modal-apuntes-body">
                    <textarea id="apuntesTextareaLateral" class="apuntes-textarea" placeholder="Escribe aquí tus apuntes de esta clase...">${escapeHtml(apuntes)}</textarea>
                </div>
                <div class="modal-apuntes-footer">
                    <button id="guardarApuntesLateralBtn" class="btn-primary">💾 Guardar apuntes</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const cerrarYGuardar = async () => {
        const textarea = document.getElementById('apuntesTextareaLateral');
        if (textarea && apuntes !== textarea.value) {
            await guardarApuntesLateralSilencioso();
        }
        document.getElementById('modalApuntesLateral')?.classList.remove('active');
    };
    
    document.getElementById('btnCerrarApuntes')?.addEventListener('click', cerrarYGuardar);
    document.getElementById('modalApuntesLateral')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-apuntes-overlay')) {
            cerrarYGuardar();
        }
    });
    document.getElementById('guardarApuntesLateralBtn')?.addEventListener('click', guardarApuntesLateral);
}

// ===== GUARDAR APUNTES =====
async function guardarApuntesLateral() {
    const textarea = document.getElementById('apuntesTextareaLateral');
    if (!textarea || !alumnoActual) return;
    
    const contenido = textarea.value;
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    const guardarBtn = document.getElementById('guardarApuntesLateralBtn');
    guardarBtn.disabled = true;
    guardarBtn.textContent = 'Guardando...';
    
    const { data: existente } = await supabase
        .from('apuntes')
        .select('id')
        .eq('usuario_id', alumnoActual.id)
        .eq('clase_id', `clase${claseId}`)
        .single();
    
    let result;
    if (existente) {
        result = await supabase
            .from('apuntes')
            .update({ contenido, fecha_actualizacion: new Date() })
            .eq('id', existente.id);
    } else {
        result = await supabase
            .from('apuntes')
            .insert([{
                usuario_id: alumnoActual.id,
                clase_id: `clase${claseId}`,
                contenido,
                fecha_creacion: new Date()
            }]);
    }
    
    guardarBtn.disabled = false;
    guardarBtn.textContent = 'Guardar apuntes';
    
    if (result.error) {
        window.modal.mostrar('Error al guardar apuntes', 'error');
    } else {
        apuntes = contenido;
        window.modal.mostrar('Apuntes guardados', 'exito');
        document.getElementById('modalApuntesLateral')?.classList.remove('active');
    }
}

async function guardarApuntesLateralSilencioso() {
    const textarea = document.getElementById('apuntesTextareaLateral');
    if (!textarea || !alumnoActual) return;
    
    const contenido = textarea.value;
    const supabase = window.supabaseClient;
    if (!supabase) return;
    if (apuntes === contenido) return;
    
    const { data: existente } = await supabase
        .from('apuntes')
        .select('id')
        .eq('usuario_id', alumnoActual.id)
        .eq('clase_id', `clase${claseId}`)
        .single();
    
    if (existente) {
        await supabase
            .from('apuntes')
            .update({ contenido, fecha_actualizacion: new Date() })
            .eq('id', existente.id);
    } else {
        await supabase
            .from('apuntes')
            .insert([{
                usuario_id: alumnoActual.id,
                clase_id: `clase${claseId}`,
                contenido,
                fecha_creacion: new Date()
            }]);
    }
    
    apuntes = contenido;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== CREAR BOTÓN FLOTANTE DE APUNTES =====
function crearBotonApuntesFlotante() {
    // Eliminar si ya existe
    const btnExistente = document.getElementById('btnApuntesFlotante');
    if (btnExistente) btnExistente.remove();
    
    const btn = document.createElement('button');
    btn.id = 'btnApuntesFlotante';
    btn.innerHTML = '✏️';
    btn.title = 'Mis Apuntes';
    btn.className = 'btn-apuntes-flotante';
    
    btn.addEventListener('click', () => {
        const modal = document.getElementById('modalApuntesLateral');
        if (modal) {
            modal.classList.add('active');
        } else {
            crearModalApuntes();
            document.getElementById('modalApuntesLateral')?.classList.add('active');
        }
    });
    
    document.body.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', initClase);