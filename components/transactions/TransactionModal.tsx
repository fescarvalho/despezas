'use client'

import { useState, useMemo, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/formatters'
import type { Category, Account, CreditCard, Transaction } from '@/types'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: TransactionFormData) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  categories: Category[]
  accounts: Account[]
  cards: CreditCard[]
  initialData?: Transaction | null
}

export interface TransactionFormData {
  description: string
  amount: number
  date: string
  type: 'income' | 'expense'
  category_id: string
  account_id?: string | null
  is_installment: boolean
  installment_total?: number
  frequency?: string
  is_value_per_installment?: boolean
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  categories,
  accounts,
  cards,
  initialData,
}: TransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [isInstallment, setIsInstallment] = useState(false)
  const [installmentTotal, setInstallmentTotal] = useState(2)
  const [frequency, setFrequency] = useState('mensal')
  const [isValuePerInstallment, setIsValuePerInstallment] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Initialize form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type)
        setDescription(initialData.description)
        setAmount(initialData.amount.toString())
        setDate(initialData.date)
        setCategoryId(initialData.category_id)
        setAccountId(initialData.account_id || '')
        setIsInstallment(false) // editing only current occurrence
      } else {
        setType('expense')
        setDescription('')
        setAmount('')
        setDate(new Date().toISOString().split('T')[0])
        setCategoryId('')
        setAccountId('')
        setIsInstallment(false)
        setInstallmentTotal(2)
        setFrequency('mensal')
        setIsValuePerInstallment(false)
      }
    }
  }, [isOpen, initialData])

  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0

  // Calculate values based on toggle
  const installmentValue = useMemo(() => {
    if (parsedAmount <= 0 || installmentTotal <= 0) return 0
    return isValuePerInstallment ? parsedAmount : parsedAmount / installmentTotal
  }, [parsedAmount, installmentTotal, isValuePerInstallment])

  const totalValue = useMemo(() => {
    if (parsedAmount <= 0 || installmentTotal <= 0) return 0
    return isValuePerInstallment ? parsedAmount * installmentTotal : parsedAmount
  }, [parsedAmount, installmentTotal, isValuePerInstallment])

  const filteredCats = categories.filter((c) => c.type === type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !amount || !categoryId) return
    setSaving(true)
    try {
      await onSave({
        description,
        amount: parsedAmount,
        date,
        type,
        category_id: categoryId,
        account_id: accountId || null,
        is_installment: isInstallment,
        installment_total: isInstallment ? installmentTotal : undefined,
        frequency: isInstallment ? frequency : undefined,
        is_value_per_installment: isInstallment ? isValuePerInstallment : undefined,
      })
      // Reset form handled by useEffect on next open
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!initialData || !onDelete) return
    setDeleting(true)
    try {
      await onDelete(initialData.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Transação" : "Nova Transação"}>
      <form onSubmit={handleSubmit}>
        {/* Type toggle */}
        <div className="type-toggle">
          <button
            type="button"
            className={`type-btn expense ${type === 'expense' ? 'active' : ''}`}
            onClick={() => setType('expense')}
          >
            💸 Despesa
          </button>
          <button
            type="button"
            className={`type-btn income ${type === 'income' ? 'active' : ''}`}
            onClick={() => setType('income')}
          >
            💰 Receita
          </button>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="tx-description">Descrição</label>
          <input
            id="tx-description"
            className="form-input"
            placeholder="Ex: Almoço, Salário, Netflix…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="form-label" htmlFor="tx-amount">Valor (R$)</label>
          <input
            id="tx-amount"
            className="form-input"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        {/* Installment preview banner */}
        {isInstallment && parsedAmount > 0 && (
          <div style={{
            margin: '10px 0 16px',
            padding: '12px 16px',
            background: 'var(--color-accent-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(79,70,229,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 700 }}>
                📅 {installmentTotal === 1 ? 'Recorrente' : `${installmentTotal}× de ${formatCurrency(installmentValue)}`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                {installmentTotal === 1 ? 'Lançamento infinito' : `Total: ${formatCurrency(totalValue)}`}
              </div>
            </div>
            <div style={{
              padding: '4px 10px',
              background: 'var(--color-accent)',
              color: 'white',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              fontWeight: 700,
            }}>
              {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
            </div>
          </div>
        )}

        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label" htmlFor="tx-date">Data</label>
          <input
            id="tx-date"
            className="form-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="tx-category">Categoria</label>
          <select
            id="tx-category"
            className="form-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Selecione uma categoria</option>
            {filteredCats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {accounts.length > 0 && (
          <div className="form-group">
            <label className="form-label" htmlFor="tx-account">Conta (opcional)</label>
            <select
              id="tx-account"
              className="form-select"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="">Sem conta vinculada</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.icon} {acc.name} — {formatCurrency(acc.balance)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Installment toggle (only for new transactions) */}
        {type === 'expense' && !initialData && (
          <div style={{
            padding: '12px 14px',
            border: `1.5px solid ${isInstallment ? 'var(--color-accent)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-md)',
            background: isInstallment ? 'var(--color-accent-light)' : 'transparent',
            transition: 'all 0.2s',
            marginBottom: 20,
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: isInstallment ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            }}>
              {/* Custom toggle */}
              <div
                onClick={() => setIsInstallment((p) => !p)}
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  background: isInstallment ? 'var(--color-accent)' : 'var(--color-border)',
                  position: 'relative',
                  transition: 'background 0.25s',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 3,
                  left: isInstallment ? 20 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.25s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span>Repetir / Parcelar transação</span>
            </label>

            {isInstallment && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Nº Parcelas (1 = Fixo Mensal)</label>
                    <input
                      className="form-input"
                      type="number"
                      min={1}
                      max={60}
                      value={installmentTotal}
                      onChange={(e) => setInstallmentTotal(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Recorrência</label>
                    <select
                      className="form-select"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                    >
                      <option value="mensal">Mensal</option>
                      <option value="bimestral">Bimestral</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isValuePerInstallment}
                    onChange={(e) => setIsValuePerInstallment(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--color-accent)' }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Valor da parcela</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Marcar essa opção significa usar o valor digitado como parcela ao invés do total</div>
                  </div>
                </label>
              </div>
            )}
          </div>
        )}

        {initialData && onDelete ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary btn-icon" onClick={handleDelete} disabled={deleting || saving} style={{ width: 44, color: 'var(--color-expense)', borderColor: 'var(--color-expense-light)', background: 'var(--color-expense-light)' }}>
              {deleting ? '...' : '🗑️'}
            </button>
            <button type="button" className="btn btn-secondary btn-full" onClick={onClose} disabled={saving || deleting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving || deleting}>
              {saving ? <><span className="spinner" /> Salvando…</> : 'Salvar Alterações'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary btn-full" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
              {saving ? (
                <><span className="spinner" /> Salvando…</>
              ) : isInstallment
                ? (installmentTotal === 1 ? 'Criar transação recorrente' : `Criar ${installmentTotal}× parcelas`)
                : 'Salvar'}
            </button>
          </div>
        )}
      </form>
    </Modal>
  )
}
