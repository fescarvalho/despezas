'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Wallet, TrendingUp, Landmark } from 'lucide-react'
import type { Account, AccountType } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/formatters'

// ─── helpers ──────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  investment: 'Investimento',
}

const ACCOUNT_ICONS = ['🏦', '💰', '💳', '👛', '🪙', '📈', '🏧', '💵', '🏡', '🌟']

const TYPE_COLORS: Record<AccountType, string> = {
  checking: '#4F46E5',
  savings:  '#10B981',
  investment: '#F59E0B',
}

const TYPE_BG: Record<AccountType, string> = {
  checking:   'rgba(79,70,229,0.12)',
  savings:    'rgba(16,185,129,0.12)',
  investment: 'rgba(245,158,11,0.12)',
}

function TypeIcon({ type }: { type: AccountType }) {
  if (type === 'savings')    return <TrendingUp size={16} />
  if (type === 'investment') return <TrendingUp size={16} />
  return <Landmark size={16} />
}

// ─── blank form ───────────────────────────────────────────────────────────────

const BLANK: Omit<Account, 'id' | 'created_at'> = {
  name: '',
  type: 'checking',
  balance: 0,
  icon: '🏦',
}

// ─── sub-component: form modal ────────────────────────────────────────────────

interface AccountFormProps {
  initial: Omit<Account, 'id' | 'created_at'>
  title: string
  isOpen: boolean
  saving: boolean
  onClose: () => void
  onSubmit: (data: Omit<Account, 'id' | 'created_at'>) => void
}

function AccountForm({ initial, title, isOpen, saving, onClose, onSubmit }: AccountFormProps) {
  const [form, setForm] = useState(initial)

  // Sync when initial changes (edit mode)
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit(form)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        {/* Icon picker */}
        <div className="form-group">
          <label className="form-label">Ícone</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ACCOUNT_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => set('icon', ic)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  fontSize: 22,
                  border: form.icon === ic
                    ? '2px solid var(--color-accent)'
                    : '1.5px solid var(--color-border)',
                  background: form.icon === ic ? 'var(--color-accent-light)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="acc-name">Nome da Conta</label>
          <input
            id="acc-name"
            className="form-input"
            placeholder="Ex: Nubank, Caixa, Carteira"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="acc-type">Tipo</label>
          <select
            id="acc-type"
            className="form-select"
            value={form.type}
            onChange={(e) => set('type', e.target.value as AccountType)}
          >
            <option value="checking">Conta Corrente</option>
            <option value="savings">Poupança</option>
            <option value="investment">Investimento</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="acc-balance">Saldo Atual (R$)</label>
          <input
            id="acc-balance"
            className="form-input"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={form.balance === 0 ? '' : form.balance}
            onChange={(e) => set('balance', parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Preview */}
        <div style={{
          padding: '14px 16px',
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          border: '1px solid var(--color-border)',
        }}>
          <span style={{ fontSize: 28 }}>{form.icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>
              {form.name || 'Nome da conta'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {ACCOUNT_TYPE_LABELS[form.type]}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontWeight: 800, fontSize: 17, color: form.balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
            {formatCurrency(form.balance)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary btn-full" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? <><span className="spinner" /> Salvando...</> : 'Salvar Conta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── delete confirm modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ account, isOpen, onClose, onConfirm, deleting }: {
  account: Account | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  deleting: boolean
}) {
  if (!account) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir Conta">
      <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{account.icon}</div>
        <p style={{ fontSize: 15, color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: 6 }}>
          Excluir &ldquo;{account.name}&rdquo;?
        </p>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          Atenção: Ao excluir esta conta, todo o histórico de movimentações vinculadas a ela também será apagado permanentemente.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary btn-full" onClick={onClose}>Cancelar</button>
        <button className="btn btn-danger btn-full" onClick={onConfirm} disabled={deleting}
          style={{ background: 'var(--color-expense)', color: 'white', border: 'none' }}>
          {deleting ? <><span className="spinner" /> Excluindo...</> : '🗑️ Excluir'}
        </button>
      </div>
    </Modal>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

interface AccountManagerProps {
  accounts: Account[]
  onCreate: (data: Omit<Account, 'id' | 'created_at'>) => Promise<void>
  onUpdate: (id: string, data: Partial<Account>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function AccountManager({ accounts, onCreate, onUpdate, onDelete }: AccountManagerProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Account | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleCreate = async (data: Omit<Account, 'id' | 'created_at'>) => {
    setSaving(true)
    try { await onCreate(data); setCreateOpen(false) }
    finally { setSaving(false) }
  }

  const handleEdit = async (data: Omit<Account, 'id' | 'created_at'>) => {
    if (!editTarget) return
    setSaving(true)
    try { await onUpdate(editTarget.id, data); setEditTarget(null) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try { await onDelete(deleteTarget.id); setDeleteTarget(null) }
    finally { setDeleting(false) }
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 className="section-title" style={{ marginBottom: 2 }}>Minhas Contas</h3>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Saldo total: <strong style={{ color: 'var(--color-income)' }}>{formatCurrency(totalBalance)}</strong>
          </span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setCreateOpen(true)}
          style={{ gap: 6 }}
          aria-label="Adicionar conta"
        >
          <Plus size={16} />
          Nova Conta
        </button>
      </div>

      {/* Account list */}
      {accounts.length === 0 ? (
        <EmptyState
          icon="🏦"
          title="Nenhuma conta cadastrada"
          description="Adicione sua primeira conta para controlar seu saldo"
          action={
            <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Adicionar Conta
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {accounts.map((acc) => (
            <div
              key={acc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.15s',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: TYPE_BG[acc.type],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}>
                {acc.icon}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {acc.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 11,
                    fontWeight: 700,
                    background: TYPE_BG[acc.type],
                    color: TYPE_COLORS[acc.type],
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}>
                    {ACCOUNT_TYPE_LABELS[acc.type]}
                  </span>
                </div>
              </div>

              {/* Balance */}
              <div style={{
                fontWeight: 800,
                fontSize: 16,
                color: acc.balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)',
                flexShrink: 0,
                textAlign: 'right',
              }}>
                {formatCurrency(acc.balance)}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  className="btn btn-secondary btn-icon"
                  onClick={() => setEditTarget(acc)}
                  aria-label={`Editar conta ${acc.name}`}
                  style={{ width: 34, height: 34 }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="btn btn-icon"
                  onClick={() => setDeleteTarget(acc)}
                  aria-label={`Excluir conta ${acc.name}`}
                  style={{ width: 34, height: 34, background: 'var(--color-expense-light)', color: 'var(--color-expense)', borderRadius: 'var(--radius-md)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Total row */}
          <div style={{
            padding: '12px 16px',
            background: 'var(--color-accent-light)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(79,70,229,0.15)',
          }}>
            <span style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: 14 }}>
              💼 Saldo Total
            </span>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-accent)' }}>
              {formatCurrency(totalBalance)}
            </span>
          </div>
        </div>
      )}

      {/* Modals */}
      <AccountForm
        key="create"
        initial={BLANK}
        title="Nova Conta"
        isOpen={createOpen}
        saving={saving}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <AccountForm
        key={editTarget?.id ?? 'edit'}
        initial={editTarget ? { name: editTarget.name, type: editTarget.type, balance: editTarget.balance, icon: editTarget.icon } : BLANK}
        title="Editar Conta"
        isOpen={!!editTarget}
        saving={saving}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />

      <DeleteConfirmModal
        account={deleteTarget}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  )
}
