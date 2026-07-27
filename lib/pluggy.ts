'use server'

/**
 * Pluggy (Meu Pluggy / Open Finance) API integration
 *
 * This module exports:
 *   - syncWithPluggy(): Fetches accounts + transactions from Pluggy via Server Action
 *     and upserts them into Supabase.
 */

import { supabase } from './supabase'
import { fetchPluggyAccounts, fetchPluggyTransactions, createPluggyConnectToken, fetchPluggyItem, fetchPluggyLoans, fetchPluggyCategories } from './pluggyService'

export async function getConnectToken(): Promise<{ token?: string; error?: string }> {
  try {
    const token = await createPluggyConnectToken()
    if (!token) return { error: 'Não foi possível gerar o token de conexão' }
    return { token }
  } catch (err: any) {
    return { error: err.message || 'Erro ao gerar token' }
  }
}

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
  categoryId?: string
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

export async function syncWithPluggy(itemId: string): Promise<{ synced: number; error?: string }> {
  try {
    if (!itemId) return { synced: 0, error: 'itemId é obrigatório' }

    // 0. Wait for the item to finish updating (Pluggy syncs in the background)
    let isReady = false;
    for (let i = 0; i < 15; i++) {
      const item = await fetchPluggyItem(itemId);
      if (item && item.executionStatus !== 'UPDATING') {
        isReady = true;
        break;
      }
      // wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!isReady) {
      return { synced: 0, error: 'A conexão demorou muito para processar. Tente sincronizar novamente mais tarde.' }
    }

    // 1. Fetch real accounts from Pluggy
    let accounts;
    try {
      accounts = await fetchPluggyAccounts(itemId)
    } catch (e: any) {
      throw e
    }

    if (!accounts || accounts.length === 0) {
      return { synced: 0, error: 'Nenhuma conta encontrada nesta conexão do Pluggy.' }
    }

    // 2. Upsert accounts into Supabase
    for (const acc of accounts) {
      if (acc.type === 'CREDIT') {
        const dueDateStr = acc.creditData?.balanceDueDate || '2026-01-05'
        const dueDay = parseInt(dueDateStr.split('-')[2])
        const closingDay = dueDay > 7 ? dueDay - 7 : 28

        const { error } = await supabase.from('credit_cards').upsert(
          {
            id: acc.id,
            name: acc.name || 'Cartão de Crédito',
            limit_amount: acc.creditData?.creditLimit || 0,
            closing_day: closingDay,
            due_day: dueDay,
            brand_icon: (acc.creditData?.brand || 'mastercard').toLowerCase(),
            color: '#8B5CF6',
          },
          { onConflict: 'id' }
        )
        if (error) console.warn('Error upserting credit card:', error.message)
      } else {
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
    }

    // 2.5 Fetch categories
    const pluggyCategories = await fetchPluggyCategories()
    const { data: localCategoriesData } = await supabase.from('categories').select('*')
    const localCategories = localCategoriesData || []

    // 3. Fetch transactions for each account and upsert
    let synced = 0
    for (const acc of accounts) {
      const isCredit = acc.type === 'CREDIT'
      
      const column = isCredit ? 'card_id' : 'account_id'
      const { data: latestTx } = await supabase
        .from('transactions')
        .select('date')
        .eq(column, acc.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()

      let fromDate = latestTx?.date
      if (fromDate) {
         const fd = new Date(fromDate)
         fd.setDate(fd.getDate() - 3)
         fromDate = fd.toISOString().split('T')[0]
      }

      const transactions = await fetchPluggyTransactions(acc.id, fromDate)
      
      for (const tx of transactions) {
        
        // O app tem foco apenas em despesas. Ignoramos entradas financeiras (CREDIT) em contas bancárias.
        if (!isCredit && tx.type === 'CREDIT') {
          continue
        }

        let localCategoryId: string | null = null

        if (tx.categoryId) {
          const existingCat = localCategories.find(c => c.pluggy_category_id === tx.categoryId)
          if (existingCat) {
            localCategoryId = existingCat.id
          } else {
            const pCat = pluggyCategories.find((c: any) => c.id === tx.categoryId)
            const categoryName = pCat?.descriptionTranslated || pCat?.description || tx.category || 'Outros'
            const categoryType = tx.type === 'CREDIT' ? 'income' : 'expense'
            
            const { data: newCat, error: catError } = await supabase.from('categories').insert({
              name: categoryName,
              type: categoryType,
              color: '#8B5CF6',
              icon: '🏷️',
              pluggy_category_id: tx.categoryId
            }).select().single()

            if (!catError && newCat) {
              localCategoryId = newCat.id
              localCategories.push(newCat)
            } else if (catError) {
              console.warn('Error creating category:', catError.message)
            }
          }
        }

        const { error } = await supabase.from('transactions').upsert(
          {
            id: tx.id,
            account_id: isCredit ? null : tx.accountId,
            card_id: isCredit ? tx.accountId : null,
            amount: Math.abs(tx.amount), // Amount might be negative for expenses
            date: tx.date.split('T')[0], // ensure YYYY-MM-DD
            description: tx.description,
            type: tx.type === 'CREDIT' ? 'income' : 'expense',
            is_installment: false,
            category_id: localCategoryId,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        )
        if (!error) synced++
        else console.warn('Error upserting transaction:', error.message)
      }
    }

    // 4. Fetch and upsert loans
    const loans = await fetchPluggyLoans(itemId)
    for (const loan of loans) {
      const { error } = await supabase.from('loans').upsert(
        {
          id: loan.id,
          name: loan.productName || 'Empréstimo',
          contract_amount: loan.contractAmount || 0,
          outstanding_balance: loan.payments?.contractOutstandingBalance || loan.installments?.contractRemainingNumber || 0,
          due_date: loan.dueDate ? loan.dueDate.split('T')[0] : null,
          installments_total: loan.installments?.totalNumberOfInstallments || null,
          installments_paid: loan.installments?.paidInstallments || null
        },
        { onConflict: 'id' }
      )
      if (error) console.warn('Error upserting loan:', error.message)
    }

    return { synced }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return { synced: 0, error: message }
  }
}
