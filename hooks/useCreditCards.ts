'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CreditCard, Invoice } from '@/types'

const SEED_CARDS: CreditCard[] = [
  { id: 'card-1', name: 'Nubank Roxinho', limit_amount: 8000, closing_day: 15, due_day: 22, brand_icon: 'mastercard', color: '#8B5CF6' },
  { id: 'card-2', name: 'Inter Gold', limit_amount: 5000, closing_day: 10, due_day: 17, brand_icon: 'mastercard', color: '#F59E0B' },
  { id: 'card-3', name: 'Itaú Visa', limit_amount: 12000, closing_day: 20, due_day: 27, brand_icon: 'visa', color: '#1E40AF' },
]

const today = new Date()
const thisMonth = today.getMonth() + 1
const thisYear = today.getFullYear()

const SEED_INVOICES: Invoice[] = [
  { id: 'inv-1', card_id: 'card-1', month: thisMonth, year: thisYear, status: 'open', total_amount: 1199.70 },
  { id: 'inv-2', card_id: 'card-2', month: thisMonth, year: thisYear, status: 'open', total_amount: 420.00 },
  { id: 'inv-3', card_id: 'card-3', month: thisMonth, year: thisYear, status: 'closed', total_amount: 3250.00 },
]

export function useCreditCards() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCards = useCallback(async () => {
    setLoading(true)
    try {
      const { data: cardsData } = await supabase.from('credit_cards').select('*').order('name')
      const { data: invoicesData } = await supabase.from('invoices').select('*').eq('month', thisMonth).eq('year', thisYear)
      setCards(!cardsData || cardsData.length === 0 ? SEED_CARDS : cardsData)
      setInvoices(!invoicesData || invoicesData.length === 0 ? SEED_INVOICES : invoicesData)
    } catch {
      setCards(SEED_CARDS)
      setInvoices(SEED_INVOICES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCards() }, [fetchCards])

  const createCard = async (payload: Omit<CreditCard, 'id' | 'created_at'>) => {
    const { data, error: err } = await supabase.from('credit_cards').insert([payload]).select()
    if (err) {
      console.warn('Supabase insert failed, using local state fallback', err)
      const newCard = { ...payload, id: `card-new-${Date.now()}` } as CreditCard
      setCards((prev) => [...prev, newCard])
      return newCard
    }
    await fetchCards()
    return data[0]
  }

  const updateCard = async (id: string, payload: Partial<CreditCard>) => {
    const { error: err } = await supabase.from('credit_cards').update(payload).eq('id', id)
    if (err) {
      console.warn('Supabase update failed, using local state fallback', err)
      setCards((prev) => prev.map((c) => c.id === id ? { ...c, ...payload } : c))
      return
    }
    await fetchCards()
  }

  const deleteCard = async (id: string) => {
    const { error: err } = await supabase.from('credit_cards').delete().eq('id', id)
    if (err) {
      console.warn('Supabase delete failed, using local state fallback', err)
    }
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  const getInvoiceForCard = (cardId: string) => invoices.find((inv) => inv.card_id === cardId)

  const totalOpenInvoices = invoices
    .filter((inv) => inv.status === 'open' || inv.status === 'closed')
    .reduce((sum, inv) => sum + inv.total_amount, 0)

  return { cards, invoices, loading, getInvoiceForCard, totalOpenInvoices, createCard, updateCard, deleteCard, refetch: fetchCards }
}
