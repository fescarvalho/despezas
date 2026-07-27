'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CreditCard, Invoice } from '@/types'

const today = new Date()
const thisMonth = today.getMonth() + 1
const thisYear = today.getFullYear()

export function useCreditCards() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCards = useCallback(async () => {
    setLoading(true)
    try {
      const { data: cardsData } = await supabase.from('credit_cards').select('*').order('name')
      const { data: invoicesData } = await supabase.from('invoices').select('*').eq('month', thisMonth).eq('year', thisYear)
      setCards(cardsData || [])
      setInvoices(invoicesData || [])
    } catch (e) {
      console.error('Error fetching credit cards:', e)
      setCards([])
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCards() }, [fetchCards])

  const createCard = async (payload: Omit<CreditCard, 'id' | 'created_at'>) => {
    const { data, error: err } = await supabase.from('credit_cards').insert([payload]).select()
    if (err) {
      console.error('Supabase insert failed:', err)
      return null as unknown as CreditCard
    }
    await fetchCards()
    return data[0]
  }

  const updateCard = async (id: string, payload: Partial<CreditCard>) => {
    const { error: err } = await supabase.from('credit_cards').update(payload).eq('id', id)
    if (err) {
      console.error('Supabase update failed:', err)
      return
    }
    await fetchCards()
  }

  const deleteCard = async (id: string) => {
    // Exclusão programática por segurança (fallback)
    const { error: txErr } = await supabase.from('transactions').delete().eq('card_id', id)
    if (txErr) {
      console.error('Erro ao excluir transações do cartão:', txErr)
      // Podemos optar por não interromper ou exibir toast, mas vamos seguir
    }

    const { error: err } = await supabase.from('credit_cards').delete().eq('id', id)
    if (err) {
      console.error('Supabase delete failed:', err)
      return
    }
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  const getInvoiceForCard = (cardId: string) => invoices.find((inv) => inv.card_id === cardId)

  const totalOpenInvoices = invoices
    .filter((inv) => inv.status === 'open' || inv.status === 'closed')
    .reduce((sum, inv) => sum + inv.total_amount, 0)

  return { cards, invoices, loading, getInvoiceForCard, totalOpenInvoices, createCard, updateCard, deleteCard, refetch: fetchCards }
}
