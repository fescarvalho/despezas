'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction, MonthYear, CreditCard } from '@/types'



/**
 * Retorna o mês/ano da fatura ajustado para o cartão:
 * Se a data da compra >= dia de fechamento, a fatura vai para o próximo mês.
 */
function getInvoiceMonth(purchaseDate: string, closingDay: number): { month: number; year: number } {
  const [year, month, day] = purchaseDate.split('-').map(Number)
  if (day >= closingDay) {
    // Vai para o próximo mês
    const next = new Date(year, month, 1) // month aqui já é o próximo (JS 0-indexed: month = atual)
    return { month: next.getMonth() + 1, year: next.getFullYear() }
  }
  return { month, year }
}

export function useTransactions(monthYear: MonthYear, search = '', typeFilter: string[] = [], sourceFilter: string[] = [], cards: CreditCard[] = []) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const startDate = `${monthYear.year}-${String(monthYear.month).padStart(2, '0')}-01`
      const endDate = new Date(monthYear.year, monthYear.month, 0).toISOString().split('T')[0]

      let query = supabase
        .from('transactions')
        .select('*, category:categories(*), account:accounts(*), invoice:invoices(*, credit_card:credit_cards(*))')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (search) query = query.ilike('description', `%${search}%`)
      if (sourceFilter.length > 0) {
        const accFilters = sourceFilter.filter(s => s.startsWith('acc:')).map(s => s.replace('acc:', ''))
        const cardFilters = sourceFilter.filter(s => s.startsWith('card:')).map(s => s.replace('card:', ''))
        
        let orString = []
        if (accFilters.length > 0) orString.push(`account_id.in.(${accFilters.join(',')})`)
        if (cardFilters.length > 0) orString.push(`card_id.in.(${cardFilters.join(',')})`)
        
        if (orString.length > 0) {
          query = query.or(orString.join(','))
        }
      }
      const { data, error: err } = await query
      if (err) throw err
      setTransactions(data || [])
    } catch (e) {
      console.error('Error fetching transactions:', e)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthYear.month, monthYear.year, search, typeFilter.join(','), sourceFilter.join(',')])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const monthIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  /**
   * Resolve (ou cria) a invoice para um determinado cartão + mês/ano.
   * Retorna o invoice_id.
   */
  const resolveInvoiceId = async (cardId: string, month: number, year: number): Promise<string | null> => {
    // Verifica se já existe
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('card_id', cardId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()

    if (existing) return existing.id

    // Cria nova invoice
    const { data: created, error } = await supabase
      .from('invoices')
      .insert({ card_id: cardId, month, year, status: 'open', total_amount: 0 })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create invoice:', error)
      return null
    }
    return created.id
  }

  const createTransaction = async (payload: any) => {
    const payloads = []

    // Encontra o dia de fechamento do cartão selecionado (se houver)
    const selectedCard = payload.card_id ? cards.find((c) => c.id === payload.card_id) : null
    const closingDay = selectedCard?.closing_day ?? null
    
    if (payload.is_installment) {
      const freqMonths: Record<string, number> = {
        mensal: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12
      }
      const step = freqMonths[payload.frequency || 'mensal'] || 1
      
      const totalOccurrences = payload.installment_total === 1 ? 24 : payload.installment_total
      const amountPerOcc = payload.is_value_per_installment 
        ? payload.amount 
        : (payload.amount / totalOccurrences)
        
      const [year, month, day] = payload.date.split('-').map(Number)
      
      for (let i = 0; i < totalOccurrences; i++) {
        const dateObj = new Date(year, month - 1 + (i * step), day)
        const dStr = dateObj.toISOString().split('T')[0]

        // Determina o mês/ano da fatura (ajustando pelo fechamento)
        let invoiceId: string | null = null
        if (payload.card_id && closingDay !== null) {
          const invoiceMonth = getInvoiceMonth(dStr, closingDay)
          invoiceId = await resolveInvoiceId(payload.card_id, invoiceMonth.month, invoiceMonth.year)
        }
        
        payloads.push({
          description: payload.installment_total === 1 
            ? payload.description 
            : `${payload.description} (${i + 1}/${totalOccurrences})`,
          amount: amountPerOcc,
          date: dStr,
          type: payload.type,
          category_id: payload.category_id,
          account_id: payload.account_id,
          card_id: payload.card_id,
          invoice_id: invoiceId,
          is_installment: payload.is_installment,
          installment_total: payload.installment_total,
        })
      }
    } else {
      // Determina o mês/ano da fatura (ajustando pelo fechamento)
      let invoiceId: string | null = null
      if (payload.card_id && closingDay !== null) {
        const invoiceMonth = getInvoiceMonth(payload.date, closingDay)
        invoiceId = await resolveInvoiceId(payload.card_id, invoiceMonth.month, invoiceMonth.year)
      }

      payloads.push({
        description: payload.description,
        amount: payload.amount,
        date: payload.date,
        type: payload.type,
        category_id: payload.category_id,
        account_id: payload.account_id,
        card_id: payload.card_id,
        invoice_id: invoiceId,
        is_installment: false,
      })
    }

    const { data, error: err } = await supabase.from('transactions').insert(payloads).select()
    if (err) {
      console.error('Supabase insert failed:', err)
      return []
    }
    await fetchTransactions()
    return data
  }

  const deleteTransaction = async (id: string) => {
    const { error: err } = await supabase.from('transactions').delete().eq('id', id)
    if (err) {
      console.error('Supabase delete failed:', err)
      return
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const updateTransaction = async (id: string, payload: any) => {
    const dbPayload = { ...payload }
    delete dbPayload.is_installment
    delete dbPayload.installment_total
    delete dbPayload.frequency
    delete dbPayload.is_value_per_installment

    const { error: err } = await supabase.from('transactions').update(dbPayload).eq('id', id)
    if (err) {
      console.error('Supabase update failed:', err)
      return
    }
    await fetchTransactions()
  }

  return { transactions, loading, error, monthIncome, monthExpenses, createTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions }
}
