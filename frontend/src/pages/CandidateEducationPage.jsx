import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import api from '../services/api'

const degrees = ['Sans diplôme', 'CAP / BEP', 'Bac', 'Bac +2 (BTS / DUT)', 'Bac +3 (Licence)', 'Bac +5 (Master / Ingénieur)', 'Doctorat']
const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Langue maternelle']
const availableLanguages = ['Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Arabe', 'Portugais']

function CandidateEducationPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const profile = user?.candidateProfile || {}
  const [form, setForm] = useState({
    degree: profile.degree || degrees[0],
    diploma: profile.diploma || '',
    school: profile.school || '',
    graduationYear: profile.graduationYear || '',
  })
  const [languages, setLanguages] = useState(profile.languages || [])
  const [languageName, setLanguageName] = useState('')
  const [languageLevel, setLanguageLevel] = useState('B2')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading) return <main className="loading-state">Chargement de votre profil…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'candidate') return <Navigate replace to="/dashboard" />

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  function addLanguage() {
    if (!languageName || languages.some((language) => language.name === languageName)) return
    setLanguages([...languages, { name: languageName, level: languageLevel }])
    setLanguageName('')
  }

  function updateLanguage(index, level) {
    setLanguages(languages.map((language, itemIndex) => itemIndex === index ? { ...language, level } : language))
  }

  function removeLanguage(index) {
    setLanguages(languages.filter((_, itemIndex) => itemIndex !== index))
  }

  async function saveEducation(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await api.patch('/api/profile', {
        ...form,
        graduationYear: Number(form.graduationYear) || null,
        educations: form.diploma || form.school
          ? [{ degree: form.degree, diploma: form.diploma, school: form.school, graduationYear: Number(form.graduationYear) || null }]
          : [],
        languages,
      })
      await refreshUser()
      navigate('/onboarding/candidate/bio')
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Impossible d’enregistrer votre formation.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <button className="back-link plain-button" onClick={() => navigate('/onboarding/candidate/skills')} type="button">Retour</button>
        <strong className="auth-brand">JobSwipe</strong>
        <span className="step-label">Étape 3 sur 5</span>
      </header>
      <div className="step-progress"><span className="step-progress-three" /></div>

      <section className="onboarding-card" aria-labelledby="education-title">
        <p className="eyebrow">Profil candidat</p>
        <h1 id="education-title">Formation et langues</h1>
        <p className="intro">Ces informations aident les recruteurs à comprendre votre parcours et les critères d’offre compatibles.</p>
        <form className="auth-form" onSubmit={saveEducation}>
          <label>Niveau d’études
            <select name="degree" onChange={updateField} value={form.degree}>
              {degrees.map((degree) => <option key={degree}>{degree}</option>)}
            </select>
          </label>
          <label>Diplôme obtenu<input name="diploma" onChange={updateField} placeholder="Master Informatique" value={form.diploma} /></label>
          <div className="field-grid">
            <label>Établissement<input name="school" onChange={updateField} placeholder="Université de Paris" value={form.school} /></label>
            <label>Année d’obtention<input max="2200" min="1900" name="graduationYear" onChange={updateField} type="number" value={form.graduationYear} /></label>
          </div>

          <fieldset>
            <legend>Langues et niveau</legend>
            <div className="language-list">
              {languages.map((language, index) => (
                <div className="language-row" key={language.name}>
                  <strong>{language.name}</strong>
                  <select aria-label={`Niveau ${language.name}`} onChange={(event) => updateLanguage(index, event.target.value)} value={language.level}>
                    {levels.map((level) => <option key={level}>{level}</option>)}
                  </select>
                  <button className="remove-language" onClick={() => removeLanguage(index)} type="button">Supprimer</button>
                </div>
              ))}
            </div>
            <div className="language-add">
              <select aria-label="Nouvelle langue" onChange={(event) => setLanguageName(event.target.value)} value={languageName}>
                <option value="">Ajouter une langue…</option>
                {availableLanguages.filter((language) => !languages.some((item) => item.name === language)).map((language) => <option key={language}>{language}</option>)}
              </select>
              <select aria-label="Niveau de la nouvelle langue" onChange={(event) => setLanguageLevel(event.target.value)} value={languageLevel}>
                {levels.map((level) => <option key={level}>{level}</option>)}
              </select>
              <button className="choice selected" onClick={addLanguage} type="button">Ajouter</button>
            </div>
          </fieldset>

          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={isSaving} type="submit">{isSaving ? 'Enregistrement…' : 'Enregistrer et continuer'}</button>
        </form>
      </section>
    </main>
  )
}

export default CandidateEducationPage