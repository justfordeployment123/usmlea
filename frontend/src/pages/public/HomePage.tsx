import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Video, Users, BarChart3, Shield, ArrowRight, Play } from 'lucide-react'
import { apiRequest } from '../../services/httpClient'
import type { Product } from '../../types/lms'
import '../../styles/public.css'

const FEATURES = [
  {
    icon: Video,
    title: 'Live Expert Sessions',
    desc: 'Join twice-weekly live classes with board-certified physicians via embedded Zoom. Real-time Q&A included.',
  },
  {
    icon: Users,
    title: 'Supervised Learning',
    desc: 'Every student-teacher interaction is supervised for quality. Privacy-first, zero unsanctioned contact.',
  },
  {
    icon: BarChart3,
    title: 'Track Your Progress',
    desc: 'View attendance records, session history, and your personalized learning roadmap all in one dashboard.',
  },
  {
    icon: Shield,
    title: 'Flexible Payment',
    desc: 'Pay upfront with a discount or choose monthly installments. Cancel anytime with no penalties.',
  },
]

const STEPS = [
  { num: 1, title: 'Create an Account', desc: 'Sign up in under 2 minutes. No approval required for students.' },
  { num: 2, title: 'Join Live Sessions', desc: 'Attend classes via embedded Zoom directly in the platform. Get notified via WhatsApp and email.' },
  { num: 3, title: 'Track Your Progress', desc: 'View your attendance, replay recorded sessions, and follow your personalized roadmap.' },
]

const TESTIMONIALS = [
  {
    quote: "The live sessions are incredible. Dr. Carter explains concepts I'd been struggling with for months in a way that finally clicked. Passed Step 1 on my first attempt.",
    name: 'Sarah M.',
    role: 'USMLE Step 1 — 248 score',
  },
  {
    quote: "The recordings are a lifesaver. I replay sessions multiple times and the notice board PDFs are exactly what I need for high-yield revision.",
    name: 'Omar K.',
    role: 'USMLE Step 2 CK student',
  },
  {
    quote: "I was hesitant about the price but the installment option made it accessible. Best investment I made for my boards prep.",
    name: 'Priya R.',
    role: 'Medical student, Year 4',
  },
]

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    apiRequest<{ products: Product[] }>('/products')
      .then(res => setProducts(res.products))
      .catch(() => setProducts([]))
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="public-hero">
        <div className="public-hero__inner">
          <span className="public-hero__eyebrow">
            <Play size={11} />
            Live Online Sessions — Now Enrolling
          </span>
          <h1 className="public-hero__title">
            Master Your Medical Exams<br />
            <span>With Expert Live Sessions</span>
          </h1>
          <p className="public-hero__subtitle">
            Board-certified physicians. Twice-weekly live classes. Recorded sessions.
            Personalized roadmaps. Everything you need to pass USMLE in one platform.
          </p>
          <div className="public-hero__actions">
            <Link to="/student/register" className="public-hero__btn public-hero__btn--primary">
              Start Free Demo
              <ArrowRight size={16} />
            </Link>
            <a href="#products" className="public-hero__btn public-hero__btn--outline">
              View Courses
            </a>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="public-section" id="products">
        <div className="public-section__inner">
          <div className="public-section__header">
            <span className="public-section__eyebrow">Our Programs</span>
            <h2 className="public-section__title">Choose Your Prep Path</h2>
            <p className="public-section__desc">
              Each program is designed by practicing physicians with a proven track record of student success.
            </p>
          </div>

          <div className={`public-card-grid public-card-grid--${products.length > 1 ? products.length : 2}`}>
            {products.length > 0 ? products.map(product => (
              <div key={product.id} className="public-product-card">
                <span className="public-product-card__badge">
                  <Video size={11} />
                  Online Sessions
                </span>
                <h3 className="public-product-card__name">{product.name}</h3>
                <p className="public-product-card__desc">{product.description}</p>

                <div className="public-product-card__pricing">
                  <div className="public-product-card__price-block">
                    <span className="public-product-card__price-label">Upfront</span>
                    <div className="public-product-card__price-value">
                      ${product.upfrontPrice}
                      <span> one-time</span>
                    </div>
                  </div>
                  <div className="public-product-card__price-block">
                    <span className="public-product-card__price-label">Installments</span>
                    <div className="public-product-card__price-value">
                      ${product.installmentAmount}
                      <span>/month × {product.installmentMonths}</span>
                    </div>
                  </div>
                </div>

                <ul className="public-product-card__features">
                  {['Live twice-weekly sessions', 'All sessions recorded', 'Downloadable study materials', 'Direct Q&A with instructor', '2-day free demo included'].map(f => (
                    <li key={f}>
                      <CheckCircle2 size={15} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/student/register" className="public-product-card__cta">
                  Enroll Now
                  <ArrowRight size={15} />
                </Link>
              </div>
            )) : (
              <div className="public-product-card" style={{ opacity: 0.7 }}>
                <span className="public-product-card__badge">Coming Soon</span>
                <h3 className="public-product-card__name">USMLE Online Sessions</h3>
                <p className="public-product-card__desc">Our flagship program is launching soon. Register now to be notified.</p>
                <Link to="/student/register" className="public-product-card__cta">Pre-Register</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="public-section public-section--alt">
        <div className="public-section__inner">
          <div className="public-section__header">
            <span className="public-section__eyebrow">Getting Started</span>
            <h2 className="public-section__title">How It Works</h2>
          </div>
          <div className="public-steps">
            {STEPS.map(step => (
              <div key={step.num} className="public-step">
                <div className="public-step__num">{step.num}</div>
                <h3 className="public-step__title">{step.title}</h3>
                <p className="public-step__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="public-section">
        <div className="public-section__inner">
          <div className="public-section__header">
            <span className="public-section__eyebrow">Why NextGen</span>
            <h2 className="public-section__title">Built for Serious Students</h2>
          </div>
          <div className="public-card-grid public-card-grid--4">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="public-feature-card">
                  <div className="public-feature-card__icon">
                    <Icon size={20} />
                  </div>
                  <h4 className="public-feature-card__title">{f.title}</h4>
                  <p className="public-feature-card__desc">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="public-section public-section--alt">
        <div className="public-section__inner">
          <div className="public-section__header">
            <span className="public-section__eyebrow">Student Stories</span>
            <h2 className="public-section__title">Results Speak for Themselves</h2>
          </div>
          <div className="public-card-grid public-card-grid--3">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="public-testimonial">
                <p className="public-testimonial__quote">"{t.quote}"</p>
                <div className="public-testimonial__author">
                  <div className="public-testimonial__avatar">{t.name[0]}</div>
                  <div>
                    <p className="public-testimonial__name">{t.name}</p>
                    <p className="public-testimonial__role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="public-cta-banner">
        <h2>Ready to Start Your Prep?</h2>
        <p>Join hundreds of students preparing for USMLE with expert live instruction.</p>
        <div className="public-hero__actions">
          <Link to="/student/register" className="public-hero__btn public-hero__btn--primary">
            Register Now — It's Free
            <ArrowRight size={16} />
          </Link>
          <Link to="/contact" className="public-hero__btn public-hero__btn--outline">
            Have Questions?
          </Link>
        </div>
      </section>
    </>
  )
}
