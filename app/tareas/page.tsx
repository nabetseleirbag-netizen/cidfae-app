'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { syncAddTask, syncUpdateTask, syncDeleteTask, syncMoveTask, syncToggleChecklistItem, syncAddComment, syncSendTaskNotification } from '@/lib/supabaseSync'
import Header from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, CheckSquare, Square, MessageSquare, Paperclip, Pencil, Trash2, ChevronDown, Send } from 'lucide-react'
import { cn, formatDate, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/utils'
import { Task, TaskStatus, TaskPriority } from '@/lib/types'

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'pendiente', label: 'Pendiente', color: 'bg-slate-400' },
  { status: 'en_progreso', label: 'En Progreso', color: 'bg-blue-500' },
  { status: 'en_revision', label: 'En Revisión', color: 'bg-purple-500' },
  { status: 'completado', label: 'Completado', color: 'bg-emerald-500' },
]

const EMPTY_TASK: Omit<Task, 'id'> = {
  titulo: '', descripcion: '', proyecto_id: '', departamento_id: '',
  tecnico_id: '', prioridad: 'media', estado: 'pendiente',
  fecha_inicio: '', fecha_limite: '', checklist: [], comentarios: [], adjuntos: [], tags: [],
}

type ViewMode = 'kanban' | 'lista'

