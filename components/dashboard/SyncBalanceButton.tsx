'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Account } from '@/types'

interface SyncBalanceButtonProps {
  accounts: Account[]
  onSynced?: () => void
}

/**
 * Recalcula o saldo de cada conta bancária somando todas as
 * transações vinculadas a ela (receitas positivas, despesas negativas).
 * Não toca no Pluggy nem em dados de cartão de crédito.
 */
export function SyncBalanceButton({ accounts, onSynced }: SyncBalanceButtonProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSync = async () => {
    if (accounts.length === 0) return
    setLoading(true)
    setResult(null)

    try {
      let updatedCount = 0

      for (const acc of accounts) {
        // Busca todas as transações vinculadas a esta conta
        const { data: txs, error } = await supabase
          .from('transactions')
          .select('amount, type')
          .is('deleted_at', null)
          .eq('account_id', acc.id)

        if (error) {
          console.error(`Erro ao buscar transações da conta ${acc.name}:`, error)
          continue
        }

        // Calcula o saldo líquido: receitas – despesas
        const balance = (txs || []).reduce((sum, tx) => {
          return sum + (tx.type === 'income' ? tx.amount : -tx.amount)
        }, 0)

        // Atualiza o saldo no Supabase
        const { error: updateErr } = await supabase
          .from('accounts')
          .update({ balance: Math.round(balance * 100) / 100 })
          .eq('id', acc.id)

        if (!updateErr) updatedCount++
        else console.error(`Erro ao atualizar saldo de ${acc.name}:`, updateErr)
      }

      setResult(`✅ ${updatedCount} conta(s) atualizada(s)`)
      onSynced?.()
    } catch (e) {
      console.error('Erro ao sincronizar saldos:', e)
      setResult('❌ Erro ao sincronizar. Tente novamente.')
    } finally {
      setLoading(false)
      // Limpa a mensagem após 4 segundos
      setTimeout(() => setResult(null), 4000)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={handleSync}
        disabled={loading || accounts.length === 0}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-accent)',
          color: 'white',
          border: 'none',
          fontSize: 13,
          fontWeight: 600,
          cursor: loading || accounts.length === 0 ? 'not-allowed' : 'pointer',
          opacity: loading || accounts.length === 0 ? 0.6 : 1,
          transition: 'opacity 0.2s, transform 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
        title="Recalcula o saldo de cada conta com base nas transações cadastradas"
      >
        <RefreshCw
          size={15}
          style={{
            animation: loading ? 'spin 1s linear infinite' : 'none',
          }}
        />
        {loading ? 'Calculando...' : 'Recalcular Saldos'}
      </button>

      {result && (
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {result}
        </span>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
