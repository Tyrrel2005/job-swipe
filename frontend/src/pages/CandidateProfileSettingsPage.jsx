import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import BottomNav from '../components/BottomNav'
import api from '../services/api'

const availabilityLabel = {
  immediate: 'Disponible immédiatement',
  within1Month: 'Disponible sous 1 mois',
  within3Months: 'Disponible sous 3 mois',
}

const workModeLabel = {
  onsite: 'Sur site',
  hybrid: 'Hybride',
  remote: 'Télétravail',
}

function ProfileAvatar({ photoUrl, initials, onClick }) {
  return (
    <button
      aria-label={photoUrl ? 'Voir la photo en grand' : 'Avatar'}
      className={photoUrl ? 'profile-hero-avatar photo-clickable' : 'profile-hero-avatar'}
      onClick={onClick}
      type="button"
    >
      {photoUrl
        ? <img alt="Photo de profil" src={photoUrl} />
        : <span>{initials}</span>}
      <span className="profile-hero-badge" aria-hidden="true">✓</span>
    </button>
  )
}

function StatItem({ value, label }) {
  return (
    <div className="profile-stat-item">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function SectionCard({ icon, title, badge, children }) {
  return (
    <section className="profile-card-section">
      <div className="profile-card-section-header">
        <span className="profile-section-icon" aria-hidden="true">{icon}</span>
        <h2>{title}</h2>
        {badge && <span className="profile-section-badge">{badge}</span>}
      </div>
      {children}
    </section>
  )
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="profile-toggle-row">
      <div>
        <strong>{label}</strong>
        {description && <p>{description}</p>}
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className={checked ? 'profile-toggle on' : 'profile-toggle'}
        onClick={onChange}
        role="switch"
        type="button"
      >
        <span />
      </button>
    </div>
  )
}

function CandidateProfileSettingsPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false)
  const [incognito, setIncognito] = useState(false)
  const [matchAlerts, setMatchAlerts] = useState(true)
  const [matchStats, setMatchStats] = useState({ total: 0, accepted: 0 })
  const photoObjectUrl = useRef('')

  const profile = user?.candidateProfile || {}

  const initials = [profile.firstName?.[0], profile.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'AM'
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Votre nom'
  const titleExp = [profile.title, profile.experience].filter(Boolean).join(' · ') || 'Titre non renseigné'

  useEffect(() => {
    if (!profile.profilePhotoUrl) return undefined

    let isActive = true

    api.get('/api/profile/photo', { responseType: 'blob' })
      .then((response) => {
        const url = URL.createObjectURL(response.data)
        photoObjectUrl.current = url
        if (isActive) setPhotoUrl(url)
      })
      .catch(() => { if (isActive) setPhotoUrl('') })

    return () => {
      isActive = false
      if (photoObjectUrl.current) URL.revokeObjectURL(photoObjectUrl.current)
    }
  }, [profile.profilePhotoUrl])

  useEffect(() => {
    if (!user) return
    api.get('/api/matches')
      .then((r) => {
        const matches = r.data.matches || []
        setMatchStats({
          total: matches.length,
          accepted: matches.filter((m) => m.status === 'accepted').length,
        })
      })
      .catch(() => {})
  }, [user])

  if (isLoading) return <main className="loading-state">Chargement de votre profil…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'candidate') return <Navigate replace to="/dashboard" />

  async function uploadPhoto(event) {
    const photo = event.target.files?.[0]
    if (!photo) return
    setError('')
    setFeedback('')

    if (!['image/jpeg', 'image/png'].includes(photo.type) || photo.size > 2 * 1024 * 1024) {
      setError('La photo doit être au format JPG ou PNG et ne pas dépasser 2 Mo.')
      return
    }

    setIsUploadingPhoto(true)
    const formData = new FormData()
    formData.append('photo', photo)

    try {
      await api.post('/api/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshUser()
      setFeedback('Photo de profil mise à jour.')
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || "Impossible d'envoyer la photo.")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  async function downloadCv() {
    try {
      const response = await api.get('/api/profile/cv', { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = 'mon-cv.pdf'
      link.click()
      URL.revokeObjectURL(url)
    } catch (downloadError) {
      setError(downloadError.response?.data?.message || 'Impossible de télécharger le CV.')
    }
  }

  async function deleteCv() {
    if (!window.confirm('Supprimer votre CV ?')) return
    try {
      await api.delete('/api/profile/cv')
      await refreshUser()
      setFeedback('CV supprimé.')
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Impossible de supprimer le CV.')
    }
  }

  const completion = user.profileCompletion ?? 0
  const salary = profile.salaryMax ? `${Math.round(profile.salaryMax / 1000)}k€` : '—'

  return (
    <main className="profile-page">
      {/* Header */}
      <header className="profile-page-header">
        <button aria-label="Retour" className="profile-nav-back" onClick={() => navigate('/dashboard')} type="button">←</button>
        <span className="profile-page-title">Mon Profil &amp; Paramètres</span>
        <button className="profile-nav-edit" onClick={() => navigate('/onboarding/candidate/profile')} type="button">✏ Modifier</button>
      </header>

      <div className="profile-page-body">

        {/* Hero */}
        <div className="profile-hero">
          <ProfileAvatar initials={initials} onClick={() => photoUrl && setIsPhotoViewerOpen(true)} photoUrl={photoUrl} />
          <label aria-label={isUploadingPhoto ? 'Envoi en cours…' : 'Changer la photo'} className="profile-photo-trigger">
            {isUploadingPhoto ? '…' : '📷'}
            <input accept="image/jpeg,image/png" onChange={uploadPhoto} type="file" />
          </label>
          <h1 className="profile-hero-name">{fullName}</h1>
          <p className="profile-hero-title">{titleExp}</p>
          <p className="profile-hero-location">
            <span aria-hidden="true">📍</span>
            {[profile.location, workModeLabel[profile.workMode]].filter(Boolean).join(' & ') || 'Localisation non renseignée'}
          </p>
          {profile.availability && (
            <span className="profile-availability-badge">
              <span className="profile-avail-dot" aria-hidden="true" />
              {availabilityLabel[profile.availability] || profile.availability}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="profile-stats-row">
          <StatItem label="Profil complété" value={`${completion}%`} />
          <div className="profile-stats-divider" aria-hidden="true" />
          <StatItem label="Matchs confirmés" value={matchStats.accepted} />
          <div className="profile-stats-divider" aria-hidden="true" />
          <StatItem label="Cible Brut" value={salary} />
        </div>

        {feedback && <p className="feedback-message profile-feedback" role="status">{feedback}</p>}
        {error && <p className="auth-error profile-feedback" role="alert">{error}</p>}

        {/* À propos */}
        <SectionCard icon="😊" title="À propos">
          <p className="profile-bio-text">{profile.bio || 'Aucune présentation renseignée. Ajoutez une bio pour vous démarquer.'}</p>
        </SectionCard>

        {/* Compétences */}
        <SectionCard badge={`${profile.skills?.length || 0} validées`} icon="💡" title="Compétences clés">
          <div className="profile-skills-cloud">
            {(profile.skills || []).length === 0
              ? <span className="profile-empty-hint">Aucune compétence renseignée.</span>
              : (profile.skills || []).map((skill) => <span className="profile-skill-tag" key={skill}>{skill}</span>)}
          </div>
        </SectionCard>

        {/* Formation */}
        <SectionCard icon="🎓" title="Formation">
          {profile.diploma || profile.school
            ? (
              <div className="profile-formation-card">
                <span className="profile-formation-logo">{profile.school?.slice(0, 3).toUpperCase() || '?'}</span>
                <div className="profile-formation-info">
                  <div className="profile-formation-topline">
                    <strong>{profile.school || 'Établissement non renseigné'}</strong>
                    {profile.graduationYear && <span className="profile-formation-year">{profile.graduationYear}</span>}
                  </div>
                  <p>{profile.diploma || profile.degree || 'Diplôme non renseigné'}</p>
                  {profile.degree && <small>{profile.degree}</small>}
                </div>
              </div>
            )
            : <span className="profile-empty-hint">Formation non renseignée.</span>}
        </SectionCard>

        {/* Langues */}
        <SectionCard icon="🌐" title="Langues">
          {(profile.languages || []).length === 0
            ? <span className="profile-empty-hint">Aucune langue renseignée.</span>
            : (
              <div className="profile-languages-row">
                {profile.languages.map((lang) => (
                  <div className="profile-language-item" key={lang.name}>
                    <span className="profile-language-name">{lang.name}</span>
                    <span className="profile-language-level">{lang.level}</span>
                    <small className="profile-language-hint">{lang.level === 'Langue maternelle' ? 'Langue maternelle' : 'Professionnel courant'}</small>
                  </div>
                ))}
              </div>
            )}
        </SectionCard>

        {/* CV */}
        <SectionCard badge={profile.cvUrl ? '🔒 Certifié & Chiffré' : undefined} icon="📄" title="Curriculum Vitae">
          {profile.cvUrl
            ? (
              <div className="profile-cv-row">
                <div className="profile-cv-info">
                  <span className="profile-cv-icon" aria-hidden="true">📄</span>
                  <div>
                    <strong>CV_{fullName.replace(' ', '_')}.pdf</strong>
                    <small>À jour</small>
                  </div>
                </div>
                <div className="profile-cv-actions">
                  <button aria-label="Télécharger le CV" className="profile-cv-btn" onClick={downloadCv} type="button">⬇</button>
                  <button aria-label="Supprimer le CV" className="profile-cv-btn danger" onClick={deleteCv} type="button">🗑</button>
                </div>
              </div>
            )
            : (
              <div className="profile-cv-empty">
                <p className="profile-empty-hint">Aucun CV enregistré.</p>
                <button className="primary-action profile-cv-upload-btn" onClick={() => navigate('/onboarding/candidate/cv')} type="button">Ajouter mon CV</button>
              </div>
            )}
        </SectionCard>

        {/* Paramètres de compte */}
        <SectionCard icon="⚙️" title="Paramètres de compte">
          <ToggleRow
            checked={incognito}
            description="Masque votre profil à votre employeur actuel"
            label="Visibilité incognito"
            onChange={() => setIncognito((v) => !v)}
          />
          <div className="profile-settings-row">
            <div>
              <strong>Export RGPD &amp; Données</strong>
              <p>Exportez l'intégralité de vos données au format JSON</p>
            </div>
            <button aria-label="Exporter les données RGPD" className="profile-settings-action" type="button">⬇</button>
          </div>
          <ToggleRow
            checked={matchAlerts}
            description="Push en temps réel pour chaque nouveau coup de cœur"
            label="Alertes de matching"
            onChange={() => setMatchAlerts((v) => !v)}
          />
          <div className="profile-danger-zone">
            <button className="profile-delete-btn" type="button">🗑 Supprimer définitivement mon compte</button>
            <p>Action irréversible conforme aux droits RGPD européens.</p>
          </div>
        </SectionCard>

      </div>

      {/* Bottom nav */}
      <BottomNav />

      {/* Photo viewer */}
      {isPhotoViewerOpen && (
        <div className="photo-viewer" onClick={() => setIsPhotoViewerOpen(false)} role="presentation">
          <div className="photo-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="photo-viewer-close" onClick={() => setIsPhotoViewerOpen(false)} type="button">Fermer</button>
            <img alt="Photo de profil en grand format" src={photoUrl} />
          </div>
        </div>
      )}
    </main>
  )
}

export default CandidateProfileSettingsPage
