'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

// Recarga todos los datos desde Supabase y actualiza el store
async function reloadAll() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const store = useStore.getState()

    const [depts, techs, projs, projTechs, tasks, checklist, comments, notifs, statuses] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('technicians').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('project_technicians').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('checklist_items').select('*'),
      supabase.from('comments').select('*'),
      supabase.from('notifications').select('*').eq('destinatario_id', session.user.id),
      supabase.from('custom_statuses').select('valor'),
    ])

    const projectsWithTechs = (projs.data ?? []).map((p: any) => ({
      ...p,
      tecnicos_ids: (projTechs.data ?? [])
        .filter((pt: any) => pt.project_id === p.id)
        .map((pt: any) => pt.technician_id),
    }))

    const tasksWithDetails = (tasks.data ?? []).map((t: any) => ({
      ...t,
      checklist: (checklist.data ?? [])
        .filter((c: any) => c.task_id === t.id)
        .map((c: any) => ({ id: c.id, texto: c.texto, completado: c.completado })),
      comentarios: (comments.data ?? [])
        .filter((c: any) => c.task_id === t.id)
        .map((c: any) => ({ id: c.id, autor_id: c.autor_id, texto: c.texto, fecha: c.created_at })),
      adjuntos: t.adjuntos ?? [],
      tags: t.tags ?? [],
    }))

    if (depts.data)    store.setDepartments(depts.data)
    if (techs.data)    store.setTechnicians(techs.data)
    store.setProjects(projectsWithTechs)
    store.setTasks(tasksWithDetails)
    // Solo sobreescribir si la tabla tiene datos; si está vacía, conservar los defaults del store
    if (statuses.data && statuses.data.length > 0) store.setCustomStatuses(statuses.data.map((s: any) => s.valor))
    if (notifs.data) {
      store.setNotifications(notifs.data.map((n: any) => ({
        id: n.id, tarea_id: n.tarea_id,
        destinatario_id: n.destinatario_id, remitente_id: n.remitente_id,
        titulo: n.titulo, mensaje: n.mensaje, leida: n.leida, fecha: n.created_at,
      })))
    }
  } catch (err) {
    console.error('reloadAll error:', err)
  }
}

export default function DataProvider() {
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current || !isSupabaseConfigured()) return
    loaded.current = true

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const store = useStore.getState()

        // Perfil del usuario
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single()

        if (profile) {
          store.setCurrentUser({
            id: session.user.id,
            nombre: profile.nombre,
            rol: profile.rol,
            email: session.user.email ?? '',
            departamento_id: profile.departamento_id ?? '',
            avatar: profile.avatar ?? '',
          })
        }

        // Carga inicial
        await reloadAll()

        // ── Realtime: sincronización entre escritorio e iPhone ─────────────
        // Cualquier cambio en estas tablas recarga todos los datos para
        // mantener consistencia (checklist, tecnicos_ids, comentarios, etc.)

        supabase.channel('sync-departments')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => reloadAll())
          .subscribe()

        supabase.channel('sync-technicians')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'technicians' }, () => reloadAll())
          .subscribe()

        supabase.channel('sync-projects')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => reloadAll())
          .subscribe()

        supabase.channel('sync-project-technicians')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'project_technicians' }, () => reloadAll())
          .subscribe()

        supabase.channel('sync-tasks')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => reloadAll())
          .subscribe()

        supabase.channel('sync-checklist')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items' }, () => reloadAll())
          .subscribe()

        supabase.channel('sync-comments')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => reloadAll())
          .subscribe()

        // Notificaciones en tiempo real (solo las del usuario actual)
        supabase.channel('sync-notifications')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `destinatario_id=eq.${session.user.id}` },
            (payload: any) => {
              const n = payload.new
              useStore.getState().setNotifications([
                ...useStore.getState().notifications,
                { id: n.id, tarea_id: n.tarea_id, destinatario_id: n.destinatario_id,
                  remitente_id: n.remitente_id, titulo: n.titulo, mensaje: n.mensaje,
                  leida: n.leida, fecha: n.created_at },
              ])
            }
          )
          .subscribe()

      } catch (err) {
        console.error('DataProvider init error:', err)
      }
    }

    init()

    return () => {
      supabase.removeAllChannels()
    }
  }, [])

  return null
}
