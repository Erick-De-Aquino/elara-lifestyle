let resenasAlumno = [];
let resenaPropia = null;
let alumnoResenasActual = null;
let puedeResenar = false;
let totalClasesCurso = 0;

function escResena(valor) {
  const div = document.createElement('div');
  div.textContent = valor ?? '';
  return div.innerHTML;
}
function iniciales(nombre='Alumno') { 
  return nombre.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase(); 
}

function estrellas(valor) { 
  return '★'.repeat(valor) + '☆'.repeat(5-valor); 
}

function textoEstado(status) {
  return ({
    pending: 'Pendiente de aprobación',
    approved: 'Publicada',
    changes_requested: 'Cambios solicitados'
  })[status] || status;
}

async function initAlumnoResenas() {
  if (!window.auth?.requireAuth('alumno')) return;
  alumnoResenasActual = window.auth.getCurrentUser();
  await window.navegacion.initNavegacion('alumno', 'resenas', alumnoResenasActual.nombre);
  await cargarResenasAlumno();
  renderAlumnoResenas();
}

async function cargarResenasAlumno() {
  const sb = window.supabaseClient;
  const [
    { data: publicadas, error: e1 },
    { data: propia, error: e2 },
    { count, error: e3 },
    clasesResponse
  ] = await Promise.all([
    sb.from('resenas').select('id, usuario_id, valoracion, comentario, status, created_at, usuarios(nombre)').eq('status','approved').neq('usuario_id', alumnoResenasActual.id).order('created_at',{ascending:false}),
    sb.from('resenas').select('id, usuario_id, valoracion, comentario, status, created_at, updated_at').eq('usuario_id', alumnoResenasActual.id).maybeSingle(),
    sb.from('progreso').select('id',{count:'exact',head:true}).eq('usuario_id',alumnoResenasActual.id).eq('completada', true),fetch('../../data/clases.json')
  ]);
  if (e1 || e2 || e3) {
    console.error('Error cargando reseñas:', e1 || e2 || e3);
    throw e1 || e2 || e3;
  }
  resenasAlumno = publicadas || [];
  resenaPropia = propia || null;

  const clases = await clasesResponse.json();
  totalClasesCurso = Object.keys(clases || {}).length;

  puedeResenar =
    totalClasesCurso > 0 &&
    (count || 0) >= totalClasesCurso;
}

function cardResena(r) {
  const nombre = r.usuarios?.nombre || 'Alumno';

  return `
    <article class="resena-card">

      <div class="resena-card-header">
        <div class="resena-avatar">
          ${escResena(iniciales(nombre))}
        </div>

        <div>
          <p class="resena-name">${escResena(nombre)}</p>
          <span class="resena-date">
            ${new Date(r.created_at).toLocaleDateString('es-ES')}
          </span>
        </div>
      </div>

      <div
        class="resena-stars"
        aria-label="${r.valoracion} de 5 estrellas">
        ${estrellas(r.valoracion)}
      </div>

      <p class="resena-comment">
        ${escResena(r.comentario)}
      </p>

    </article>
  `;
}

