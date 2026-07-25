'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Account } from '@/types'



export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('accounts')
        .select('*')
        .order('name')

      if (err) throw err

      setAccounts(data || [])
    } catch (e) {
      console.error('Error fetching accounts:', e)
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)

  const createAccount = async (payload: Omit<Account, 'id' | 'created_at'>) => {
    const { data, error: err } = await supabase.from('accounts').insert(payload).select().single()
    if (err) {
      console.error('Supabase insert failed:', err)
      return null as unknown as Account
    }
    setAccounts((prev) => [...prev, data])
    return data
  }

  const updateAccount = async (id: string, payload: Partial<Account>) => {
    const { error: err } = await supabase.from('accounts').update(payload).eq('id', id)
    if (err) {
      console.error('Supabase update failed:', err)
      return
    }
    await fetchAccounts()
  }

  const deleteAccount = async (id: string) => {
    // Remove todas as transações vinculadas à conta antes de excluí-la
    const { error: txErr } = await supabase
      .from('transactions')
      .delete()
      .eq('account_id', id)

    if (txErr) {
      console.error('Erro ao excluir transações da conta:', txErr)
      return
    }

    const { error: err } = await supabase.from('accounts').delete().eq('id', id)
    if (err) {
      console.error('Supabase delete failed:', err)
      return
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  return { accounts, loading, error, totalBalance, createAccount, updateAccount, deleteAccount, refetch: fetchAccounts }
}
