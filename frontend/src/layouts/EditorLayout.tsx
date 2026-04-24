import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Calendar, Eye, LogOut, Menu, X, Pencil } from 'lucide-react'
import { useEditorAuth } from '../context/EditorAuthContext'
import './EditorLayout.css'

const EDITOR_NAV_ITEMS = [
  { to: '/editor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/editor/sessions', label: 'Sessions', icon: Calendar },
  { to: '/editor/supervision', label: 'Supervision', icon: Eye },
]

export default function EditorLayout() {
  const { editor, logout } = useEditorAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/editor/login')
  }

  return (
    <div className={`editor-layout ${mobileOpen ? 'editor-layout--mobile-open' : ''}`}>
      {mobileOpen && <button className="editor-layout__overlay" onClick={() => setMobileOpen(false)} />}

      <aside className="editor-sidebar">
        <div className="editor-sidebar__brand">
          <div className="editor-sidebar__logo-wrap">
            <img src="/logo.png" alt="NextGen" className="editor-sidebar__logo" />
            <div>
              <strong>NextGen</strong>
              <span>Editor Portal</span>
            </div>
          </div>
          <button className="editor-sidebar__close" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="editor-sidebar__role-badge">
          <Pencil size={13} />
          <strong>Editor</strong>
        </div>

        <nav className="editor-sidebar__nav">
          {EDITOR_NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `editor-sidebar__link ${isActive ? 'editor-sidebar__link--active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="editor-sidebar__bottom">
          <div className="editor-sidebar__user">
            <div className="editor-sidebar__avatar">
              {editor?.name?.[0]?.toUpperCase() ?? 'E'}
            </div>
            <div>
              <strong>{editor?.name ?? 'Editor'}</strong>
              <span>{editor?.email}</span>
            </div>
          </div>
          <button className="editor-sidebar__logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <section className="editor-main">
        <header className="editor-topbar">
          <button className="editor-topbar__menu" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="editor-topbar__meta">
            <span className="editor-topbar__title">Editor Portal</span>
            <span className="editor-topbar__subtitle">Manage sessions and supervise activity</span>
          </div>
          <div className="editor-topbar__badge">
            <Pencil size={13} />
            <span>Editor</span>
          </div>
        </header>
        <main className="editor-content">
          <Outlet />
        </main>
      </section>
    </div>
  )
}
