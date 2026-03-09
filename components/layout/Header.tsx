'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Sun, Moon, Search, CheckCheck, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { cn, formatDate } from '@/lib/utils'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const {
    darkMode,
    toggleDarkMode,
    currentUser,
    notifications,
    markNotificationRead,
    markAllRead,
  } = useStore()

  const router = useRouter()
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
    router.push('/login')
  }

  const userNotifications = notifications.filter(n => n.destinatario_id === currentUser.id)
  const unreadCount = userNotifications.filter(n => !n.leida).length

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen])

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 w-56">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none w-full"
          />
        </div>

        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setNotifOpen(prev => !prev)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
              {/* Dropdown header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-800 dark:text-white">Notificaciones</span>
                {userNotifications.length > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    <CheckCheck size={12} />
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
                {userNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                    <Bell size={24} className="opacity-30" />
                    <p className="text-xs">No hay notificaciones</p>
                  </div>
                ) : (
                  userNotifications
                    .slice()
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map(notif => (
                      <button
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={cn(
                          'w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors',
                          !notif.leida && 'bg-blue-50/60 dark:bg-blue-950/30'
                        )}
                      >
                        {/* Bell icon */}
                        <div className={cn(
                          'shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5',
                          notif.leida
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        )}>
                          <Bell size={13} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-xs font-semibold leading-tight truncate',
                            notif.leida
                              ? 'text-slate-600 dark:text-slate-300'
                              : 'text-slate-900 dark:text-white'
                          )}>
                            {notif.titulo}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                            {notif.mensaje}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatDate(notif.fecha)}</p>
                        </div>

                        {/* Unread dot */}
                        {!notif.leida && (
                          <div className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        )}
                      </button>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {currentUser.nombre.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{currentUser.nombre}</p>
            <p className="text-[10px] text-slate-400 leading-tight capitalize">{currentUser.rol.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
