import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import api from '../services/api'

function RecruiterCompanyPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [logoUrl, setLogoUrl] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isLogoViewerOpen, setIsLogoViewerOpen] = useState(false)
  const profile = user?.recruiterProfile || {}

  useEffect(() => {
    if (!profile.companyLogoUrl) return undefined

    let isActive = true
    let objectUrl = ''
    api.get('/api/profile/company-logo', { responseType: 'blob' })
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data)
        if (isActive) setLogoUrl(objectUrl)
      })
      .catch(() => {
        if (isActive) setLogoUrl('')
      })

    return () => {
      isActive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [profile.companyLogoUrl])

  if (isLoading) return <main className="loading-state">Chargement du profil entreprise…</main>
  if (!user) return <Navigate replace to="/auth?mode=login" />
  if (user.role !== 'recruiter') return <Navigate replace to="/dashboard" />

  async function uploadLogo(event) {
    const logo = event.target.files?.[0]
    if (!logo) return
    setError('')
    setFeedback('')

    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(logo.type) || logo.size > 2 * 1024 * 1024) {
      setError('Le logo doit être au format PNG, JPG ou SVG et ne pas dépasser 2 Mo.')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('logo', logo)
    try {
      await api.post('/api/profile/company-logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshUser()
      setFeedback('Logo de l’entreprise mis à jour.')
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Impossible d’envoyer le logo.')
    } finally {
      setIsUploading(false)
    }
  }

  async function deleteLogo() {
    try {
      await api.delete('/api/profile/company-logo')
      await refreshUser()
      setLogoUrl('')
      setFeedback('Logo supprimé.')
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Impossible de supprimer le logo.')
    }
  }

  return (
    <main className="company-profile-shell">
      <header className="profile-settings-header"><button className="back-link plain-button" onClick={() => navigate('/dashboard')} type="button">Retour</button><strong className="auth-brand">Entreprise</strong><button className="primary-action profile-edit-button recruiter-action" onClick={() => navigate('/onboarding/recruiter/profile')} type="button">Modifier</button></header>
      <section className="company-profile-card">
        <div className="company-profile-hero"><button className={logoUrl ? 'company-logo-large company-logo-clickable' : 'company-logo-large'} onClick={() => logoUrl && setIsLogoViewerOpen(true)} type="button">{logoUrl ? <img alt={`Logo ${profile.companyName}`} src={logoUrl} /> : <span>{profile.companyName?.slice(0, 2).toUpperCase() || 'JS'}</span>}</button><div><p className="eyebrow recruiter-eyebrow">Entreprise vérifiée</p><h1>{profile.companyName || 'Votre entreprise'}</h1><p>{profile.companySector || 'Secteur non renseigné'} · {profile.companySize || 'Effectif non renseigné'} · {profile.companyCity || 'Ville non renseignée'}</p></div></div>
        <div className="company-logo-actions"><label className="secondary-action photo-upload-button">{isUploading ? 'Envoi…' : 'Ajouter ou remplacer le logo'}<input accept="image/png,image/jpeg,image/svg+xml" onChange={uploadLogo} type="file" /></label><span>PNG, JPG ou SVG · 2 Mo maximum</span>{logoUrl && <button className="delete-link" onClick={deleteLogo} type="button">Supprimer</button>}</div>
        {feedback && <p className="feedback-message" role="status">{feedback}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <section className="profile-section"><h2>Informations entreprise</h2><div className="profile-tags"><span>{profile.companySector || 'Secteur non renseigné'}</span><span>{profile.companySize || 'Effectif non renseigné'}</span><span>{profile.companyCity || 'Ville non renseignée'}</span></div></section>
        <section className="profile-section"><h2>Recruteur rattaché</h2><p>{profile.recruiterName || 'Nom non renseigné'} · {profile.recruiterPosition || 'Fonction non renseignée'}</p><p>Délai de réponse annoncé : {profile.responseTime || 'Non renseigné'}</p></section>
      </section>
      {isLogoViewerOpen && <div className="photo-viewer" onClick={() => setIsLogoViewerOpen(false)} role="presentation"><div className="photo-viewer-content" onClick={(event) => event.stopPropagation()}><button className="photo-viewer-close" onClick={() => setIsLogoViewerOpen(false)} type="button">Fermer</button><img alt={`Logo ${profile.companyName} en grand format`} src={logoUrl} /></div></div>}
    </main>
  )
}

export default RecruiterCompanyPage