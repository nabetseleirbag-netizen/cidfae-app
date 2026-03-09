/**
 * supabaseSync.ts
 * Funciones write-through: actualiza Zustand (optimistic) + sincroniza con Supabase.
 * Si Supabase no está configurado, solo actualiza Zustand (demo mode).
 */

import { supabase, isSupabaseConfigured } from './supabase'
import { useStore } from './store'
import type { Department, Technician, Project, Task, Notification } from './types'

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const db = () => isSupabaseConfigured() ? supabase : null

// ── Helpers para mapear entre Zustand types y DB columns ─────────────────

function taskToDb(task: Task) {
  return {
    id: task.id,
    titulo: task.titulo,
    descripcion: task.descripcion,
    proyecto_id: task.proyecto_id || null,
    departamento_id: task.departamento_id || null,
    tecnico_id: task.tecnico_id || null,
    prioridad: task.prioridad,
    estado: task.estado,
    fecha_inicio: task.fecha_inicio || null,
    fecha_limite: task.fecha_limite || null,
    adjuntos: task.adjuntos,
    tags: task.tags,
    enviada: task.enviada ?? false,
    fecha_envio: task.fecha_envio || null,
  }
}

function projectToDb(project: Project) {
  return {
    id: project.id,
    nombre: project.nombre,
    codigo: project.codigo,
    descripcion: project.descripcion,
    departamento_id: project.departamento_id || null,
    responsable_id: project.responsable_id || null,
    fecha_inicio: project.fecha_inicio || null,
    fecha_fin: project.fecha_fin || null,
    estado: project.estado,
    color: project.color,
  }
}

// ── Departamentos ─────────────────────────────────────────────────────────

export async function syncAddDepartment(d: Omit<Department, 'id'>) {
  const newDept: Department = { ...d, id: uid() }
  useStore.getState().addDepartment(d)
  const client = db()
  if (client) {
    const { error } = await client.from('departments').insert({ ...newDept })
    if (error) console.error('syncAddDepartment error:', error)
  }
  return newDept
}

export async function syncUpdateDepartment(id: string, d: Partial<Department>) {
  useStore.getState().updateDepartment(id, d)
  const client = db()
  if (client) {
    const { error } = await client.from('departments').update(d).eq('id', id)
    if (error) console.error('syncUpdateDepartment error:', error)
  }
}

export async function syncDeleteDepartment(id: string) {
  useStore.getState().deleteDepartment(id)
  const client = db()
  if (client) {
    const { error } = await client.from('departments').delete().eq('id', id)
    if (error) console.error('syncDeleteDepartment error:', error)
  }
}

// ── Técnicos ──────────────────────────────────────────────────────────────

export async function syncAddTechnician(t: Omit<Technician, 'id'>) {
  const newTech: Technician = { ...t, id: uid() }
  useStore.getState().addTechnician(t)
  const client = db()
  if (client) {
    const { error } = await client.from('technicians').insert({
      ...newTech,
      avatar: undefined,  // not in DB
    })
    if (error) console.error('syncAddTechnician error:', error)
  }
  return newTech
}

export async function syncUpdateTechnician(id: string, t: Partial<Technician>) {
  useStore.getState().updateTechnician(id, t)
  const client = db()
  if (client) {
    const { avatar: _, ...dbFields } = t as any
    const { error } = await client.from('technicians').update(dbFields).eq('id', id)
    if (error) console.error('syncUpdateTechnician error:', error)
  }
}

export async function syncDeleteTechnician(id: string) {
  useStore.getState().deleteTechnician(id)
  const client = db()
  if (client) {
    const { error } = await client.from('technicians').delete().eq('id', id)
    if (error) console.error('syncDeleteTechnician error:', error)
  }
}

// ── Proyectos ─────────────────────────────────────────────────────────────

export async function syncAddProject(p: Omit<Project, 'id'>) {
  const newProj: Project = { ...p, id: uid() }
  useStore.getState().addProject(p)
  const client = db()
  if (client) {
    const projectRow = projectToDb(newProj)
    const { error } = await client.from('projects').insert(projectRow)
    if (error) {
      console.error('syncAddProject error:', error)
      return newProj
    }
    // Insert junction table rows
    if (p.tecnicos_ids?.length) {
      await client.from('project_technicians').insert(
        p.tecnicos_ids.map(tid => ({ project_id: newProj.id, technician_id: tid }))
      )
    }
  }
  return newProj
}

export async function syncUpdateProject(id: string, p: Partial<Project>) {
  useStore.getState().updateProject(id, p)
  const client = db()
  if (client) {
    const { tecnicos_ids, ...fields } = p as any
    if (Object.keys(fields).length) {
      const { error } = await client.from('projects').update(fields).eq('id', id)
      if (error) console.error('syncUpdateProject error:', error)
    }
    if (tecnicos_ids !== undefined) {
      await client.from('project_technicians').delete().eq('project_id', id)
      if (tecnicos_ids.length) {
        await client.from('project_technicians').insert(
          tecnicos_ids.map((tid: string) => ({ project_id: id, technician_id: tid }))
        )
      }
    }
  }
}

