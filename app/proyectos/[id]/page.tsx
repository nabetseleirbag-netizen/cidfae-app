'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { cn, formatDate, getProjectProgress, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/utils'
import { TaskStatus } from '@/lib/types'
import { ArrowLeft, Calendar, Users, CheckSquare, Clock, AlertTriangle, ChevronDown } from 'lucide-react'

const TASK_STATUS_LIST: TaskStatus[] = ['pendiente', 'en_progreso', 'en_revision', 'completado']

const DEPT_COLORS: Record<string, string> = {
  'dep-1': 'bg-blue-500',
  'dep-2': 'bg-purple-500',
  'dep-3': 'bg-emerald-500',
  'dep-4': 'bg-amber-500',
  'dep-5': 'bg-red-500',
  'dep-6': 'bg-cyan-500',
  'dep-7': 'bg-pink-500',
}

const GANTT_BAR_COLORS: Record<TaskStatus, string> = {
  pendiente: 'bg-slate-400',
  en_progreso: 'bg-blue-500',
  en_revision: 'bg-amber-500',
  completado: 'bg-emerald-500',
}

function safeDate(str: string): Date | null {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function calcGanttBar(
  taskStart: string,
  taskEnd: string,
  projStart: string,
  projEnd: string
): { left: number; width: number } {
  const ps = safeDate(projStart)
  const pe = safeDate(projEnd)
  const ts = safeDate(taskStart)
  const te = safeDate(taskEnd)

  if (!ps || !pe || !ts || !te || pe.getTime() === ps.getTime()) {
    return { left: 0, width: 100 }
  }

  const totalMs = pe.getTime() - ps.getTime()
  const rawLeft = ((ts.getTime() - ps.getTime()) / totalMs) * 100
  const rawWidth = ((te.getTime() - ts.getTime()) / totalMs) * 100

  const left = Math.max(0, Math.min(rawLeft, 100))
  const width = Math.max(2, Math.min(rawWidth, 100 - left))

  return { left, width }
}

function getMidDate(start: string, end: string): string {
  const s = safeDate(start)
  const e = safeDate(end)
  if (!s || !e) return ''
  const mid = new Date((s.getTime() + e.getTime()) / 2)
  return mid.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

export default function ProyectoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { projects, tasks, technicians, departments } = useStore()

  const projectId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''
  const project = projects.find(p => p.id === projectId)

  const [filterStatus, setFilterStatus] = useState<string>('')

  if (!project) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-6">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Proyecto no encontrado.</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft size={14} /> Volver a Proyectos
        </button>
      </div>
    )
  }

  const projectTasks = tasks.filter(t => t.proyecto_id === project.id)
  const assignedTechs = technicians.filter(t => project.tecnicos_ids.includes(t.id))
  const dept = departments.find(d => d.id === project.departamento_id)
  const responsable = technicians.find(t => t.id === project.responsable_id)
  const progress = getProjectProgress(tasks, project.id)

  const filteredTasks = projectTasks.filter(t =>
    filterStatus === '' || t.estado === filterStatus
  )

  const statusCounts = TASK_STATUS_LIST.reduce<Record<string, number>>((acc, s) => {
    acc[s] = projectTasks.filter(t => t.estado === s).length
    return acc
  }, {})

  const statusPillColors: Record<string, string> = {
    pendiente: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    en_progreso: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    en_revision: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    completado: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  }

  // Gantt: tasks that have at least a fecha_inicio and fecha_limite
  const ganttTasks = projectTasks.filter(t => t.fecha_inicio && t.fecha_limite)

  const startLabel = safeDate(project.fecha_inicio)
    ? new Date(project.fecha_inicio).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-'
  const endLabel = safeDate(project.fecha_fin)
    ? new Date(project.fecha_fin).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-'
  const midLabel = getMidDate(project.fecha_inicio, project.fecha_fin)

  return (
    <div className="flex flex-col h-full overflow-auto bg-slate-50 dark:bg-slate-950">
      {/* ── Header Bar ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 sticky top-0 z-30">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-3"
        >
          <ArrowLeft size={13} /> Volver a Proyectos
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{project.codigo}</span>
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', STATUS_COLORS[project.estado])}>
                {STATUS_LABELS[project.estado]}
              </span>
              {dept && (
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{dept.nombre}</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{project.nombre}</h1>
            {project.descripcion && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{project.descripcion}</p>
            )}
          </div>
          <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <div>
                <span className="block text-[10px] text-slate-400">Inicio</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(project.fecha_inicio)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <div>
                <span className="block text-[10px] text-slate-400">Fin estimado</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(project.fecha_fin)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Progreso general del proyecto</span>
            <span className="text-sm font-bold text-slate-800 dark:text-white">{progress}%</span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, backgroundColor: project.color }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-400">{statusCounts['completado']} tareas completadas</span>
            <span className="text-[10px] text-slate-400">{projectTasks.length} tareas en total</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">

        {/* ── Técnicos asignados ─────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Users size={15} className="text-slate-400" />
            Técnicos asignados
            <span className="text-xs font-normal text-slate-400 ml-1">({assignedTechs.length})</span>
          </h2>
          {assignedTechs.length === 0 ? (
            <p className="text-xs text-slate-400">No hay técnicos asignados a este proyecto.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {assignedTechs.map(tech => {
                const techTaskCount = projectTasks.filter(t => t.tecnico_id === tech.id).length
                const deptColor = DEPT_COLORS[tech.departamento_id] || 'bg-slate-400'
                const techDept = departments.find(d => d.id === tech.departamento_id)
                return (
                  <div
                    key={tech.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col items-center text-center gap-2 hover:shadow-sm transition-shadow"
                  >
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold', deptColor)}>
                      {tech.iniciales}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">{tech.nombre}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tech.cargo}</p>
                      {techDept && (
                        <p className="text-[10px] text-slate-400">{techDept.nombre}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950 rounded-full px-2 py-0.5">
                      <CheckSquare size={9} />
                      {techTaskCount} {techTaskCount === 1 ? 'tarea' : 'tareas'}
                    </div>
                    {tech.id === project.responsable_id && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950 rounded-full px-2 py-0.5">
                        Responsable
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Tareas del proyecto ────────────────────────────────── */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CheckSquare size={15} className="text-slate-400" />
              Tareas del proyecto
              <span className="text-xs font-normal text-slate-400 ml-1">({projectTasks.length})</span>
            </h2>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Status count pills */}
              {TASK_STATUS_LIST.map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
                    filterStatus === s
                      ? 'ring-2 ring-offset-1 ring-blue-400 border-transparent ' + statusPillColors[s]
                      : 'border-slate-200 dark:border-slate-700 ' + statusPillColors[s]
                  )}
                >
                  {STATUS_LABELS[s]}
                  <span className="font-bold">{statusCounts[s]}</span>
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-sm">No hay tareas con este filtro.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTasks.map(task => {
                  const tech = technicians.find(t => t.id === task.tecnico_id)
                  const deptColor = tech ? (DEPT_COLORS[tech.departamento_id] || 'bg-slate-400') : 'bg-slate-400'
                  return (
                    <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Priority badge */}
                      <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', PRIORITY_COLORS[task.prioridad])}>
                        {PRIORITY_LABELS[task.prioridad]}
                      </span>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white leading-tight truncate">{task.titulo}</p>
                      </div>

                      {/* Technician avatar */}
                      {tech && (
                        <div
                          title={tech.nombre}
                          className={cn('shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold', deptColor)}
                        >
                          {tech.iniciales}
                        </div>
                      )}

                      {/* Status badge */}
                      <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap', STATUS_COLORS[task.estado])}>
                        {STATUS_LABELS[task.estado]}
                      </span>

                      {/* Due date */}
                      <div className="shrink-0 flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock size={10} />
                        {formatDate(task.fecha_limite)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Cronograma (Gantt) ────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Calendar size={15} className="text-slate-400" />
            Cronograma
            <span className="text-xs font-normal text-slate-400 ml-1">({ganttTasks.length} tareas)</span>
          </h2>

          {ganttTasks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-sm">No hay tareas con fechas para mostrar en el cronograma.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Legend */}
              <div className="flex flex-wrap gap-3 px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                {TASK_STATUS_LIST.map(s => (
                  <div key={s} className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <div className={cn('w-3 h-3 rounded-sm', GANTT_BAR_COLORS[s])} />
                    {STATUS_LABELS[s]}
                  </div>
                ))}
              </div>

              {/* Timeline header */}
              <div className="flex px-4 pt-2 pb-1">
                {/* Left label column placeholder */}
                <div className="w-48 shrink-0" />
                {/* Timeline dates */}
                <div className="flex-1 relative h-5">
                  <span className="absolute left-0 text-[10px] text-slate-400 translate-x-0">{startLabel}</span>
                  {midLabel && (
                    <span className="absolute left-1/2 text-[10px] text-slate-400 -translate-x-1/2">{midLabel}</span>
                  )}
                  <span className="absolute right-0 text-[10px] text-slate-400 translate-x-0 text-right">{endLabel}</span>
                </div>
              </div>

              {/* Vertical guideline overlay + task rows */}
              <div className="px-4 pb-4 space-y-1.5">
                {ganttTasks.map(task => {
                  const { left, width } = calcGanttBar(
                    task.fecha_inicio,
                    task.fecha_limite,
                    project.fecha_inicio,
                    project.fecha_fin
                  )
                  const barColor = GANTT_BAR_COLORS[task.estado]
                  const tech = technicians.find(t => t.id === task.tecnico_id)

                  return (
                    <div key={task.id} className="flex items-center gap-0">
                      {/* Task name label column */}
                      <div className="w-48 shrink-0 pr-3 flex items-center gap-1.5">
                        {tech && (
                          <div
                            className={cn('w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[8px] font-bold', DEPT_COLORS[tech.departamento_id] || 'bg-slate-400')}
                            title={tech.nombre}
                          >
                            {tech.iniciales}
                          </div>
                        )}
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate leading-tight" title={task.titulo}>
                          {task.titulo}
                        </span>
                      </div>

                      {/* Bar track */}
                      <div className="flex-1 relative h-7 bg-slate-50 dark:bg-slate-800 rounded-md overflow-hidden">
                        {/* Mid gridline */}
                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-200 dark:bg-slate-700 pointer-events-none" />

                        {/* Gantt bar */}
                        <div
                          className={cn('absolute top-1 bottom-1 rounded-md flex items-center px-1.5 group cursor-default transition-opacity hover:opacity-90', barColor)}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${task.titulo} | ${formatDate(task.fecha_inicio)} – ${formatDate(task.fecha_limite)}`}
                        >
                          {width > 10 && (
                            <span className="text-[9px] font-medium text-white truncate leading-none select-none">
                              {task.titulo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
