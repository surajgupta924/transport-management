import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.08),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-enter flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
