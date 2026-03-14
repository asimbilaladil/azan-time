'use client'
import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || '/api'

const BENEFITS = [
  { icon: '🔔', title: 'Never Miss a Prayer', desc: 'The Azan plays automatically on your Alexa at the exact time of every prayer.' },
  { icon: '🕌', title: 'Your Mosque\'s Times', desc: 'Select any mosque worldwide and get prayer times specific to your local masjid.' },
  { icon: '🗣️', title: 'Beautiful Azan Audio', desc: 'A full high-quality Azan recitation plays through your Alexa speaker.' },
  { icon: '⚙️', title: 'Fully Automatic', desc: 'Set it once and forget it. Runs 24/7 with automatic timezone handling.' },
]

const STEPS = [
  { n: '01', title: 'Connect Amazon', desc: 'Sign in with your Amazon account to link your Alexa devices.' },
  { n: '02', title: 'Choose Mosque', desc: 'Search and select your local mosque for accurate prayer times.' },
  { n: '03', title: 'Enable Skill', desc: 'Enable the Azan Time skill in the Alexa app and set up a routine.' },
  { n: '04', title: 'Hear the Azan', desc: 'The Azan plays automatically on your Echo at every prayer.' },
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

        .deco-circle-1 {
          position: absolute;
          top: -140px; right: -140px;
          width: 500px; height: 500px;
          border-radius: 50%;
          border: 70px solid rgba(201,168,76,0.06);
          pointer-events: none;
        }
        .deco-circle-2 {
          position: absolute;
          bottom: 200px; left: -100px;
          width: 340px; height: 340px;
          border-radius: 50%;
          border: 50px solid rgba(201,168,76,0.05);
          pointer-events: none;
        }

        .land-inner {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* NAV */
        .land-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 0 20px;
          border-bottom: 1px solid rgba(201,168,76,0.1);
        }

        .nav-logo { display: flex; align-items: center; gap: 12px; }

        .nav-logo-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #c9a84c, #8b6a1e);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 20px rgba(201,168,76,0.3);
        }

        .nav-logo-name {
          font-family: 'Cinzel', serif;
          font-size: 1.1rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          color: #c9a84c;
        }

        .nav-logo-sub {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          color: rgba(201,168,76,0.38);
          margin-top: 1px;
        }

        .nav-signin {
          font-family: 'Cinzel', serif;
          font-size: 0.68rem;
          letter-spacing: 0.14em;
          color: rgba(201,168,76,0.55);
          text-decoration: none;
          border: 1px solid rgba(201,168,76,0.22);
          padding: 9px 20px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .nav-signin:hover {
          color: #c9a84c;
          border-color: rgba(201,168,76,0.5);
          background: rgba(201,168,76,0.06);
        }

        /* HERO */
        .hero {
          text-align: center;
          padding: 90px 0 72px;
          max-width: 680px;
          margin: 0 auto;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
        }

        .eyebrow-line {
          height: 1px; width: 36px;
          background: rgba(201,168,76,0.35);
        }

        .eyebrow-text {
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          letter-spacing: 0.35em;
          color: rgba(201,168,76,0.5);
          text-transform: uppercase;
        }

        .hero-ar {
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 1.4rem;
          color: rgba(201,168,76,0.3);
          direction: rtl;
          margin-bottom: 12px;
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 5.8rem;
          font-weight: 300;
          line-height: 1;
          color: #f0e8cc;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .hero-title em {
          font-style: italic;
          color: #c9a84c;
        }

        .hero-desc {
          font-size: 1.1rem;
          color: rgba(232,223,192,0.48);
          line-height: 1.75;
          font-weight: 300;
          margin: 26px auto 42px;
          max-width: 460px;
        }

        .hero-btns {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 38px;
          background: linear-gradient(135deg, #c9a84c, #8b6a1e);
          border: none;
          border-radius: 12px;
          color: #0a1f14;
          font-family: 'Cinzel', serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.25s;
          box-shadow: 0 8px 32px rgba(201,168,76,0.28);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(201,168,76,0.44);
        }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 28px;
          background: transparent;
          border: 1px solid rgba(201,168,76,0.22);
          border-radius: 12px;
          color: rgba(232,223,192,0.6);
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          border-color: rgba(201,168,76,0.48);
          color: #c9a84c;
        }

        .hero-note {
          margin-top: 18px;
          font-size: 0.7rem;
          color: rgba(232,223,192,0.22);
          letter-spacing: 0.08em;
        }

        /* DIVIDER */
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.16), transparent);
          margin: 0 0 60px;
        }

        .section-label {
          font-family: 'Cinzel', serif;
          font-size: 0.58rem;
          letter-spacing: 0.35em;
          color: rgba(201,168,76,0.38);
          text-align: center;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.4rem;
          font-weight: 300;
          text-align: center;
          color: #f0e8cc;
          margin-bottom: 44px;
        }

        /* BENEFITS */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 72px;
        }

        @media (max-width: 860px) { .benefits-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .benefits-grid { grid-template-columns: 1fr; } }

        .benefit-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
          border: 1px solid rgba(201,168,76,0.12);
          border-radius: 16px;
          padding: 22px 18px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .benefit-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.26), transparent);
        }

        .benefit-card:hover { border-color: rgba(201,168,76,0.24); }

        .benefit-icon { font-size: 1.6rem; margin-bottom: 12px; }

        .benefit-title {
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          color: #c9a84c;
          margin-bottom: 9px;
        }

        .benefit-desc {
          font-size: 0.83rem;
          color: rgba(232,223,192,0.4);
          line-height: 1.65;
          font-weight: 300;
        }

        /* STEPS */
        .steps-wrap {
          position: relative;
          margin-bottom: 72px;
        }

        .steps-line {
          position: absolute;
          top: 27px; left: 12%; right: 12%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.16), rgba(201,168,76,0.16), transparent);
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
        }

        @media (max-width: 660px) {
          .steps-grid { grid-template-columns: 1fr 1fr; }
          .steps-line { display: none; }
        }

        .step-item { text-align: center; padding: 0 12px; }

        .step-num {
          width: 54px; height: 54px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(201,168,76,0.11), rgba(201,168,76,0.04));
          border: 1px solid rgba(201,168,76,0.26);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 18px;
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          font-weight: 600;
          color: #c9a84c;
          position: relative; z-index: 1;
        }

        .step-title {
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: #e8dfc0;
          margin-bottom: 9px;
        }

        .step-desc {
          font-size: 0.8rem;
          color: rgba(232,223,192,0.36);
          line-height: 1.6;
          font-weight: 300;
        }

        /* BOTTOM CTA */
        .bottom-cta {
          text-align: center;
          padding: 60px 24px;
          background: linear-gradient(135deg, rgba(201,168,76,0.07), rgba(201,168,76,0.02));
          border: 1px solid rgba(201,168,76,0.14);
          border-radius: 22px;
          position: relative;
          overflow: hidden;
          margin-bottom: 48px;
        }

        .bottom-cta::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.38), transparent);
        }

        .bottom-cta-ar {
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 1.9rem;
          color: rgba(201,168,76,0.28);
          direction: rtl;
          margin-bottom: 14px;
        }

        .bottom-cta-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.8rem;
          font-weight: 300;
          color: #f0e8cc;
          margin-bottom: 10px;
        }

        .bottom-cta-desc {
          font-size: 0.95rem;
          color: rgba(232,223,192,0.38);
          margin-bottom: 34px;
          font-weight: 300;
        }

        /* FOOTER */
        .land-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 22px;
          border-top: 1px solid rgba(201,168,76,0.08);
        }

        .footer-copy {
          font-size: 0.7rem;
          color: rgba(232,223,192,0.2);
          letter-spacing: 0.05em;
        }

        .footer-links { display: flex; gap: 18px; }

        .footer-link {
          font-family: 'Cinzel', serif;
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          color: rgba(201,168,76,0.28);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-link:hover { color: rgba(201,168,76,0.6); }
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
                <div className="nav-logo-name">AZAN TIME</div>
                <div className="nav-logo-sub">AUTOMATIC Azan</div>
              </div>
            </div>
            <a href={`${API}/auth/lwa`} className="nav-signin">SIGN IN →</a>
          </nav>

          {/* HERO */}
          <section className="hero">
            <div className="hero-eyebrow">
              <div className="eyebrow-line" />
              <div className="eyebrow-text">Automatic Azan for Alexa</div>
              <div className="eyebrow-line" />
            </div>

            <div className="hero-ar">أذان تلقائي على أليكسا</div>

            <h1 className="hero-title">Azan <em>Time</em></h1>

            <p className="hero-desc">
              Hear the Azan automatically on your Amazon Alexa device at every one of the five daily prayers — based on your local mosque's exact times.
            </p>

            <div className="hero-btns">
              <a href={`${API}/auth/lwa`} className="btn-primary">
                Connect with Amazon →
              </a>
              <a href="https://www.amazon.de/dp/B0GS1SD9LF/" target="_blank" rel="noopener noreferrer" className="btn-outline">
                🔔 Enable Skill
              </a>
            </div>

            <div className="hero-note">Free · Secure · No passwords stored</div>
          </section>

          <div className="divider" />

          {/* BENEFITS */}
          <div className="section-label">Why Azan Time</div>
          <h2 className="section-title">Everything you need, nothing you don't</h2>
          <div className="benefits-grid">
            {BENEFITS.map((b) => (
              <div key={b.title} className="benefit-card">
                <div className="benefit-icon">{b.icon}</div>
                <div className="benefit-title">{b.title}</div>
                <div className="benefit-desc">{b.desc}</div>
              </div>
            ))}
          </div>

          <div className="divider" />

          {/* STEPS */}
          <div className="section-label">Setup</div>
          <h2 className="section-title">Up and running in minutes</h2>
          <div className="steps-wrap">
            <div className="steps-line" />
            <div className="steps-grid">
              {STEPS.map((s) => (
                <div key={s.n} className="step-item">
                  <div className="step-num">{s.n}</div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
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
