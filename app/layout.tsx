import type { Metadata } from 'next'
import './globals.css'
import { AppLayout } from '@/components/layout/AppLayout'

export const metadata: Metadata = {
  title: 'Despezas – Controle Financeiro Pessoal',
  description: 'Gerencie suas finanças pessoais com inteligência. Acompanhe receitas, despesas, cartões e muito mais.',
  keywords: 'finanças pessoais, controle financeiro, gastos, orçamento',
  openGraph: {
    title: 'Despezas',
    description: 'Controle financeiro pessoal inteligente',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  )
}
