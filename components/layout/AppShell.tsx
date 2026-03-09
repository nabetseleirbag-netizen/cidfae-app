'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useStore } from '@/lib/store'
import Sidebar from './Sidebar'
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

  // For public routes (login), render without sidebar
  if (isPublicRoute) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className={cn(
        'flex-1 flex flex-col overflow-hidden transition-all duration-300',
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      )}>
        <DataProvider />
        {children}
      </main>
    </div>
  )
}
