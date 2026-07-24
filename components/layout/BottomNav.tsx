'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, CreditCard, BarChart2, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Início', icon: LayoutDashboard },
  { href: '/transactions', label: 'Extrato', icon: ArrowLeftRight },
  { href: '/cards', label: 'Cartões', icon: CreditCard },
  { href: '/reports', label: 'Relatórios', icon: BarChart2 },
  { href: '/settings', label: 'Config', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <button
          key={href}
          onClick={() => router.push(href)}
          className={`bottom-nav-item ${pathname === href ? 'active' : ''}`}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
