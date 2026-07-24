'use client'

import { Search } from 'lucide-react'

interface FilterChipsProps {
  search: string
  onSearchChange: (v: string) => void
  activeTypes: string[]
  onTypeToggle: (type: string) => void
}

const CHIP_FILTERS = [
  { id: 'income', label: '💰 Receitas' },
  { id: 'expense', label: '💸 Despesas' },
]

export function FilterChips({ search, onSearchChange, activeTypes, onTypeToggle }: FilterChipsProps) {
  return (
    <div className="filter-bar">
      <div className="search-input-wrap">
        <Search size={16} />
        <input
          id="transaction-search"
          className="search-input"
          placeholder="Buscar transações..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
        {CHIP_FILTERS.map(({ id, label }) => (
          <button
            key={id}
            className={`chip ${activeTypes.includes(id) ? 'active' : ''}`}
            onClick={() => onTypeToggle(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
