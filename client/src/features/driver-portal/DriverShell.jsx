import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { DriverSidebar } from './DriverSidebar'
import { Topbar } from '../../components/layout/Topbar'

export function DriverShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-[#eef3fb]">
      <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-enter flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
