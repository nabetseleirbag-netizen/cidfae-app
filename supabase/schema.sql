-- ========================================
-- CIDFAE Gestión Técnica — Supabase Schema
-- Ejecutar en: Supabase > SQL Editor
-- ========================================

-- 1. Tabla de perfiles de usuario (extiende auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text not null default 'Usuario',
  rol text not null default 'tecnico' check (rol in ('administrador','jefe_proyecto','tecnico')),
  departamento_id uuid,
  avatar text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Departamentos
create table if not exists public.departments (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  color text not null default '#3b82f6',
  icon text not null default '🔧',
  descripcion text default '',
  created_at timestamptz default now()
);

-- 3. Técnicos
create table if not exists public.technicians (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  cargo text not null default 'Técnico',
  departamento_id uuid references public.departments(id),
  especialidad text default '',
  email text,
  telefono text default '',
  estado text not null default 'activo',
  iniciales text not null default 'XX',
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 4. Proyectos
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  codigo text not null unique,
  descripcion text default '',
  departamento_id uuid references public.departments(id),
  responsable_id uuid references public.technicians(id),
  fecha_inicio date,
  fecha_fin date,
  estado text not null default 'planificacion' check (estado in ('planificacion','en_ejecucion','pausado','finalizado')),
  color text default '#3b82f6',
  created_at timestamptz default now()
);

-- 5. Técnicos por Proyecto (many-to-many)
create table if not exists public.project_technicians (
  project_id uuid references public.projects(id) on delete cascade,
  technician_id uuid references public.technicians(id) on delete cascade,
  primary key (project_id, technician_id)
);

-- 6. Tareas
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descripcion text default '',
  proyecto_id uuid references public.projects(id),
  departamento_id uuid references public.departments(id),
  tecnico_id uuid references public.technicians(id),
  prioridad text not null default 'media' check (prioridad in ('alta','media','baja')),
  estado text not null default 'pendiente' check (estado in ('pendiente','en_progreso','en_revision','completado')),
  fecha_inicio date,
  fecha_limite date,
  adjuntos text[] default '{}',
  tags text[] default '{}',
  enviada boolean default false,
  fecha_envio timestamptz,
  created_at timestamptz default now()
);

-- 7. Items de Checklist
create table if not exists public.checklist_items (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade,
  texto text not null,
  completado boolean default false,
  orden int default 0,
  created_at timestamptz default now()
);

-- 8. Comentarios
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade,
  autor_id uuid references auth.users(id),
  texto text not null,
  created_at timestamptz default now()
);

-- 9. Notificaciones
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  tarea_id uuid references public.tasks(id) on delete cascade,
  destinatario_id uuid references auth.users(id),
  remitente_id uuid references auth.users(id),
  titulo text not null,
  mensaje text default '',
  leida boolean default false,
  created_at timestamptz default now()
);

-- 10. Estados personalizados de técnicos
create table if not exists public.custom_statuses (
  id uuid default gen_random_uuid() primary key,
  valor text not null unique,
  created_at timestamptz default now()
);

-- ── Trigger: crear perfil automáticamente al registrarse ──
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nombre, rol)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email), coalesce(new.raw_user_meta_data->>'rol', 'tecnico'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS (Row Level Security) ──
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.technicians enable row level security;
alter table public.projects enable row level security;
alter table public.project_technicians enable row level security;
alter table public.tasks enable row level security;
alter table public.checklist_items enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.custom_statuses enable row level security;

-- Función helper para obtener el rol del usuario actual
create or replace function public.get_my_role()
returns text as $$
  select rol from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- Políticas: Administrador tiene acceso total
create policy "admins_all" on public.departments for all using (public.get_my_role() = 'administrador');
create policy "admins_all" on public.technicians for all using (public.get_my_role() = 'administrador');
create policy "admins_all" on public.projects for all using (public.get_my_role() = 'administrador');
create policy "admins_all" on public.project_technicians for all using (public.get_my_role() = 'administrador');
create policy "admins_all" on public.tasks for all using (public.get_my_role() = 'administrador');
create policy "admins_all" on public.checklist_items for all using (public.get_my_role() = 'administrador');
create policy "admins_all" on public.comments for all using (public.get_my_role() = 'administrador');
create policy "admins_all" on public.notifications for all using (public.get_my_role() = 'administrador');
create policy "admins_all" on public.custom_statuses for all using (public.get_my_role() = 'administrador');

-- Políticas: Jefe de Proyecto — leer todo, CRUD en proyectos/tareas
create policy "jefes_read" on public.departments for select using (public.get_my_role() in ('jefe_proyecto','tecnico'));
create policy "jefes_read" on public.technicians for select using (public.get_my_role() in ('jefe_proyecto','tecnico'));
create policy "jefes_read" on public.custom_statuses for select using (public.get_my_role() in ('jefe_proyecto','tecnico'));
create policy "jefes_crud_projects" on public.projects for all using (public.get_my_role() = 'jefe_proyecto');
create policy "jefes_read_projects" on public.projects for select using (public.get_my_role() = 'tecnico');
create policy "jefes_read_pt" on public.project_technicians for select using (public.get_my_role() in ('jefe_proyecto','tecnico'));
create policy "jefes_crud_pt" on public.project_technicians for all using (public.get_my_role() = 'jefe_proyecto');
create policy "jefes_crud_tasks" on public.tasks for all using (public.get_my_role() = 'jefe_proyecto');
create policy "jefes_crud_checklist" on public.checklist_items for all using (public.get_my_role() = 'jefe_proyecto');
create policy "jefes_crud_comments" on public.comments for all using (public.get_my_role() = 'jefe_proyecto');
create policy "jefes_crud_notif" on public.notifications for all using (public.get_my_role() = 'jefe_proyecto');

-- Políticas: Técnico — solo sus tareas y notificaciones
create policy "tecnicos_own_tasks" on public.tasks for select using (
  public.get_my_role() = 'tecnico' and tecnico_id in (select id from public.technicians where user_id = auth.uid())
);
create policy "tecnicos_update_own_tasks" on public.tasks for update using (
  public.get_my_role() = 'tecnico' and tecnico_id in (select id from public.technicians where user_id = auth.uid())
);
create policy "tecnicos_own_notif" on public.notifications for select using (destinatario_id = auth.uid());
create policy "tecnicos_mark_read" on public.notifications for update using (destinatario_id = auth.uid());
create policy "tecnicos_read_checklist" on public.checklist_items for select using (
  task_id in (select id from public.tasks where tecnico_id in (select id from public.technicians where user_id = auth.uid()))
);
create policy "tecnicos_update_checklist" on public.checklist_items for update using (
  task_id in (select id from public.tasks where tecnico_id in (select id from public.technicians where user_id = auth.uid()))
);
create policy "tecnicos_read_comments" on public.comments for select using (
  task_id in (select id from public.tasks where tecnico_id in (select id from public.technicians where user_id = auth.uid()))
);
create policy "tecnicos_add_comments" on public.comments for insert with check (autor_id = auth.uid());

-- Profiles: cada usuario puede ver y editar su propio perfil
create policy "own_profile" on public.profiles for all using (id = auth.uid());
create policy "admins_all_profiles" on public.profiles for all using (public.get_my_role() = 'administrador');

-- ── Datos iniciales: estados de técnico ──
insert into public.custom_statuses (valor) values ('activo'),('inactivo'),('vacaciones'),('baja_medica')
  on conflict (valor) do nothing;
