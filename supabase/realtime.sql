-- ================================================
-- Habilitar Supabase Realtime para sincronización
-- entre escritorio e iPhone en tiempo real.
--
-- Ejecutar en: Supabase > SQL Editor
-- (Solo necesitas hacerlo UNA vez)
-- ================================================

alter publication supabase_realtime add table public.departments;
alter publication supabase_realtime add table public.technicians;
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.project_technicians;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.checklist_items;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.notifications;
