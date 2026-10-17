import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { api, token } from '../lib/api';
import { fullName } from '../lib/format';
import { Avatar, Banner, Icon, Spinner } from '../components/UI';

export default function Chat() {
  const { id, matchId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    async function load() {
      try {
        const resource = matchId
          ? await api.post(`/conversations/matches/${matchId}`)
          : { conversation: { _id: id } };
        const cid = resource.conversation._id;

        const [messagesData, conversationsData] = await Promise.all([
          api.get(`/conversations/${cid}/messages`),
          api.get('/conversations'),
        ]);
        if (!active) return;

        const meta = conversationsData.conversations?.find(c => c._id === cid) || resource.conversation;
        setConversation(meta);
        setMessages(messagesData.messages || []);
        await api.patch(`/conversations/${cid}/read`, {}).catch(() => {});

        if (!active) return;

        const socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
          auth: { token: token() },
          transports: ['websocket', 'polling'],
          autoConnect: true,
        });
        socketRef.current = socket;
        socket._jobswipeConversationId = cid;

        socket.on('connect', () => {
          setConnected(true);
          socket.emit('conversation:join', { conversationId: cid }, ack => {
            if (ack?.success) socket.emit('conversation:read', { conversationId: cid });
          });
        });
        socket.on('disconnect', () => setConnected(false));
        socket.on('message:new', msg => {
          if (String(msg.conversationId) === String(cid)) {
            setMessages(list =>
              list.some(m => String(m._id) === String(msg._id)) ? list : [...list, msg]
            );
          }
        });
        socket.on('message:error', e => setError(e.message || 'Erreur de messagerie.'));
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        socket.emit('conversation:leave', { conversationId: socket._jobswipeConversationId });
        socket.disconnect();
      }
    };
  }, [id, matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const peer = (conversation?.participantIds || []).find(p => String(p._id) !== String(user.id));
  const name = peer?.role === 'candidate'
    ? fullName(peer.candidateProfile)
    : peer?.recruiterProfile?.recruiterName || peer?.email || 'Votre interlocuteur';

  async function send(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || !conversation || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await api.post(`/conversations/${conversation._id}/messages`, { content: value });
      setMessages(list =>
        list.some(m => String(m._id) === String(res.data._id)) ? list : [...list, res.data]
      );
      setText('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  async function clear() {
    if (!window.confirm('Supprimer tous les messages de cette conversation pour les deux participants ?')) return;
    try {
      await api.delete(`/conversations/${conversation._id}/messages`);
      setMessages([]);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="chat-page">
      <header className="page-header">
        <button type="button" className="icon-btn" aria-label="Retour" onClick={() => nav(user.role === 'candidate' ? '/candidate/matches' : '/recruiter/matches')}>
          <Icon name="arrow_back" />
        </button>
        <Avatar name={name} size="sm" />
        <div className="page-heading">
          <strong style={{ fontSize: 15 }}>{name}</strong>
          <span className="small" style={{ color: connected ? '#006c49' : '#687289' }}>
            {connected ? 'Temps réel connecté' : 'En mode HTTP'}
          </span>
        </div>
        <button className="icon-btn" title="Effacer les messages" aria-label="Effacer les messages" onClick={clear}>
          <Icon name="more_vert" />
        </button>
      </header>

      <div className="chat-subtitle">🔒 Conversation privée ouverte après un match accepté.</div>

      {error && <div style={{ padding: '10px 15px' }}><Banner kind="error">{error}</Banner></div>}

      {loading ? <Spinner /> : (
        <div className="chat-history">
          <div className="card" style={{ textAlign: 'center' }}>
            <Icon name="handshake" className="text-green" size={31} />
            <strong style={{ display: 'block' }}>Match confirmé</strong>
            <p className="small muted">Vos échanges sont privés.</p>
          </div>
          {messages.map(m => {
            const isMe = m.senderRole
              ? m.senderRole === user.role
              : String(m.senderId?._id ?? m.senderId) === String(user.id);
            return (
              <div className={`bubble ${isMe ? 'me' : 'other'}`} key={m._id}>
                {m.content}
                <time>{new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>
              </div>
            );
          })}
          <span ref={bottomRef} />
        </div>
      )}

      <form className="chat-send" onSubmit={send}>
        <input
          className="field"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={5000}
          placeholder="Écrivez votre message…"
          disabled={loading || !conversation}
        />
        <button type="submit" disabled={sending || !text.trim() || !conversation} aria-label="Envoyer le message">
          <Icon name="send" />
        </button>
      </form>
    </div>
  );
}
