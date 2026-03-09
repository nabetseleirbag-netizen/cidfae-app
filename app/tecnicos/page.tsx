'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import Header from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Mail, Phone, Pencil, Trash2, UserCheck, UserX } from 'lucide-react'
import { cn, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { Technician, TechnicianStatus } from '@/lib/types'

const EMPTY_TECH: Omit<Technician, 'id'> = {
  nombre: '', cargo: '', departamento_id: '', especialidad: '',
  email: '', telefono: '', estado: 'activo', avatar: '', iniciales: '',
}

const DEPT_COLORS: Record<string, string> = {
  'dep-1': 'bg-blue-500',
  'dep-2': 'bg-purple-500',
  'dep-3': 'bg-emerald-500',
  'dep-4': 'bg-amber-500',
  'dep-5': 'bg-red-500',
  'dep-6': 'bg-cyan-500',
  'dep-7': 'bg-pink-500',
}

export default function TecnicosPage() {
  const { technicians, departments, tasks, customStatuses, addTechnician, updateTechnician, deleteTechnician } = useStore()
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Technician, 'id'>>(EMPTY_TECH)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filtered = technicians.filter(t =>
    (search === '' || t.nombre.toLowerCase().includes(search.toLowerCase()) || t.especialidad.toLowerCase().includes(search.toLowerCase())) &&
    (filterDept === '' || t.departamento_id === filterDept) &&
    (filterStatus === '' || t.estado === filterStatus)
  )

  function openCreate() {
    setEditId(null)
    setForm(EMPTY_TECH)
    setModalOpen(true)
  }

  function openEdit(t: Technician) {
    setEditId(t.id)
    setForm({ nombre: t.nombre, cargo: t.cargo, departamento_id: t.departamento_id, especialidad: t.especialidad, email: t.email, telefono: t.telefono, estado: t.estado, avatar: t.avatar, iniciales: t.iniciales })
    setModalOpen(true)
  }

  function handleSave() {
    const iniciales = form.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    if (editId) {
      updateTechnician(editId, { ...form, iniciales })
    } else {
      addTechnician({ ...form, iniciales })
    }
    setModalOpen(false)
  }

  function handleDelete(id: string) {
    deleteTechnician(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="Técnicos" subtitle={`${technicians.filter(t => t.estado === 'activo').length} activos de ${technicians.length} registrados`} />
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-60">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar técnico..."
                className="bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none w-full"
              />
            </div>
            <select
              value={filterDept} onChange={e => setFilterDept(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="">Todos los depts.</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
            <select
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="">Todos los estados</option>
              {customStatuses.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Nuevo Técnico
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(tech => {
            const dept = departments.find(d => d.id === tech.departamento_id)
            const techTasks = tasks.filter(t => t.tecnico_id === tech.id)
            const pendingTasks = techTasks.filter(t => t.estado !== 'completado').length
            return (
              <div key={tech.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                {/* Top color strip */}
                <div className={cn('h-1.5', DEPT_COLORS[tech.departamento_id] || 'bg-slate-400')} />
                <div className="p-5">
                  {/* Avatar + status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold', DEPT_COLORS[tech.departamento_id] || 'bg-slate-400')}>
                      {tech.iniciales}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[tech.estado] || 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300')}>
                        {tech.estado === 'activo' ? <UserCheck size={10} /> : <UserX size={10} />}
                        {STATUS_LABELS[tech.estado] || (tech.estado.charAt(0).toUpperCase() + tech.estado.slice(1).replace(/_/g, ' '))}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-0.5">{tech.nombre}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{tech.cargo}</p>
                  </div>

                  <div className="space-y-1 mb-4">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{tech.especialidad}</p>
                    {dept && (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {dept.nombre}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Mail size={11} className="shrink-0" />
                      <span className="truncate">{tech.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Phone size={11} className="shrink-0" />
                      <span>{tech.telefono}</span>
                    </div>
                  </div>

                  {/* Task count */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{pendingTasks}</span> tareas activas
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(tech)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(tech.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <UsersIcon size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron técnicos</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Técnico' : 'Nuevo Técnico'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Nombre completo', key: 'nombre', type: 'text', placeholder: 'Cap. Juan Pérez' },
            { label: 'Cargo', key: 'cargo', type: 'text', placeholder: 'Ingeniero Electrónico' },
            { label: 'Especialidad técnica', key: 'especialidad', type: 'text', placeholder: 'STM32 / PCB / Python' },
            { label: 'Email institucional', key: 'email', type: 'email', placeholder: 'jperez@cidfae.ec' },
            { label: 'Teléfono', key: 'telefono', type: 'tel', placeholder: '+593 99 000 0000' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} className={key === 'nombre' || key === 'especialidad' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={(form as Record<string, string>)[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Departamento</label>
            <select
              value={form.departamento_id}
              onChange={e => setForm(f => ({ ...f, departamento_id: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Estado</label>
            <select
              value={form.estado}
              onChange={e => setForm(f => ({ ...f, estado: e.target.value as TechnicianStatus }))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              {customStatuses.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!form.nombre || !form.departamento_id}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {editId ? 'Guardar cambios' : 'Crear técnico'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar técnico" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          ¿Estás seguro de que deseas eliminar este técnico? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={() => handleDelete(deleteConfirm!)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-xl transition-colors">
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  )
}

function UsersIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
