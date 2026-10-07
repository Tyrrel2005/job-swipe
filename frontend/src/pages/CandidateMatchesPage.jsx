import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import api from '../services/api'

function MatchCard({ match }) {
  const navigate = useNavigate()
  const offer = match.jobOfferId
  const statusLabel = {
    pending: 'En attente de décision',
    accepted: 'Match confirmé',
    rejected: 'Candidature refusée',
  }[match.status]

  async function openConversation() {
    try {
      const response = await api.post(`/api/conversations/matches/${match._id}`)
      navigate(`/messages?conversation=${response.data.conversation._id}`)
    } catch {
      navigate('/messages')
    }
  }

  return (
    <article className="match-card">
      <div className="offer-card-topline">
        <span className="company-avatar">{offer?.title?.slice(0, 2).toUpperCase() || 'JS'}</span>
        <span className={match.status === 'accepted' ? 'match-score' : 'match-status'}>{statusLabel}</span>
      </div>
      <h2>{offer?.title || 'Offre indisponible'}</h2>
      <p className="offer-meta">{offer?.city || 'Ville non précisée'} · {offer?.contractType || 'Contrat non précisé'}</p>
      <div className="match-card-footer">
        <span className="match-compatibility">{match.compatibilityScore ?? 0}% compatibilité</span>
        {match.status === 'accepted' && <button className="chat-ready chat-button" onClick={openConversation} type="button">Ouvrir la conversation</button>}
      </div>
    </article>
  )
}

function CandidateMatchesPage() {
  const { user, isLoading: isSessionLoading } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'candidate') return

    api.get('/api/matches')
      .then((response) => setMatches(response.data.matches || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Impossible de charger vos candidatures.'))
      .finally(() => setIsLoading(false))
  }, [user])

  if (isSessionLoading) return <main className="loading-state">Chargement de votre session…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'candidate') return <Navigate replace to="/dashboard" />

  const pendingMatches = matches.filter((match) => match.status === 'pending')
  const acceptedMatches = matches.filter((match) => match.status === 'accepted')
  const rejectedMatches = matches.filter((match) => match.status === 'rejected')

  return (
    <main className="candidate-dashboard">
      <button className="back-link plain-button offer-back" onClick={() => navigate('/dashboard')} type="button">Retour au dashboard</button>
      <header className="dashboard-header matches-heading">
        <div>
          <p className="eyebrow">Candidat</p>
          <h1>Mes candidatures</h1>
        </div>
        <span className="offer-count">{matches.length}</span>
      </header>
      {isLoading && <p className="empty-state">Chargement de vos candidatures…</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {!isLoading && !error && matches.length === 0 && <p className="empty-state">Vous n’avez pas encore manifesté d’intérêt pour une offre.</p>}
      {!isLoading && !error && (
        <div className="matches-sections">
          <section>
            <div className="section-heading"><h2>Matchs confirmés</h2><span className="offer-count">{acceptedMatches.length}</span></div>
            <div className="match-list">{acceptedMatches.map((match) => <MatchCard key={match._id} match={match} />)}</div>
          </section>
          <section>
            <div className="section-heading"><h2>En attente</h2><span className="offer-count">{pendingMatches.length}</span></div>
            <div className="match-list">{pendingMatches.map((match) => <MatchCard key={match._id} match={match} />)}</div>
          </section>
          {rejectedMatches.length > 0 && (
            <section>
              <div className="section-heading"><h2>Refusées</h2><span className="offer-count">{rejectedMatches.length}</span></div>
              <div className="match-list">{rejectedMatches.map((match) => <MatchCard key={match._id} match={match} />)}</div>
            </section>
          )}
        </div>
      )}
    </main>
  )
}

export default CandidateMatchesPage