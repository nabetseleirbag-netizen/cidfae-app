'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import Header from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Calendar, Users, TrendingUp, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { cn, formatDate, getProjectProgress, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { Project, ProjectStatus } from '@/lib/types'

const PROJECT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

const EMPTY_PROJECT: Omit<Project, 'id'> = {
  nombre: '', codigo: '', descripcion: '', departamento_id: '',
  responsable_id: '', fecha_inicio: '', fecha_fin: '',
  estado: 'planificacion', color: '#3b82f6', tecnicos_ids: [],
}

export default function ProyectosPage() {
  const { projects, departments, technicians, tasks, addProject, updateProject, deleteProject } = useStore()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Project, 'id'>>(EMPTY_PROJECT)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [selectedTecnicos, setSelectedTecnicos] = useState<string[]>([])

  const filtered = projects.filter(p =>
    (search === '' || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === '' || p.estado === filterStatus) &&
    (filterDept === '' || p.departamento_id === filterDept)
  )

  function openCreate() {
    setEditId(null)
    setForm(EMPTY_PROJECT)
    setSelectedTecnicos([])
    setModalOpen(true)
  }

  function openEdit(p: Project) {
    setEditId(p.id)
    setForm({ nombre: p.nombre, codigo: p.codigo, descripcion: p.descripcion, departamento_id: p.departamento_id, responsable_id: p.responsable_id, fecha_inicio: p.fecha_inicio, fecha_fin: p.fecha_fin, estado: p.estado, color: p.color, tecnicos_ids: p.tecnicos_ids })
    setSelectedTecnicos(p.tecnicos_ids)
    setModalOpen(true)
  }

  function handleSave() {
    if (editId) {
      updateProject(editId, { ...form, tecnicos_ids: selectedTecnicos })
    } else {
      addProject({ ...form, tecnicos_ids: selectedTecnicos })
    }
    setModalOpen(false)
  }

  function toggleTecnico(id: string) {
    setSelectedTecnicos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const statusStatuses: ProjectStatus[] = ['planificacion', 'en_ejecucion', 'pausado', 'finalizado']
  const statusIcons: Record<string, string> = {
    planificacion: '📋', en_ejecucion: '🔄', pausado: '⏸', finalizado: '✅'
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="Proyectos" subtitle={`${projects.filter(p => p.estado === 'en_ejecucion').length} proyectos en ejecución`} />
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statusStatuses.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={cn(
                'bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all text-left',
                filterStatus === s
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              )}
            >
              <p className="text-xl mb-1">{statusIcons[s]}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {projects.filter(p => p.estado === s).length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{STATUS_LABELS[s]}</p>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-56">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proyecto..." className="bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none w-full" />
            </div>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none">
              <option value="">Todos los depts.</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Plus size={16} /> Nuevo Proyecto
          </button>
        </div>

        {/* Project cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(proj => {
            const dept = departments.find(d => d.id === proj.departamento_id)
            const resp = technicians.find(t => t.id === proj.responsable_id)
            const progress = getProjectProgress(tasks, proj.id)
            const projTasks = tasks.filter(t => t.proyecto_id === proj.id)
            const assignedTechs = technicians.filter(t => proj.tecnicos_ids.includes(t.id))

            return (
              <div key={proj.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all group">
                {/* Color bar */}
                <div className="h-1.5" style={{ backgroundColor: proj.color }} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-400 font-mono">{proj.codigo}</span>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[proj.estado])}>
                          {STATUS_LABELS[proj.estado]}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{proj.nombre}</h3>
                      {dept && <span className="text-xs text-slate-400">{dept.nombre}</span>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button onClick={() => openEdit(proj)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(proj.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{proj.descripcion}</p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Progreso general</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: proj.color }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-slate-400">{projTasks.filter(t => t.estado === 'completado').length} completadas</span>
                      <span className="text-[10px] text-slate-400">{projTasks.length} total</span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar size={12} className="text-slate-400" />
                      <div>
                        <span className="block text-[10px] text-slate-400">Inicio</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(proj.fecha_inicio)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar size={12} className="text-slate-400" />
                      <div>
                        <span className="block text-[10px] text-slate-400">Fin estimado</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(proj.fecha_fin)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Team */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2">
                        {assignedTechs.slice(0, 4).map(t => (
                          <div key={t.id} title={t.nombre} className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-white">
                            {t.iniciales}
                          </div>
                        ))}
                        {assignedTechs.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                            +{assignedTechs.length - 4}
                          </div>
                        )}
                      </div>
                      {resp && <span className="text-xs text-slate-400 ml-2">Resp: {resp.nombre.split(' ')[1]}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <TrendingUp size={11} />
                      {projTasks.length} tareas
                    </div>
                  </div>

                  {/* Ver detalle link */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Link href={`/proyectos/${proj.id}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1">
                      Ver cronograma y detalle →
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📁</p>
            <p className="text-sm">No se encontraron proyectos</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Proyecto' : 'Nuevo Proyecto'} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombre del proyecto</label>
            <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="UAV VTOL Sky Fury" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Código</label>
            <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="CIDFAE-2025-001" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={cn('w-7 h-7 rounded-full border-2 transition-all', form.color === c ? 'border-slate-600 scale-110' : 'border-transparent')} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descripción</label>
            <textarea rows={2} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción del proyecto..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Departamento</label>
            <select value={form.departamento_id} onChange={e => setForm(f => ({ ...f, departamento_id: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
              <option value="">Seleccionar...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Responsable</label>
            <select value={form.responsable_id} onChange={e => setForm(f => ({ ...f, responsable_id: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
              <option value="">Seleccionar...</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Fecha de inicio</label>
            <input type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Fecha de finalización</label>
            <input type="date" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Estado</label>
            <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as ProjectStatus }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
              <option value="planificacion">Planificación</option>
              <option value="en_ejecucion">En Ejecución</option>
              <option value="pausado">Pausado</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Técnicos asignados</label>
            <div className="flex flex-wrap gap-2">
              {technicians.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTecnico(t.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                    selectedTecnicos.includes(t.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  )}
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center">{t.iniciales}</span>
                  {t.nombre.split(' ').slice(-1)[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={!form.nombre} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {editId ? 'Guardar cambios' : 'Crear proyecto'}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar proyecto" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">¿Estás seguro de que deseas eliminar este proyecto?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
          <button onClick={() => { deleteProject(deleteConfirm!); setDeleteConfirm(null) }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-xl transition-colors">Eliminar</button>
        </div>
      </Modal>
    </div>
  )
}
