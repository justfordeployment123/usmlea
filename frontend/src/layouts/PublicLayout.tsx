import { NavLink, Outlet, Link } from 'react-router-dom'
import { GraduationCap, Users } from 'lucide-react'
import './PublicLayout.css'

export default function PublicLayout() {
  return (
    <div className="public-layout">
      <nav className="public-nav">
        <Link to="/" className="public-nav__brand">
          <img src="/logo.png" alt="NextGen" className="public-nav__logo" />
          <div className="public-nav__brand-text">
            <strong>NextGen</strong>
            <span>Medical Mastery</span>
          </div>
        </Link>

        <div className="public-nav__links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `public-nav__link ${isActive ? 'public-nav__link--active' : ''}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `public-nav__link ${isActive ? 'public-nav__link--active' : ''}`
            }
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `public-nav__link ${isActive ? 'public-nav__link--active' : ''}`
            }
          >
            Contact
          </NavLink>
          <NavLink
            to="/faqs"
            className={({ isActive }) =>
              `public-nav__link ${isActive ? 'public-nav__link--active' : ''}`
            }
          >
            FAQs
          </NavLink>
        </div>

        <div className="public-nav__actions">
          <Link to="/student/login" className="public-nav__btn public-nav__btn--outline">
            <Users size={14} />
            Student Login
          </Link>
          <Link to="/teacher/login" className="public-nav__btn public-nav__btn--primary">
            <GraduationCap size={14} />
            Teacher Login
          </Link>
        </div>
      </nav>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-footer__inner">
          <div>
            <div className="public-footer__brand-text">
              <strong>NextGen Medical Mastery</strong>
              <p>Premium live sessions and adaptive study tools for medical board exam preparation.</p>
            </div>
          </div>

          <div className="public-footer__col">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/faqs">FAQs</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="public-footer__col">
            <h4>Access</h4>
            <ul>
              <li><Link to="/student/login">Student Login</Link></li>
              <li><Link to="/student/register">Student Register</Link></li>
              <li><Link to="/teacher/login">Teacher Login</Link></li>
              <li><Link to="/teacher/register">Apply to Teach</Link></li>
            </ul>
          </div>
        </div>

        <div className="public-footer__bottom">
          <span>© {new Date().getFullYear()} NextGen Medical Mastery. All rights reserved.</span>
          <span>Platform for medical education</span>
        </div>
      </footer>
    </div>
  )
}
