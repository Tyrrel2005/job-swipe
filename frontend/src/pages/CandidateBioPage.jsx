import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import api from '../services/api'

const suggestions = [
  'Développeur fullstack JavaScript, 3 ans d’expérience sur React et Node.js. Je cherche un CDI produit avec du télétravail hybride.',
  'Spécialisé en architecture frontend réactive et micro-services Node.js. Habitué aux migrations progressives et aux petites équipes produit.',
]

function CandidateBioPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [bio, setBio] = useState(user?.candidateProfile?.bio || '')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading) return <main className="loading-state">Chargement de votre profil…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'candidate') return <Navigate replace to="/dashboard" />

  async function saveBio(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await api.patch('/api/profile', { bio })
      await refreshUser()
      navigate('/onboarding/candidate/cv')
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Impossible d’enregistrer votre présentation.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <button className="back-link plain-button" onClick={() => navigate('/onboarding/candidate/education')} type="button">Retour</button>
        <strong className="auth-brand">JobSwipe</strong>
        <span className="step-label">Étape 4 sur 5</span>
      </header>
      <div className="step-progress"><span className="step-progress-four" /></div>

      <section className="onboarding-card" aria-labelledby="bio-title">
        <p className="eyebrow">Profil candidat</p>
        <h1 id="bio-title">Présentez-vous</h1>
        <p className="intro">Cette présentation sera visible par les recruteurs lorsque vous manifesterez votre intérêt.</p>
        <form className="auth-form" onSubmit={saveBio}>
          <label>Votre présentation
            <textarea className="bio-input" maxLength="280" onChange={(event) => setBio(event.target.value)} placeholder="Décrivez votre expérience et votre recherche…" value={bio} />
          </label>
          <p className="character-count">{bio.length} / 280 caractères</p>
          <div className="suggestion-list">
            <strong>Suggestions</strong>
            {suggestions.map((suggestion) => <button className="suggestion" key={suggestion} onClick={() => setBio(suggestion)} type="button">{suggestion}</button>)}
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={isSaving} type="submit">{isSaving ? 'Enregistrement…' : 'Enregistrer et continuer'}</button>
        </form>
      </section>
    </main>
  )
}

export default CandidateBioPage