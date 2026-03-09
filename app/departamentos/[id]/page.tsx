'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import Header from '@/components/layout/Header'
import { ArrowLeft, Users, FolderKanban, ClipboardList, CheckCircle2 } from 'lucide-react'
import { cn, formatDate, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, getProjectProgress } from '@/lib/utils'
import { TaskStatus } from '@/lib/types'

type TabKey = 'tecnicos' | 'tareas' | 'proyectos'

const TASK_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: 'Todas', value: '' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'En Progreso', value: 'en_progreso' },
  { label: 'En Revisión', value: 'en_revision' },
  { label: 'Completado', value: 'completado' },
]

export default function DepartamentoDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { departments, technicians, projects, tasks } = useStore()

  const [activeTab, setActiveTab] = useState<TabKey>('tecnicos')
  const [taskFilter, setTaskFilter] = useState<string>('')

  const dept = departments.find(d => d.id === id)

  if (!dept) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Departamento no encontrado.</p>
        <Link href="/departamentos" className="mt-4 text-blue-600 dark:text-blue-400 text-sm hover:underline">
          ← Volver a Departamentos
        </Link>
      </div>
    )
  }

  const deptTechs = technicians.filter(t => t.departamento_id === id)
  const deptProjects = projects.filter(p => p.departamento_id === id)
  const deptTasks = tasks.filter(t => t.departamento_id === id)
  const completedTasks = deptTasks.filter(t => t.estado === 'completado')
  const activeProjects = deptProjects.filter(p => p.estado === 'en_ejecucion')

  const filteredTasks = deptTasks.filter(t => taskFilter === '' || t.estado === taskFilter)

  function techStatusColor(estado: string): string {
    if (estado === 'activo') return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400'
    if (estado === 'inactivo') return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
    return 'text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-400'
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'tecnicos', label: 'Técnicos', count: deptTechs.length },
    { key: 'tareas', label: 'Tareas', count: deptTasks.length },
    { key: 'proyectos', label: 'Proyectos', count: deptProjects.length },
  ]

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title={dept.nombre} subtitle={dept.descripcion} />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* Back link */}
        <Link
          href="/departamentos"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          <ArrowLeft size={14} /> Volver a Departamentos
        </Link>

        {/* Department header card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6" style={{ borderBottom: `4px solid ${dept.color}` }}>
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
                style={{ backgroundColor: dept.color }}
              >
                {dept.nombre.slice(0, 2)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{dept.nombre}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{dept.descripcion}</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800">
            {[
              { label: 'Técnicos', value: deptTechs.length, icon: Users, color: 'text-blue-500' },
              { label: 'Proyectos activos', value: activeProjects.length, icon: FolderKanban, color: 'text-purple-500' },
              { label: 'Tareas totales', value: deptTasks.length, icon: ClipboardList, color: 'text-amber-500' },
              { label: 'Completadas', value: completedTasks.length, icon: CheckCircle2, color: 'text-emerald-500' },
            ].map(s => (
              <div key={s.label} className="p-4 flex items-center gap-3">
                <s.icon size={20} className={s.color} />
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              {tab.label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-medium',
                activeTab === tab.key
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab: Técnicos */}
        {activeTab === 'tecnicos' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {deptTechs.length === 0 && (
              <p className="text-sm text-slate-400 col-span-full text-center py-8">No hay técnicos en este departamento.</p>
            )}
            {deptTechs.map(tech => (
              <div key={tech.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0"
                  >
                    {tech.iniciales}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug">{tech.nombre}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tech.cargo}</p>
                    <span className={cn('inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium', techStatusColor(tech.estado))}>
                      {tech.estado.charAt(0).toUpperCase() + tech.estado.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300 w-20 shrink-0">Email</span>
                    <span className="truncate">{tech.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300 w-20 shrink-0">Teléfono</span>
                    <span>{tech.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300 w-20 shrink-0">Especialidad</span>
                    <span className="truncate">{tech.especialidad}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Tareas */}
        {activeTab === 'tareas' && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {TASK_FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTaskFilter(opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
                    taskFilter === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600'
                  )}
                >
                  {opt.label}
                  {opt.value !== '' && (
                    <span className="ml-1.5 opacity-70">
                      ({deptTasks.filter(t => t.estado === opt.value).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tasks list */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {filteredTasks.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No hay tareas con este filtro.
                </div>
              )}
              {filteredTasks.length > 0 && (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredTasks.map(task => {
                    const tech = technicians.find(t => t.id === task.tecnico_id)
                    return (
                      <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Priority badge */}
                        <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-xs font-medium', PRIORITY_COLORS[task.prioridad])}>
                          {PRIORITY_LABELS[task.prioridad]}
                        </span>

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{task.titulo}</p>
                        </div>

                        {/* Assigned technician */}
                        {tech ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                              {tech.iniciales}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                              {tech.nombre.split(' ').slice(-1)[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600 shrink-0">Sin asignar</span>
                        )}

                        {/* Status badge */}
                        <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[task.estado])}>
                          {STATUS_LABELS[task.estado]}
                        </span>

                        {/* Due date */}
                        <span className={cn(
                          'shrink-0 text-xs hidden md:inline',
                          task.fecha_limite && new Date(task.fecha_limite) < new Date() && task.estado !== 'completado'
                            ? 'text-red-500 font-medium'
                            : 'text-slate-400'
                        )}>
                          {task.fecha_limite ? formatDate(task.fecha_limite) : '-'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Proyectos */}
        {activeTab === 'proyectos' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {deptProjects.length === 0 && (
              <p className="text-sm text-slate-400 col-span-full text-center py-8">No hay proyectos en este departamento.</p>
            )}
            {deptProjects.map(proj => {
              const progress = getProjectProgress(tasks, proj.id)
              return (
                <div key={proj.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all">
                  {/* Color bar */}
                  <div className="h-1.5" style={{ backgroundColor: proj.color }} />

                  <div className="p-5">
                    {/* Code & status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{proj.codigo}</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[proj.estado])}>
                        {STATUS_LABELS[proj.estado]}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 leading-snug">{proj.nombre}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{proj.descripcion}</p>

                    {/* Progress bar */}
                    <div className="mb-1.5">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-slate-500">Progreso</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${progress}%`, backgroundColor: proj.color }}
                        />
                      </div>
                    </div>

                    {/* Ver detalle link */}
                    <Link
                      href={`/proyectos`}
                      className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                    >
                      Ver detalle →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
