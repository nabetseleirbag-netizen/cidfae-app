import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function daysLeft(dateStr: string): number {
  const now = new Date()
  const d = new Date(dateStr)
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function getProjectProgress(tasks: { estado: string; proyecto_id: string }[], projectId: string): number {
  const projectTasks = tasks.filter((t) => t.proyecto_id === projectId)
  if (projectTasks.length === 0) return 0
  const completed = projectTasks.filter((t) => t.estado === 'completado').length
  return Math.round((completed / projectTasks.length) * 100)
}

export const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  en_revision: 'En Revisión',
  completado: 'Completado',
  planificacion: 'Planificación',
  en_ejecucion: 'En Ejecución',
  pausado: 'Pausado',
  finalizado: 'Finalizado',
  activo: 'Activo',
  inactivo: 'Inactivo',
}

export const PRIORITY_LABELS: Record<string, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

export const PRIORITY_COLORS: Record<string, string> = {
  alta: 'text-red-500 bg-red-50 dark:bg-red-950 dark:text-red-400',
  media: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400',
  baja: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
}

export const STATUS_COLORS: Record<string, string> = {
  pendiente: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
  en_progreso: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
  en_revision: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400',
  completado: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400',
  planificacion: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
  en_ejecucion: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
  pausado: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400',
  finalizado: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400',
  activo: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400',
  inactivo: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
}
