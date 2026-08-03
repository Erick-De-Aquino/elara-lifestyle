let resenasProfesor=[]; let filtroResenas='pending';

function escR(v){
    const d=document.createElement('div');
    d.textContent=v??'';return d.innerHTML;
}

function starsR(v){
    return '★'.repeat(v)+'☆'.repeat(5-v)
}

function estadoR(status) {
  return ({
    pending: 'Pendiente',
    approved: 'Publicada',
    changes_requested: 'Cambios solicitados'
  })[status] || status;
}

async function initProfesorResenas(){
    if(!window.auth?.requireAuth('profesor'))
        return;const s=window.auth.getCurrentUser();
    await window.navegacion.initNavegacion('profesor','resenas',s.nombre);
    await cargarResenasProfesor();renderProfesorResenas();
}

async function cargarResenasProfesor(){
    const {data,error}=await window.supabaseClient
    .from('resenas')
    .select('id, usuario_id, valoracion, comentario, status, created_at, updated_at, usuarios(nombre,email)')
    .order('created_at',{ascending:false});if(error)throw error;resenasProfesor=data||[];
}

function renderProfesorResenas() {
  const c = document.getElementById('resenas-container');

  const counts = {
    pending: 0,
    approved: 0
  };

  resenasProfesor.forEach(r => {
    if (counts.hasOwnProperty(r.status)) {
      counts[r.status]++;
    }
  });

  const items = resenasProfesor.filter(r => {
    if (filtroResenas === 'pending') {
      return r.status === 'pending' || r.status === 'changes_requested';
    }

    return r.status === 'approved';
  });

  c.innerHTML = `
    <section class="resenas-hero">
      <div>
        <h2>⭐ Gestión de reseñas</h2>
        <p>Revisa y publica las experiencias enviadas por los alumnos.</p>
      </div>
    </section>

    <div class="resenas-tabs">
      ${[
        ['pending', 'Pendientes'],
        ['approved', 'Publicadas']
      ].map(([id, texto]) => `
        <button
          class="resenas-tab ${filtroResenas === id ? 'active' : ''}"
          data-filter="${id}">
          ${texto} (${counts[id]})
        </button>
      `).join('')}
    </div>

    <div class="resenas-admin-list">
      ${
        items.length
          ? items.map(cardAdmin).join('')
          : '<div class="resenas-empty">No hay reseñas en este estado.</div>'
      }
    </div>
  `;

  document.querySelectorAll('.resenas-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      filtroResenas = btn.dataset.filter;
      renderProfesorResenas();
    });
  });

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      cambiarEstado(Number(btn.dataset.id), btn.dataset.action);
    });
  });
}

function cardAdmin(r) {
  const u = r.usuarios || {};

  const requiereRevision = r.status === 'changes_requested';

  return `
    <article class="resena-admin-card">

      <div class="resena-admin-meta">
        <div>
          <p class="resena-name">${escR(u.nombre || 'Alumno')}</p>

          <span class="resena-date">
            ${escR(u.email || '')}
            ·
            ${new Date(r.created_at).toLocaleDateString('es-ES')}
          </span>
        </div>

        <span class="resena-status ${r.status}">
          ${
            requiereRevision
              ? 'Requiere revisión'
              : estadoR(r.status)
          }
        </span>

      </div>

      <div class="resena-stars">
        ${starsR(r.valoracion)}
      </div>

      <p class="resena-comment">
        ${escR(r.comentario)}
      </p>

      <div class="resena-admin-actions">

        ${
          r.status !== 'approved'
            ? `<button
                class="btn-resena success"
                data-action="approved"
                data-id="${r.id}">
                Publicar
              </button>`
            : ''
        }

        ${
          r.status !== 'approved'
            ? `<button
                class="btn-resena secondary"
                data-action="changes_requested"
                data-id="${r.id}">
                Solicitar cambios
              </button>`
            : ''
        }

      </div>

    </article>
  `;
}

async function cambiarEstado(id, accion) {

  const resena = resenasProfesor.find(r => r.id === id);

  if (!resena) return;

  if (accion === 'approved') {

    window.modal.confirmar(
      '¿Confirmas que este alumno ha finalizado correctamente ELARA LifeStyle? La reseña será publicada.',
      async () => {

        const { error } = await window.supabaseClient
          .from('resenas')
          .update({
            status: 'approved',
            curso_verificado: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          console.error(error);
          window.modal.mostrar(
            'No se pudo publicar la reseña',
            'error'
          );
          return;
        }

        window.modal.mostrar(
          'Reseña publicada correctamente',
          'exito'
        );

        await cargarResenasProfesor();
        renderProfesorResenas();

      }
    );

    return;
  }

  if (accion === 'changes_requested') {

    const comentario = prompt(
      '¿Qué cambios le solicitarás al alumno?\n\nEste comentario será visible únicamente para él.'
    );

    if (comentario === null) return;

    const { error } = await window.supabaseClient
      .from('resenas')
      .update({
        status: 'changes_requested',
        feedback_profesor: comentario.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error(error);

      window.modal.mostrar(
        'No se pudo actualizar la reseña',
        'error'
      );

      return;
    }

    window.modal.mostrar(
      'Se solicitaron cambios al alumno',
      'exito'
    );

    await cargarResenasProfesor();
    renderProfesorResenas();

  }

}

document.addEventListener('DOMContentLoaded',()=>initProfesorResenas().catch(err=>{console.error(err);document.getElementById('resenas-container').innerHTML='<div class="resenas-empty">No se pudieron cargar las reseñas. Comprueba la migración de Supabase.</div>';}));
