'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FolderKanban, ClipboardList,
  Building2, CalendarDays, Settings, ChevronLeft, ChevronRight,
  Shield
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tecnicos', label: 'Técnicos', icon: Users },
  { href: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { href: '/tareas', label: 'Tareas', icon: ClipboardList },
  { href: '/departamentos', label: 'Departamentos', icon: Building2 },
  { href: '/planner', label: 'Planner Semanal', icon: CalendarDays },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useStore()

  return (
    <aside className={cn(
      // Oculto en móvil, visible en tablet/desktop
      'hidden md:flex fixed left-0 top-0 h-screen flex-col transition-all duration-300 z-40',
      'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700',
      sidebarCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">CIDFAE</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Gestión Técnica</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  )}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{label}</span>}
                  {sidebarCollapsed && (
                    <span className="absolute left-14 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {label}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse button */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  )
}
