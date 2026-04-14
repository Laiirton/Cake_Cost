import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cake Cost - Gestão de Confeitaria',
  description: 'Dashboard profissional para gerenciamento de confeitaria. Controle receitas, pedidos, clientes, custos e muito mais.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
