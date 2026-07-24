import { useState } from 'react'
import type { Loan } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { Landmark, Trash2 } from 'lucide-react'

interface LoanManagerProps {
  loans: Loan[]
  onDelete: (id: string) => Promise<void>
}

export function LoanManager({ loans, onDelete }: LoanManagerProps) {
  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null)
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

  const handleDeleteClick = (loan: Loan) => {
    setDeleteTarget(loan)
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Meus Empréstimos</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Acompanhe seus empréstimos e financiamentos</p>
        </div>
      </div>

      {loans.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', background: 'var(--color-bg-secondary)', borderRadius: 12 }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            Você ainda não tem nenhum empréstimo importado.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loans.map((loan) => {
            const progress = loan.installments_total && loan.installments_total > 0 && loan.installments_paid
              ? Math.round((loan.installments_paid / loan.installments_total) * 100)
              : null
              
            return (
              <div key={loan.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                background: 'var(--color-bg-secondary)',
                borderRadius: 12,
                border: '1px solid var(--color-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, background: 'var(--color-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF'
                  }}>
                    <Landmark size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>{loan.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      <span style={{ color: 'var(--color-expense)', fontWeight: 500 }}>
                        Falta pagar: {formatCurrency(loan.outstanding_balance)}
                      </span>
                      {' '}• Total: {formatCurrency(loan.contract_amount)}
                    </div>
                    {progress !== null && (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, width: 100, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-accent)' }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {loan.installments_paid}/{loan.installments_total}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-icon"
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-expense)' }}
                    onClick={() => handleDeleteClick(loan)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Empréstimo">
        <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏦</div>
          <p style={{ fontSize: 15, color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: 6 }}>
            Excluir "{deleteTarget?.name}"?
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Esta ação não pode ser desfeita. Ele não sumirá do banco real, apenas será desvinculado do Despezas.
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
