'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import Header from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn, PRIORITY_COLORS, STATUS_COLORS, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils'
import { Task, TaskPriority, TaskStatus } from '@/lib/types'

function getWeekDates(offset = 0): Date[] {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(diff + i)
    return d
  })
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function isSameDay(d1: Date, d2: Date) {
  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
}

function isInRange(date: Date, start: string, end: string): boolean {
  if (!start && !end) return false
  const d = date.getTime()
  const s = start ? new Date(start).getTime() : -Infinity
  const e = end ? new Date(end + 'T23:59:59').getTime() : Infinity
  return d >= s && d <= e
}

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const EMPTY_QUICK_TASK = {
  titulo: '',
  descripcion: '',
  proyecto_id: '',
  tecnico_id: '',
  prioridad: 'media' as TaskPriority,
  fecha_inicio: '',
  fecha_limite: '',
}

export default function PlannerPage() {
  const { tasks, technicians, projects, departments, addTask } = useStore()
  const [weekOffset, setWeekOffset] = useState(0)
  const [filterTech, setFilterTech] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [view, setView] = useState<'tecnico' | 'calendario'>('calendario')

  // Day detail modal state
  const [dayDetailDate, setDayDetailDate] = useState<Date | null>(null)
  // Quick-add task modal state
  const [addTaskForDay, setAddTaskForDay] = useState<Date | null>(null)
  const [quickForm, setQuickForm] = useState(EMPTY_QUICK_TASK)

  const weekDates = getWeekDates(weekOffset)
  const today = new Date()

  const getTasksForDay = (date: Date, techId?: string): Task[] => {
    return tasks.filter(t => {
      if (techId && t.tecnico_id !== techId) return false
      if (filterTech && t.tecnico_id !== filterTech) return false
      if (filterDept && t.departamento_id !== filterDept) return false
      return isInRange(date, t.fecha_inicio, t.fecha_limite)
    })
  }

  // Get tasks where fecha_inicio or fecha_limite exactly matches a given date (for day detail)
  const getTasksOnDate = (date: Date): Task[] => {
    const ymd = toYMD(date)
    return tasks.filter(t =>
      t.fecha_inicio === ymd || t.fecha_limite === ymd
    )
  }

  const filteredTechs = technicians.filter(t =>
    t.estado === 'activo' &&
    (filterDept === '' || t.departamento_id === filterDept) &&
    (filterTech === '' || t.id === filterTech)
  )

  const weekLabel = (() => {
    const start = weekDates[0]
    const end = weekDates[6]
    const fmt = (d: Date) => d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
    return `${fmt(start)} — ${fmt(end)}, ${end.getFullYear()}`
  })()

  // Workload per technician this week
  const techWorkload = technicians.filter(t => t.estado === 'activo').map(tech => {
    const weekTasks = tasks.filter(t =>
      t.tecnico_id === tech.id &&
      weekDates.some(d => isInRange(d, t.fecha_inicio, t.fecha_limite))
    )
    return {
      ...tech,
      total: weekTasks.length,
      completado: weekTasks.filter(t => t.estado === 'completado').length,
      en_progreso: weekTasks.filter(t => t.estado === 'en_progreso').length,
      pendiente: weekTasks.filter(t => t.estado === 'pendiente').length,
    }
  }).sort((a, b) => b.total - a.total)

  function openAddTaskForDay(date: Date) {
    const ymd = toYMD(date)
    setQuickForm({ ...EMPTY_QUICK_TASK, fecha_inicio: ymd, fecha_limite: ymd })
    setDayDetailDate(null)
    setAddTaskForDay(date)
  }

  function handleQuickAddTask() {
    if (!quickForm.titulo.trim()) return
    addTask({
      titulo: quickForm.titulo,
      descripcion: quickForm.descripcion,
      proyecto_id: quickForm.proyecto_id,
      departamento_id: '',
      tecnico_id: quickForm.tecnico_id,
      prioridad: quickForm.prioridad,
      estado: 'pendiente',
      fecha_inicio: quickForm.fecha_inicio,
      fecha_limite: quickForm.fecha_limite,
      checklist: [],
      comentarios: [],
      adjuntos: [],
      tags: [],
    })
    setAddTaskForDay(null)
    setQuickForm(EMPTY_QUICK_TASK)
  }

  const dayDetailTasks = dayDetailDate ? getTasksOnDate(dayDetailDate) : []

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Planner Semanal" subtitle={weekLabel} />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Controls */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(0)} className="text-xs px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-100 transition-colors">
              Esta semana
            </button>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
              <button onClick={() => setWeekOffset(o => o - 1)} className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setWeekOffset(o => o + 1)} className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none">
              <option value="">Todos los depts.</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
            <select value={filterTech} onChange={e => setFilterTech(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none">
              <option value="">Todos los técnicos</option>
              {technicians.filter(t => t.estado === 'activo').map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
              {(['calendario', 'tecnico'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all', view === v ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500')}>
                  {v === 'calendario' ? '📅 Calendario' : '👤 Por Técnico'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar view */}
        {view === 'calendario' && (
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-7 gap-2 min-w-[700px]">
              {/* Day headers — clickable */}
              {weekDates.map((date, i) => {
                const isToday = isSameDay(date, today)
                return (
                  <div
                    key={i}
                    onClick={() => setDayDetailDate(date)}
                    className={cn(
                      'text-center p-2 rounded-xl cursor-pointer transition-colors',
                      isToday
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    )}
                  >
                    <p className={cn('text-xs font-semibold', isToday ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400')}>{DAY_SHORT[i]}</p>
                    <p className="text-lg font-bold leading-tight">{date.getDate()}</p>
                    <p className={cn('text-[10px]', isToday ? 'text-blue-200' : 'text-slate-400')}>{date.toLocaleDateString('es-EC', { month: 'short' })}</p>
                  </div>
                )
              })}

              {/* Task cells */}
              {weekDates.map((date, i) => {
                const dayTasks = getTasksForDay(date)
                const isToday = isSameDay(date, today)
                return (
                  <div
                    key={`tasks-${i}`}
                    className={cn(
                      'relative group min-h-[200px] rounded-xl p-2 space-y-1.5 border',
                      isToday
                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50'
                    )}
                  >
                    {/* "+" quick add button (appears on hover) */}
                    <button
                      onClick={() => openAddTaskForDay(date)}
                      className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all"
                      title="Añadir tarea en este día"
                    >
                      <Plus size={11} />
                    </button>

                    {dayTasks.slice(0, 6).map(task => {
                      const tech = technicians.find(t => t.id === task.tecnico_id)
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            'p-2 rounded-lg text-xs transition-all hover:shadow-sm cursor-default',
                            task.estado === 'completado'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800'
                              : task.estado === 'en_progreso'
                              ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800'
                              : task.prioridad === 'alta'
                              ? 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                          )}
                        >
                          <p className="font-semibold text-slate-800 dark:text-white leading-tight truncate">{task.titulo}</p>
                          <div className="flex items-center justify-between mt-1">
                            {tech && (
                              <span className="text-[10px] text-slate-400 truncate">{tech.nombre.split(' ').slice(-1)[0]}</span>
                            )}
                            <span className={cn('text-[10px] px-1 rounded font-medium ml-auto', PRIORITY_COLORS[task.prioridad])}>
                              {PRIORITY_LABELS[task.prioridad].slice(0, 1)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {dayTasks.length > 6 && (
                      <button
                        onClick={() => setDayDetailDate(date)}
                        className="text-[10px] text-blue-500 dark:text-blue-400 text-center w-full hover:underline"
                      >
                        +{dayTasks.length - 6} más
                      </button>
                    )}
                    {dayTasks.length === 0 && (
                      <p className="text-[10px] text-slate-300 dark:text-slate-700 text-center pt-4">Sin tareas</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Technician view */}
        {view === 'tecnico' && (
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {/* Workload summary */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Carga de trabajo semanal por técnico</h3>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {techWorkload.map(tech => {
                    const dept = departments.find(d => d.id === tech.departamento_id)
                    const load = tech.total > 0 ? Math.min(100, (tech.total / 8) * 100) : 0
                    const loadColor = load > 80 ? '#ef4444' : load > 50 ? '#f59e0b' : '#10b981'
                    return (
                      <div key={tech.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                            {tech.iniciales}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{tech.nombre.split(' ').slice(-2).join(' ')}</p>
                            <p className="text-[10px] text-slate-400">{dept?.nombre || '-'}</p>
                          </div>
                          <span className="text-sm font-bold" style={{ color: loadColor }}>{tech.total}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${load}%`, backgroundColor: loadColor }} />
                        </div>
                        <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
                          <span>✓ {tech.completado}</span>
                          <span>🔄 {tech.en_progreso}</span>
                          <span>⏳ {tech.pendiente}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Per technician schedule */}
              {filteredTechs.map(tech => {
                const techWeekTasks = weekDates.map(date => ({
                  date,
                  tasks: getTasksForDay(date, tech.id),
                }))
                const hasTasks = techWeekTasks.some(d => d.tasks.length > 0)
                if (!hasTasks && filterTech === '') return null

                const dept = departments.find(d => d.id === tech.departamento_id)
                return (
                  <div key={tech.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
                        {tech.iniciales}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{tech.nombre}</p>
                        <p className="text-xs text-slate-400">{dept?.nombre} · {tech.especialidad}</p>
                      </div>
                      <div className="ml-auto flex gap-2">
                        {techWeekTasks.reduce((s, d) => s + d.tasks.length, 0) > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                            {techWeekTasks.reduce((s, d) => s + d.tasks.length, 0)} tareas esta semana
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-0 divide-x divide-slate-100 dark:divide-slate-800">
                      {techWeekTasks.map(({ date, tasks: dayTasks }, i) => {
                        const isToday = isSameDay(date, today)
                        return (
                          <div
                            key={i}
                            className={cn('relative group p-2 min-h-[80px]', isToday && 'bg-blue-50/50 dark:bg-blue-950/20')}
                          >
                            <p className={cn('text-[10px] font-semibold mb-1.5', isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400')}>
                              {DAY_SHORT[i]} {date.getDate()}
                            </p>
                            <div className="space-y-1">
                              {dayTasks.map(task => (
                                <div
                                  key={task.id}
                                  className={cn(
                                    'p-1.5 rounded-lg text-[10px] leading-tight',
                                    task.estado === 'completado' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                                    task.prioridad === 'alta' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                                    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                  )}
                                >
                                  {task.titulo.slice(0, 20)}{task.titulo.length > 20 ? '…' : ''}
                                </div>
                              ))}
                              {dayTasks.length === 0 && (
                                <div className="h-6 rounded-lg border border-dashed border-slate-100 dark:border-slate-800" />
                              )}
                            </div>

                            {/* "+" quick add button for technician view */}
                            <button
                              onClick={() => openAddTaskForDay(date)}
                              className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all"
                              title="Añadir tarea"
                            >
                              <Plus size={9} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Day Detail Modal */}
      {dayDetailDate && (
        <Modal
          open={!!dayDetailDate}
          onClose={() => setDayDetailDate(null)}
          title={formatFullDate(dayDetailDate)}
          size="lg"
        >
          <div className="space-y-4">
            {dayDetailTasks.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No hay tareas con fecha de inicio o límite en este día.</p>
            )}

            {dayDetailTasks.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {dayDetailTasks.map(task => {
                  const tech = technicians.find(t => t.id === task.tecnico_id)
                  return (
                    <div key={task.id} className="py-3 flex items-center gap-3">
                      {/* Priority badge */}
                      <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-xs font-medium', PRIORITY_COLORS[task.prioridad])}>
                        {PRIORITY_LABELS[task.prioridad]}
                      </span>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{task.titulo}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {task.fecha_inicio === toYMD(dayDetailDate) && task.fecha_limite === toYMD(dayDetailDate)
                            ? 'Inicio y límite'
                            : task.fecha_inicio === toYMD(dayDetailDate)
                            ? 'Fecha de inicio'
                            : 'Fecha límite'}
                        </p>
                      </div>

                      {/* Status badge */}
                      <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[task.estado])}>
                        {STATUS_LABELS[task.estado]}
                      </span>

                      {/* Technician initials */}
                      {tech && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0" title={tech.nombre}>
                          {tech.iniciales}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => openAddTaskForDay(dayDetailDate)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              >
                <Plus size={15} /> Agregar tarea en este día
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick-Add Task Modal */}
      {addTaskForDay && (
        <Modal
          open={!!addTaskForDay}
          onClose={() => { setAddTaskForDay(null); setQuickForm(EMPTY_QUICK_TASK) }}
          title={`Nueva tarea — ${formatFullDate(addTaskForDay)}`}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Título *</label>
              <input
                value={quickForm.titulo}
                onChange={e => setQuickForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Título de la tarea..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descripción</label>
              <textarea
                rows={2}
                value={quickForm.descripcion}
                onChange={e => setQuickForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripción opcional..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Proyecto</label>
                <select
                  value={quickForm.proyecto_id}
                  onChange={e => setQuickForm(f => ({ ...f, proyecto_id: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="">Seleccionar...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Técnico</label>
                <select
                  value={quickForm.tecnico_id}
                  onChange={e => setQuickForm(f => ({ ...f, tecnico_id: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="">Seleccionar...</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Prioridad</label>
                <select
                  value={quickForm.prioridad}
                  onChange={e => setQuickForm(f => ({ ...f, prioridad: e.target.value as TaskPriority }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Fecha límite</label>
                <input
                  type="date"
                  value={quickForm.fecha_limite}
                  onChange={e => setQuickForm(f => ({ ...f, fecha_limite: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fecha de inicio: <span className="font-semibold text-slate-700 dark:text-slate-300">{quickForm.fecha_inicio}</span>
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => { setAddTaskForDay(null); setQuickForm(EMPTY_QUICK_TASK) }}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleQuickAddTask}
              disabled={!quickForm.titulo.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus size={14} /> Agregar tarea
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
