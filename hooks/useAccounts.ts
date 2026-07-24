'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Account } from '@/types'

// Seed data for when the database is empty
const SEED_ACCOUNTS: Omit<Account, 'created_at'>[] = [
  { id: 'acc-1', name: 'Conta Corrente', type: 'checking', balance: 4250.75, icon: '🏦' },
  { id: 'acc-2', name: 'Poupança', type: 'savings', balance: 18500.0, icon: '💰' },
  { id: 'acc-3', name: 'Carteira', type: 'checking', balance: 350.0, icon: '👛' },
]

let localMockAccounts: Account[] | null = null

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

      if (!data || data.length === 0) {
        if (!localMockAccounts) localMockAccounts = [...SEED_ACCOUNTS] as Account[]
        setAccounts([...localMockAccounts])
      } else {
        setAccounts(data)
      }
    } catch {
      if (!localMockAccounts) localMockAccounts = [...SEED_ACCOUNTS] as Account[]
      setAccounts([...localMockAccounts])
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
      console.warn('Supabase insert failed, using local state fallback', err)
      const newAcc = { ...payload, id: `acc-new-${Date.now()}` } as Account
      if (!localMockAccounts) localMockAccounts = [...SEED_ACCOUNTS] as Account[]
      localMockAccounts.push(newAcc)
      setAccounts([...localMockAccounts])
      return newAcc
    }
    setAccounts((prev) => [...prev, data])
    return data
  }

  const updateAccount = async (id: string, payload: Partial<Account>) => {
    const { error: err } = await supabase.from('accounts').update(payload).eq('id', id)
    if (err) {
      console.warn('Supabase update failed, using local state fallback', err)
      if (!localMockAccounts) localMockAccounts = [...SEED_ACCOUNTS] as Account[]
      localMockAccounts = localMockAccounts.map((a) => a.id === id ? { ...a, ...payload } : a)
      setAccounts([...localMockAccounts])
      return
    }
    await fetchAccounts()
  }

  const deleteAccount = async (id: string) => {
    const { error: err } = await supabase.from('accounts').delete().eq('id', id)
    if (err) {
      console.warn('Supabase delete failed, using local state fallback', err)
      if (!localMockAccounts) localMockAccounts = [...SEED_ACCOUNTS] as Account[]
      localMockAccounts = localMockAccounts.filter((a) => a.id !== id)
      setAccounts([...localMockAccounts])
      return
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  return { accounts, loading, error, totalBalance, createAccount, updateAccount, deleteAccount, refetch: fetchAccounts }
}
