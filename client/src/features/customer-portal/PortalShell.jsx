import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { PortalSidebar } from './PortalSidebar'
import { Topbar } from '../../components/layout/Topbar'

export function PortalShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-[#eef3fb]">
      <PortalSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-enter flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
