import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

import { useAuth } from '../context/useAuth'
import api from '../services/api'
import { getToken } from '../services/authStorage'

function NotificationsPage() {
  const { user, isLoading: isSessionLoading } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return undefined

    api.get('/api/notifications?limit=100')
      .then((response) => {
        setNotifications((currentNotifications) => {
          const serverNotifications = response.data.notifications || []
          const serverIds = new Set(serverNotifications.map((notification) => notification._id))
          return [...currentNotifications.filter((notification) => !serverIds.has(notification._id)), ...serverNotifications]
        })
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Impossible de charger les notifications.'))
      .finally(() => setIsLoading(false))

    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      auth: { token: getToken() },
    })
    socket.on('notification:new', (notification) => {
      setNotifications((currentNotifications) => currentNotifications.some((item) => item._id === notification._id)
        ? currentNotifications
        : [notification, ...currentNotifications])
    })
    socket.on('connect_error', () => setError('Les notifications temps réel sont indisponibles.'))

    return () => socket.disconnect()
  }, [user])

  if (isSessionLoading) return <main className="loading-state">Chargement de votre session…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />

  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  async function markAsRead(notificationId) {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`)
      setNotifications((currentNotifications) => currentNotifications.map((notification) => notification._id === notificationId
        ? { ...notification, readAt: new Date().toISOString() }
        : notification))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Impossible de marquer la notification comme lue.')
    }
  }

  async function markAllAsRead() {
    try {
      await api.patch('/api/notifications/read-all')
      setNotifications((currentNotifications) => currentNotifications.map((notification) => ({ ...notification, readAt: notification.readAt || new Date().toISOString() })))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Impossible de marquer les notifications comme lues.')
    }
  }

  return (
    <main className="notifications-shell">
      <header className="notifications-header">
        <button className="back-link plain-button" onClick={() => navigate('/dashboard')} type="button">Retour</button>
        <strong className="auth-brand">Notifications</strong>
        <span className="offer-count">{unreadCount}</span>
      </header>
      <section className="notifications-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Activité</p>
            <h1>Vos notifications</h1>
          </div>
          <button className="secondary-action notification-action" disabled={!unreadCount} onClick={markAllAsRead} type="button">Tout lire</button>
        </div>
        {isLoading && <p className="empty-state">Chargement des notifications…</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {!isLoading && !error && notifications.length === 0 && <p className="empty-state">Vous n’avez aucune notification.</p>}
        <div className="notification-list">
          {notifications.map((notification) => (
            <article className={notification.readAt ? 'notification-item read' : 'notification-item'} key={notification._id}>
              <div className="notification-dot" aria-hidden="true" />
              <div className="notification-content">
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
                <small>{new Date(notification.createdAt).toLocaleString('fr-FR')}</small>
              </div>
              {!notification.readAt && <button className="notification-read" onClick={() => markAsRead(notification._id)} type="button">Marquer lu</button>}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default NotificationsPage