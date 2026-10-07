import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'

import { useAuth } from '../context/useAuth'

function AuthPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, signup } = useAuth()
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login')
  const [role, setRole] = useState('candidate')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSignup = mode === 'signup'

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      let authenticatedUser

      if (isSignup) {
        const [firstName, ...lastNameParts] = form.name.trim().split(/\s+/)
        authenticatedUser = await signup({
          email: form.email,
          password: form.password,
          role,
          ...(role === 'candidate'
            ? { firstName, lastName: lastNameParts.join(' ') }
            : { recruiterName: form.name }),
        })
      } else {
        authenticatedUser = await login({ email: form.email, password: form.password })
      }

      navigate(isSignup && authenticatedUser.role === 'candidate'
        ? '/onboarding/candidate/profile'
        : isSignup && authenticatedUser.role === 'recruiter'
          ? '/onboarding/recruiter/profile'
          : '/dashboard')
    } catch (submissionError) {
      setError(submissionError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <header className="auth-header">
        <Link className="back-link" to="/">Retour</Link>
        <strong className="auth-brand">JobSwipe</strong>
        <span className="auth-help">Aide</span>
      </header>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-tabs" role="tablist" aria-label="Authentification">
          <button className={!isSignup ? 'auth-tab active' : 'auth-tab'} onClick={() => setMode('login')} type="button">
            Connexion
          </button>
          <button className={isSignup ? 'auth-tab active' : 'auth-tab'} onClick={() => setMode('signup')} type="button">
            Inscription
          </button>
        </div>

        <p className="eyebrow">Votre rôle</p>
        <div className="role-grid">
          <button className={role === 'candidate' ? 'role-option selected' : 'role-option'} onClick={() => setRole('candidate')} type="button">
            <span className="role-icon" aria-hidden="true">C</span>
            <span>
              <strong>Candidat</strong>
              <small>Rechercher un emploi</small>
            </span>
          </button>
          <button className={role === 'recruiter' ? 'role-option selected recruiter' : 'role-option recruiter'} onClick={() => setRole('recruiter')} type="button">
            <span className="role-icon" aria-hidden="true">R</span>
            <span>
              <strong>Recruteur</strong>
              <small>Publier des offres</small>
            </span>
          </button>
        </div>

        <div className="auth-heading">
          <h1 id="auth-title">{isSignup ? 'Créer votre compte' : 'Bienvenue sur JobSwipe'}</h1>
          <p>{isSignup ? 'Commencez votre expérience de matching professionnel.' : 'Connectez-vous pour continuer votre recherche.'}</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {isSignup && (
            <label>
              Nom complet
              <input autoComplete="name" name="name" onChange={updateField} placeholder="Alexandre Moreau" required value={form.name} />
            </label>
          )}
          <label>
            Adresse email professionnelle
            <input autoComplete="email" name="email" onChange={updateField} placeholder="alexandre@domaine.fr" required type="email" value={form.email} />
          </label>
          <label>
            Mot de passe sécurisé
            <input autoComplete={isSignup ? 'new-password' : 'current-password'} name="password" onChange={updateField} placeholder="••••••••••••" required type="password" value={form.password} />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit">
            {isSubmitting ? 'Connexion en cours…' : isSignup ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-legal">En continuant, vous acceptez les conditions générales et la politique de confidentialité.</p>
      </section>
    </main>
  )
}

export default AuthPage