function renderAlumnoResenas() {
  const c=document.getElementById('resenas-container');
  const propia = resenaPropia ? `<section class="resenas-panel resena-own">
    <div class="resena-admin-meta"><div><h2 style="margin:0 0 6px;color:var(--text-primary)">Tu reseña</h2><span class="resena-status ${resenaPropia.status}">${textoEstado(resenaPropia.status)}</span></div></div>
    <div class="resena-stars">${estrellas(resenaPropia.valoracion)}</div><p class="resena-comment">${escResena(resenaPropia.comentario)}</p>
    <p class="resena-note"> ${resenaPropia.status === 'approved' ? 'Tu reseña ya es visible para todos los alumnos.' : resenaPropia.status === 'changes_requested' ? `El profesor ha solicitado algunos cambios antes de publicarla.${resenaPropia.feedback_profesor ? '<br><br><strong>Comentario del profesor:</strong><br>' + escResena(resenaPropia.feedback_profesor) : ''}` : 'El profesor revisará tu reseña antes de publicarla.'}</p>
    <div class="resena-form-actions"><button class="btn-resena secondary" id="editar-resena">Editar reseña</button></div>
  </section>` : puedeResenar ? `<section class="resenas-panel resena-own"><h2 style="margin-top:0;color:var(--text-primary)">Comparte tu experiencia</h2><p style="color:var(--text-secondary)">Has completado el curso. Tu reseña se publicará automáticamente cuando sea aprobada.</p><button class="btn-resena primary" id="crear-resena">Escribir reseña</button></section>` : `<section class="resenas-panel resena-own"><h2 style="margin-top:0;color:var(--text-primary)">Comparte tu experiencia</h2><p style="color:var(--text-secondary)">Completa las ${totalClasesCurso} clases para poder enviar una reseña.</p></section>`;
  c.innerHTML = `<section class="resenas-hero"><div><h2>⭐ Experiencias de alumnos</h2><p>Reseñas aprobadas de personas que completaron ELARA LifeStyle.</p></div></section>${propia}<h2 style="color:var(--text-primary);margin:0 0 14px">Reseñas publicadas</h2>${resenasAlumno.length ? `<div class="resenas-grid">${resenasAlumno.map(cardResena).join('')}</div>` : '<div class="resenas-empty">Todavía no hay reseñas publicadas.</div>'}`;
  document.getElementById('crear-resena')?.addEventListener('click',()=>abrirFormularioResena());
  document.getElementById('editar-resena')?.addEventListener('click',()=>abrirFormularioResena(resenaPropia));
}

function abrirFormularioResena(actual = null) {
  window.modal.personalizado(`
    <div class="modal-form">
      <h3>${actual ? 'Editar' : 'Escribir'} reseña</h3>

      <form id="resena-form">

        <div class="form-group">
            <label>Tu valoración</label>
            <div id="rating-selector"></div>
        </div>

        <div class="form-group">
          <label for="resena-comentario">Tu experiencia</label>
          <textarea
            id="resena-comentario"
            maxlength="1200"
            required
            placeholder="Cuéntanos cómo fue tu experiencia..."
          >${escResena(actual?.comentario || '')}</textarea>
        </div>

        <p class="resena-note">
          Al guardar, la reseña quedará pendiente de aprobación.
        </p>

        <div class="modal-buttons">
          <button
            type="button"
            class="btn-resena secondary"
            id="cancelar-resena">
            Cancelar
          </button>

          <button
            class="btn-resena primary"
            type="submit">
            Enviar para aprobación
          </button>
        </div>

      </form>
    </div>
  `);

  const rating = window.RatingStars.create({
      container: document.getElementById('rating-selector'),
      value: actual?.valoracion || 0
  });

  document
    .getElementById('cancelar-resena')
    .addEventListener('click', () => window.modal.cerrar());

  document
    .getElementById('resena-form')
    .addEventListener('submit', async (e) => {

      e.preventDefault();

      const btn = e.submitter;
      btn.disabled = true;

      try {

        const payload = {
          usuario_id: alumnoResenasActual.id,
          valoracion: rating.getValue(),
          comentario: document.getElementById('resena-comentario').value.trim(),
          status: 'pending',
          updated_at: new Date().toISOString()
        };

        const query = actual
          ? window.supabaseClient
              .from('resenas')
              .update(payload)
              .eq('id', actual.id)
          : window.supabaseClient
              .from('resenas')
              .insert(payload);

        const { error } = await query;

        if (error) throw error;

        window.modal.cerrar();
        window.modal.mostrar('Reseña enviada para aprobación', 'exito');

        await cargarResenasAlumno();
        renderAlumnoResenas();

      } catch (err) {

        console.error(err);

        window.modal.mostrar(
          'No se pudo guardar la reseña',
          'error'
        );

        btn.disabled = false;
      }

    });
}

document.addEventListener('DOMContentLoaded',()=>initAlumnoResenas().catch(err=>{console.error(err); document.getElementById('resenas-container').innerHTML='<div class="resenas-empty">No se pudieron cargar las reseñas. Comprueba que la migración de Supabase esté aplicada.</div>';}));
