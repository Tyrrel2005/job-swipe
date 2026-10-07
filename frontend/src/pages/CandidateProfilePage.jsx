import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import api from '../services/api'
import { useAuth } from '../context/useAuth'

const contracts = ['CDI', 'CDD', 'Alternance', 'Stage', 'Freelance', 'Temps partiel']

function CandidateProfilePage() {
  const { user, isLoading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const profile = user?.candidateProfile || {}
  const [form, setForm] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    title: profile.title || '',
    location: profile.location || '',
    experience: profile.experience || "Moins d'1 an",
    desiredContractTypes: profile.desiredContractTypes || [],
    availability: profile.availability || 'immediate',
    workMode: profile.workMode || 'hybrid',
    salaryMin: profile.salaryMin || '',
    salaryMax: profile.salaryMax || '',
  })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading) return <main className="loading-state">Chargement de votre profil…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'candidate') return <Navigate replace to="/dashboard" />

  function updateField(event) {
    const { name, value } = event.target
    setForm({ ...form, [name]: value })
  }

  function toggleContract(contract) {
    const selected = form.desiredContractTypes.includes(contract)
    setForm({
      ...form,
      desiredContractTypes: selected
        ? form.desiredContractTypes.filter((item) => item !== contract)
        : [...form.desiredContractTypes, contract],
    })
  }

  async function saveProfile(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await api.patch('/api/profile', {
        ...form,
        salaryMin: Number(form.salaryMin) || 0,
        salaryMax: Number(form.salaryMax) || 0,
      })
      await refreshUser()
      navigate('/onboarding/candidate/skills')
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Impossible d’enregistrer le profil.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <button className="back-link plain-button" onClick={() => navigate('/dashboard')} type="button">Retour</button>
        <strong className="auth-brand">JobSwipe</strong>
        <span className="step-label">Étape 1 sur 5</span>
      </header>
      <div className="step-progress"><span /></div>

      <section className="onboarding-card" aria-labelledby="candidate-profile-title">
        <p className="eyebrow">Profil candidat</p>
        <h1 id="candidate-profile-title">Complétez votre profil</h1>
        <p className="intro">Ces informations permettront de calculer votre compatibilité avec les offres.</p>
        <form className="auth-form" onSubmit={saveProfile}>
          <div className="field-grid">
            <label>Prénom<input name="firstName" onChange={updateField} required value={form.firstName} /></label>
            <label>Nom<input name="lastName" onChange={updateField} required value={form.lastName} /></label>
          </div>
          <label>Titre du poste recherché<input name="title" onChange={updateField} placeholder="Développeur Fullstack" required value={form.title} /></label>
          <div className="field-grid">
            <label>Localisation<input name="location" onChange={updateField} placeholder="Paris" required value={form.location} /></label>
            <label>Expérience
              <select name="experience" onChange={updateField} value={form.experience}>
                <option>Moins d&apos;1 an</option>
                <option>1 à 3 ans</option>
                <option>3 à 6 ans</option>
                <option>Plus de 6 ans</option>
              </select>
            </label>
          </div>
          <fieldset>
            <legend>Types de contrat recherchés</legend>
            <div className="choice-list">
              {contracts.map((contract) => (
                <button className={form.desiredContractTypes.includes(contract) ? 'choice selected' : 'choice'} key={contract} onClick={(event) => { event.preventDefault(); toggleContract(contract) }} type="button">
                  {contract}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Mode de travail</legend>
            <div className="choice-list">
              {[
                ['onsite', 'Sur site'],
                ['hybrid', 'Hybride'],
                ['remote', 'Télétravail total'],
              ].map(([value, label]) => (
                <button className={form.workMode === value ? 'choice selected' : 'choice'} key={value} onClick={() => setForm({ ...form, workMode: value })} type="button">{label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Disponibilité</legend>
            <div className="choice-list">
              {[
                ['immediate', 'Immédiate'],
                ['within1Month', 'Sous 1 mois'],
                ['within3Months', 'Sous 3 mois'],
              ].map(([value, label]) => (
                <button className={form.availability === value ? 'choice selected' : 'choice'} key={value} onClick={() => setForm({ ...form, availability: value })} type="button">{label}</button>
              ))}
            </div>
          </fieldset>
          <div className="field-grid">
            <label>Salaire minimum<input min="0" name="salaryMin" onChange={updateField} type="number" value={form.salaryMin} /></label>
            <label>Salaire maximum<input min="0" name="salaryMax" onChange={updateField} type="number" value={form.salaryMax} /></label>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={isSaving} type="submit">{isSaving ? 'Enregistrement…' : 'Continuer vers les compétences'}</button>
        </form>
      </section>
    </main>
  )
}

export default CandidateProfilePage