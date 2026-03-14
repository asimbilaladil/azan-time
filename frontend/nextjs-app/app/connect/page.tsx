'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || '/api'

const PRAYERS_DEMO = [
  { ar: 'الفجر', en: 'FAJR',    time: '05:14' },
  { ar: 'الظهر', en: 'DHUHR',   time: '12:38' },
  { ar: 'العصر', en: 'ASR',     time: '15:52' },
  { ar: 'المغرب', en: 'MAGHRIB', time: '18:29' },
  { ar: 'العشاء', en: 'ISHA',   time: '20:05' },
]

const BENEFITS = [
  {
    icon: '🔔',
    title: 'Never Miss a Prayer',
    desc: 'The Adhan plays automatically on your Alexa device at the exact time of every prayer — no reminders needed.',
  },
  {
    icon: '🕌',
    title: 'Your Mosque\'s Times',
    desc: 'Select any mosque worldwide from my-masjid.com and get prayer times specific to your local masjid.',
  },
  {
    icon: '🗣️',
    title: 'Beautiful Adhan Audio',
    desc: 'A full, high-quality Adhan recitation plays through your Alexa speaker for each of the five daily prayers.',
  },
  {
    icon: '⚙️',
    title: 'Fully Automatic',
    desc: 'Set it once and forget it. The scheduler runs 24/7 and handles timezone, token refresh, and timing automatically.',
  },
]

const STEPS = [
  { n: '01', title: 'Connect Amazon', desc: 'Sign in with your Amazon account to link your Alexa devices.' },
  { n: '02', title: 'Choose Your Mosque', desc: 'Search and select your local mosque to get accurate prayer times.' },
  { n: '03', title: 'Enable the Skill', desc: 'Enable the Azan Time skill in the Alexa app and set up a routine.' },
  { n: '04', title: 'Hear the Adhan', desc: 'The Adhan will play automatically on your Echo at every prayer.' },
]

