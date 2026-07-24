'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, CreditCard, BarChart2, Settings, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

const NAV_ITEMS = [
  { href: '/', label: 'Início', icon: LayoutDashboard },
  { href: '/transactions', label: 'Extrato', icon: ArrowLeftRight },
  { href: '/cards', label: 'Cartões', icon: CreditCard },
  { href: '/reports', label: 'Relatórios', icon: BarChart2 },
  { href: '/settings', label: 'Config', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isDark, toggle } = useTheme()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">D</div>
        <span className="sidebar-logo-text">Despezas</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={`sidebar-link ${pathname === href ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggle} aria-label="Alternar tema">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          <span>{isDark ? 'Tema Claro' : 'Tema Escuro'}</span>
        </button>
        <div className="sidebar-version">Despezas v1.0 • Open Finance</div>
      </div>
    </aside>
  )
}
