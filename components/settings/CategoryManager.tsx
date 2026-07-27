'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import type { Category } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'

interface CategoryManagerProps {
  categories: Category[]
  onCreate: (data: Omit<Category, 'id' | 'created_at'>) => Promise<void>
  onUpdate?: (id: string, data: Partial<Category>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const PRESET_COLORS = ['#10B981', '#EF4444', '#4F46E5', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#3B82F6', '#6366F1']
const PRESET_ICONS = ['🍔', '🚗', '🏠', '💊', '🎮', '📚', '👔', '✈️', '🐾', '💼', '💻', '📈', '🎵', '⚽', '💡']

export function CategoryManager({ categories, onCreate, onUpdate, onDelete }: CategoryManagerProps) {
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [icon, setIcon] = useState('🍔')
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleOpenNew = () => {
    setEditingCategory(null)
    setName('')
    setColor(PRESET_COLORS[0])
    setIcon('🍔')
    setType('expense')
    setErrorMessage(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat)
    setName(cat.name)
    setColor(cat.color || PRESET_COLORS[0])
    setIcon(cat.icon || '🍔')
    setType(cat.type || 'expense')
    setErrorMessage(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setErrorMessage(null)
    try {
      if (editingCategory && onUpdate) {
        await onUpdate(editingCategory.id, { name: name.trim(), color, icon, type })
        showToast('Categoria atualizada com sucesso!', 'success')
      } else {
        await onCreate({ name: name.trim(), color, icon, type })
        showToast('Categoria criada com sucesso!', 'success')
      }
      setModalOpen(false)
      setName('')
    } catch (err: any) {
      console.error('Erro ao salvar categoria:', err)
      const msg = err?.message || 'Erro ao salvar categoria no banco de dados.'
      setErrorMessage(msg)
      showToast(`Erro ao salvar categoria: ${msg}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Deseja realmente excluir a categoria "${cat.name}"?`)) return
    try {
      await onDelete(cat.id)
      showToast('Categoria excluída com sucesso!', 'success')
    } catch (err: any) {
      showToast(`Erro ao excluir categoria: ${err?.message || 'Erro desconhecido'}`, 'error')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>Categorias</h3>
        <button className="btn btn-primary btn-icon" onClick={handleOpenNew} aria-label="Nova categoria">
          <Plus size={18} />
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon="🏷️" title="Nenhuma categoria" description="Crie categorias para organizar suas transações" />
      ) : (
        <div>
          {categories.map((cat) => (
            <div key={cat.id} className="category-item">
              <div
                className="category-icon-circle"
                style={{ background: cat.color + '20' }}
              >
                {cat.icon}
              </div>
              <span className="category-name">{cat.name}</span>
              <span
                className="category-type-badge"
                style={{
                  background: cat.type === 'income' ? 'var(--color-income-light)' : 'var(--color-expense-light)',
                  color: cat.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)',
                }}
              >
                {cat.type === 'income' ? 'Receita' : 'Despesa'}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-icon btn-secondary"
                  onClick={() => handleOpenEdit(cat)}
                  aria-label={`Editar categoria ${cat.name}`}
                  style={{ width: 32, height: 32 }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="btn btn-icon btn-danger"
                  onClick={() => handleDelete(cat)}
                  aria-label={`Excluir categoria ${cat.name}`}
                  style={{ width: 32, height: 32 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCategory ? "Editar Categoria" : "Nova Categoria"}>
        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <div style={{ padding: '10px 14px', background: 'var(--color-expense-light)', color: 'var(--color-expense)', borderRadius: 'var(--radius-md)', marginBottom: 14, fontSize: 13 }}>
              {errorMessage}
            </div>
          )}

          <div className="type-toggle" style={{ marginBottom: 16 }}>
            <button type="button" className={`type-btn expense ${type === 'expense' ? 'active' : ''}`} onClick={() => setType('expense')}>
              💸 Despesa
            </button>
            <button type="button" className={`type-btn income ${type === 'income' ? 'active' : ''}`} onClick={() => setType('income')}>
              💰 Receita
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Nome</label>
            <input className="form-input" placeholder="Ex: Alimentação" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Ícone</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)', fontSize: 20,
                    border: icon === ic ? '2px solid var(--color-accent)' : '1.5px solid var(--color-border)',
                    background: icon === ic ? 'var(--color-accent-light)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cor</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', background: c,
                    border: color === c ? '3px solid var(--color-accent)' : '2px solid transparent',
                    outline: color === c ? '2px solid var(--color-accent-light)' : 'none',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary btn-full" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
              {saving ? <><span className="spinner" /> Salvando...</> : editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
