begin;
drop trigger if exists trg_prepare_resena on public.resenas;
drop function if exists public.prepare_resena();
drop table if exists public.resenas;
-- private.is_profesor() may be shared by later security work, so it is intentionally preserved.
commit;
