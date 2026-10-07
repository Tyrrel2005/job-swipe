import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import api from '../services/api'

const skillGroups = {
  frontend: ['React.js', 'Next.js', 'TypeScript', 'Vue.js', 'JavaScript ES6+', 'HTML / CSS', 'Tailwind CSS', 'Redux'],
  backend: ['Node.js', 'Express.js', 'API REST', 'Socket.IO', 'NestJS', 'Python / Django', 'JWT / bcrypt'],
  data: ['MongoDB', 'Mongoose', 'PostgreSQL', 'MySQL', 'Redis', 'SQL', 'Modélisation de données'],
  infrastructure: ['Docker', 'Kubernetes', 'Linux', 'Nginx', 'AWS', 'CI/CD', 'Cybersécurité'],
  tools: ['Git / GitHub', 'Figma', 'Jira', 'Postman', 'Tests unitaires', 'Méthode Agile'],
}

const groupLabels = {
  all: 'Toutes',
  frontend: 'Frontend',
  backend: 'Backend',
  data: 'Bases de données',
  infrastructure: 'Réseau & Infrastructure',
  tools: 'Outils',
}

function CandidateSkillsPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [selectedSkills, setSelectedSkills] = useState(user?.candidateProfile?.skills || [])
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const visibleGroups = useMemo(() => Object.entries(skillGroups)
    .filter(([key]) => category === 'all' || key === category)
    .map(([key, skills]) => [key, skills.filter((skill) => skill.toLowerCase().includes(query.toLowerCase()))])
    .filter(([, skills]) => skills.length > 0), [category, query])

  if (isLoading) return <main className="loading-state">Chargement de votre profil…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'candidate') return <Navigate replace to="/dashboard" />

  function toggleSkill(skill) {
    setSelectedSkills((current) => current.includes(skill)
      ? current.filter((item) => item !== skill)
      : [...current, skill])
  }

  async function saveSkills() {
    if (selectedSkills.length < 3) {
      setError('Sélectionnez au moins 3 compétences.')
      return
    }

    setError('')
    setIsSaving(true)

    try {
      await api.patch('/api/profile', { skills: selectedSkills })
      await refreshUser()
      navigate('/onboarding/candidate/education')
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Impossible d’enregistrer vos compétences.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <button className="back-link plain-button" onClick={() => navigate('/onboarding/candidate/profile')} type="button">Retour</button>
        <strong className="auth-brand">JobSwipe</strong>
        <span className="step-label">Étape 2 sur 5</span>
      </header>
      <div className="step-progress"><span className="step-progress-half" /></div>

      <section className="onboarding-card skills-card" aria-labelledby="skills-title">
        <p className="eyebrow">Profil candidat</p>
        <h1 id="skills-title">Choisissez vos compétences</h1>
        <p className="intro">Sélectionnez au moins trois compétences pour alimenter votre score de compatibilité.</p>

        <label className="skill-search">
          Rechercher une compétence
          <input onChange={(event) => setQuery(event.target.value)} placeholder="React, Node.js, Docker…" value={query} />
        </label>

        <div className="skill-categories" role="tablist" aria-label="Catégories de compétences">
          {Object.entries(groupLabels).map(([key, label]) => (
            <button className={category === key ? 'choice selected' : 'choice'} key={key} onClick={() => setCategory(key)} type="button">{label}</button>
          ))}
        </div>

        <div className="skill-groups">
          {visibleGroups.map(([key, skills]) => (
            <section className="skill-group" key={key}>
              <h2>{groupLabels[key]}</h2>
              <div className="choice-list">
                {skills.map((skill) => (
                  <button className={selectedSkills.includes(skill) ? 'choice selected' : 'choice'} key={skill} onClick={() => toggleSkill(skill)} type="button">
                    {selectedSkills.includes(skill) ? '✓ ' : '+ '}{skill}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="selected-skills" aria-live="polite">
          <strong>{selectedSkills.length} compétence{selectedSkills.length > 1 ? 's' : ''} sélectionnée{selectedSkills.length > 1 ? 's' : ''}</strong>
          <div className="choice-list">
            {selectedSkills.map((skill) => <span className="selected-skill" key={skill}>{skill}</span>)}
          </div>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" disabled={isSaving || selectedSkills.length < 3} onClick={saveSkills} type="button">
          {isSaving ? 'Enregistrement…' : 'Enregistrer mes compétences'}
        </button>
      </section>
    </main>
  )
}

export default CandidateSkillsPage