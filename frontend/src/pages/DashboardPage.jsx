import { Navigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import CandidateDashboardPage from './CandidateDashboardPage'
import RecruiterDashboardPage from './RecruiterDashboardPage'

function DashboardPage() {
  const { user, isLoading, logout } = useAuth()

  if (isLoading) {
    return <main className="loading-state">Chargement de votre session…</main>
  }

  if (!user) {
    return <Navigate replace to="/auth?mode=login" />
  }

  if (user.role === 'candidate') {
    return <CandidateDashboardPage />
  }

  if (user.role === 'recruiter') {
    return <RecruiterDashboardPage />
  }

  return (
    <main className="dashboard-placeholder">
      <div className="setup-card">
        <p className="eyebrow">Session authentifiée</p>
        <h1>Bonjour {user.email}</h1>
        <p className="intro">Rôle détecté : {user.role}. Le tableau de bord métier sera ajouté dans la prochaine étape.</p>
        <button className="primary-action dashboard-action" onClick={logout} type="button">Se déconnecter</button>
      </div>
    </main>
  )
}

export default DashboardPage