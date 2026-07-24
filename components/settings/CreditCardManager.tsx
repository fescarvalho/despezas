'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, CreditCard as CardIcon } from 'lucide-react'
import type { CreditCard, CardBrand } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/formatters'

interface CreditCardManagerProps {
  cards: CreditCard[]
  onCreate: (data: Omit<CreditCard, 'id' | 'created_at'>) => Promise<void>
  onUpdate: (id: string, data: Partial<CreditCard>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const BRANDS: { value: CardBrand; label: string; icon: string }[] = [
  { value: 'mastercard', label: 'Mastercard', icon: '🔴🟠' },
  { value: 'visa', label: 'Visa', icon: '🔵' },
  { value: 'elo', label: 'Elo', icon: '🟡' },
  { value: 'amex', label: 'American Express', icon: '🟦' },
  { value: 'hipercard', label: 'Hipercard', icon: '🟥' },
]

export function CreditCardManager({ cards, onCreate, onUpdate, onDelete }: CreditCardManagerProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [closingDay, setClosingDay] = useState('15')
  const [dueDay, setDueDay] = useState('22')
  const [brand, setBrand] = useState<CardBrand>('mastercard')
  const [color, setColor] = useState('#8B5CF6')
  const [loading, setLoading] = useState(false)

  const handleOpenNew = () => {
    setEditingCard(null)
    setName('')
    setLimit('')
    setClosingDay('15')
    setDueDay('22')
    setBrand('mastercard')
    setColor('#8B5CF6')
    setModalOpen(true)
  }

  const handleOpenEdit = (card: CreditCard) => {
    setEditingCard(card)
    setName(card.name)
    setLimit(card.limit_amount.toString())
    setClosingDay(card.closing_day.toString())
    setDueDay(card.due_day.toString())
    setBrand(card.brand_icon)
    setColor(card.color || '#8B5CF6')
    setModalOpen(true)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditingCard(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name,
        limit_amount: parseFloat(limit) || 0,
        closing_day: parseInt(closingDay) || 1,
        due_day: parseInt(dueDay) || 1,
        brand_icon: brand,
        color,
      }
      
      if (editingCard) {
        await onUpdate(editingCard.id, payload)
      } else {
        await onCreate(payload)
      }
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<CreditCard | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await onDelete(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteClick = (card: CreditCard) => {
    setDeleteTarget(card)
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Meus Cartões</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Gerencie seus cartões de crédito e limites</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenNew}>
          <Plus size={16} /> Novo
        </button>
      </div>

      {cards.length === 0 ? (
        <EmptyState icon="💳" title="Nenhum cartão" description="Adicione seu primeiro cartão de crédito" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cards.map((card) => (
            <div key={card.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, background: card.color || 'var(--color-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF'
                }}>
                  <CardIcon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>{card.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Limite: {formatCurrency(card.limit_amount)} • Vence dia {card.due_day}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-icon"
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)' }}
                  onClick={() => handleOpenEdit(card)}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="btn btn-icon"
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-expense)' }}
                  onClick={() => handleDeleteClick(card)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={handleClose} title={editingCard ? 'Editar Cartão' : 'Novo Cartão'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome do Cartão</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank, Inter..." required />
          </div>

          <div className="form-group">
            <label className="form-label">Limite (R$)</label>
            <input className="form-input" type="number" step="0.01" min="0" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="0.00" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Dia do Fechamento</label>
              <input className="form-input" type="number" min="1" max="31" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Dia do Vencimento</label>
              <input className="form-input" type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Bandeira</label>
              <select className="form-select" value={brand} onChange={(e) => setBrand(e.target.value as CardBrand)} required>
                {BRANDS.map(b => (
                  <option key={b.value} value={b.value}>{b.icon} {b.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cor</label>
              <input className="form-input" type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ padding: 4, height: 44 }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="button" className="btn btn-secondary btn-full" onClick={handleClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Salvar Cartão'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Cartão">
        <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
          <p style={{ fontSize: 15, color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: 6 }}>
            Excluir "{deleteTarget?.name}"?
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Esta ação não pode ser desfeita. Transações vinculadas serão excluídas.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-full" onClick={() => setDeleteTarget(null)}>Cancelar</button>
          <button className="btn btn-danger btn-full" onClick={handleDeleteConfirm} disabled={isDeleting}
            style={{ background: 'var(--color-expense)', color: 'white', border: 'none' }}>
            {isDeleting ? <><span className="spinner" /> Excluindo...</> : '🗑️ Excluir'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
