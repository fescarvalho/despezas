'use client'

import { Plus } from 'lucide-react'

interface FABProps {
  onClick: () => void
  label?: string
}

export function FAB({ onClick, label = 'Nova transação' }: FABProps) {
  return (
    <button className="fab" onClick={onClick} aria-label={label} title={label}>
      <Plus size={24} />
    </button>
  )
}
