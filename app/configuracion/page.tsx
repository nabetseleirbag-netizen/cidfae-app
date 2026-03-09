'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { syncAddStatus, syncRemoveStatus } from '@/lib/supabaseSync'
import Header from '@/components/layout/Header'
import { Moon, Sun, Shield, Bell, Database, Download, Info, X, Plus } from 'lucide-react'
import { cn, getProjectProgress } from '@/lib/utils'

export default function ConfiguracionPage() {
  const {
    darkMode,
    toggleDarkMode,
    currentUser,
    tasks,
    projects,
    technicians,
    customStatuses,
  } = useStore()

  const [newStatus, setNewStatus] = useState('')

  const handleAddStatus = async () => {
    if (newStatus.trim()) {
      await syncAddStatus(newStatus.trim())
      setNewStatus('')
    }
  }

  const exportarPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    // Title
    doc.setFillColor(37, 99, 235)  // blue-600
    doc.rect(0, 0, 210, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('CIDFAE — Reporte de Proyectos', 105, 18, { align: 'center' })

    // Date
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generado: ${new Date().toLocaleDateString('es-EC')}`, 105, 26, { align: 'center' })

    let yPos = 40

    // Summary stats box
    doc.setFillColor(248, 250, 252)  // gray-50
    doc.roundedRect(10, yPos, 190, 25, 3, 3, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(10, yPos, 190, 25, 3, 3, 'S')

    doc.setTextColor(71, 85, 105)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    const summaryStats = [
      { label: 'Total Proyectos', value: String(projects.length) },
      { label: 'Activos', value: String(projects.filter(p => p.estado === 'en_ejecucion').length) },
      { label: 'Total Tareas', value: String(tasks.length) },
      { label: 'Completadas', value: String(tasks.filter(t => t.estado === 'completado').length) },
      { label: 'Técnicos', value: String(technicians.length) },
    ]
    summaryStats.forEach((s, i) => {
      const x = 18 + i * 38
      doc.text(s.value, x, yPos + 11)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text(s.label, x, yPos + 18)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
    })

    yPos += 35

    // Projects section
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Proyectos', 10, yPos)
    yPos += 8

    for (const project of projects) {
      if (yPos > 260) {
        doc.addPage()
        yPos = 20
      }

      const progress = getProjectProgress(tasks, project.id)
      const projectTasks = tasks.filter(t => t.proyecto_id === project.id)

      // Project card background
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(10, yPos, 190, 28, 2, 2, 'F')

      // Color indicator bar
      const colorHex = project.color.replace('#', '')
      const r = parseInt(colorHex.substring(0, 2), 16)
      const g = parseInt(colorHex.substring(2, 4), 16)
      const b = parseInt(colorHex.substring(4, 6), 16)
      doc.setFillColor(r, g, b)
      doc.roundedRect(10, yPos, 3, 28, 1, 1, 'F')

      // Project name
      doc.setTextColor(30, 41, 59)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(project.nombre.substring(0, 45), 17, yPos + 8)

      // Code + Status
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139)
      doc.text(`${project.codigo} · ${project.estado.replace('_', ' ')}`, 17, yPos + 15)

      // Dates
      doc.text(`${project.fecha_inicio} → ${project.fecha_fin}`, 17, yPos + 21)

      // Progress bar
      const barX = 130, barY = yPos + 10, barW = 60, barH = 4
      doc.setFillColor(226, 232, 240)
      doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F')
      doc.setFillColor(r, g, b)
      doc.roundedRect(barX, barY, Math.max(2, (progress / 100) * barW), barH, 2, 2, 'F')

      // Progress text
      doc.setTextColor(30, 41, 59)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`${progress}%`, barX + barW + 3, barY + 3.5)

      // Task counts
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139)
      const done = projectTasks.filter(t => t.estado === 'completado').length
      doc.text(`${done}/${projectTasks.length} tareas completadas`, barX, yPos + 20)

      yPos += 33
    }

    // Footer on every page
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text(`CIDFAE Gestión Técnica · Página ${i} de ${totalPages}`, 105, 290, { align: 'center' })
    }

    doc.save(`CIDFAE_Proyectos_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const exportarCSV = (tipo: 'proyectos' | 'tecnicos') => {
    let csv = ''
    if (tipo === 'proyectos') {
      csv = 'Nombre,Código,Estado,Inicio,Fin,Progreso\n'
      projects.forEach(p => {
        const progress = getProjectProgress(tasks, p.id)
        csv += `"${p.nombre}","${p.codigo}","${p.estado}","${p.fecha_inicio}","${p.fecha_fin}","${progress}%"\n`
      })
    } else {
      csv = 'Nombre,Cargo,Especialidad,Departamento,Estado,Email\n'
      technicians.forEach(t => {
        csv += `"${t.nombre}","${t.cargo}","${t.especialidad}","${t.departamento_id}","${t.estado}","${t.email}"\n`
      })
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CIDFAE_${tipo}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = [
    { label: 'Tareas totales', value: tasks.length },
    { label: 'Proyectos', value: projects.length },
    { label: 'Técnicos', value: technicians.length },
    { label: 'Completadas', value: tasks.filter(t => t.estado === 'completado').length },
  ]

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="Configuración" subtitle="Preferencias y administración del sistema" />
      <div className="flex-1 p-6 space-y-5 max-w-3xl animate-fade-in">

        {/* User profile card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Shield size={16} className="text-blue-500" /> Perfil de usuario
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {currentUser.nombre.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{currentUser.nombre}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium capitalize">
                {currentUser.rol.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Apariencia</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode
                ? <Moon size={18} className="text-blue-400" />
                : <Sun size={18} className="text-amber-500" />
              }
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">
                  Modo {darkMode ? 'oscuro' : 'claro'}
                </p>
                <p className="text-xs text-slate-400">Cambiar el tema de la interfaz</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                darkMode ? 'bg-blue-600' : 'bg-slate-300'
              )}
            >
              <div className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center',
                darkMode ? 'translate-x-6' : 'translate-x-0.5'
              )}>
                {darkMode
                  ? <Moon size={10} className="text-blue-600" />
                  : <Sun size={10} className="text-amber-400" />
                }
              </div>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Bell size={16} className="text-amber-500" /> Notificaciones
          </h3>
          <div className="space-y-3">
            {[
              'Asignación de nueva tarea',
              'Fecha límite próxima (24h)',
              'Actualización de orden de trabajo',
              'Comentario en tarea asignada',
            ].map(label => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                <button className="relative w-10 h-5 rounded-full bg-blue-600">
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Database stats */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Database size={16} className="text-purple-500" /> Estadísticas del sistema
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(s => (
              <div key={s.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Download size={16} className="text-emerald-500" /> Exportar datos
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportarPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-slate-700 dark:text-slate-300 rounded-xl text-sm transition-all"
            >
              <Download size={13} />
              Reporte de Proyectos (PDF)
            </button>
            <button
              onClick={() => exportarCSV('proyectos')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-slate-700 dark:text-slate-300 rounded-xl text-sm transition-all"
            >
              <Download size={13} />
              Proyectos (CSV)
            </button>
            <button
              onClick={() => exportarCSV('tecnicos')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-slate-700 dark:text-slate-300 rounded-xl text-sm transition-all"
            >
              <Download size={13} />
              Técnicos (CSV)
            </button>
          </div>
        </div>

        {/* Gestión de Estados */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Estados de Técnicos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Personaliza los estados disponibles para los técnicos del sistema.
          </p>

          {/* List of current statuses */}
          <div className="flex flex-wrap gap-2 mb-4">
            {customStatuses.map(status => (
              <div
                key={status}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5"
              >
                <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                  {status.replace(/_/g, ' ')}
                </span>
                {customStatuses.length > 1 && (
                  <button
                    onClick={() => syncRemoveStatus(status)}
                    className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                    aria-label={`Eliminar estado ${status}`}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add new status */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddStatus() }}
              placeholder="Nuevo estado (ej: en_comision)"
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus size={15} /> Agregar
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Info size={18} />
            <h3 className="text-sm font-semibold">Acerca del sistema</h3>
          </div>
          <p className="text-sm text-blue-100 mb-1"><strong>CIDFAE — Gestión Técnica</strong></p>
          <p className="text-xs text-blue-200">Sistema de gestión de proyectos e ingeniería del Centro de Investigación y Desarrollo de la Fuerza Aérea Ecuatoriana.</p>
          <p className="text-xs text-blue-300 mt-3">v1.0.0 · Next.js 15 · Zustand · Recharts</p>
        </div>

      </div>
    </div>
  )
}
