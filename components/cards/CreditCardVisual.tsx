'use client'

import { useState } from 'react'
import type { CreditCard } from '@/types'

interface CreditCardVisualProps {
  card: CreditCard
  isSelected?: boolean
  onClick?: () => void
}

const BRAND_LOGOS: Record<string, string> = {
  visa: 'VISA',
  mastercard: '●● Mastercard',
  elo: 'elo',
  amex: 'AMEX',
  hipercard: 'hipercard',
}

const DEFAULT_COLORS = ['#4F46E5', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6']

export function CreditCardVisual({ card, isSelected, onClick }: CreditCardVisualProps) {
  const bgColor = card.color || DEFAULT_COLORS[0]

  const gradient = `linear-gradient(135deg, ${bgColor}, ${bgColor}BB)`

  return (
    <div
      className="credit-card-visual"
      onClick={onClick}
      style={{
        background: gradient,
        outline: isSelected ? '3px solid rgba(255,255,255,0.6)' : 'none',
        outlineOffset: 3,
      }}
      role={onClick ? 'button' : undefined}
      aria-label={`Cartão ${card.name}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div className="card-chip" />
        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>
          {BRAND_LOGOS[card.brand_icon] || card.brand_icon.toUpperCase()}
        </span>
      </div>

      <div className="card-number" style={{ position: 'relative', zIndex: 1 }}>
        •••• •••• •••• 4521
      </div>

      <div className="card-bottom">
        <div>
          <div className="card-holder-name">{card.name}</div>
          <div className="card-expiry">Fecha: dia {card.closing_day} · Vence: dia {card.due_day}</div>
        </div>
      </div>
    </div>
  )
}
