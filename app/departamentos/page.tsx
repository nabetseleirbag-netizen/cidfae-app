'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import Header from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { Department } from '@/lib/types'
import { Users, FolderKanban, ClipboardList, TrendingUp, Plus, Pencil, Trash2 } from 'lucide-react'
import { cn, getProjectProgress } from '@/lib/utils'

const DEPT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']
const DEPT_ICONS = ['🔧', '🛩', '💻', '⚙️', '📡', '🚁', '🔬', '🏗', '📋', '⚡', '🎯', '🛡']

export default function DepartamentosPage() {
  const { departments, technicians, projects, tasks, addDepartment, updateDepartment, deleteDepartment } = useStore()

  const [showDeptModal, setShowDeptModal] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Department | null>(null)
  const [deptForm, setDeptForm] = useState({ nombre: '', descripcion: '', color: '#3b82f6', icon: '🔧' })

  function openCreate() {
    setEditingDept(null)
    setDeptForm({ nombre: '', descripcion: '', color: '#3b82f6', icon: '🔧' })
    setShowDeptModal(true)
  }

  function openEdit(dep: Department, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingDept(dep)
    setDeptForm({ nombre: dep.nombre, descripcion: dep.descripcion, color: dep.color, icon: dep.icon })
    setShowDeptModal(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deptForm.nombre.trim()) return
    if (editingDept) {
      updateDepartment(editingDept.id, deptForm)
    } else {
      addDepartment(deptForm)
    }
    setShowDeptModal(false)
  }

  function handleDelete() {
    if (!showDeleteConfirm) return
    deleteDepartment(showDeleteConfirm.id)
    setShowDeleteConfirm(null)
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="Departamentos" subtitle={`${departments.length} departamentos operativos`} />
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* Top action bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona los departamentos de la organización
          </p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} /> Nuevo Departamento
          </button>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Técnicos activos', value: technicians.filter(t => t.estado === 'activo').length, icon: Users, color: 'bg-blue-500' },
            { label: 'Proyectos activos', value: projects.filter(p => p.estado === 'en_ejecucion').length, icon: FolderKanban, color: 'bg-purple-500' },
            { label: 'Tareas pendientes', value: tasks.filter(t => t.estado !== 'completado').length, icon: ClipboardList, color: 'bg-amber-500' },
            { label: 'Tareas completadas', value: tasks.filter(t => t.estado === 'completado').length, icon: TrendingUp, color: 'bg-emerald-500' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>
                  <s.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Department cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {departments.map(dept => {
            const deptTechs = technicians.filter(t => t.departamento_id === dept.id)
            const activeTechs = deptTechs.filter(t => t.estado === 'activo')
            const deptProjects = projects.filter(p => p.departamento_id === dept.id)
            const activeProjects = deptProjects.filter(p => p.estado === 'en_ejecucion')
            const deptTasks = tasks.filter(t => t.departamento_id === dept.id)
            const completedTasks = deptTasks.filter(t => t.estado === 'completado')
            const pendingTasks = deptTasks.filter(t => t.estado === 'pendiente')
            const productivity = deptTasks.length > 0 ? Math.round((completedTasks.length / deptTasks.length) * 100) : 0

            return (
              <div key={dept.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all">
                {/* Header */}
                <div className="p-5 pb-4" style={{ borderBottom: `3px solid ${dept.color}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl" style={{ backgroundColor: dept.color }}>
                      {dept.icon || dept.nombre.slice(0, 2)}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-right mr-2">
                        <p className="text-xs text-slate-400">Productividad</p>
                        <p className="text-2xl font-bold" style={{ color: dept.color }}>{productivity}%</p>
                      </div>
                      {/* Edit / Delete buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => openEdit(dept, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Editar departamento"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(dept) }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Eliminar departamento"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{dept.nombre}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{dept.descripcion}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
                  {[
                    { label: 'Técnicos', value: activeTechs.length, total: deptTechs.length },
                    { label: 'Proyectos', value: activeProjects.length, total: deptProjects.length },
                    { label: 'Tareas', value: pendingTasks.length + deptTasks.filter(t => t.estado === 'en_progreso').length, total: deptTasks.length },
                  ].map(s => (
                    <div key={s.label} className="p-3 text-center">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</p>
                      <p className="text-[10px] text-slate-400">{s.label} activos</p>
                      <p className="text-[10px] text-slate-300 dark:text-slate-600">{s.total} total</p>
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Carga de trabajo</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {deptTasks.filter(t => t.estado !== 'completado').length} activas
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${productivity}%`, backgroundColor: dept.color, transition: 'width 0.7s ease' }}
                    />
                  </div>
                </div>

                {/* Technicians avatars */}
                {deptTechs.length > 0 && (
                  <div className="px-4 pb-4 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {deptTechs.slice(0, 5).map(t => (
                        <div
                          key={t.id}
                          title={t.nombre}
                          className={cn(
                            'w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white',
                            t.estado === 'inactivo' ? 'opacity-40' : ''
                          )}
                          style={{ backgroundColor: dept.color }}
                        >
                          {t.iniciales}
                        </div>
                      ))}
                      {deptTechs.length > 5 && (
                        <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          +{deptTechs.length - 5}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{activeTechs.length} activo{activeTechs.length !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* Active projects */}
                {activeProjects.length > 0 && (
                  <div className="px-4 pb-4 space-y-1.5">
                    {activeProjects.slice(0, 2).map(p => (
                      <div key={p.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.nombre}</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-auto shrink-0">
                          {getProjectProgress(tasks, p.id)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ver departamento link */}
                <div className="px-4 pb-4">
                  <Link href={`/departamentos/${dept.id}`} className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1">
                    Ver técnicos y tareas →
                  </Link>
                </div>
              </div>
            )
          })}

          {/* Empty state */}
          {departments.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
              <FolderKanban size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-medium mb-1">No hay departamentos</p>
              <p className="text-xs mb-4">Crea el primer departamento para comenzar</p>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={16} /> Nuevo Departamento
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        title={editingDept ? 'Editar Departamento' : 'Nuevo Departamento'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={deptForm.nombre}
              onChange={e => setDeptForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Ingeniería Aeronáutica"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Descripción
            </label>
            <textarea
              rows={3}
              value={deptForm.descripcion}
              onChange={e => setDeptForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Breve descripción del departamento..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {DEPT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setDeptForm(f => ({ ...f, color }))}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                    deptForm.color === color ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Icono
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {DEPT_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setDeptForm(f => ({ ...f, icon }))}
                  className={cn(
                    'w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all hover:scale-110',
                    deptForm.icon === icon
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  )}
                  title={icon}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: deptForm.color }}
            >
              {deptForm.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {deptForm.nombre || 'Nombre del departamento'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {deptForm.descripcion || 'Sin descripción'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowDeptModal(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors"
            >
              {editingDept ? 'Guardar cambios' : 'Crear departamento'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Eliminar Departamento"
        size="sm"
      >
        {showDeleteConfirm && (() => {
          const dep = showDeleteConfirm
          const depTechs = technicians.filter(t => t.departamento_id === dep.id)
          const depProjects = projects.filter(p => p.departamento_id === dep.id)
          const hasLinks = depTechs.length > 0 || depProjects.length > 0

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: dep.color }}>
                  {dep.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{dep.nombre}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{dep.descripcion}</p>
                </div>
              </div>

              {hasLinks && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">Advertencia</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Este departamento tiene{' '}
                    {depTechs.length > 0 && `${depTechs.length} técnico${depTechs.length !== 1 ? 's' : ''}`}
                    {depTechs.length > 0 && depProjects.length > 0 && ' y '}
                    {depProjects.length > 0 && `${depProjects.length} proyecto${depProjects.length !== 1 ? 's' : ''}`}
                    {' '}asociados. Estos quedarán sin departamento asignado.
                  </p>
                </div>
              )}

              <p className="text-sm text-slate-600 dark:text-slate-300">
                ¿Estás seguro de que deseas eliminar el departamento <strong>{dep.nombre}</strong>? Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium text-white transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
