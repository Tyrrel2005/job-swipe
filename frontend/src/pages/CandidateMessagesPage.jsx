import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'

import { useAuth } from '../context/useAuth'
import BottomNav from '../components/BottomNav'
import api from '../services/api'
import { getToken } from '../services/authStorage'

function getConversationContact(conversation, user) {
  const participant = conversation?.participantIds?.find((item) => String(item?._id || item) !== String(user?.id))
  const profile = participant?.role === 'recruiter' ? participant.recruiterProfile : participant?.candidateProfile
  const name = participant?.role === 'recruiter'
    ? profile?.recruiterName || profile?.companyName || 'Votre recruteur'
    : [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Votre candidat'

  return {
    name,
    role: participant?.role === 'recruiter' ? 'Recruteur' : 'Candidat',
    initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
  }
}

function CandidateMessagesPage() {
  const { user, isLoading: isSessionLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const socketRef = useRef(null)
  const joinedConversationRef = useRef(null)
  const selectedConversationRef = useRef(null)
  const messageRequestRef = useRef(0)

  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  useEffect(() => {
    if (!user) return undefined

    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      auth: { token: getToken() },
    })
    socketRef.current = socket

    socket.on('connect_error', () => setError('Connexion temps réel indisponible. La messagerie HTTP reste active.'))
    socket.on('message:new', (message) => {
      if (String(message.conversationId) !== String(selectedConversationRef.current?._id)) return
      setMessages((current) => current.some((m) => m._id === message._id) ? current : [...current, message])
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      joinedConversationRef.current = null
    }
  }, [user])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !selectedConversation) return

    if (joinedConversationRef.current) {
      socket.emit('conversation:leave', { conversationId: joinedConversationRef.current })
    }

    socket.emit('conversation:join', { conversationId: selectedConversation._id }, (response) => {
      if (!response?.success) {
        setError(response?.message || 'Impossible de rejoindre cette conversation en temps réel.')
        return
      }
      joinedConversationRef.current = selectedConversation._id
      socket.emit('conversation:read', { conversationId: selectedConversation._id })
    })
  }, [selectedConversation])

  useEffect(() => {
    if (!user) return

    api.get('/api/conversations')
      .then((response) => {
        const loaded = response.data.conversations || []
        setConversations(loaded)
        const requestedId = searchParams.get('conversation')
        const initial = loaded.find((c) => c._id === requestedId) || loaded[0]
        if (initial) {
          setMessages([])
          setIsMessagesLoading(true)
          setSelectedConversation(initial)
        }
      })
      .catch((e) => setError(e.response?.data?.message || 'Impossible de charger vos conversations.'))
      .finally(() => setIsLoading(false))
  }, [searchParams, user])

  useEffect(() => {
    if (!selectedConversation) return

    const requestId = messageRequestRef.current + 1
    messageRequestRef.current = requestId

    api.get(`/api/conversations/${selectedConversation._id}/messages`)
      .then((response) => {
        if (requestId === messageRequestRef.current) setMessages(response.data.messages || [])
      })
      .then(() => api.patch(`/api/conversations/${selectedConversation._id}/read`))
      .catch((e) => {
        if (requestId === messageRequestRef.current) setError(e.response?.data?.message || 'Impossible de charger les messages.')
      })
      .finally(() => {
        if (requestId === messageRequestRef.current) setIsMessagesLoading(false)
      })
  }, [selectedConversation])

  if (isSessionLoading) return <main className="loading-state">Chargement de votre session…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />

  function selectConversation(conversation) {
    setMessages([])
    setIsMessagesLoading(true)
    setSelectedConversation(conversation)
    setSearchParams({ conversation: conversation._id })
    setError('')
  }

  async function sendMessage(event) {
    event.preventDefault()
    const content = messageText.trim()
    if (!content || !selectedConversation) return

    setIsSending(true)
    setError('')

    try {
      const response = await api.post(`/api/conversations/${selectedConversation._id}/messages`, { content })
      setMessages((current) => current.some((m) => m._id === response.data.data._id)
        ? current
        : [...current, response.data.data])
      setMessageText('')
    } catch (e) {
      setError(e.response?.data?.message || "Impossible d'envoyer le message.")
    } finally {
      setIsSending(false)
    }
  }

  async function clearMessages() {
    if (!selectedConversation || !window.confirm('Supprimer tous les messages de cette conversation ?')) return

    try {
      await api.delete(`/api/conversations/${selectedConversation._id}/messages`)
      setMessages([])
      setError('')
    } catch (e) {
      setError(e.response?.data?.message || 'Impossible de supprimer les messages.')
    }
  }

  const contact = selectedConversation ? getConversationContact(selectedConversation, user) : null

  return (
    <main className="messages-shell">
      <header className="messages-header">
        <button
          aria-label="Retour au dashboard"
          className="back-link plain-button messages-back"
          onClick={() => navigate('/dashboard')}
          type="button"
        >
          ‹
        </button>
        <strong className="auth-brand">Messagerie</strong>
        <span />
      </header>

      <div className={selectedConversation ? 'messages-layout has-selection' : 'messages-layout'}>

        {/* Sidebar */}
        <aside className="conversation-list">
          <div className="conversation-list-heading">
            <div>
              <p className="eyebrow">Vos échanges</p>
              <h1>Conversations</h1>
            </div>
            <span className="conversation-count">{conversations.length}</span>
          </div>
          {isLoading && <p className="empty-state">Chargement…</p>}
          {!isLoading && conversations.length === 0 && (
            <p className="empty-state">Aucune conversation ouverte.</p>
          )}
          {conversations.map((conversation) => {
            const c = getConversationContact(conversation, user)
            return (
              <button
                className={selectedConversation?._id === conversation._id ? 'conversation-item selected' : 'conversation-item'}
                key={conversation._id}
                onClick={() => selectConversation(conversation)}
                type="button"
              >
                <span className="conversation-avatar">{c.initials}</span>
                <span className="conversation-copy">
                  <strong>{c.name}</strong>
                  <small>{conversation.matchId?.jobOfferId?.title || 'Match professionnel'}</small>
                </span>
                <span className="conversation-chevron">›</span>
              </button>
            )
          })}
        </aside>

        {/* Chat panel */}
        <section aria-labelledby="chat-title" className="chat-panel">
          {!selectedConversation && (
            <div className="empty-state">Sélectionnez une conversation pour commencer.</div>
          )}
          {selectedConversation && contact && (
            <>
              {/* Header */}
              <div className="chat-heading">
                <div className="chat-contact">
                  <span className="chat-avatar">{contact.initials}</span>
                  <div>
                    <h2 id="chat-title">{contact.name}</h2>
                    <p className="chat-contact-role">{contact.role}</p>
                  </div>
                </div>
                <button
                  aria-label="Supprimer les messages"
                  className="clear-messages-button"
                  onClick={clearMessages}
                  type="button"
                >
                  🗑
                </button>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {isMessagesLoading && <p className="empty-state">Chargement des messages…</p>}
                {!isMessagesLoading && messages.length === 0 && (
                  <p className="empty-state">Aucun message. Envoyez le premier.</p>
                )}
                {messages.map((message) => {
                  const senderId = typeof message.senderId === 'object' ? message.senderId?._id : message.senderId
                  const isOwn = senderId
                    ? String(senderId) === String(user.id)
                    : message.senderRole === user.role
                  const label = isOwn ? 'Vous' : message.senderRole === 'recruiter' ? 'Recruteur' : 'Candidat'
                  return (
                    <div className={isOwn ? 'chat-message-row own' : 'chat-message-row'} key={message._id}>
                      <span className="chat-sender-label">{label}</span>
                      <p className={isOwn ? 'chat-bubble own' : 'chat-bubble'}>{message.content}</p>
                      <time dateTime={message.createdAt}>
                        {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                  )
                })}
              </div>

              {/* Compose */}
              <form className="chat-compose" onSubmit={sendMessage}>
                <input
                  maxLength="5000"
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Écrivez votre message…"
                  value={messageText}
                />
                <button
                  aria-label="Envoyer"
                  className="primary-action compose-send"
                  disabled={isSending || !messageText.trim()}
                  type="submit"
                >
                  ➤
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {error && <p className="auth-error message-error" role="alert">{error}</p>}
      <BottomNav />
    </main>
  )
}

export default CandidateMessagesPage