export default function TareasPage() {
  const { tasks, projects, departments, technicians } = useStore()
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterTech, setFilterTech] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [view, setView] = useState<ViewMode>('kanban')
  const [modalOpen, setModalOpen] = useState(false)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Task, 'id'>>(EMPTY_TASK)
  const [newCheckItem, setNewCheckItem] = useState('')
  const [newComment, setNewComment] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [sendModalTaskId, setSendModalTaskId] = useState<string | null>(null)

  const filtered = tasks.filter(t =>
    (search === '' || t.titulo.toLowerCase().includes(search.toLowerCase())) &&
    (filterProject === '' || t.proyecto_id === filterProject) &&
    (filterTech === '' || t.tecnico_id === filterTech) &&
    (filterPriority === '' || t.prioridad === filterPriority)
  )

  function openCreate() {
    setEditId(null)
    setForm(EMPTY_TASK)
    setModalOpen(true)
  }

  function openEdit(t: Task) {
    setEditId(t.id)
    setForm({ titulo: t.titulo, descripcion: t.descripcion, proyecto_id: t.proyecto_id, departamento_id: t.departamento_id, tecnico_id: t.tecnico_id, prioridad: t.prioridad, estado: t.estado, fecha_inicio: t.fecha_inicio, fecha_limite: t.fecha_limite, checklist: t.checklist, comentarios: t.comentarios, adjuntos: t.adjuntos, tags: t.tags })
    setModalOpen(true)
    setDetailTask(null)
  }

  function handleSave() {
    if (editId) {
      syncUpdateTask(editId, form)
    } else {
      syncAddTask(form)
    }
    setModalOpen(false)
  }

  function addCheckItem() {
    if (!newCheckItem.trim()) return
    setForm(f => ({ ...f, checklist: [...f.checklist, { id: `c-${Date.now()}`, texto: newCheckItem, completado: false }] }))
    setNewCheckItem('')
  }

  function handleComment() {
    if (!newComment.trim() || !detailTask) return
    syncAddComment(detailTask.id, newComment)
    setNewComment('')
    setDetailTask(tasks.find(t => t.id === detailTask.id) || detailTask)
  }

  function handleSendNotification() {
    if (!sendModalTaskId) return
    syncSendTaskNotification(sendModalTaskId)
    setSendModalTaskId(null)
  }

  // Compute the task and tech for the send modal
  const sendModalTask = sendModalTaskId ? tasks.find(t => t.id === sendModalTaskId) || null : null
  const sendModalTech = sendModalTask?.tecnico_id ? technicians.find(t => t.id === sendModalTask.tecnico_id) || null : null

  function TaskCard({ task }: { task: Task }) {
    const tech = technicians.find(t => t.id === task.tecnico_id)
    const proj = projects.find(p => p.id === task.proyecto_id)
    const checkDone = task.checklist.filter(c => c.completado).length
    const isOverdue = task.fecha_limite && new Date(task.fecha_limite) < new Date() && task.estado !== 'completado'

    return (
      <div
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
        onClick={() => setDetailTask(task)}
      >
        <div className="flex items-start justify-between mb-2">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', PRIORITY_COLORS[task.prioridad])}>
            {PRIORITY_LABELS[task.prioridad]}
          </span>
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => openEdit(task)} className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Pencil size={12} />
            </button>
            <button onClick={() => setDeleteConfirm(task.id)} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1 leading-snug">{task.titulo}</h4>
        {proj && <p className="text-xs text-blue-500 dark:text-blue-400 mb-2 truncate">{proj.nombre}</p>}

        {task.checklist.length > 0 && (
          <div className="mb-2">
            <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.checklist.length > 0 ? (checkDone / task.checklist.length) * 100 : 0}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{checkDone}/{task.checklist.length} subtareas</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 dark:border-slate-800">
          <span className={cn('text-xs', isOverdue ? 'text-red-500 font-medium' : 'text-slate-400')}>
            {task.fecha_limite ? formatDate(task.fecha_limite) : '-'}
          </span>
          <div className="flex items-center gap-2">
            {task.enviada && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">📤 Enviada</span>
            )}
            {task.comentarios.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                <MessageSquare size={10} />{task.comentarios.length}
              </span>
            )}
            {tech && (
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white" title={tech.nombre}>
                {tech.iniciales}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Tareas" subtitle={`${tasks.filter(t => t.estado !== 'completado').length} tareas activas`} />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 w-48">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarea..." className="bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none w-full" />
            </div>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none">
              <option value="">Todos los proyectos</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.nombre.slice(0, 20)}</option>)}
            </select>
            <select value={filterTech} onChange={e => setFilterTech(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none">
              <option value="">Todos los técnicos</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none">
              <option value="">Toda prioridad</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
              {(['kanban', 'lista'] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setView(v)} className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all', view === v ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500')}>
                  {v === 'kanban' ? '⊞ Kanban' : '☰ Lista'}
                </button>
              ))}
            </div>
            <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-colors">
              <Plus size={15} /> Nueva Tarea
            </button>
          </div>
        </div>

        {/* Kanban view */}
        {view === 'kanban' && (
          <div className="flex-1 overflow-x-auto p-4">
            <div className="flex gap-4 h-full min-w-max">
              {COLUMNS.map(col => {
                const colTasks = filtered.filter(t => t.estado === col.status)
                return (
                  <div key={col.status} className="w-72 shrink-0 flex flex-col">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className={cn('w-2.5 h-2.5 rounded-full', col.color)} />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.label}</span>
                      <span className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full font-medium">{colTasks.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                      {colTasks.map(task => <TaskCard key={task.id} task={task} />)}
                      <button
                        onClick={() => { setForm(f => ({ ...f, estado: col.status })); openCreate() }}
                        className="w-full py-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus size={13} /> Añadir tarea
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* List view */}
        {view === 'lista' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Tarea</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">Proyecto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Prioridad</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">Técnico</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden lg:table-cell">Fecha límite</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filtered.map(task => {
                    const tech = technicians.find(t => t.id === task.tecnico_id)
                    const proj = projects.find(p => p.id === task.proyecto_id)
                    return (
                      <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => setDetailTask(task)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-slate-800 dark:text-white text-sm">{task.titulo}</p>
                            {task.enviada && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">📤 Enviada</span>
                            )}
                          </div>
                          {task.checklist.length > 0 && <p className="text-xs text-slate-400">{task.checklist.filter(c => c.completado).length}/{task.checklist.length} subtareas</p>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px] block">{proj?.nombre || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={task.estado}
                            onClick={e => e.stopPropagation()}
                            onChange={e => syncMoveTask(task.id, e.target.value as TaskStatus)}
                            className={cn('text-xs font-medium px-2 py-0.5 rounded-full border-0 outline-none cursor-pointer', STATUS_COLORS[task.estado])}
                          >
                            {COLUMNS.map(c => <option key={c.status} value={c.status}>{STATUS_LABELS[c.status]}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', PRIORITY_COLORS[task.prioridad])}>
                            {PRIORITY_LABELS[task.prioridad]}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {tech ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">{tech.iniciales}</div>
                              <span className="text-xs text-slate-600 dark:text-slate-400">{tech.nombre.split(' ').slice(-1)[0]}</span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={cn('text-xs', task.fecha_limite && new Date(task.fecha_limite) < new Date() && task.estado !== 'completado' ? 'text-red-500 font-medium' : 'text-slate-400')}>
                            {task.fecha_limite ? formatDate(task.fecha_limite) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setDeleteConfirm(task.id)} className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm">No se encontraron tareas</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Tarea' : 'Nueva Tarea'} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Título de la tarea *</label>
            <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Diseño PCB del controlador..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descripción</label>
            <textarea rows={2} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción detallada..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Proyecto</label>
            <select value={form.proyecto_id} onChange={e => setForm(f => ({ ...f, proyecto_id: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
              <option value="">Seleccionar...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Departamento</label>
            <select value={form.departamento_id} onChange={e => setForm(f => ({ ...f, departamento_id: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
              <option value="">Seleccionar...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Técnico asignado</label>
            <select value={form.tecnico_id} onChange={e => setForm(f => ({ ...f, tecnico_id: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
              <option value="">Seleccionar...</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Prioridad</label>
            <select value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as TaskPriority }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Estado</label>
            <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as TaskStatus }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
              {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Fecha de inicio</label>
            <input type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Fecha límite</label>
            <input type="date" value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
          </div>

          {/* Checklist */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Checklist de subtareas</label>
            <div className="space-y-2 mb-2">
              {form.checklist.map((item, i) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={item.completado} onChange={() => setForm(f => ({ ...f, checklist: f.checklist.map((c, idx) => idx === i ? { ...c, completado: !c.completado } : c) }))} className="rounded" />
                  <span className={cn('text-sm flex-1', item.completado ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300')}>{item.texto}</span>
                  <button onClick={() => setForm(f => ({ ...f, checklist: f.checklist.filter((_, idx) => idx !== i) }))} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCheckItem()} placeholder="Añadir subtarea..." className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
              <button onClick={addCheckItem} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-600 dark:text-slate-400 rounded-xl text-sm transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={!form.titulo} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {editId ? 'Guardar cambios' : 'Crear tarea'}
          </button>
        </div>
      </Modal>

      {/* Task Detail Modal */}
      {detailTask && (
        <Modal open={!!detailTask} onClose={() => setDetailTask(null)} title={detailTask.titulo} size="xl">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', PRIORITY_COLORS[detailTask.prioridad])}>{PRIORITY_LABELS[detailTask.prioridad]}</span>
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', STATUS_COLORS[detailTask.estado])}>{STATUS_LABELS[detailTask.estado]}</span>
              {detailTask.enviada && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">📤 Enviada</span>
              )}
              <select
                value={detailTask.estado}
                onChange={e => { syncMoveTask(detailTask.id, e.target.value as TaskStatus); setDetailTask(t => t ? { ...t, estado: e.target.value as TaskStatus } : null) }}
                className="px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full text-xs font-medium outline-none"
              >
                {COLUMNS.map(c => <option key={c.status} value={c.status}>→ {c.label}</option>)}
              </select>
            </div>

            {detailTask.descripcion && <p className="text-sm text-slate-600 dark:text-slate-400">{detailTask.descripcion}</p>}

            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Técnico', value: technicians.find(t => t.id === detailTask.tecnico_id)?.nombre || '-' },
                { label: 'Proyecto', value: projects.find(p => p.id === detailTask.proyecto_id)?.nombre || '-' },
                { label: 'Fecha inicio', value: formatDate(detailTask.fecha_inicio) },
                { label: 'Fecha límite', value: formatDate(detailTask.fecha_limite) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-400 mb-0.5">{label}</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Checklist */}
            {detailTask.checklist.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Subtareas</p>
                  <span className="text-xs text-slate-400">{detailTask.checklist.filter(c => c.completado).length}/{detailTask.checklist.length}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(detailTask.checklist.filter(c => c.completado).length / detailTask.checklist.length) * 100}%` }} />
                </div>
                <div className="space-y-2">
                  {detailTask.checklist.map(item => (
                    <button
                      key={item.id}
                      className="flex items-center gap-3 w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors"
                      onClick={() => { syncToggleChecklistItem(detailTask.id, item.id); setDetailTask(t => t ? { ...t, checklist: t.checklist.map(c => c.id === item.id ? { ...c, completado: !c.completado } : c) } : null) }}
                    >
                      {item.completado ? <CheckSquare size={15} className="text-blue-500 shrink-0" /> : <Square size={15} className="text-slate-300 shrink-0" />}
                      <span className={cn('text-sm', item.completado ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300')}>{item.texto}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">Comentarios ({detailTask.comentarios.length})</p>
              <div className="space-y-3 mb-3">
                {detailTask.comentarios.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {technicians.find(t => t.id === c.autor_id)?.iniciales || 'U'}
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">{new Date(c.fecha).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{c.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleComment()}
                  placeholder="Escribir comentario..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                <button onClick={handleComment} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition-colors">
                  <MessageSquare size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setDeleteConfirm(detailTask.id)} className="flex items-center gap-1.5 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl text-sm transition-colors">
              <Trash2 size={14} /> Eliminar
            </button>
            <div className="flex gap-2">
              {detailTask.tecnico_id && (
                <button
                  onClick={() => setSendModalTaskId(detailTask.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Send size={14} /> Enviar a técnico
                </button>
              )}
              <button onClick={() => openEdit(detailTask)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-colors">
                <Pencil size={14} /> Editar tarea
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Send Confirmation Modal */}
      {sendModalTask && sendModalTech && (
        <Modal open={!!sendModalTaskId} onClose={() => setSendModalTaskId(null)} title="Enviar notificación a técnico" size="md">
          <div className="space-y-4">
            {/* Technician info */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
                {sendModalTech.iniciales}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{sendModalTech.nombre}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{sendModalTech.cargo}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{sendModalTech.email}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{sendModalTech.telefono}</p>
              </div>
            </div>

            {/* Task info */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Tarea a notificar</p>
              <p className="text-sm font-medium text-slate-800 dark:text-white">{sendModalTask.titulo}</p>
            </div>

            {/* Message preview */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Vista previa del mensaje</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Hola {sendModalTech.nombre.split(' ')[0]}, tienes asignada la tarea: <strong>{sendModalTask.titulo}</strong>. Prioridad: <strong>{PRIORITY_LABELS[sendModalTask.prioridad]}</strong>. Fecha límite: <strong>{formatDate(sendModalTask.fecha_limite)}</strong>.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setSendModalTaskId(null)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSendNotification}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Send size={14} /> Confirmar envío
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar tarea" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">¿Estás seguro de que deseas eliminar esta tarea?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
          <button onClick={() => { syncDeleteTask(deleteConfirm!); setDeleteConfirm(null); setDetailTask(null) }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-xl">Eliminar</button>
        </div>
      </Modal>
    </div>
  )
}
