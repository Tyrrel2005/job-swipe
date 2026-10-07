import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

import api from '../services/api'
import { getToken } from '../services/authStorage'

function NotificationButton({ onClick }) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let isActive = true

    api.get('/api/notifications?unreadOnly=true&limit=100')
      .then((response) => {
        if (isActive) setUnreadCount((response.data.notifications || []).length)
      })
      .catch(() => {
        if (isActive) setUnreadCount(0)
      })

    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      auth: { token: getToken() },
    })
    socket.on('notification:new', () => setUnreadCount((count) => count + 1))

    return () => {
      isActive = false
      socket.disconnect()
    }
  }, [])

  return <button className="secondary-action notification-dashboard-button" onClick={onClick} type="button">Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}</button>
}

export default NotificationButton