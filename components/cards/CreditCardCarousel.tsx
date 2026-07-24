'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CreditCard } from '@/types'
import { CreditCardVisual } from './CreditCardVisual'

interface CreditCardCarouselProps {
  cards: CreditCard[]
  selectedCardId: string | null
  onSelect: (card: CreditCard) => void
}

export function CreditCardCarousel({ cards, selectedCardId, onSelect }: CreditCardCarouselProps) {
  const [current, setCurrent] = useState(0)

  const prev = () => {
    const idx = (current - 1 + cards.length) % cards.length
    setCurrent(idx)
    onSelect(cards[idx])
  }

  const next = () => {
    const idx = (current + 1) % cards.length
    setCurrent(idx)
    onSelect(cards[idx])
  }

  if (cards.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'center' }}>
        <button
          className="month-nav-btn"
          onClick={prev}
          style={{ flexShrink: 0 }}
          aria-label="Cartão anterior"
          disabled={cards.length <= 1}
        >
          <ChevronLeft size={18} />
        </button>

        <div style={{ flex: 1, maxWidth: 340 }}>
          <CreditCardVisual
            card={cards[current]}
            isSelected={cards[current].id === selectedCardId}
            onClick={() => onSelect(cards[current])}
          />
        </div>

        <button
          className="month-nav-btn"
          onClick={next}
          style={{ flexShrink: 0 }}
          aria-label="Próximo cartão"
          disabled={cards.length <= 1}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="carousel-dots" style={{ marginTop: 16 }}>
        {cards.map((card, i) => (
          <button
            key={card.id}
            className={`carousel-dot ${i === current ? 'active' : ''}`}
            onClick={() => { setCurrent(i); onSelect(cards[i]) }}
            aria-label={`Selecionar cartão ${card.name}`}
          />
        ))}
      </div>
    </div>
  )
}
