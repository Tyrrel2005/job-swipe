import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Bottom navigation bar — 4 tabs :
 *  - Découvrir  → /discover
 *  - Dashboard  → /dashboard
 *  - Chat       → /messages
 *  - Profil     → /profile
 *
 * @param {{ badge?: number }} props  badge = unread count on Chat tab
 */
function BottomNav({ badge = 0 }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const tabs = [
    { label: 'Découvrir', path: '/discover', icon: '🔍' },
    { label: 'Dashboard', path: '/dashboard', icon: '◫' },
    { label: 'Chat', path: '/messages', icon: '💬' },
    { label: 'Profil', path: '/profile', icon: '👤' },
  ]

  return (
    <nav aria-label="Navigation principale" className="bottom-nav">
      {tabs.map(({ label, path, icon }) => {
        const active = pathname === path || (path === '/dashboard' && pathname === '/matches')
        const showBadge = label === 'Chat' && badge > 0

        return (
          <button
            aria-current={active ? 'page' : undefined}
            className={active ? 'bottom-nav-item active' : 'bottom-nav-item'}
            key={path}
            onClick={() => navigate(path)}
            type="button"
          >
            <span aria-hidden="true" className="bottom-nav-icon">{icon}</span>
            {showBadge && (
              <span aria-label={`${badge} non lus`} className="bottom-nav-badge">{badge}</span>
            )}
            <small>{label}</small>
            {active && <span aria-hidden="true" className="bottom-nav-dot" />}
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav
