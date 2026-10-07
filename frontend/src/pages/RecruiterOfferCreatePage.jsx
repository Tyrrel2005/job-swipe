import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import api from '../services/api'

const contracts = ['CDI', 'CDD', 'Alternance', 'Stage', 'Freelance', 'Temps partiel']
const degrees = ['Sans diplôme', 'CAP / BEP', 'Bac', 'Bac +2 (BTS / DUT)', 'Bac +3 (Licence)', 'Bac +5 (Master / Ingénieur)', 'Doctorat']
const skills = ['React.js', 'Node.js', 'TypeScript', 'API REST', 'MongoDB', 'PostgreSQL', 'Docker', 'AWS', 'Tests unitaires', 'Git / GitHub']
const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Langue maternelle']

function RecruiterOfferCreatePage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    contractType: 'CDI',
    city: '',
    remoteMode: 'hybrid',
    salaryMin: '',
    salaryMax: '',
    minimumDegree: 'Sans diplôme',
    description: '',
  })
  const [requiredSkills, setRequiredSkills] = useState([])
  const [requiredLanguages, setRequiredLanguages] = useState([])
  const [languageName, setLanguageName] = useState('')
  const [languageLevel, setLanguageLevel] = useState('B2')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading) return <main className="loading-state">Chargement de votre session…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'recruiter') return <Navigate replace to="/dashboard" />

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  function toggleSkill(skill) {
    setRequiredSkills(requiredSkills.includes(skill)
      ? requiredSkills.filter((item) => item !== skill)
      : [...requiredSkills, skill])
  }

  function addLanguage() {
    if (!languageName || requiredLanguages.some((language) => language.name === languageName)) return
    setRequiredLanguages([...requiredLanguages, { name: languageName, level: languageLevel }])
    setLanguageName('')
  }

  async function publishOffer(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await api.post('/api/jobs', {
        ...form,
        salaryMin: Number(form.salaryMin) || 0,
        salaryMax: Number(form.salaryMax) || 0,
        requiredSkills,
        requiredLanguages,
      })
      navigate('/dashboard')
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Impossible de publier cette offre.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <button className="back-link plain-button" onClick={() => navigate('/dashboard')} type="button">Annuler</button>
        <strong className="auth-brand">JobSwipe</strong>
        <span className="step-label">Nouvelle offre</span>
      </header>
      <section className="onboarding-card offer-form-card" aria-labelledby="new-offer-title">
        <p className="eyebrow recruiter-eyebrow">Console recruteur</p>
        <h1 id="new-offer-title">Publier une offre</h1>
        <p className="intro">Les candidats verront votre offre et son score de compatibilité calculé à partir de ces critères.</p>
        <form className="auth-form" onSubmit={publishOffer}>
          <label>Intitulé du poste<input name="title" onChange={updateField} placeholder="Développeur Fullstack Senior" required value={form.title} /></label>
          <fieldset>
            <legend>Type de contrat</legend>
            <div className="choice-list">{contracts.map((contract) => <button className={form.contractType === contract ? 'choice selected recruiter-choice' : 'choice'} key={contract} onClick={() => setForm({ ...form, contractType: contract })} type="button">{contract}</button>)}</div>
          </fieldset>
          <div className="field-grid">
            <label>Ville<input name="city" onChange={updateField} placeholder="Paris" required value={form.city} /></label>
            <label>Télétravail
              <select name="remoteMode" onChange={updateField} value={form.remoteMode}>
                <option value="onsite">Sur site</option>
                <option value="hybrid">Hybride</option>
                <option value="remote">Télétravail total</option>
              </select>
            </label>
          </div>
          <div className="field-grid">
            <label>Salaire minimum<input min="0" name="salaryMin" onChange={updateField} required type="number" value={form.salaryMin} /></label>
            <label>Salaire maximum<input min="0" name="salaryMax" onChange={updateField} required type="number" value={form.salaryMax} /></label>
          </div>
          <label>Niveau d’études minimum
            <select name="minimumDegree" onChange={updateField} value={form.minimumDegree}>{degrees.map((degree) => <option key={degree}>{degree}</option>)}</select>
          </label>
          <fieldset>
            <legend>Compétences requises</legend>
            <div className="choice-list">{skills.map((skill) => <button className={requiredSkills.includes(skill) ? 'choice selected recruiter-choice' : 'choice'} key={skill} onClick={() => toggleSkill(skill)} type="button">{requiredSkills.includes(skill) ? '✓ ' : '+ '}{skill}</button>)}</div>
          </fieldset>
          <fieldset>
            <legend>Langues attendues</legend>
            <div className="language-list">{requiredLanguages.map((language, index) => <div className="language-row" key={language.name}><strong>{language.name}</strong><select aria-label={`Niveau ${language.name}`} onChange={(event) => setRequiredLanguages(requiredLanguages.map((item, itemIndex) => itemIndex === index ? { ...item, level: event.target.value } : item))} value={language.level}>{levels.map((level) => <option key={level}>{level}</option>)}</select><button className="remove-language" onClick={() => setRequiredLanguages(requiredLanguages.filter((_, itemIndex) => itemIndex !== index))} type="button">Supprimer</button></div>)}</div>
            <div className="language-add"><select aria-label="Nouvelle langue" onChange={(event) => setLanguageName(event.target.value)} value={languageName}><option value="">Ajouter une langue…</option><option>Français</option><option>Anglais</option><option>Espagnol</option><option>Allemand</option></select><select aria-label="Niveau de la nouvelle langue" onChange={(event) => setLanguageLevel(event.target.value)} value={languageLevel}>{levels.map((level) => <option key={level}>{level}</option>)}</select><button className="choice selected recruiter-choice" onClick={addLanguage} type="button">Ajouter</button></div>
          </fieldset>
          <label>Missions et description<textarea className="bio-input" maxLength="5000" name="description" onChange={updateField} placeholder="Décrivez les missions, l’équipe et les attentes…" required value={form.description} /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit recruiter-submit" disabled={isSaving} type="submit">{isSaving ? 'Publication…' : 'Publier l’offre'}</button>
        </form>
      </section>
    </main>
  )
}

export default RecruiterOfferCreatePage