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
      const selectedM = monthYear.month
      const selectedY = monthYear.year

      // Datas do mês selecionado
      const lastDay = new Date(selectedY, selectedM, 0).getDate()
      const startDateStr = `${selectedY}-${String(selectedM).padStart(2, '0')}-01`
      const endDateStr = `${selectedY}-${String(selectedM).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      // Buscamos do mês anterior ao mês atual para capturar compras de cartão
      // feitas no mês anterior mas após o fechamento (que pertencem a esta fatura)
      const prevMonth = selectedM === 1 ? 12 : selectedM - 1
      const prevYear = selectedM === 1 ? selectedY - 1 : selectedY
      const fetchStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`

      let query = supabase
        .from('transactions')
        .select('*, category:categories(*), account:accounts(*), invoice:invoices(*, credit_card:credit_cards(*))')
        .gte('date', fetchStart)
        .lte('date', endDateStr)
        .order('date', { ascending: false })

      if (search) query = query.ilike('description', `%${search}%`)

      if (sourceFilter.length > 0) {
        const accFilters = sourceFilter.filter(s => s.startsWith('acc:')).map(s => s.replace('acc:', ''))
        const cardFilters = sourceFilter.filter(s => s.startsWith('card:')).map(s => s.replace('card:', ''))
        const orParts: string[] = []
        if (accFilters.length > 0) orParts.push(`account_id.in.(${accFilters.join(',')})`)
        if (cardFilters.length > 0) orParts.push(`card_id.in.(${cardFilters.join(',')})`)
        if (orParts.length > 0) query = query.or(orParts.join(','))
      }

      if (typeFilter.length > 0) {
        query = query.in('type', typeFilter)
      }

      const { data, error: err } = await query
      if (err) throw err

      // Filtragem client-side: determina o mês de fatura de cada transação
      const result = (data || []).filter(tx => {
        if (tx.card_id) {
          // Prioridade 1: transação já tem invoice_id com mês/ano definidos
          if (tx.invoice?.month != null && tx.invoice?.year != null) {
            return tx.invoice.month === selectedM && tx.invoice.year === selectedY
          }
          // Prioridade 2: usar o dia de fechamento do cartão para calcular o mês da fatura
          const card = cards.find(c => c.id === tx.card_id)
          if (card?.closing_day) {
            const inv = getInvoiceMonth(tx.date, card.closing_day)
            return inv.month === selectedM && inv.year === selectedY
          }
          // Fallback: filtra por data
          return tx.date >= startDateStr && tx.date <= endDateStr
        }
        // Sem cartão: filtra por data do mês selecionado
        return tx.date >= startDateStr && tx.date <= endDateStr
      })

      setTransactions(result)
    } catch (e) {
      console.error('Error fetching transactions:', e)
      setTransactions([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthYear.month, monthYear.year, search, typeFilter.join(','), sourceFilter.join(','), cards.map(c => c.id + c.closing_day).join(',')])

  useEffect(() => {
    fetchTransactions()

    // Supabase Realtime: rebusca automaticamente quando a tabela muda
    // (útil após sincronização com Pluggy ou qualquer atualização externa)
    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          fetchTransactions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTransactions])

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
      .insert({ id: crypto.randomUUID(), card_id: cardId, month, year, status: 'open', total_amount: 0 })
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

    /** Formata Date como YYYY-MM-DD no fuso local (evita bug UTC do toISOString) */
    const toLocalDateStr = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

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

      // Para compras no cartão: se a compra for >= dia de fechamento,
      // a parcela 1 começa no próximo mês; caso contrário, começa no mês atual.
      let startYear = year
      let startMonth = month // 1-indexed
      if (payload.card_id && closingDay !== null) {
        const invoiceStart = getInvoiceMonth(payload.date, closingDay)
        startYear = invoiceStart.year
        startMonth = invoiceStart.month
      }

      for (let i = 0; i < totalOccurrences; i++) {
        const dateObj = new Date(startYear, startMonth - 1 + (i * step), day)
        const dStr = toLocalDateStr(dateObj)

        // Resolve a fatura correspondente a essa parcela
        let invoiceId: string | null = null
        if (payload.card_id && closingDay !== null) {
          const invoiceMonth = getInvoiceMonth(dStr, closingDay)
          invoiceId = await resolveInvoiceId(payload.card_id, invoiceMonth.month, invoiceMonth.year)
        }

        payloads.push({
          id: crypto.randomUUID(),
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
          installment_info: payload.installment_total > 1 ? { current: i + 1, total: totalOccurrences } : null,
        })
      }
    } else {
      // Compra simples: mantém a data original, mas atribui à fatura correta
      let invoiceId: string | null = null
      if (payload.card_id && closingDay !== null) {
        const invoiceMonth = getInvoiceMonth(payload.date, closingDay)
        invoiceId = await resolveInvoiceId(payload.card_id, invoiceMonth.month, invoiceMonth.year)
      }

      payloads.push({
        id: crypto.randomUUID(),
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
      throw err
    }
    await fetchTransactions()
    return data
  }

  const deleteTransaction = async (id: string, scope: 'single' | 'future' | 'all' = 'single', originalTx?: Transaction) => {
    if (scope === 'single' || !originalTx?.created_at) {
      const { error: err } = await supabase.from('transactions').delete().eq('id', id)
      if (err) {
        console.error('Supabase delete failed:', err)
        throw err
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      return
    }

    let query = supabase.from('transactions').delete().eq('created_at', originalTx.created_at)
    if (scope === 'future') {
      query = query.gte('date', originalTx.date)
    }

    const { error: err } = await query
    if (err) {
      console.error('Supabase delete bulk failed:', err)
      throw err
    }
    await fetchTransactions()
  }

  const updateTransaction = async (id: string, payload: any, scope: 'single' | 'future' | 'all' = 'single', originalTx?: Transaction) => {
    const dbPayload = { ...payload }
    delete dbPayload.is_installment
    delete dbPayload.installment_total
    delete dbPayload.frequency
    delete dbPayload.is_value_per_installment

    const selectedCard = payload.card_id ? cards.find((c) => c.id === payload.card_id) : null
    const closingDay = selectedCard?.closing_day ?? null

    if (scope === 'single' || !originalTx?.created_at) {
      let invoiceId: string | null = null
      if (payload.card_id && closingDay !== null) {
        const invoiceMonth = getInvoiceMonth(payload.date, closingDay)
        invoiceId = await resolveInvoiceId(payload.card_id, invoiceMonth.month, invoiceMonth.year)
      }
      dbPayload.invoice_id = invoiceId

      const { error: err } = await supabase.from('transactions').update(dbPayload).eq('id', id)
      if (err) {
        console.error('Supabase update failed:', err)
        throw err
      }
      await fetchTransactions()
      return
    }

    // Bulk update: fetch matching transactions
    let query = supabase.from('transactions').select('*').eq('created_at', originalTx.created_at)
    if (scope === 'future') {
      query = query.gte('date', originalTx.date)
    }
    const { data: targets, error: fetchErr } = await query
    if (fetchErr || !targets) throw fetchErr

    const upsertPayloads = await Promise.all(targets.map(async (t) => {
      let newDescription = dbPayload.description
      if (t.installment_info) {
        newDescription = `${dbPayload.description} (${t.installment_info.current}/${t.installment_info.total})`
      } else {
        const match = t.description.match(/\(\d+\/\d+\)$/)
        if (match) {
          newDescription = `${dbPayload.description} ${match[0]}`
        }
      }

      let invoiceId: string | null = null
      // Use original date of the target transaction, not the payload date (payload date might just be the one the user selected in the modal)
      // Actually, if the user changed the date, how do we apply it to all? 
      // Usually date changes aren't applied to all installments, only the base description/amount/card.
      // We will keep the target's original date.
      if (payload.card_id && closingDay !== null) {
        const invoiceMonth = getInvoiceMonth(t.date, closingDay)
        invoiceId = await resolveInvoiceId(payload.card_id, invoiceMonth.month, invoiceMonth.year)
      }

      return {
        ...t,
        ...dbPayload,
        date: t.date, // keep original date
        description: newDescription,
        invoice_id: invoiceId
      }
    }))

    const { error: err } = await supabase.from('transactions').upsert(upsertPayloads)
    if (err) throw err

    await fetchTransactions()
  }

  return { transactions, loading, error, monthIncome, monthExpenses, createTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions }
}
