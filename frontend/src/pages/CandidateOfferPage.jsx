import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import api from '../services/api'

function CandidateOfferPage() {
  const { user, isLoading: isSessionLoading } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [offer, setOffer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'candidate') return

    api.get(`/api/jobs/${id}`)
      .then((response) => setOffer(response.data.jobOffer))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Impossible de charger cette offre.'))
      .finally(() => setIsLoading(false))
  }, [id, user])

  if (isSessionLoading) return <main className="loading-state">Chargement de votre session…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'candidate') return <Navigate replace to="/dashboard" />

  async function applyToOffer() {
    try {
      await api.post(`/api/matches/offers/${id}`)
      setFeedback('Votre intérêt a été envoyé au recruteur.')
    } catch (requestError) {
      setFeedback(requestError.response?.data?.message || 'Impossible d’envoyer votre candidature.')
    }
  }

  return (
    <main className="candidate-dashboard">
      <button className="back-link plain-button offer-back" onClick={() => navigate('/dashboard')} type="button">Retour aux offres</button>
      {isLoading && <p className="empty-state">Chargement de l’offre…</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {offer && (
        <article className="offer-detail-card">
          <div className="offer-card-topline">
            <span className="company-avatar">{offer.recruiterId?.toString().slice(-2) || 'JS'}</span>
            <span className="match-score">{offer.compatibilityScore ?? 0}% match</span>
          </div>
          <p className="eyebrow offer-detail-eyebrow">Offre publiée</p>
          <h1>{offer.title}</h1>
          <p className="offer-meta">{offer.city} · {offer.remoteMode} · {offer.contractType}</p>
          <p className="offer-salary">{offer.salaryMin || 0} - {offer.salaryMax || 0} €</p>
          <div className="offer-detail-section">
            <h2>Compétences recherchées</h2>
            <div className="offer-skills">{(offer.requiredSkills || []).map((skill) => <span key={skill}>{skill}</span>)}</div>
          </div>
          <div className="offer-detail-section">
            <h2>Formation minimale</h2>
            <p>{offer.minimumDegree || 'Non précisée'}</p>
          </div>
          <div className="offer-detail-section">
            <h2>Description</h2>
            <p>{offer.description || 'Aucune description fournie.'}</p>
          </div>
          {feedback && <p className="feedback-message" role="status">{feedback}</p>}
          <button className="primary-action offer-action" onClick={applyToOffer} type="button">Manifester mon intérêt</button>
        </article>
      )}
    </main>
  )
}

export default CandidateOfferPage