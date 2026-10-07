import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import api from '../services/api'

function RecruiterCandidatesPage() {
  const { user, isLoading: isSessionLoading } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [candidateProfile, setCandidateProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'recruiter') return

    api.get('/api/matches')
      .then((response) => {
        const loadedMatches = response.data.matches || []
        setMatches(loadedMatches)
        if (loadedMatches[0]) setSelectedMatch(loadedMatches[0])
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Impossible de charger les candidats intéressés.'))
      .finally(() => setIsLoading(false))
  }, [user])

  useEffect(() => {
    if (!selectedMatch) return

    api.get(`/api/matches/${selectedMatch._id}/candidate-profile`)
      .then((response) => setCandidateProfile(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Impossible de charger le profil candidat.'))
      .finally(() => setIsProfileLoading(false))
  }, [selectedMatch])

  if (isSessionLoading) return <main className="loading-state">Chargement de votre session…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'recruiter') return <Navigate replace to="/dashboard" />

  const pendingMatches = matches.filter((match) => match.status === 'pending')

  async function updateStatus(status) {
    if (!selectedMatch) return

    try {
      const response = await api.patch(`/api/matches/${selectedMatch._id}/status`, { status })
      setMatches(matches.map((match) => match._id === selectedMatch._id ? response.data.match : match))
      setSelectedMatch({ ...selectedMatch, status })
      setCandidateProfile({ ...candidateProfile, status })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Impossible de traiter cette candidature.')
    }
  }

  async function downloadFile(kind) {
    if (!selectedMatch) return

    try {
      const response = await api.get(`/api/matches/${selectedMatch._id}/candidate-${kind}`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = kind === 'cv' ? 'cv-candidat.pdf' : 'photo-candidat'
      link.click()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Impossible de télécharger le ${kind}.`)
    }
  }

  const candidate = candidateProfile?.candidate?.candidateProfile

  return (
    <main className="recruiter-dashboard">
      <button className="back-link plain-button offer-back" onClick={() => navigate('/dashboard')} type="button">Retour au dashboard</button>
      <header className="recruiter-dashboard-header candidates-heading">
        <div>
          <p className="eyebrow recruiter-eyebrow">Console recruteur</p>
          <h1>Candidats intéressés</h1>
          <p>{pendingMatches.length} candidature{pendingMatches.length > 1 ? 's' : ''} en attente</p>
        </div>
      </header>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {isLoading && <p className="empty-state">Chargement des candidats…</p>}
      {!isLoading && matches.length === 0 && <p className="empty-state">Aucun candidat n’a encore manifesté son intérêt.</p>}
      {!isLoading && matches.length > 0 && (
        <div className="candidates-layout">
          <aside className="candidate-list">
            {matches.map((match) => (
              <button className={selectedMatch?._id === match._id ? 'candidate-list-item selected' : 'candidate-list-item'} key={match._id} onClick={() => { setSelectedMatch(match); setError('') }} type="button">
                <span className="company-avatar">{match.candidateId?.candidateProfile?.firstName?.slice(0, 1) || 'C'}</span>
                <span><strong>{match.candidateId?.candidateProfile?.firstName || match.candidateId?.email || 'Candidat'}</strong><small>{match.jobOfferId?.title || 'Offre associée'}</small></span>
                <em>{match.compatibilityScore ?? 0}%</em>
              </button>
            ))}
          </aside>
          <section className="candidate-detail-card">
            {isProfileLoading && <p className="empty-state">Chargement du profil…</p>}
            {!isProfileLoading && candidate && (
              <>
                <div className="candidate-detail-header"><div className="candidate-large-avatar">{candidate.firstName?.slice(0, 1)}{candidate.lastName?.slice(0, 1)}</div><div><p className="eyebrow recruiter-eyebrow">{candidateProfile.status === 'pending' ? 'À examiner' : 'Candidature traitée'}</p><h2>{candidate.firstName} {candidate.lastName}</h2><p>{candidate.title} · {candidate.experience}</p></div></div>
                <div className="candidate-facts"><span>{candidate.location || 'Localisation non précisée'}</span><span>{candidate.availability || 'Disponibilité non précisée'}</span><span>{candidate.salaryMin || 0} - {candidate.salaryMax || 0} €</span></div>
                <section className="offer-detail-section"><h3>Compétences</h3><div className="offer-skills">{(candidate.skills || []).map((skill) => <span key={skill}>{skill}</span>)}</div></section>
                <section className="offer-detail-section"><h3>À propos</h3><p>{candidate.bio || 'Aucune présentation renseignée.'}</p></section>
                <div className="candidate-actions"><button className="secondary-action" onClick={() => downloadFile('photo')} type="button">Télécharger la photo</button><button className="secondary-action" onClick={() => downloadFile('cv')} type="button">Consulter le CV</button></div>
                {candidateProfile.status === 'pending' && <div className="candidate-decision"><button className="reject-action" onClick={() => updateStatus('rejected')} type="button">Refuser</button><button className="accept-action" onClick={() => updateStatus('accepted')} type="button">Accepter et matcher</button></div>}
                {candidateProfile.status === 'accepted' && <p className="feedback-message">Match accepté. La conversation est ouverte.</p>}
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default RecruiterCandidatesPage