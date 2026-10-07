import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import api from '../services/api'

function RecruiterProfilePage() {
  const { user, isLoading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const profile = user?.recruiterProfile || {}
  const [form, setForm] = useState({
    companyName: profile.companyName || '',
    companySector: profile.companySector || '',
    companySize: profile.companySize || '',
    companyCity: profile.companyCity || '',
    recruiterName: profile.recruiterName || '',
    recruiterPosition: profile.recruiterPosition || '',
    responseTime: profile.responseTime || 'within48Hours',
  })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading) return <main className="loading-state">Chargement de votre profil…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'recruiter') return <Navigate replace to="/dashboard" />

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function saveProfile(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await api.patch('/api/profile', form)
      await refreshUser()
      navigate('/dashboard')
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Impossible d’enregistrer le profil recruteur.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <button className="back-link plain-button" onClick={() => navigate('/dashboard')} type="button">Retour</button>
        <strong className="auth-brand">JobSwipe</strong>
        <span className="step-label">Profil recruteur</span>
      </header>
      <div className="step-progress"><span className="step-progress-full" /></div>

      <section className="onboarding-card" aria-labelledby="recruiter-profile-title">
        <p className="eyebrow recruiter-eyebrow">Espace recruteur</p>
        <h1 id="recruiter-profile-title">Présentez votre entreprise</h1>
        <p className="intro">Ces informations apparaîtront sur vos offres et dans les conversations après un match.</p>
        <form className="auth-form" onSubmit={saveProfile}>
          <label>Nom de l’entreprise<input name="companyName" onChange={updateField} placeholder="FinTech Nova" required value={form.companyName} /></label>
          <div className="field-grid">
            <label>Secteur<input name="companySector" onChange={updateField} placeholder="Technologie" required value={form.companySector} /></label>
            <label>Effectif<input name="companySize" onChange={updateField} placeholder="51 à 250" required value={form.companySize} /></label>
          </div>
          <label>Ville du siège<input name="companyCity" onChange={updateField} placeholder="Paris" required value={form.companyCity} /></label>
          <label>Nom du recruteur<input name="recruiterName" onChange={updateField} placeholder="Sophie Martin" required value={form.recruiterName} /></label>
          <label>Fonction<input name="recruiterPosition" onChange={updateField} placeholder="Responsable recrutement" required value={form.recruiterPosition} /></label>
          <fieldset>
            <legend>Délai de réponse annoncé</legend>
            <div className="choice-list">
              {[
                ['under1Hour', 'Moins d’une heure'],
                ['within24Hours', 'Sous 24 heures'],
                ['within48Hours', 'Sous 48 heures'],
              ].map(([value, label]) => <button className={form.responseTime === value ? 'choice selected recruiter-choice' : 'choice'} key={value} onClick={() => setForm({ ...form, responseTime: value })} type="button">{label}</button>)}
            </div>
          </fieldset>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit recruiter-submit" disabled={isSaving} type="submit">{isSaving ? 'Enregistrement…' : 'Accéder à mon espace recruteur'}</button>
        </form>
      </section>
    </main>
  )
}

export default RecruiterProfilePage