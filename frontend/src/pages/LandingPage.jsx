import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <main className="app-shell">
      <section className="setup-card" aria-labelledby="app-title">
        <div className="brand-mark" aria-hidden="true">JS</div>
        <p className="eyebrow">Plateforme de matching professionnel</p>
        <h1 id="app-title">JobSwipe</h1>
        <p className="intro">
          Le recrutement par intérêt réciproque, maintenant sur une base React prête à connecter au backend.
        </p>
        <div className="status-row" role="status">
          <span className="status-dot" aria-hidden="true" />
          Frontend React initialisé
        </div>
        <div className="stack-list">
          <span>Vite</span>
          <span>React</span>
          <span>Tailwind CSS</span>
          <span>API REST</span>
        </div>
        <div className="landing-actions">
          <Link className="primary-action" to="/auth?mode=signup">Créer un compte</Link>
          <Link className="secondary-action" to="/auth?mode=login">Se connecter</Link>
        </div>
      </section>
    </main>
  )
}

export default LandingPage