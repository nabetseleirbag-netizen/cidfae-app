import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: string
  trend?: { value: number; label: string }
  href?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, color, trend, href }: StatCardProps) {
  const inner = (
    <div className={cn(
      'bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 transition-all',
      href ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-blue-300 dark:hover:border-blue-700' : 'hover:shadow-md'
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', color)}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1">
          <span className={cn('text-xs font-semibold', trend.value >= 0 ? 'text-emerald-500' : 'text-red-500')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{inner}</Link>
  }
  return inner
}
