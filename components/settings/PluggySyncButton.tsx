'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Wifi, Link2Off, PlusCircle } from 'lucide-react'
import { syncWithPluggy, getConnectToken } from '@/lib/pluggy'
import { useToast } from '@/components/ui/Toast'
import dynamic from 'next/dynamic'

const PluggyConnectWrapper = dynamic(() => import('./PluggyConnectWrapper'), { ssr: false })

const STORAGE_KEY = 'pluggy_item_ids'

function loadItemIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveItemIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

interface PluggySyncButtonProps {
  onSynced?: () => void
}

export function PluggySyncButton({ onSynced }: PluggySyncButtonProps) {
  const [loading, setLoading] = useState(false)
  const [connectToken, setConnectToken] = useState<string | null>(null)
  const [itemIds, setItemIds] = useState<string[]>([])
  const { showToast } = useToast()

  // Carrega os itemIds salvos do localStorage
  useEffect(() => {
    setItemIds(loadItemIds())
  }, [])

  // ─── Sincroniza usando os itemIds já salvos (sem abrir o widget) ───
  const handleSync = async () => {
    if (itemIds.length === 0) {
      showToast('Nenhuma conta conectada. Use "Nova conexão" para vincular seu banco.', 'error')
      return
    }
    setLoading(true)
    showToast('Sincronizando dados do Meu Pluggy...', 'success')
    try {
      let totalSynced = 0
      const failedIds: string[] = []

      for (const itemId of itemIds) {
        const result = await syncWithPluggy(itemId)
        if (result.error) {
          console.error(`Erro ao sincronizar item ${itemId}:`, result.error)
          failedIds.push(itemId)
        } else {
          totalSynced += result.synced
        }
      }

      if (failedIds.length > 0 && failedIds.length === itemIds.length) {
        showToast('Erro ao sincronizar. Tente reconectar sua conta.', 'error')
      } else if (failedIds.length > 0) {
        showToast(`Sincronizado parcialmente: ${totalSynced} transações importadas.`, 'success')
      } else {
        showToast(`✅ Sincronizado! ${totalSynced} transações importadas.`, 'success')
      }
      onSynced?.()
    } catch (err) {
      showToast('Erro inesperado ao sincronizar.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ─── Abre o widget para adicionar uma nova conexão bancária ───
  const handleNewConnection = async () => {
    setLoading(true)
    try {
      const result = await getConnectToken()
      if (result.error || !result.token) {
        showToast(`Erro ao iniciar conexão: ${result.error}`, 'error')
      } else {
        setConnectToken(result.token)
      }
    } catch (err) {
      showToast('Erro inesperado ao conectar com Pluggy.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ─── Callback do widget após conexão bem-sucedida ───
  const handleSuccess = async (itemData: any) => {
    setConnectToken(null)
    const newItemId: string = itemData.item.id

    // Salva o itemId se ainda não estiver na lista
    const updated = itemIds.includes(newItemId) ? itemIds : [...itemIds, newItemId]
    saveItemIds(updated)
    setItemIds(updated)

    setLoading(true)
    showToast('Conta conectada! Importando transações...', 'success')
    try {
      const result = await syncWithPluggy(newItemId)
      if (result.error) {
        showToast(`Erro na sincronização: ${result.error}`, 'error')
      } else {
        showToast(`✅ Sincronizado! ${result.synced} transações importadas.`, 'success')
        onSynced?.()
      }
    } catch (err) {
      showToast('Erro inesperado ao sincronizar.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ─── Remove todas as conexões salvas ───
  const handleDisconnect = () => {
    saveItemIds([])
    setItemIds([])
    showToast('Conexões removidas. Use "Nova conexão" para reconectar.', 'success')
  }

  // Mostra o widget quando o token estiver disponível
  if (connectToken) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PluggyConnectWrapper
          connectToken={connectToken}
          onSuccess={handleSuccess}
          onError={() => {
            showToast('Erro no Pluggy Connect', 'error')
            setConnectToken(null)
          }}
          onClose={() => setConnectToken(null)}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Status da conexão */}
      <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{itemIds.length > 0 ? '🟢' : '🔴'}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {itemIds.length > 0
              ? `${itemIds.length} conexão(ões) ativa(s)`
              : 'Nenhuma conta conectada'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {itemIds.length > 0
              ? 'Clique em "Sincronizar" para atualizar os dados do banco'
              : 'Clique em "Nova conexão" para vincular seu banco'}
          </div>
        </div>
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {/* Botão principal: Sincronizar (só aparece se já tem conexão) */}
        {itemIds.length > 0 && (
          <button
            className="sync-btn"
            onClick={handleSync}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Sincronizar
              </>
            )}
          </button>
        )}

        {/* Botão: Nova conexão */}
        <button
          onClick={handleNewConnection}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 'var(--radius-md)',
            background: 'transparent',
            border: '1.5px solid var(--color-accent)',
            color: 'var(--color-accent)',
            fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
          }}
        >
          <PlusCircle size={17} />
          {itemIds.length > 0 ? 'Adicionar banco' : 'Nova conexão'}
        </button>

        {/* Botão: Remover conexões */}
        {itemIds.length > 0 && (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1.5px solid var(--color-danger, #EF4444)',
              color: 'var(--color-danger, #EF4444)',
              fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
            }}
          >
            <Link2Off size={17} />
            Desconectar
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12, lineHeight: 1.5 }}>
        Após a primeira conexão, use o botão <strong>Sincronizar</strong> para atualizar os dados sem precisar reconectar.
      </p>
    </div>
  )
}
