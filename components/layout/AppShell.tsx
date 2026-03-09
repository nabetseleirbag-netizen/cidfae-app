'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useStore } from '@/lib/store'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { cn } from '@/lib/utils'
import DataProvider from '@/components/DataProvider'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { darkMode, sidebarCollapsed } = useStore()
  const pathname = usePathname()
  const isPublicRoute = pathname === '/login'

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Rutas públicas (login): sin sidebar ni nav
  if (isPublicRoute) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar solo visible en md+ */}
      <Sidebar />

      {/* Contenido principal */}
      <main className={cn(
        'flex-1 flex flex-col overflow-hidden transition-all duration-300',
        // En móvil no hay margen izquierdo (sidebar oculto)
        // En tablet/desktop sí hay margen para el sidebar
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-64',
        // Espacio para la bottom nav en móvil (62px nav + safe area inset)
        'pb-[calc(62px+env(safe-area-inset-bottom))] md:pb-0'
      )}>
        <DataProvider />
        {children}
      </main>

      {/* Bottom navigation solo en móvil */}
      <BottomNav />
    </div>
  )
}
