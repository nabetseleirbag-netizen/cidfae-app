'use client'

import { useStore } from '@/lib/store'
import Header from '@/components/layout/Header'
import { StatCard } from '@/components/ui/StatCard'
import {
  ClipboardList, CheckCircle2, FolderKanban, Users,
  AlertCircle, TrendingUp, Clock, Activity
} from 'lucide-react'
import { getProjectProgress, formatDate, STATUS_COLORS, PRIORITY_COLORS, STATUS_LABELS, PRIORITY_LABELS, cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, Legend
} from 'recharts'

const PIE_COLORS = ['#94a3b8', '#3b82f6', '#8b5cf6', '#10b981']

export default function DashboardPage() {
  const { tasks, projects, technicians, departments } = useStore()

  const pending = tasks.filter(t => t.estado === 'pendiente').length
  const inProgress = tasks.filter(t => t.estado === 'en_progreso').length
  const inReview = tasks.filter(t => t.estado === 'en_revision').length
  const completed = tasks.filter(t => t.estado === 'completado').length
  const activeProjects = projects.filter(p => p.estado === 'en_ejecucion').length
  const activeTechs = technicians.filter(t => t.estado === 'activo').length

  const tasksByStatus = [
    { name: 'Pendiente', value: pending },
    { name: 'En Progreso', value: inProgress },
    { name: 'En Revisión', value: inReview },
    { name: 'Completado', value: completed },
  ]

  const tasksByDept = departments.map(dep => ({
    name: dep.nombre.slice(0, 8),
    tareas: tasks.filter(t => t.departamento_id === dep.id).length,
  })).filter(d => d.tareas > 0)

  const projectProgress = projects.slice(0, 5).map(p => ({
    name: p.nombre.slice(0, 22),
    avance: getProjectProgress(tasks, p.id),
    color: p.color,
  }))

  const weeklyData = [
    { sem: 'Sem 1', completadas: 3, nuevas: 5 },
    { sem: 'Sem 2', completadas: 5, nuevas: 4 },
    { sem: 'Sem 3', completadas: 7, nuevas: 6 },
    { sem: 'Sem 4', completadas: 4, nuevas: 9 },
    { sem: 'Sem 5', completadas: 8, nuevas: 4 },
    { sem: 'Actual', completadas: completed, nuevas: pending + inProgress },
  ]

  const recentTasks = tasks.slice(0, 6)

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="Dashboard" subtitle="Panel de control — CIDFAE" />
      <div className="flex-1 p-6 space-y-6 animate-fade-in">

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Tareas Pendientes" value={pending} icon={AlertCircle} color="bg-amber-500" trend={{ value: 12, label: 'vs semana pasada' }} href="/tareas" />
          <StatCard title="En Progreso" value={inProgress} icon={Clock} color="bg-blue-500" href="/tareas" />
          <StatCard title="Completadas" value={completed} icon={CheckCircle2} color="bg-emerald-500" trend={{ value: 8, label: 'vs sem. pasada' }} href="/tareas" />
          <StatCard title="Proyectos Activos" value={activeProjects} icon={FolderKanban} color="bg-purple-500" href="/proyectos" />
          <StatCard title="Total Tareas" value={tasks.length} icon={ClipboardList} color="bg-slate-500" href="/tareas" />
          <StatCard title="Técnicos Activos" value={activeTechs} icon={Users} color="bg-cyan-500" href="/tecnicos" />
          <StatCard title="Departamentos" value={departments.length} icon={Activity} color="bg-pink-500" href="/departamentos" />
          <StatCard
            title="Productividad"
            value={`${tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}%`}
            icon={TrendingUp}
            color="bg-indigo-500"
            subtitle="tareas completadas"
            href="/tareas"
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Tareas por Estado</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={tasksByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {tasksByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Tareas por Departamento</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tasksByDept} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="tareas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Productividad Semanal</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weeklyData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="sem" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="completadas" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Completadas" />
                <Line type="monotone" dataKey="nuevas" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Nuevas/Activas" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Avance de Proyectos</h3>
            <div className="space-y-3">
              {projectProgress.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[130px]">{p.name}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.avance}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.avance}%`, backgroundColor: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Actividad Reciente</h3>
            <span className="text-xs text-slate-400">{tasks.length} tareas en total</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {recentTasks.map(task => {
              const tech = technicians.find(t => t.id === task.tecnico_id)
              const proj = projects.find(p => p.id === task.proyecto_id)
              return (
                <div key={task.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium shrink-0', PRIORITY_COLORS[task.prioridad])}>
                    {PRIORITY_LABELS[task.prioridad]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.titulo}</p>
                    <p className="text-xs text-slate-400 truncate">{proj?.nombre || '-'}</p>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium shrink-0', STATUS_COLORS[task.estado])}>
                    {STATUS_LABELS[task.estado]}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300 shrink-0">
                    {tech?.iniciales || '?'}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap hidden md:block">{formatDate(task.fecha_limite)}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
