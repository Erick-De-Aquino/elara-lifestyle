-- ELARA Lifestyle: vincular cada evento con una clase del curso.
-- Cambio no destructivo: los eventos existentes conservan clase_id = NULL.

begin;

alter table public.eventos
  add column if not exists clase_id integer;

alter table public.eventos
  drop constraint if exists eventos_clase_id_check;

alter table public.eventos
  add constraint eventos_clase_id_check
  check (clase_id is null or clase_id between 1 and 14);

comment on column public.eventos.clase_id is
  'Número de clase del curso asociada al evento (1 a 14).';

commit;
