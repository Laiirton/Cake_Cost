'use client'

import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />
        {children}
      </div>
    </>
  )
}
