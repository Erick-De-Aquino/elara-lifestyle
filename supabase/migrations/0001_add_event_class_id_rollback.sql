-- Reversión de la vinculación entre eventos y clases.
-- ADVERTENCIA: elimina cualquier clase_id ya asignado a eventos.

begin;

alter table public.eventos
  drop constraint if exists eventos_clase_id_check;

alter table public.eventos
  drop column if exists clase_id;

commit;
