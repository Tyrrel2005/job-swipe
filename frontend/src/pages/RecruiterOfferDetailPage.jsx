import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import api from '../services/api'

function RecruiterOfferDetailPage() {
  const { user, isLoading: isSessionLoading } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [offer, setOffer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'recruiter') return

    api.get(`/api/jobs/${id}`)
      .then((response) => setOffer(response.data.jobOffer))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Impossible de charger cette offre.'))
      .finally(() => setIsLoading(false))
  }, [id, user])

  if (isSessionLoading) return <main className="loading-state">Chargement de votre session…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'recruiter') return <Navigate replace to="/dashboard" />

  return (
    <main className="recruiter-dashboard">
      <button className="back-link plain-button offer-back" onClick={() => navigate('/dashboard')} type="button">Retour à mes offres</button>
      {isLoading && <p className="empty-state">Chargement de l’offre…</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {offer && (
        <article className="recruiter-offer-detail">
          <div className="offer-detail-topline">
            <span className={offer.status === 'published' ? 'published-badge' : 'closed-badge'}>{offer.status === 'published' ? 'Offre publiée' : 'Offre fermée'}</span>
            <span className="recruiter-detail-date">{offer.city} · {offer.remoteMode}</span>
          </div>
          <p className="eyebrow recruiter-eyebrow">Présentation de l’offre</p>
          <h1>{offer.title}</h1>
          <p className="recruiter-detail-contract">{offer.contractType} · {offer.salaryMin || 0} - {offer.salaryMax || 0} €</p>
          <div className="recruiter-detail-grid">
            <section className="offer-detail-section"><h2>Niveau d’études minimum</h2><p>{offer.minimumDegree || 'Non précisé'}</p></section>
            <section className="offer-detail-section"><h2>Candidats intéressés</h2><p>Les profils ayant manifesté leur intérêt seront disponibles dans la prochaine section recruteur.</p></section>
          </div>
          <section className="offer-detail-section"><h2>Compétences requises</h2><div className="offer-skills">{(offer.requiredSkills || []).map((skill) => <span key={skill}>{skill}</span>)}</div></section>
          <section className="offer-detail-section"><h2>Langues attendues</h2><div className="offer-skills">{(offer.requiredLanguages || []).map((language) => <span key={language.name}>{language.name} · {language.level}</span>)}</div></section>
          <section className="offer-detail-section"><h2>Description du poste</h2><p>{offer.description || 'Aucune description fournie.'}</p></section>
        </article>
      )}
    </main>
  )
}

export default RecruiterOfferDetailPage