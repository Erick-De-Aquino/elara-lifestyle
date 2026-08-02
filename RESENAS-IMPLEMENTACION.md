# Reseñas — implementación

Esta versión añade una página de reseñas para alumnos y otra para el profesor.

Antes de probarla, debe ejecutarse en el proyecto Supabase `elara-alumnos` el archivo:

`supabase/migrations/0002_create_reviews.sql`

El rollback está en:

`supabase/migrations/0002_create_reviews_rollback.sql`

Comportamiento:
- Todos los alumnos autenticados ven reseñas aprobadas.
- Solo alumnos con 14 clases completadas pueden enviar una reseña.
- Una reseña nueva o editada queda en estado pendiente.
- El profesor puede aprobar y publicar, rechazar o devolver a pendiente.
- Solo se permite una reseña por alumno.
