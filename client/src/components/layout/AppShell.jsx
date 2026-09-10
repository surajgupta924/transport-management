import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { getSocket, disconnectSocket } from '../../lib/socket'
import { apiSlice } from '../../app/apiSlice'
import { tokenStorage } from '../../lib/tokenStorage'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!tokenStorage.getAccess()) return undefined
    const socket = getSocket()
    socket.connect()
    const onNotification = () => {
      dispatch(apiSlice.util.invalidateTags(['Notifications']))
    }
    socket.on('notification:new', onNotification)
    return () => {
      socket.off('notification:new', onNotification)
      disconnectSocket()
    }
  }, [dispatch])

  return (
    <div className="flex min-h-svh bg-[#eef3fb]">
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
