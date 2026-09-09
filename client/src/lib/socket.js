import { io } from 'socket.io-client'
import { tokenStorage } from './tokenStorage'

let socket

export function getSocket() {
  if (socket) return socket
  const url = import.meta.env.VITE_SOCKET_URL || undefined
  socket = io(url || '/', {
    path: '/socket.io',
    autoConnect: false,
    auth: (cb) => cb({ token: tokenStorage.getAccess() }),
    transports: ['websocket', 'polling'],
  })
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
