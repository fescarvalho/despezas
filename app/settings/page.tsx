'use client'

import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useCreditCards } from '@/hooks/useCreditCards'
import { useLoans } from '@/hooks/useLoans'
import { useTheme } from '@/hooks/useTheme'
import { PluggySyncButton } from '@/components/settings/PluggySyncButton'
import { CategoryManager } from '@/components/settings/CategoryManager'
import { AccountManager } from '@/components/settings/AccountManager'
import { CreditCardManager } from '@/components/settings/CreditCardManager'
import { LoanManager } from '@/components/settings/LoanManager'
import { ToastProvider } from '@/components/ui/Toast'
import { Wifi, Tag, Info, Shield, Palette, Landmark } from 'lucide-react'

function SettingsContent() {
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories()
  const { accounts, createAccount, updateAccount, deleteAccount } = useAccounts()
  const { cards, createCard, updateCard, deleteCard } = useCreditCards()
  const { loans, deleteLoan } = useLoans()
  const { isDark, toggle } = useTheme()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Gerencie integrações e preferências</p>
        </div>
      </div>

      {/* Theme toggle — visible on mobile (sidebar hidden) */}
      <div className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Palette size={18} color="var(--color-accent)" />
          <h2 className="section-title" style={{ marginBottom: 0 }}>Aparência</h2>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                {isDark ? '🌙 Tema Escuro' : '☀️ Tema Claro'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {isDark ? 'Interface com fundo escuro' : 'Interface com fundo claro'}
              </div>
            </div>
            <button
              onClick={toggle}
              aria-label="Alternar tema"
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                background: isDark ? 'var(--color-accent)' : 'var(--color-border)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.3s ease',
                flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: 3,
                left: isDark ? 26 : 3,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                fontSize: 12,
              }}>
                {isDark ? '🌙' : '☀️'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Account manager & Credit Cards */}
      <div className="settings-section">
        {/* Minhas Contas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Landmark size={18} color="var(--color-accent)" />
          <h2 className="section-title" style={{ marginBottom: 0 }}>Minhas Contas</h2>
        </div>
        <div className="card" style={{ marginBottom: 32 }}>
          <AccountManager
            accounts={accounts}
            onCreate={async (data) => { await createAccount(data) }}
            onUpdate={async (id, data) => { await updateAccount(id, data) }}
            onDelete={async (id) => { await deleteAccount(id) }}
          />
        </div>

        {/* Meus Cartões */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Tag size={18} color="var(--color-accent)" />
          <h2 className="section-title" style={{ marginBottom: 0 }}>Cartões de Crédito</h2>
        </div>
        <div className="card">
          <CreditCardManager
            cards={cards}
            onCreate={async (data) => { await createCard(data) }}
            onUpdate={async (id, data) => { await updateCard(id, data) }}
            onDelete={async (id) => { await deleteCard(id) }}
          />
        </div>

        {/* Meus Empréstimos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Landmark size={18} color="var(--color-accent)" />
          <h2 className="section-title" style={{ marginBottom: 0 }}>Meus Empréstimos</h2>
        </div>
        <div className="card">
          <LoanManager
            loans={loans}
            onDelete={async (id) => { await deleteLoan(id) }}
          />
        </div>
      </div>

      {/* Pluggy sync */}
      <div className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Wifi size={18} color="var(--color-accent)" />
          <h2 className="section-title" style={{ marginBottom: 0 }}>Open Finance – Meu Pluggy</h2>
        </div>
        <div className="card">
          <PluggySyncButton />
        </div>
      </div>

      {/* Category manager */}
      <div className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Tag size={18} color="var(--color-accent)" />
          <h2 className="section-title" style={{ marginBottom: 0 }}>Gerenciar Categorias</h2>
        </div>
        <div className="card">
          <CategoryManager
            categories={categories}
            onCreate={async (data) => { await createCategory(data) }}
            onUpdate={async (id, data) => { await updateCategory(id, data) }}
            onDelete={async (id) => { await deleteCategory(id) }}
          />
        </div>
      </div>

      {/* App info */}
      <div className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Info size={18} color="var(--color-accent)" />
          <h2 className="section-title" style={{ marginBottom: 0 }}>Sobre o App</h2>
        </div>
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Versão', value: '1.0.0' },
              { label: 'Framework', value: 'Next.js 14' },
              { label: 'Banco de dados', value: 'Supabase' },
              { label: 'Open Finance', value: 'Meu Pluggy' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 16px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className="card" style={{ background: 'var(--color-accent-light)', border: '1px solid rgba(79,70,229,0.15)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Shield size={20} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-accent)', marginBottom: 4 }}>Dados protegidos</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Seus dados financeiros são armazenados com segurança no Supabase com criptografia em repouso.
              A integração com Open Finance é feita via protocolo OAuth 2.0 certificado pelo Banco Central.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsContent />
    </ToastProvider>
  )
}
