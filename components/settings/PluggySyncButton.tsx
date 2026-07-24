'use client'

import { useState } from 'react'
import { RefreshCw, Wifi } from 'lucide-react'
import { syncWithPluggy, getConnectToken } from '@/lib/pluggy'
import { useToast } from '@/components/ui/Toast'
import dynamic from 'next/dynamic'

// PluggyConnect usually requires client-side rendering and references window
const PluggyConnectWrapper = dynamic(() => import('./PluggyConnectWrapper'), { ssr: false })

interface PluggySyncButtonProps {
  onSynced?: () => void
}

export function PluggySyncButton({ onSynced }: PluggySyncButtonProps) {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const [connectToken, setConnectToken] = useState<string | null>(null)

  const handleStartConnect = async () => {
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

  const handleSuccess = async (itemData: any) => {
    setConnectToken(null) // Close widget
    setLoading(true)
    showToast('Conexão feita! Importando transações...', 'success')
    try {
      const result = await syncWithPluggy(itemData.item.id)
      if (result.error) {
        showToast(`Erro na sincronização: ${result.error}`, 'error')
      } else {
        showToast(`✅ Sincronizado com sucesso! ${result.synced} transações importadas.`, 'success')
        onSynced?.()
      }
    } catch (err) {
      showToast('Erro inesperado ao sincronizar com Pluggy.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (connectToken) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PluggyConnectWrapper
          connectToken={connectToken}
          onSuccess={handleSuccess}
          onError={(err) => {
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
      <button className="sync-btn" onClick={handleStartConnect} disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" />
            Sincronizando com Pluggy...
          </>
        ) : (
          <>
            <Wifi size={22} />
            Sincronizar com Meu Pluggy
          </>
        )}
      </button>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 10, lineHeight: 1.5 }}>
        Conecte sua conta ao Open Finance e importe automaticamente seus extratos bancários e faturas de cartão.
      </p>
    </div>
  )
}
