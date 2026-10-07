import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import api from '../services/api'

function RecruiterMatchesPage() {
  const { user, isLoading: isSessionLoading } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'recruiter') return

    api.get('/api/matches')
      .then((response) => setMatches(response.data.matches || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Impossible de charger vos matchs.'))
      .finally(() => setIsLoading(false))
  }, [user])

  if (isSessionLoading) return <main className="loading-state">Chargement de votre session…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'recruiter') return <Navigate replace to="/dashboard" />

  const acceptedMatches = matches.filter((match) => match.status === 'accepted')
  const pendingMatches = matches.filter((match) => match.status === 'pending')
  const rejectedMatches = matches.filter((match) => match.status === 'rejected')

  async function openConversation(matchId) {
    try {
      const response = await api.post(`/api/conversations/matches/${matchId}`)
      navigate(`/messages?conversation=${response.data.conversation._id}`)
    } catch {
      navigate('/messages')
    }
  }

  function renderMatches(items, emptyText) {
    if (items.length === 0) return <p className="empty-state">{emptyText}</p>

    return <div className="match-list">{items.map((match) => {
      const candidate = match.candidateId?.candidateProfile
      return (
        <article className="match-card" key={match._id}>
          <div className="offer-card-topline"><span className="company-avatar">{candidate?.firstName?.slice(0, 1) || 'C'}</span><span className="match-score">{match.compatibilityScore ?? 0}% match</span></div>
          <h2>{candidate?.firstName || match.candidateId?.email || 'Candidat'}</h2>
          <p className="offer-meta">{candidate?.title || 'Profil candidat'} · {match.jobOfferId?.title || 'Offre associée'}</p>
          <p className="offer-meta">{candidate?.location || 'Localisation non précisée'}</p>
          {match.status === 'accepted' && <button className="primary-action offer-action" onClick={() => openConversation(match._id)} type="button">Ouvrir la conversation</button>}
        </article>
      )
    })}</div>
  }

  return (
    <main className="recruiter-dashboard">
      <button className="back-link plain-button offer-back" onClick={() => navigate('/dashboard')} type="button">Retour au dashboard</button>
      <header className="recruiter-dashboard-header candidates-heading"><div><p className="eyebrow recruiter-eyebrow">Console recruteur</p><h1>Mes matchs</h1><p>{acceptedMatches.length} conversation{acceptedMatches.length > 1 ? 's' : ''} ouverte{acceptedMatches.length > 1 ? 's' : ''}</p></div></header>
      {isLoading && <p className="empty-state">Chargement de vos matchs…</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {!isLoading && !error && <div className="matches-sections recruiter-matches-sections"><section><div className="section-heading"><h2>Matchs confirmés</h2><span className="offer-count">{acceptedMatches.length}</span></div>{renderMatches(acceptedMatches, 'Aucun match confirmé.')}</section><section><div className="section-heading"><h2>En attente</h2><span className="offer-count">{pendingMatches.length}</span></div>{renderMatches(pendingMatches, 'Aucune candidature en attente.')}</section>{rejectedMatches.length > 0 && <section><div className="section-heading"><h2>Refusés</h2><span className="offer-count">{rejectedMatches.length}</span></div>{renderMatches(rejectedMatches, 'Aucun refus.')}</section>}</div>}
    </main>
  )
}

export default RecruiterMatchesPage