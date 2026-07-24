'use client'

import { useState } from 'react'
import { RefreshCw, Wifi } from 'lucide-react'
import { syncWithPluggy } from '@/lib/pluggy'
import { useToast } from '@/components/ui/Toast'

interface PluggySyncButtonProps {
  onSynced?: () => void
}

export function PluggySyncButton({ onSynced }: PluggySyncButtonProps) {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleSync = async () => {
    setLoading(true)
    try {
      const result = await syncWithPluggy()
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

  return (
    <div>
      <button className="sync-btn" onClick={handleSync} disabled={loading}>
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