export async function syncDeleteProject(id: string) {
  useStore.getState().deleteProject(id)
  const client = db()
  if (client) {
    const { error } = await client.from('projects').delete().eq('id', id)
    if (error) console.error('syncDeleteProject error:', error)
  }
}

// ── Tareas ────────────────────────────────────────────────────────────────

export async function syncAddTask(t: Omit<Task, 'id'>) {
  const newTask: Task = {
    ...t,
    id: uid(),
    checklist: t.checklist ?? [],
    comentarios: t.comentarios ?? [],
    adjuntos: t.adjuntos ?? [],
    tags: t.tags ?? [],
  }
  useStore.getState().addTask(t)
  const client = db()
  if (client) {
    const taskRow = taskToDb(newTask)
    const { error } = await client.from('tasks').insert(taskRow)
    if (error) {
      console.error('syncAddTask error:', error)
      return newTask
    }
    // Insert checklist items
    if (newTask.checklist.length) {
      await client.from('checklist_items').insert(
        newTask.checklist.map((c, i) => ({ id: c.id, task_id: newTask.id, texto: c.texto, completado: c.completado, orden: i }))
      )
    }
  }
  return newTask
}

export async function syncUpdateTask(id: string, t: Partial<Task>) {
  useStore.getState().updateTask(id, t)
  const client = db()
  if (client) {
    const { checklist, comentarios, ...fields } = t as any
    if (Object.keys(fields).length) {
      const { error } = await client.from('tasks').update(fields).eq('id', id)
      if (error) console.error('syncUpdateTask error:', error)
    }
  }
}

export async function syncDeleteTask(id: string) {
  useStore.getState().deleteTask(id)
  const client = db()
  if (client) {
    const { error } = await client.from('tasks').delete().eq('id', id)
    if (error) console.error('syncDeleteTask error:', error)
  }
}

export async function syncMoveTask(taskId: string, newStatus: Task['estado']) {
  useStore.getState().moveTask(taskId, newStatus)
  const client = db()
  if (client) {
    const { error } = await client.from('tasks').update({ estado: newStatus }).eq('id', taskId)
    if (error) console.error('syncMoveTask error:', error)
  }
}

export async function syncToggleChecklistItem(taskId: string, itemId: string) {
  useStore.getState().toggleChecklistItem(taskId, itemId)
  const client = db()
  if (client) {
    const task = useStore.getState().tasks.find(t => t.id === taskId)
    const item = task?.checklist.find(c => c.id === itemId)
    if (item) {
      const { error } = await client.from('checklist_items').update({ completado: item.completado }).eq('id', itemId)
      if (error) console.error('syncToggleChecklist error:', error)
    }
  }
}

export async function syncAddComment(taskId: string, text: string) {
  useStore.getState().addComment(taskId, text)
  const client = db()
  const { data: { session } } = await supabase?.auth?.getSession() ?? { data: { session: null } }
  if (client && session) {
    const newComment = useStore.getState().tasks.find(t => t.id === taskId)?.comentarios.slice(-1)[0]
    if (newComment) {
      const { error } = await client.from('comments').insert({
        id: newComment.id,
        task_id: taskId,
        autor_id: session.user.id,
        texto: text,
      })
      if (error) console.error('syncAddComment error:', error)
    }
  }
}

export async function syncSendTaskNotification(taskId: string) {
  useStore.getState().sendTaskNotification(taskId)
  const client = db()
  const { data: { session } } = await supabase?.auth?.getSession() ?? { data: { session: null } }
  if (client && session) {
    const task = useStore.getState().tasks.find(t => t.id === taskId)
    const newNotif = useStore.getState().notifications.slice(-1)[0]
    if (task && newNotif) {
      await Promise.all([
        client.from('tasks').update({ enviada: true, fecha_envio: new Date().toISOString() }).eq('id', taskId),
        client.from('notifications').insert({
          id: newNotif.id,
          tarea_id: taskId,
          destinatario_id: task.tecnico_id,
          remitente_id: session.user.id,
          titulo: newNotif.titulo,
          mensaje: newNotif.mensaje,
          leida: false,
        }),
      ])
    }
  }
}

// ── Estados personalizados ────────────────────────────────────────────────

export async function syncAddStatus(status: string) {
  useStore.getState().addStatus(status)
  const client = db()
  if (client) {
    const norm = status.trim().toLowerCase()
    await client.from('custom_statuses').insert({ valor: norm }).single()
  }
}

export async function syncRemoveStatus(status: string) {
  useStore.getState().removeStatus(status)
  const client = db()
  if (client) {
    await client.from('custom_statuses').delete().eq('valor', status)
  }
}
