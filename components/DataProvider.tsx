'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export default function DataProvider() {
  const loaded = useRef(false)
  const store = useStore()

  useEffect(() => {
    if (loaded.current || !isSupabaseConfigured()) return
    loaded.current = true

    async function loadData() {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Load profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

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

        // Load all data in parallel
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

        // Map project technicians
        const projectsWithTechs = (projs.data ?? []).map((p: any) => ({
          ...p,
          tecnicos_ids: (projTechs.data ?? [])
            .filter((pt: any) => pt.project_id === p.id)
            .map((pt: any) => pt.technician_id),
        }))

        // Map tasks with checklist and comments
        const tasksWithDetails = (tasks.data ?? []).map((t: any) => ({
          ...t,
          checklist: (checklist.data ?? [])
            .filter((c: any) => c.task_id === t.id)
            .map((c: any) => ({
              id: c.id,
              texto: c.texto,
              completado: c.completado,
            })),
          comentarios: (comments.data ?? [])
            .filter((c: any) => c.task_id === t.id)
            .map((c: any) => ({
              id: c.id,
              autor_id: c.autor_id,
              texto: c.texto,
              fecha: c.created_at,
            })),
          adjuntos: t.adjuntos ?? [],
          tags: t.tags ?? [],
        }))

        // Populate Zustand store
        if (depts.data) store.setDepartments(depts.data)
        if (techs.data) store.setTechnicians(techs.data)
        store.setProjects(projectsWithTechs)
        store.setTasks(tasksWithDetails)
        if (notifs.data) {
          store.setNotifications(
            notifs.data.map((n: any) => ({
              id: n.id,
              tarea_id: n.tarea_id,
              destinatario_id: n.destinatario_id,
              remitente_id: n.remitente_id,
              titulo: n.titulo,
              mensaje: n.mensaje,
              leida: n.leida,
              fecha: n.created_at,
            }))
          )
        }
        if (statuses.data) {
          store.setCustomStatuses(statuses.data.map((s: any) => s.valor))
        }

        // Subscribe to real-time notifications
        supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `destinatario_id=eq.${session.user.id}`,
            },
            (payload: any) => {
              const n = payload.new
              store.setNotifications([
                ...useStore.getState().notifications,
                {
                  id: n.id,
                  tarea_id: n.tarea_id,
                  destinatario_id: n.destinatario_id,
                  remitente_id: n.remitente_id,
                  titulo: n.titulo,
                  mensaje: n.mensaje,
                  leida: n.leida,
                  fecha: n.created_at,
                },
              ])
            }
          )
          .subscribe()
      } catch (err) {
        console.error('DataProvider error:', err)
      }
    }

    loadData()
  }, [])

  return null // no visible UI
}
