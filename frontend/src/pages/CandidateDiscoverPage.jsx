import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import BottomNav from '../components/BottomNav'
import api from '../services/api'

const initialFilters = { city: '', salaryMin: '', remoteMode: '' }

const remoteModeLabel = { onsite: 'Sur site', hybrid: 'Hybride', remote: 'Télétravail' }

function companyInitials(offer) {
  const name = offer.companyName || offer.title || ''
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'JS'
}

function FilterPill({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const active = Boolean(value)
  return (
    <div className="discover-filter-pill-wrap" ref={ref}>
      <button
        className={active ? 'discover-filter-pill active' : 'discover-filter-pill'}
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <span>{label}</span>
        <span className="discover-filter-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="discover-filter-dropdown">
          {options.map((opt) => (
            <button
              className={value === opt.value ? 'discover-filter-opt active' : 'discover-filter-opt'}
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function OfferCard({ offer, swipe, onTouchStart, onTouchEnd, onNavigate }) {
  const [missionOpen, setMissionOpen] = useState(false)
  const score = offer.compatibilityScore ?? 0
  const skills = offer.requiredSkills || []
  const visibleSkills = skills.slice(0, 4)
  const extraCount = skills.length - visibleSkills.length

  return (
    <article
      className={`discover-offer-card ${swipe ? `is-swiping-${swipe}` : ''}`}
      onTouchEnd={onTouchEnd}
      onTouchStart={onTouchStart}
    >
      {/* Banner */}
      <div className="dv-banner">
        <div className="dv-banner-topline">
          <span className="dv-badge-compat">
            <span className="dv-bolt" aria-hidden="true">⚡</span>
            {score}% Compatibilité
          </span>
          <span className="dv-badge-verified">
            <span aria-hidden="true">✓</span> Vérifiée
          </span>
          <button aria-label="Sauvegarder l'offre" className="dv-bookmark" type="button">🔖</button>
        </div>
        <div className="dv-company-line">
          <span className="dv-company-logo">{companyInitials(offer)}</span>
          <div>
            <p className="dv-company-name">
              {offer.companyName || 'Entreprise'} <span className="dv-check" aria-hidden="true">✓</span>
            </p>
            <p className="dv-company-sub">{offer.title} • {offer.city} ({remoteModeLabel[offer.remoteMode] || offer.remoteMode})</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="dv-body">
        <h2 className="dv-offer-title">{offer.title}</h2>

        <div className="dv-offer-pills">
          {(offer.salaryMin || offer.salaryMax) && (
            <span className="dv-pill salary">
              € {offer.salaryMin || 0}k – {offer.salaryMax || 0}k € / an
            </span>
          )}
          <span className="dv-pill contract">{offer.contractType}</span>
          {offer.remoteMode && (
            <span className="dv-pill remote">
              {offer.remoteMode === 'hybrid' ? '3j télétravail / sem.' : remoteModeLabel[offer.remoteMode]}
            </span>
          )}
        </div>

        <p className="dv-skills-label">COMPÉTENCES CLÉS RECHERCHÉES</p>
        <div className="dv-skills">
          {visibleSkills.map((skill) => (
            <span className="dv-skill-tag" key={skill}>
              <span className="dv-skill-dot" aria-hidden="true">◎</span> {skill}
            </span>
          ))}
          {extraCount > 0 && <span className="dv-skill-tag extra">+{extraCount} autres</span>}
        </div>

        <div className="dv-missions-section">
          <button
            className="dv-missions-toggle"
            onClick={() => setMissionOpen((o) => !o)}
            type="button"
          >
            <span>
              <span className="dv-missions-icon" aria-hidden="true">≡</span>
              Missions &amp; Avantages du poste
            </span>
            <span className="dv-missions-chevron">{missionOpen ? '▲' : '▼'}</span>
          </button>
          {missionOpen && (
            <p className="dv-description">
              {offer.description || 'Découvrez une nouvelle opportunité professionnelle adaptée à votre profil.'}
            </p>
          )}
          {!missionOpen && offer.description && (
            <p className="dv-description-preview">{offer.description}</p>
          )}
        </div>

        <button className="dv-detail-link" onClick={() => onNavigate(`/offers/${offer._id}`)} type="button">
          Voir le détail complet →
        </button>
      </div>
    </article>
  )
}

function CandidateDiscoverPage() {
  const { user, isLoading: isSessionLoading } = useAuth()
  const navigate = useNavigate()
  const [offers, setOffers] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [swipe, setSwipe] = useState('')
  const [touchStart, setTouchStart] = useState(null)
  const [savedIds, setSavedIds] = useState(new Set())
  const profile = user?.candidateProfile || {}
  const photoInitials = [profile.firstName?.[0], profile.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'AM'

  useEffect(() => {
    if (!user || user.role !== 'candidate') return

    setIsLoading(true)
    setError('')
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    api.get('/api/jobs', { params })
      .then((r) => setOffers(r.data.jobOffers || []))
      .catch((e) => setError(e.response?.data?.message || 'Impossible de charger les offres.'))
      .finally(() => setIsLoading(false))
  }, [filters, user])

  if (isSessionLoading) return <main className="loading-state">Chargement de votre session…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'candidate') return <Navigate replace to="/dashboard" />

  const currentOffer = offers[0]

  function updateFilter(name, value) {
    setFilters((f) => ({ ...f, [name]: value }))
  }

  async function decideOffer(decision) {
    if (!currentOffer || swipe) return

    const direction = decision === 'pass' ? 'left' : 'right'
    setSwipe(direction)
    setFeedback('')

    if (decision !== 'pass') {
      try {
        await api.post(`/api/matches/offers/${currentOffer._id}`)
        if (decision === 'save') setSavedIds((s) => new Set([...s, currentOffer._id]))
        setFeedback(decision === 'super' ? 'Intérêt prioritaire envoyé !' : decision === 'save' ? 'Offre sauvegardée.' : 'Votre intérêt a été envoyé au recruteur.')
      } catch (e) {
        setSwipe('')
        setFeedback(e.response?.data?.message || "Impossible d'envoyer votre intérêt.")
        return
      }
    } else {
      setFeedback('Offre passée.')
    }

    window.setTimeout(() => {
      setOffers((current) => current.slice(1))
      setSwipe('')
    }, 280)
  }

  function handleTouchStart(e) { setTouchStart(e.touches[0].clientX) }
  function handleTouchEnd(e) {
    if (touchStart === null) return
    const dist = e.changedTouches[0].clientX - touchStart
    setTouchStart(null)
    if (Math.abs(dist) < 70) return
    decideOffer(dist > 0 ? 'like' : 'pass')
  }

  const remoteModeFilterOptions = [
    { value: '', label: 'Tous les modes' },
    { value: 'onsite', label: 'Sur site' },
    { value: 'hybrid', label: 'Hybride' },
    { value: 'remote', label: 'Télétravail' },
  ]
  const salaryOptions = [
    { value: '', label: 'Tous les salaires' },
    { value: '30000', label: 'Min. 30k €' },
    { value: '40000', label: 'Min. 40k €' },
    { value: '50000', label: 'Min. 50k €' },
    { value: '60000', label: 'Min. 60k €' },
    { value: '80000', label: 'Min. 80k €' },
  ]

  const remotePillLabel = filters.remoteMode
    ? `Télétravail : ${remoteModeLabel[filters.remoteMode]}`
    : 'Télétravail : Hybride'
  const salaryPillLabel = filters.salaryMin
    ? `Min. ${parseInt(filters.salaryMin) / 1000}k €`
    : 'Min. 60k €'
  const cityPillLabel = filters.city || 'Paris'

  return (
    <main className="dv-page">

      {/* Header */}
      <header className="dv-header">
        <button
          aria-label="Voir le profil"
          className="dv-header-avatar"
          onClick={() => navigate('/profile')}
          type="button"
        >
          <span>{photoInitials}</span>
          <span className="dv-header-avatar-dot" aria-hidden="true" />
        </button>
        <div className="dv-header-brand">
          <span className="dv-brand-dot" aria-hidden="true">•</span>
          <strong>JobSwipe</strong>
        </div>
        <div className="dv-header-actions">
          <button aria-label="Notifications" className="dv-header-icon" onClick={() => navigate('/notifications')} type="button">🔔</button>
          <button aria-label="Filtres avancés" className="dv-header-icon" onClick={() => {}} type="button">⊞</button>
        </div>
      </header>

      {/* Filters */}
      <div className="dv-filters" role="search" aria-label="Filtres des offres">
        <FilterPill
          label={remotePillLabel}
          onChange={(v) => updateFilter('remoteMode', v)}
          options={remoteModeFilterOptions}
          value={filters.remoteMode}
        />
        <FilterPill
          label={salaryPillLabel}
          onChange={(v) => updateFilter('salaryMin', v)}
          options={salaryOptions}
          value={filters.salaryMin}
        />
        <div className="discover-filter-pill-wrap">
          <input
            aria-label="Filtrer par ville"
            className="discover-filter-pill city-input"
            onChange={(e) => updateFilter('city', e.target.value)}
            placeholder={cityPillLabel}
            value={filters.city}
          />
        </div>
      </div>

      {/* Feedback */}
      {feedback && <p className="dv-feedback" role="status">{feedback}</p>}
      {error && <p className="auth-error dv-error" role="alert">{error}</p>}

      {/* Loading */}
      {isLoading && <p className="dv-loading">Chargement des offres…</p>}

      {/* Empty */}
      {!isLoading && !error && !currentOffer && (
        <section className="discover-empty">
          <span className="empty-icon">✦</span>
          <h2>Vous avez fait le tour</h2>
          <p>Aucune autre offre ne correspond à vos filtres.</p>
          <button
            className="primary-action"
            onClick={() => { setError(''); setFilters(initialFilters) }}
            type="button"
          >
            Réinitialiser les filtres
          </button>
        </section>
      )}

      {/* Deck */}
      {!isLoading && !error && currentOffer && (
        <section aria-label="Offre à découvrir" className="dv-deck">
          {offers[1] && <div className="dv-shadow-card" aria-hidden="true" />}
          <OfferCard
            offer={currentOffer}
            onNavigate={navigate}
            onTouchEnd={handleTouchEnd}
            onTouchStart={handleTouchStart}
            swipe={swipe}
          />
        </section>
      )}

      {/* Swipe actions */}
      <nav aria-label="Actions sur l'offre" className="dv-actions">
        <button
          aria-label="Annuler"
          className="dv-action undo"
          disabled={Boolean(swipe)}
          onClick={() => {}}
          type="button"
        >
          ↺
        </button>
        <button
          aria-label="Passer l'offre"
          className="dv-action pass"
          disabled={!currentOffer || Boolean(swipe)}
          onClick={() => decideOffer('pass')}
          type="button"
        >
          ✕
        </button>
        <button
          aria-label="Intérêt prioritaire"
          className="dv-action super"
          disabled={!currentOffer || Boolean(swipe)}
          onClick={() => decideOffer('super')}
          type="button"
        >
          ★
        </button>
        <button
          aria-label="Manifester son intérêt"
          className="dv-action like"
          disabled={!currentOffer || Boolean(swipe)}
          onClick={() => decideOffer('like')}
          type="button"
        >
          ♥
        </button>
      </nav>

      {/* Bottom nav */}
      <BottomNav />

    </main>
  )
}

export default CandidateDiscoverPage
