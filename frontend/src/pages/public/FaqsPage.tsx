import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import '../../styles/public.css'

const FAQ_DATA = [
  {
    category: 'General',
    items: [
      { q: 'What is NextGen Medical Mastery?', a: 'NextGen is a premium online platform for medical board exam preparation. We offer live sessions with board-certified physicians, recorded session libraries, downloadable study materials, and progress tracking tools.' },
      { q: 'Which exams do you cover?', a: 'We currently focus on USMLE Step 1 and Step 2 CK. We are actively expanding to cover additional board exams and specialties.' },
      { q: 'Who are the teachers?', a: 'All our instructors are board-certified physicians who have passed the exams they teach. Each teacher undergoes a rigorous approval process before being granted access to the platform.' },
      { q: 'How many students are in each session?', a: 'We cap cohorts to maintain a small-group feel with maximum interaction. Typically 15–30 students per live session.' },
      { q: 'Is the platform available on mobile?', a: 'Yes. The platform is fully responsive and works on all modern browsers, including mobile and tablet devices.' },
    ],
  },
  {
    category: 'Payments',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards through our secure Stripe payment gateway.' },
      { q: 'What is the difference between upfront and installment payment?', a: 'The upfront option is a single one-time payment with a percentage discount applied. The installment option charges you monthly and you can cancel at any time.' },
      { q: 'Can I cancel my installment subscription?', a: 'Yes. You can unsubscribe from monthly installments at any time from your student dashboard. Access continues until the end of your current billing period.' },
      { q: 'Do you offer refunds?', a: 'We offer a 2-day free demo so you can try the platform before committing. Refund requests after purchase are reviewed case by case — contact support within 48 hours of payment.' },
    ],
  },
  {
    category: 'Sessions',
    items: [
      { q: 'How do I join a live session?', a: 'You will receive a WhatsApp message, email, and in-app notification as soon as a session goes live. Click "Join Session" on your My Classes page to join via embedded Zoom.' },
      { q: 'Are sessions recorded?', a: 'Yes. All sessions are recorded and added to your class library within a few hours. Demo users can only access the same-day recording; full access unlocks the entire archive.' },
      { q: 'What if I miss a live session?', a: 'No problem — the recording is available in your class library. You can also post questions in the notice board for the teacher to address in the next session.' },
      { q: 'Can I change the session timing?', a: 'Session times are managed by your teacher and editor. Any changes require a documented reason. You will be notified immediately if a session is rescheduled.' },
    ],
  },
  {
    category: 'Demo',
    items: [
      { q: 'How long is the free demo?', a: 'The free demo lasts 2 days from when you register. A countdown timer is visible in your dashboard.' },
      { q: 'What can I access during the demo?', a: 'During the demo you can join live sessions, view only the current day\'s recording, and see a preview of the learning roadmap. Full session history and advanced features require enrollment.' },
      { q: 'Does the demo require a credit card?', a: 'No. You can register and start your demo without entering any payment information.' },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`public-faq-item ${open ? 'public-faq-item--open' : ''}`}>
      <button className="public-faq-item__trigger" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <ChevronDown size={17} className="public-faq-item__chevron" />
      </button>
      {open && <div className="public-faq-item__body">{a}</div>}
    </div>
  )
}

export default function FaqsPage() {
  return (
    <>
      <section className="public-page-hero">
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about NextGen Medical Mastery.</p>
      </section>

      <section className="public-section">
        <div className="public-section__inner" style={{ maxWidth: 760 }}>
          {FAQ_DATA.map(cat => (
            <div key={cat.category} className="public-faq-category">
              <h3>{cat.category}</h3>
              {cat.items.map(item => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