function LandingContent() {
  const params = useSearchParams()
  const router = useRouter()
  const tokenParam = params.get('token')

  useEffect(() => {
    if (tokenParam) localStorage.setItem('jwt', tokenParam)
    const jwt = localStorage.getItem('jwt')
    if (jwt) router.replace('/dashboard')
  }, [tokenParam])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cinzel:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .land-root {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at 15% 10%, rgba(139,101,30,0.18) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 90%, rgba(10,80,45,0.3) 0%, transparent 50%),
            linear-gradient(160deg, #1a3d28 0%, #0f2318 50%, #132d1e 100%);
          color: #e8dfc0;
          font-family: 'Cormorant Garamond', serif;
          overflow-x: hidden;
          position: relative;
        }

        /* Grid pattern */
        .land-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(201,168,76,0.04) 59px, rgba(201,168,76,0.04) 60px),
            repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(201,168,76,0.04) 59px, rgba(201,168,76,0.04) 60px);
          pointer-events: none;
          z-index: 0;
        }

        /* Decorative circles */
        .deco-circle-1 {
          position: absolute;
          top: -120px; right: -120px;
          width: 480px; height: 480px;
          border-radius: 50%;
          border: 60px solid rgba(201,168,76,0.07);
          pointer-events: none;
        }
        .deco-circle-2 {
          position: absolute;
          bottom: -80px; left: -80px;
          width: 360px; height: 360px;
          border-radius: 50%;
          border: 50px solid rgba(201,168,76,0.06);
          pointer-events: none;
        }

        .land-inner {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* NAV */
        .land-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 0 0;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nav-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #c9a84c, #8b6a1e);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          box-shadow: 0 0 16px rgba(201,168,76,0.3);
        }

        .nav-logo-text {
          font-family: 'Cinzel', serif;
          font-size: 1.1rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          color: #c9a84c;
        }

        .nav-link {
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          color: rgba(201,168,76,0.6);
          text-decoration: none;
          border: 1px solid rgba(201,168,76,0.25);
          padding: 8px 18px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .nav-link:hover {
          color: #c9a84c;
          border-color: rgba(201,168,76,0.5);
          background: rgba(201,168,76,0.06);
        }

        /* HERO */
        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
          padding: 80px 0 60px;
        }

        @media (max-width: 800px) {
          .hero { grid-template-columns: 1fr; gap: 40px; padding: 50px 0 40px; }
          .hero-right { display: none; }
        }

        .hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .eyebrow-line {
          height: 1px;
          width: 40px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5));
        }

        .eyebrow-text {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.3em;
          color: rgba(201,168,76,0.6);
          text-transform: uppercase;
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 4.5rem;
          font-weight: 300;
          line-height: 1.05;
          color: #f0e8cc;
          margin-bottom: 8px;
        }

        .hero-title em {
          font-style: italic;
          color: #c9a84c;
        }

        .hero-subtitle {
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 1.6rem;
          color: rgba(201,168,76,0.5);
          direction: rtl;
          margin-bottom: 24px;
          font-weight: 400;
        }

        .hero-desc {
          font-size: 1.1rem;
          color: rgba(232,223,192,0.55);
          line-height: 1.7;
          max-width: 440px;
          margin-bottom: 36px;
          font-weight: 300;
        }

        .hero-cta {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 15px 32px;
          background: linear-gradient(135deg, #c9a84c, #8b6a1e);
          border: none;
          border-radius: 12px;
          color: #0a1f14;
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.25s;
          box-shadow: 0 6px 24px rgba(201,168,76,0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 36px rgba(201,168,76,0.45);
        }

        .btn-primary svg { width: 18px; height: 18px; }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 15px 28px;
          background: transparent;
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 12px;
          color: rgba(232,223,192,0.7);
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          border-color: rgba(201,168,76,0.5);
          color: #c9a84c;
          background: rgba(201,168,76,0.05);
        }

        .hero-note {
          margin-top: 14px;
          font-size: 0.75rem;
          color: rgba(232,223,192,0.3);
          letter-spacing: 0.05em;
        }

        /* PRAYER CARD (hero right) */
        .prayer-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 20px;
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
        }

        .prayer-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent);
        }

        .prayer-card-label {
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          letter-spacing: 0.25em;
          color: rgba(201,168,76,0.45);
          text-align: center;
          margin-bottom: 18px;
          text-transform: uppercase;
        }

        .prayer-card-mosque {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(201,168,76,0.06);
          border-radius: 10px;
          border: 1px solid rgba(201,168,76,0.12);
          margin-bottom: 20px;
        }

        .prayer-card-mosque-name {
          font-size: 0.85rem;
          color: rgba(232,223,192,0.7);
        }

        .prayer-demo-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 6px;
          border-bottom: 1px solid rgba(201,168,76,0.07);
        }

        .prayer-demo-row:last-child { border-bottom: none; }

        .prayer-demo-ar {
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 1rem;
          color: rgba(232,223,192,0.6);
          direction: rtl;
        }

        .prayer-demo-en {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          color: rgba(201,168,76,0.5);
        }

        .prayer-demo-time {
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          color: rgba(232,223,192,0.7);
          letter-spacing: 0.05em;
        }

        .prayer-demo-row.highlight .prayer-demo-ar { color: #c9a84c; }
        .prayer-demo-row.highlight .prayer-demo-en { color: rgba(201,168,76,0.8); }
        .prayer-demo-row.highlight .prayer-demo-time { color: #c9a84c; }
        .prayer-demo-row.highlight {
          background: rgba(201,168,76,0.06);
          border-radius: 8px;
          padding: 10px 10px;
          margin: 0 -4px;
        }

        .playing-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.25);
          border-radius: 4px;
          padding: 2px 8px;
          font-family: 'Cinzel', serif;
          font-size: 0.55rem;
          letter-spacing: 0.1em;
          color: #4ade80;
        }

        .playing-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse-dot 1.2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        /* DIVIDER */
        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent);
          margin: 20px 0 60px;
        }

        /* BENEFITS */
        .benefits-label {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.3em;
          color: rgba(201,168,76,0.45);
          text-align: center;
          margin-bottom: 14px;
          text-transform: uppercase;
        }

        .benefits-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.6rem;
          font-weight: 300;
          text-align: center;
          color: #f0e8cc;
          margin-bottom: 48px;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 80px;
        }

        @media (max-width: 900px) { .benefits-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px) { .benefits-grid { grid-template-columns: 1fr; } }

        .benefit-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
          border: 1px solid rgba(201,168,76,0.14);
          border-radius: 16px;
          padding: 24px 20px;
          position: relative;
          overflow: hidden;
        }

        .benefit-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent);
        }

        .benefit-icon {
          font-size: 1.8rem;
          margin-bottom: 14px;
        }

        .benefit-title {
          font-family: 'Cinzel', serif;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          color: #c9a84c;
          margin-bottom: 10px;
        }

        .benefit-desc {
          font-size: 0.88rem;
          color: rgba(232,223,192,0.45);
          line-height: 1.65;
          font-weight: 300;
        }

        /* HOW IT WORKS */
        .steps-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.6rem;
          font-weight: 300;
          text-align: center;
          color: #f0e8cc;
          margin-bottom: 48px;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          position: relative;
          margin-bottom: 80px;
        }

        .steps-grid::before {
          content: '';
          position: absolute;
          top: 28px; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.2), rgba(201,168,76,0.2), transparent);
        }

        @media (max-width: 700px) {
          .steps-grid { grid-template-columns: 1fr 1fr; }
          .steps-grid::before { display: none; }
        }

        .step-item {
          text-align: center;
          padding: 0 16px;
          position: relative;
        }

        .step-num {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05));
          border: 1px solid rgba(201,168,76,0.3);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          font-weight: 600;
          color: #c9a84c;
          letter-spacing: 0.05em;
          position: relative;
          z-index: 1;
          background-clip: padding-box;
        }

        .step-title {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: #e8dfc0;
          margin-bottom: 10px;
        }

        .step-desc {
          font-size: 0.83rem;
          color: rgba(232,223,192,0.4);
          line-height: 1.6;
          font-weight: 300;
        }

        /* BOTTOM CTA */
        .bottom-cta {
          text-align: center;
          padding: 60px 24px;
          background: linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02));
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 24px;
          position: relative;
          overflow: hidden;
        }

        .bottom-cta::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent);
        }

        .bottom-cta-ar {
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 1.8rem;
          color: rgba(201,168,76,0.4);
          margin-bottom: 16px;
          direction: rtl;
        }

        .bottom-cta-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          font-weight: 300;
          color: #f0e8cc;
          margin-bottom: 12px;
        }

        .bottom-cta-desc {
          font-size: 1rem;
          color: rgba(232,223,192,0.45);
          margin-bottom: 32px;
          font-weight: 300;
        }

        /* FOOTER */
        .land-footer {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid rgba(201,168,76,0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-copy {
          font-size: 0.75rem;
          color: rgba(232,223,192,0.25);
          letter-spacing: 0.05em;
        }

        .footer-links {
          display: flex;
          gap: 20px;
        }

        .footer-link {
          font-family: 'Cinzel', serif;
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          color: rgba(201,168,76,0.35);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-link:hover { color: rgba(201,168,76,0.7); }
      `}</style>

      <div className="land-root">
        <div className="deco-circle-1" />
        <div className="deco-circle-2" />

        <div className="land-inner">

          {/* NAV */}
          <nav className="land-nav">
            <div className="nav-logo">
              <div className="nav-logo-icon">🕌</div>
              <div>
                <div className="nav-logo-text">AZAN TIME</div>
              </div>
            </div>
            <a href={`${API}/auth/lwa`} className="nav-link">SIGN IN →</a>
          </nav>

          {/* HERO */}
          <section className="hero">
            <div className="hero-left">
              <div className="hero-eyebrow">
                <div className="eyebrow-line" />
                <div className="eyebrow-text">Automatic Adhan for Alexa</div>
              </div>

              <h1 className="hero-title">
                Azan<br /><em>Time</em>
              </h1>

              <div className="hero-subtitle">أذان تلقائي على أليكسا</div>

              <p className="hero-desc">
                Hear the Adhan automatically on your Amazon Alexa device at every one of the five daily prayers — based on your local mosque's exact times.
              </p>

              <div className="hero-cta">
                <a href={`${API}/auth/lwa`} className="btn-primary">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.98 8.44c-.36-3.4-3.24-6.04-6.74-6.04-2.52 0-4.72 1.38-5.9 3.42C4.42 6.22 2.5 8.38 2.5 11c0 2.9 2.36 5.25 5.27 5.25h11c2.62 0 4.73-2.1 4.73-4.69 0-2.48-1.94-4.5-4.52-4.12z"/>
                  </svg>
                  Connect with Amazon
                </a>
                <a href="https://www.amazon.de/dp/B0GS1SD9LF/" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                  🔔 Enable Skill
                </a>
              </div>
              <div className="hero-note">Free · Secure · No passwords stored</div>
            </div>

            <div className="hero-right">
              <div className="prayer-card">
                <div className="prayer-card-label">Today's Prayer Times</div>
                <div className="prayer-card-mosque">
                  <span style={{ fontSize: '1.2rem' }}>🕌</span>
                  <span className="prayer-card-mosque-name">Your Local Mosque</span>
                </div>
                {PRAYERS_DEMO.map((p, i) => (
                  <div key={p.en} className={`prayer-demo-row${i === 2 ? ' highlight' : ''}`}>
                    <div>
                      <div className="prayer-demo-ar">{p.ar}</div>
                      <div className="prayer-demo-en">{p.en}</div>
                    </div>
                    {i === 2 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="playing-badge">
                          <span className="playing-dot" />
                          PLAYING
                        </span>
                        <span className="prayer-demo-time">{p.time}</span>
                      </div>
                    ) : (
                      <div className="prayer-demo-time">{p.time}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="section-divider" />

          {/* BENEFITS */}
          <div className="benefits-label">Why Azan Time</div>
          <h2 className="benefits-title">Everything you need, nothing you don't</h2>

          <div className="benefits-grid">
            {BENEFITS.map((b) => (
              <div key={b.title} className="benefit-card">
                <div className="benefit-icon">{b.icon}</div>
                <div className="benefit-title">{b.title}</div>
                <div className="benefit-desc">{b.desc}</div>
              </div>
            ))}
          </div>

          {/* HOW IT WORKS */}
          <div className="benefits-label">Setup</div>
          <h2 className="steps-title">Up and running in minutes</h2>

          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.n} className="step-item">
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* BOTTOM CTA */}
          <div className="bottom-cta">
            <div className="bottom-cta-ar">حي على الصلاة</div>
            <div className="bottom-cta-title">Ready to begin?</div>
            <div className="bottom-cta-desc">Connect your Amazon account and never miss a prayer again.</div>
            <a href={`${API}/auth/lwa`} className="btn-primary" style={{ display: 'inline-flex' }}>
              Connect with Amazon →
            </a>
          </div>

          {/* FOOTER */}
          <footer className="land-footer">
            <div className="footer-copy">© 2026 Azan Time · azantime.de</div>
            <div className="footer-links">
              <a href="/privacy" className="footer-link">PRIVACY</a>
              <a href="/terms" className="footer-link">TERMS</a>
              <a href="https://www.amazon.de/dp/B0GS1SD9LF/" target="_blank" rel="noopener noreferrer" className="footer-link">ALEXA SKILL</a>
            </div>
          </footer>

        </div>
      </div>
    </>
  )
}

export default function ConnectPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f2318', color: '#c9a84c', fontFamily: 'serif', fontSize: '1.2rem', letterSpacing: '0.2em' }}>
        بسم الله...
      </div>
    }>
      <LandingContent />
    </Suspense>
  )
}
