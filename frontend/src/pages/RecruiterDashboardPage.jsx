import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import NotificationButton from '../components/NotificationButton'
import api from '../services/api'

function RecruiterDashboardPage() {
  const { user, isLoading: isSessionLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [offers, setOffers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'recruiter') return

    api.get('/api/jobs')
      .then((response) => setOffers(response.data.jobOffers || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Impossible de charger vos offres.'))
      .finally(() => setIsLoading(false))

  }, [user])

  if (isSessionLoading) return <main className="loading-state">Chargement de votre session…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'recruiter') return <Navigate replace to="/dashboard" />

  return (
    <main className="recruiter-dashboard">
      <header className="recruiter-dashboard-header">
        <div>
          <p className="eyebrow recruiter-eyebrow">Recruteur</p>
          <h1>{user.recruiterProfile?.companyName || 'Votre entreprise'}</h1>
          <p>{user.recruiterProfile?.recruiterName || user.email}</p>
        </div>
        <div className="dashboard-header-actions">
          <button className="secondary-action" onClick={() => navigate('/recruiter/profile')} type="button">Profil</button>
          <button className="secondary-action" onClick={() => navigate('/recruiter/candidates')} type="button">Candidats intéressés</button>
          <button className="secondary-action" onClick={() => navigate('/recruiter/matches')} type="button">Mes matchs</button>
          <NotificationButton onClick={() => navigate('/notifications')} />
          <button className="secondary-action" onClick={logout} type="button">Déconnexion</button>
        </div>
      </header>

      <section className="recruiter-stats">
        <div><strong>{offers.length}</strong><span>Offres publiées</span></div>
        <div><strong>{offers.filter((offer) => offer.status === 'published').length}</strong><span>Actives</span></div>
        <div><strong>{offers.filter((offer) => offer.status === 'closed').length}</strong><span>Fermées</span></div>
      </section>

      <section className="recruiter-offers-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow recruiter-eyebrow">Console recruteur</p>
            <h2>Mes offres</h2>
          </div>
          <button className="primary-action compact-action recruiter-action" onClick={() => navigate('/recruiter/offers/new')} type="button">Nouvelle offre</button>
        </div>
        {isLoading && <p className="empty-state">Chargement de vos offres…</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {!isLoading && !error && offers.length === 0 && <p className="empty-state">Vous n’avez pas encore publié d’offre.</p>}
        <div className="recruiter-offer-list">
          {offers.map((offer) => (
            <article className="recruiter-offer-card" key={offer._id}>
              <div>
                <span className={offer.status === 'published' ? 'published-badge' : 'closed-badge'}>{offer.status === 'published' ? 'Publiée' : 'Fermée'}</span>
                <h3>{offer.title}</h3>
                <p>{offer.city} · {offer.remoteMode} · {offer.contractType}</p>
              </div>
              <div className="recruiter-offer-metrics">
                <strong>{offer.salaryMin || 0} - {offer.salaryMax || 0} €</strong>
                <span>{offer.requiredSkills?.length || 0} compétences demandées</span>
              </div>
              <button className="secondary-action" onClick={() => navigate(`/recruiter/offers/${offer._id}`)} type="button">Voir l’offre</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default RecruiterDashboardPage