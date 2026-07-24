'use client'

import { useState, useMemo } from 'react'
import { useCreditCards } from '@/hooks/useCreditCards'
import { useTransactions } from '@/hooks/useTransactions'
import { useMonthSelector } from '@/hooks/useMonthSelector'
import { CreditCardCarousel } from '@/components/cards/CreditCardCarousel'
import { InvoiceDetails } from '@/components/cards/InvoiceDetails'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { CreditCard } from '@/types'

export default function CardsPage() {
  const { monthYear, goNext, goPrev } = useMonthSelector()
  const { cards, loading, getInvoiceForCard } = useCreditCards()
  const { transactions } = useTransactions(monthYear)

  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null)
  const activeCard = selectedCard || (cards.length > 0 ? cards[0] : null)

  const invoice = activeCard ? getInvoiceForCard(activeCard.id) : undefined
  const invoiceTransactions = useMemo(
    () => transactions.filter((tx) => invoice && tx.invoice_id === invoice.id),
    [transactions, invoice]
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cartões de Crédito</h1>
          <p className="page-subtitle">{cards.length} cartão{cards.length !== 1 ? 'es' : ''} cadastrado{cards.length !== 1 ? 's' : ''}</p>
        </div>
        <MonthSelector month={monthYear.month} year={monthYear.year} onPrev={goPrev} onNext={goNext} />
      </div>

      {loading ? (
        <div className="summary-grid" style={{ gridTemplateColumns: '1fr' }}>
          <SkeletonCard />
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon="💳"
          title="Nenhum cartão cadastrado"
          description="Adicione um cartão de crédito para acompanhar suas faturas"
        />
      ) : (
        <div>
          <div className="card card-lg" style={{ marginBottom: 24 }}>
            <CreditCardCarousel
              cards={cards}
              selectedCardId={activeCard?.id || null}
              onSelect={(card) => setSelectedCard(card)}
            />
          </div>

          {activeCard && (
            <InvoiceDetails
              card={activeCard}
              invoice={invoice}
              transactions={invoiceTransactions}
            />
          )}
        </div>
      )}
    </div>
  )
}
