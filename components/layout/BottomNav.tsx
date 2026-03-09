'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, FolderKanban, Users,
  Building2, CalendarDays, Settings, X, ChevronRight,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MAIN_ITEMS = [
  { href: '/',          label: 'Inicio',    icon: LayoutDashboard },
  { href: '/tareas',    label: 'Tareas',    icon: ClipboardList   },
  { href: '/proyectos', label: 'Proyectos', icon: FolderKanban    },
  { href: '/tecnicos',  label: 'Técnicos',  icon: Users           },
]

const MORE_ITEMS = [
  { href: '/departamentos', label: 'Departamentos',   icon: Building2    },
  { href: '/planner',       label: 'Planner Semanal', icon: CalendarDays },
  { href: '/configuracion', label: 'Configuración',   icon: Settings     },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = MORE_ITEMS.some(item => pathname.startsWith(item.href))

  return (
    <>
      {/* ── Bottom Tab Bar ────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden
                   bg-white/95 dark:bg-slate-900/95 backdrop-blur-md
                   border-t border-slate-200 dark:border-slate-700"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-[62px]">
          {MAIN_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-1 flex-col items-center justify-center gap-[3px] active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
              >
                <Icon
                  size={23}
                  className={cn(
                    'transition-colors',
                    active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                )}>
                  {label}
                </span>
                {active && (
                  <span className="absolute bottom-0 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </Link>
            )
          })}

          {/* Botón "Más" */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-[3px] active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
          >
            <MoreHorizontal
              size={23}
              className={cn(
                'transition-colors',
                isMoreActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
              )}
              strokeWidth={isMoreActive ? 2.2 : 1.8}
            />
            <span className={cn(
              'text-[10px] font-medium transition-colors',
              isMoreActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
            )}>
              Más
            </span>
          </button>
        </div>
      </nav>

      {/* ── Drawer "Más" ─────────────────────────────────────── */}
      {moreOpen && (
        <div className="md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl
                       bg-white dark:bg-slate-900 shadow-2xl animate-fade-in"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-base font-bold text-slate-800 dark:text-white">Más opciones</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Items */}
            <div className="px-4 py-4 space-y-2">
              {MORE_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors',
                      active
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      active ? 'bg-white/20' : 'bg-white dark:bg-slate-700'
                    )}>
                      <Icon size={20} className={active ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
                    </div>
                    <span className="text-sm font-semibold flex-1">{label}</span>
                    {!active && <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
