'use server'

/**
 * Pluggy (Meu Pluggy / Open Finance) API integration
 *
 * This module exports:
 *   - syncWithPluggy(): Fetches accounts + transactions from Pluggy via Server Action
 *     and upserts them into Supabase.
 */

import { supabase } from './supabase'
import { fetchPluggyAccounts, fetchPluggyTransactions } from './pluggyService'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PluggyAccount {
  id: string
  name: string
  type: string
  balance: number
}

interface PluggyTransaction {
  id: string
  accountId: string
  amount: number
  date: string
  description: string
  type: 'CREDIT' | 'DEBIT'
  category?: string
}

// ---------------------------------------------------------------------------
// Mock data (used when real credentials are not configured)
// ---------------------------------------------------------------------------

const MOCK_ACCOUNTS: PluggyAccount[] = [
  { id: 'pluggy-acc-1', name: 'Conta Corrente Pluggy', type: 'BANK', balance: 3500.0 },
  { id: 'pluggy-acc-2', name: 'Poupança Pluggy', type: 'SAVINGS', balance: 12000.0 },
]

const MOCK_TRANSACTIONS: PluggyTransaction[] = [
  {
    id: 'pluggy-tx-1',
    accountId: 'pluggy-acc-1',
    amount: 5000,
    date: new Date().toISOString().split('T')[0],
    description: 'Salário – Pluggy Sync',
    type: 'CREDIT',
    category: 'Salário',
  },
  {
    id: 'pluggy-tx-2',
    accountId: 'pluggy-acc-1',
    amount: 120.5,
    date: new Date().toISOString().split('T')[0],
    description: 'Mercado – Pluggy Sync',
    type: 'DEBIT',
    category: 'Alimentação',
  },
  {
    id: 'pluggy-tx-3',
    accountId: 'pluggy-acc-1',
    amount: 85.9,
    date: new Date().toISOString().split('T')[0],
    description: 'Uber – Pluggy Sync',
    type: 'DEBIT',
    category: 'Transporte',
  },
]

// ---------------------------------------------------------------------------
// Main sync function
// ---------------------------------------------------------------------------

export async function syncWithPluggy(): Promise<{ synced: number; error?: string }> {
  try {
    // 1. Fetch real accounts from Pluggy
    const accounts = await fetchPluggyAccounts()
    if (!accounts || accounts.length === 0) {
      return { synced: 0, error: 'Nenhuma conta encontrada no Pluggy ou falha na autenticação.' }
    }

    // 2. Upsert accounts into Supabase
    for (const acc of accounts) {
      const { error } = await supabase.from('accounts').upsert(
        {
          id: acc.id,
          name: acc.name,
          type: acc.type === 'SAVINGS' ? 'savings' : 'checking',
          balance: acc.balance,
          icon: '🏦',
        },
        { onConflict: 'id' }
      )
      if (error) console.warn('Error upserting account:', error.message)
    }

    // 3. Fetch transactions for each account and upsert
    let synced = 0
    for (const acc of accounts) {
      const transactions = await fetchPluggyTransactions(acc.id)
      
      for (const tx of transactions) {
        const { error } = await supabase.from('transactions').upsert(
          {
            id: tx.id,
            account_id: tx.accountId,
            amount: Math.abs(tx.amount), // Amount might be negative for expenses
            date: tx.date.split('T')[0], // ensure YYYY-MM-DD
            description: tx.description,
            type: tx.type === 'CREDIT' ? 'income' : 'expense',
            is_installment: false,
            category_id: null,
          },
          { onConflict: 'id' }
        )
        if (!error) synced++
        else console.warn('Error upserting transaction:', error.message)
      }
    }

    return { synced }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return { synced: 0, error: message }
  }
}
