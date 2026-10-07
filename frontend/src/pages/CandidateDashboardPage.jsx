import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import BottomNav from '../components/BottomNav'
import api from '../services/api'

const remoteModeLabel = { onsite: 'Sur site', hybrid: 'Hybride', remote: 'Full Remote' }

const statusConfig = {
  accepted: {
    label: '● Match confirmé !',
    className: 'cd-status accepted',
    actionLabel: '💬 Chat ouvert',
    actionClass: 'cd-action-btn primary',
  },
  pending: {
    label: '⏳ En attente du recruteur',
    className: 'cd-status pending',
    actionLabel: 'Détails offre →',
    actionClass: 'cd-action-btn ghost',
  },
  rejected: {
    label: '✕ Candidature refusée',
    className: 'cd-status rejected',
    actionLabel: 'Détails offre →',
    actionClass: 'cd-action-btn ghost',
  },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return "Postulé il y a moins d'1h"
  if (h < 24) return `Vu par le recruteur il y a ${h}h`
  if (d === 1) return 'Postulé hier'
  return `Postulé il y a ${d}j`
}

function companyInitials(title) {
  return (title || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'JS'
}

function MatchRow({ match, onConversation, onDetail }) {
  const offer = match.jobOfferId
  const cfg = statusConfig[match.status] || statusConfig.pending
  const initials = companyInitials(offer?.title)

  async function handleAction() {
    if (match.status === 'accepted') {
      await onConversation(match)
    } else {
      onDetail(offer?._id)
    }
  }

  return (
    <article className="cd-match-row">
      <div className="cd-match-top">
        <span className="cd-company-logo">{initials}</span>
        <div className="cd-match-info">
          <div className="cd-match-headline">
            <strong className="cd-company-name">
              {offer?.title ? offer.title.split(' ').slice(0, 2).join(' ') : 'Entreprise'}
              <span className="cd-verified" aria-hidden="true"> ✓</span>
            </strong>
            <span className="cd-salary">
              {offer?.salaryMin && offer?.salaryMax
                ? `${offer.salaryMin / 1000}–${offer.salaryMax / 1000}k€`
                : '—'}
            </span>
          </div>
          <p className="cd-job-title">{offer?.title || 'Poste non renseigné'}</p>
          <div className="cd-match-tags">
            {offer?.city && (
              <span className="cd-tag">
                <span aria-hidden="true">📍</span> {offer.city}{offer?.remoteMode ? ` / ${remoteModeLabel[offer.remoteMode] || offer.remoteMode}` : ''}
              </span>
            )}
            {(offer?.requiredSkills || []).slice(0, 2).map((s) => (
              <span className="cd-tag" key={s}>{s}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="cd-match-bottom">
        <span className={cfg.className}>{cfg.label}</span>
        <div className="cd-match-meta-row">
          <span className="cd-time-ago">{timeAgo(match.createdAt)}</span>
          <button className={cfg.actionClass} onClick={handleAction} type="button">
            {cfg.actionLabel}
          </button>
        </div>
      </div>
    </article>
  )
}

function CandidateDashboardPage() {
  const { user, isLoading: isSessionLoading } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('candidatures')

  const profile = user?.candidateProfile || {}
  const firstName = profile.firstName || user?.email?.split('@')[0] || 'Candidat'
  const initials = [profile.firstName?.[0], profile.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'A'

  useEffect(() => {
    if (!user || user.role !== 'candidate') return
    api.get('/api/matches')
      .then((r) => setMatches(r.data.matches || []))
      .catch((e) => setError(e.response?.data?.message || 'Impossible de charger vos candidatures.'))
      .finally(() => setIsLoading(false))
  }, [user])

  if (isSessionLoading) return <main className="loading-state">Chargement…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'candidate') return <Navigate replace to="/dashboard" />

  const acceptedMatches = matches.filter((m) => m.status === 'accepted')
  const pendingMatches = matches.filter((m) => m.status === 'pending')
  const allCandidatures = matches
  const reciproques = acceptedMatches

  const displayed = activeTab === 'candidatures' ? allCandidatures : reciproques

  // Stats
  const likedCount = matches.length
  const matchCount = acceptedMatches.length
  const matchRate = likedCount > 0 ? Math.round((matchCount / likedCount) * 100) : 0

  async function openConversation(match) {
    try {
      const response = await api.post(`/api/conversations/matches/${match._id}`)
      navigate(`/messages?conversation=${response.data.conversation._id}`)
    } catch {
      navigate('/messages')
    }
  }

  // Recruiter avatars for banner (up to 3 accepted)
  const recruiterAvatars = acceptedMatches.slice(0, 3).map((m) => {
    const offer = m.jobOfferId
    return companyInitials(offer?.title)
  })

  return (
    <main className="cd-page">

      {/* Header */}
      <header className="cd-header">
        <button className="cd-header-avatar" onClick={() => navigate('/profile')} type="button">
          <span>{initials}</span>
          <span className="cd-header-avatar-dot" aria-hidden="true" />
        </button>
        <div className="cd-header-center">
          <span className="cd-header-role">Candidat</span>
          <strong className="cd-header-name">{firstName}</strong>
        </div>
        <strong className="cd-header-brand">JobSwipe</strong>
        <button aria-label="Filtres" className="cd-header-icon" type="button">⊞</button>
      </header>

      {/* Tabs */}
      <nav aria-label="Sections du dashboard" className="cd-tabs">
        <button
          className={activeTab === 'candidatures' ? 'cd-tab active' : 'cd-tab'}
          onClick={() => setActiveTab('candidatures')}
          type="button"
        >
          Mes Candidatures
          <span className="cd-tab-badge">{allCandidatures.length}</span>
        </button>
        <button
          className={activeTab === 'reciproques' ? 'cd-tab active' : 'cd-tab'}
          onClick={() => setActiveTab('reciproques')}
          type="button"
        >
          Matchs Réciproques
          {reciproques.length > 0 && (
            <span className="cd-tab-badge green">{reciproques.length}</span>
          )}
        </button>
      </nav>

      <div className="cd-body">

        {/* Banner */}
        {acceptedMatches.length > 0 && (
          <section className="cd-banner" aria-label="Nouvelle dynamique">
            <div className="cd-banner-inner">
              <div className="cd-banner-top">
                <span className="cd-banner-emoji" aria-hidden="true">🎉</span>
                <p className="cd-banner-eyebrow">NOUVELLE DYNAMIQUE <span className="cd-banner-live" aria-hidden="true">●</span></p>
              </div>
              <h2 className="cd-banner-title">
                Félicitations&nbsp;! Vous avez {acceptedMatches.length} nouveau{acceptedMatches.length > 1 ? 'x' : ''} match{acceptedMatches.length > 1 ? 's' : ''} réciproque{acceptedMatches.length > 1 ? 's' : ''} prêts à discuter.
              </h2>
              <p className="cd-banner-sub">Les recruteurs ont validé votre profil. Répondez sous 24h pour maximiser votre taux d'entretien.</p>
              <div className="cd-banner-footer">
                <div className="cd-recruiter-avatars">
                  {recruiterAvatars.map((av, i) => (
                    <span className="cd-recruiter-av" key={i} style={{ zIndex: 3 - i }}>{av}</span>
                  ))}
                </div>
                <button className="cd-banner-cta" onClick={() => navigate('/messages')} type="button">
                  Voir les conversations
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Stats */}
        <section aria-label="Statistiques de swipe" className="cd-stats-section">
          <div className="cd-stats-heading">
            <strong>Statistiques de swipe</strong>
            <span className="cd-stats-period">30 derniers jours</span>
          </div>
          <div className="cd-stats-grid">
            <div className="cd-stat-card">
              <span className="cd-stat-icon" aria-hidden="true">♡</span>
              <strong>{likedCount}</strong>
              <span>Likées</span>
            </div>
            <div className="cd-stat-card accent">
              <span className="cd-stat-icon" aria-hidden="true">◇</span>
              <strong>{matchCount} <small>({matchRate}%)</small></strong>
              <span>Matchs</span>
              <small className="cd-stat-sub">Taux de succès</small>
            </div>
            <div className="cd-stat-card">
              <span className="cd-stat-icon" aria-hidden="true">📅</span>
              <strong>0</strong>
              <span>Entretiens</span>
              <small className="cd-stat-sub">Planifiés</small>
            </div>
          </div>
        </section>

        {/* Applications list */}
        <section aria-labelledby="cd-list-title" className="cd-list-section">
          <div className="cd-list-heading">
            <h2 id="cd-list-title">
              {activeTab === 'candidatures' ? 'Candidatures en cours' : 'Matchs Réciproques'}
            </h2>
            <button className="cd-filter-btn" type="button">Tout filtrer ☰</button>
          </div>

          {isLoading && <p className="cd-empty">Chargement…</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {!isLoading && !error && displayed.length === 0 && (
            <div className="cd-empty-state">
              <p>{activeTab === 'candidatures' ? "Vous n'avez pas encore postulé." : 'Aucun match réciproque pour le moment.'}</p>
              <button className="primary-action cd-discover-btn" onClick={() => navigate('/discover')} type="button">
                Découvrir des offres
              </button>
            </div>
          )}

          <div className="cd-match-list">
            {displayed.map((match) => (
              <MatchRow
                key={match._id}
                match={match}
                onConversation={openConversation}
                onDetail={(id) => id && navigate(`/offers/${id}`)}
              />
            ))}
          </div>
        </section>

        {/* Quick access to discover */}
        {pendingMatches.length === 0 && !isLoading && (
          <button className="cd-discover-shortcut" onClick={() => navigate('/discover')} type="button">
            <span aria-hidden="true">🔍</span> Découvrir de nouvelles offres →
          </button>
        )}

      </div>

      {/* Bottom nav */}
      <BottomNav />

    </main>
  )
}

export default CandidateDashboardPage
