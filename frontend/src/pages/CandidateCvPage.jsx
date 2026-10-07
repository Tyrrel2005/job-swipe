import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import api from '../services/api'

const MAX_FILE_SIZE = 5 * 1024 * 1024

function CandidateCvPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading) return <main className="loading-state">Chargement de votre profil…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'candidate') return <Navigate replace to="/dashboard" />

  function selectFile(event) {
    const selectedFile = event.target.files?.[0]
    setError('')

    if (!selectedFile) return
    if (selectedFile.type !== 'application/pdf' || !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setFile(null)
      setError('Le CV doit être un fichier PDF.')
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null)
      setError('Le CV ne doit pas dépasser 5 Mo.')
      return
    }

    setFile(selectedFile)
  }

  async function uploadCv(event) {
    event.preventDefault()
    if (!file) {
      setError('Sélectionnez un fichier PDF avant de continuer.')
      return
    }

    setError('')
    setIsSaving(true)
    const formData = new FormData()
    formData.append('cv', file)

    try {
      await api.post('/api/profile/cv', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshUser()
      navigate('/dashboard')
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Impossible d’envoyer votre CV.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <button className="back-link plain-button" onClick={() => navigate('/onboarding/candidate/bio')} type="button">Retour</button>
        <strong className="auth-brand">JobSwipe</strong>
        <span className="step-label">Étape 5 sur 5</span>
      </header>
      <div className="step-progress"><span className="step-progress-full" /></div>

      <section className="onboarding-card" aria-labelledby="cv-title">
        <p className="eyebrow">Profil candidat</p>
        <h1 id="cv-title">Ajoutez votre CV</h1>
        <p className="intro">Votre CV reste privé. Seul un recruteur ayant accepté votre candidature pourra le consulter.</p>
        <form className="auth-form" onSubmit={uploadCv}>
          <label className="cv-dropzone">
            <span className="cv-icon" aria-hidden="true">PDF</span>
            <strong>{file ? file.name : 'Choisir un fichier PDF'}</strong>
            <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} Mo` : 'PDF uniquement · 5 Mo maximum'}</small>
            <input accept="application/pdf,.pdf" onChange={selectFile} type="file" />
          </label>
          <div className="cv-rules">
            <p>Authentification requise avant l’envoi</p>
            <p>Contrôle du type PDF et de la taille côté navigateur et serveur</p>
            <p>Remplacer un CV supprime l’ancien fichier</p>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={isSaving} type="submit">{isSaving ? 'Envoi en cours…' : 'Enregistrer mon CV'}</button>
          <button className="skip-button" onClick={() => navigate('/dashboard')} type="button">Ajouter mon CV plus tard</button>
        </form>
      </section>
    </main>
  )
}

export default CandidateCvPage