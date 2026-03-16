'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SKILL_STEPS = [
  {
    id: 1,
    phase: 'Enable Skill',
    title: 'Open the Alexa Skill',
    desc: 'Visit the Amazon Alexa store and click "Enable to Use" on the Azan Time skill page.',
    action: { label: 'Open Alexa Skill Store', href: 'https://www.amazon.de/dp/B0GS1SD9LF/' },
    detail: 'The skill is free. You need an Amazon account linked to your Alexa device.',
    icon: '🔔',
    badge: 'Step 1',
  },
  {
    id: 2,
    phase: 'Link Account',
    title: 'Allow Account Linking',
    desc: 'After enabling, Amazon will ask you to sign in and allow Azan Time to connect to your account. Tap "Allow".',
    action: null,
    detail: 'This lets the skill know which mosque you selected so it can trigger Azan at the correct times.',
    icon: '🔗',
    badge: 'Step 2',
  },
  {
    id: 3,
    phase: 'Discover Device',
    title: 'Skill Linked Successfully',
    desc: 'Alexa will scan for connected devices. You\'ll see "1 Azan Time doorbell found and connected."',
    action: null,
    detail: 'Tap "Next" to proceed. Alexa automatically discovers the virtual Azan device from your account.',
    icon: '✅',
    badge: 'Step 3',
  },
  {
    id: 4,
    phase: 'Routine Setup',
    title: 'Create an Alexa Routine',
    desc: 'Go to More → Routines in the Alexa app. Create a new routine triggered by the Azan Time doorbell.',
    action: null,
    detail: 'Set the action to play Azan audio on your preferred Alexa device. This runs automatically at every prayer time.',
    icon: '⚙️',
    badge: 'Step 4',
    comingSoon: true,
  },
]

const VOICE_COMMANDS = [
  { de: '"Alexa, schalte Azan ein"', en: 'Turn Azan on' },
  { de: '"Alexa, schalte Azan aus"', en: 'Turn Azan off' },
  { de: '"Alexa, aktiviere Azan"', en: 'Activate Azan' },
]

export default function AlexaSetupPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(1)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const jwt = localStorage.getItem('jwt')
    if (!jwt) { router.push('/connect'); return }
    setAuthChecked(true)
  }, [])

  if (!authChecked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a2a1f', color: '#c9a84c', fontFamily: 'serif', fontSize: '1.2rem', letterSpacing: '0.2em' }}>
      بسم الله...
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Cinzel:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f2d1c; }

        .setup-root {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at 20% 0%, rgba(139,101,30,0.18) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(10,80,45,0.35) 0%, transparent 50%),
            linear-gradient(160deg, #1a3d28 0%, #0f2318 40%, #132d1e 100%);
          color: #e8dfc0;
          font-family: 'Cormorant Garamond', serif;
          position: relative;
          overflow-x: hidden;
        }

        .setup-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(201,168,76,0.03) 59px, rgba(201,168,76,0.03) 60px),
            repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(201,168,76,0.03) 59px, rgba(201,168,76,0.03) 60px);
          pointer-events: none;
          z-index: 0;
        }

        .setup-inner {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px 60px;
        }

        /* HEADER */
        .setup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0 16px;
          border-bottom: 1px solid rgba(201,168,76,0.15);
          margin-bottom: 48px;
        }

        .setup-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .setup-logo-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #c9a84c, #8b6a1e);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          box-shadow: 0 0 20px rgba(201,168,76,0.3);
        }

        .setup-logo-text {
          font-family: 'Cinzel', serif;
          font-size: 1.3rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          color: #c9a84c;
        }

        .setup-logo-sub {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: rgba(201,168,76,0.5);
          text-transform: uppercase;
          margin-top: 1px;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          background: transparent;
          border: 1px solid rgba(201,168,76,0.3);
          border-radius: 10px;
          color: rgba(201,168,76,0.7);
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-decoration: none;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: rgba(201,168,76,0.08);
          border-color: rgba(201,168,76,0.5);
          color: #c9a84c;
        }

        /* HERO */
        .setup-hero {
          text-align: center;
          margin-bottom: 56px;
        }

        .setup-hero-eyebrow {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: rgba(201,168,76,0.5);
          margin-bottom: 14px;
        }

        .setup-hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.2rem, 5vw, 3.5rem);
          font-weight: 300;
          line-height: 1.15;
          color: #e8dfc0;
          margin-bottom: 16px;
        }

        .setup-hero-title span {
          color: #c9a84c;
          font-style: italic;
        }

        .setup-hero-ar {
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 1.3rem;
          color: rgba(201,168,76,0.55);
          direction: rtl;
          margin-bottom: 20px;
        }

        .setup-hero-desc {
          font-size: 1.05rem;
          color: rgba(232,223,192,0.5);
          max-width: 540px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* PROGRESS BAR */
        .progress-bar-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 48px;
        }

        .progress-step-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 10px;
          position: relative;
        }

        .progress-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid rgba(201,168,76,0.25);
          background: rgba(201,168,76,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          color: rgba(201,168,76,0.4);
          transition: all 0.3s;
          position: relative;
          z-index: 1;
        }

        .progress-circle.done {
          background: rgba(201,168,76,0.15);
          border-color: rgba(201,168,76,0.5);
          color: #c9a84c;
        }

        .progress-circle.active {
          background: linear-gradient(135deg, #c9a84c, #8b6a1e);
          border-color: #c9a84c;
          color: #0a1f14;
          box-shadow: 0 0 20px rgba(201,168,76,0.4);
        }

        .progress-label {
          font-family: 'Cinzel', serif;
          font-size: 0.58rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(201,168,76,0.35);
          text-align: center;
          white-space: nowrap;
        }

        .progress-label.active { color: rgba(201,168,76,0.7); }

        .progress-connector {
          flex: 1;
          height: 1px;
          max-width: 60px;
          background: rgba(201,168,76,0.15);
          margin-bottom: 22px;
          position: relative;
        }

        .progress-connector.done {
          background: rgba(201,168,76,0.4);
        }

        /* MAIN LAYOUT */
        .setup-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 860px) {
          .setup-layout { grid-template-columns: 1fr; }
        }

        /* STEP CARDS */
        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .step-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(201,168,76,0.12);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.25s;
        }

        .step-card:hover {
          border-color: rgba(201,168,76,0.25);
        }

        .step-card.active {
          border-color: rgba(201,168,76,0.35);
          background: linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(255,255,255,0.02) 100%);
        }

        .step-card.active::before {
          content: '';
          display: block;
          height: 2px;
          background: linear-gradient(90deg, transparent, #c9a84c 40%, transparent);
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
        }

        .step-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          transition: all 0.3s;
        }

        .active .step-icon-wrap {
          background: rgba(201,168,76,0.15);
          border-color: rgba(201,168,76,0.35);
          box-shadow: 0 0 16px rgba(201,168,76,0.15);
        }

        .step-header-text { flex: 1; min-width: 0; }

        .step-badge {
          font-family: 'Cinzel', serif;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(201,168,76,0.5);
          margin-bottom: 3px;
        }

        .step-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: #e8dfc0;
          line-height: 1.2;
        }

        .step-chevron {
          color: rgba(201,168,76,0.3);
          font-size: 1rem;
          transition: transform 0.3s;
          flex-shrink: 0;
        }

        .active .step-chevron {
          transform: rotate(90deg);
          color: rgba(201,168,76,0.6);
        }

        .step-body {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease;
        }

        .step-body.open {
          max-height: 400px;
        }

        .step-body-inner {
          padding: 0 24px 24px;
          border-top: 1px solid rgba(201,168,76,0.08);
          padding-top: 20px;
        }

        .step-desc {
          font-size: 1rem;
          color: rgba(232,223,192,0.7);
          line-height: 1.7;
          margin-bottom: 12px;
        }

        .step-detail {
          font-size: 0.82rem;
          color: rgba(232,223,192,0.4);
          line-height: 1.6;
          padding: 10px 14px;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          border-left: 2px solid rgba(201,168,76,0.2);
          margin-bottom: 16px;
        }

        .step-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          background: linear-gradient(135deg, #c9a84c, #8b6a1e);
          border: none;
          border-radius: 10px;
          color: #0a1f14;
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(201,168,76,0.2);
        }

        .step-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(201,168,76,0.35);
        }

        .coming-soon-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: rgba(232,223,192,0.05);
          border: 1px solid rgba(232,223,192,0.12);
          border-radius: 8px;
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          color: rgba(232,223,192,0.4);
        }

        /* RIGHT PANEL */
        .right-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 24px;
        }

        .card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(201,168,76,0.18);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent);
        }

        .panel-title {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          color: #c9a84c;
          margin-bottom: 16px;
          text-transform: uppercase;
        }

        /* Phone mockup */
        .phone-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 4px;
        }

        .phone-frame {
          width: 160px;
          background: #1a1a1a;
          border-radius: 28px;
          padding: 10px 8px;
          border: 2px solid #2a2a2a;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05);
          position: relative;
        }

        .phone-notch {
          width: 60px;
          height: 8px;
          background: #0a0a0a;
          border-radius: 4px;
          margin: 0 auto 8px;
        }

        .phone-screen {
          background: #fff;
          border-radius: 18px;
          overflow: hidden;
          min-height: 280px;
          display: flex;
          flex-direction: column;
        }

        .screen-step {
          display: none;
          flex-direction: column;
          height: 100%;
          min-height: 280px;
        }

        .screen-step.visible { display: flex; }

        /* Step 1 screen */
        .s1-header {
          background: #f0f0f0;
          padding: 10px 12px 8px;
          font-size: 9px;
          font-family: sans-serif;
          color: #333;
          font-weight: 600;
          text-align: center;
          border-bottom: 1px solid #e0e0e0;
        }

        .s1-body { padding: 10px 12px; flex: 1; }

        .s1-skill-name {
          font-size: 11px;
          font-family: sans-serif;
          font-weight: 700;
          color: #111;
          margin-bottom: 2px;
        }

        .s1-stars { color: #f90; font-size: 9px; margin-bottom: 8px; }

        .s1-enable-btn {
          width: 100%;
          background: #1a73e8;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 6px;
          font-size: 8px;
          font-family: sans-serif;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-align: center;
          margin-bottom: 5px;
        }

        .s1-link-note {
          text-align: center;
          font-size: 7px;
          color: #888;
          font-family: sans-serif;
        }

        .s1-desc {
          margin-top: 8px;
          font-size: 7.5px;
          color: #444;
          font-family: sans-serif;
          line-height: 1.5;
        }

        /* Step 2 screen */
        .s2-header {
          background: #f0f0f0;
          padding: 10px 12px 8px;
          font-size: 9px;
          font-family: sans-serif;
          color: #333;
          font-weight: 600;
          text-align: center;
          border-bottom: 1px solid #e0e0e0;
        }

        .s2-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 20px 12px 12px;
        }

        .s2-amazon-logo {
          font-size: 18px;
          font-family: sans-serif;
          font-weight: 700;
          color: #232f3e;
        }

        .s2-amazon-logo span { color: #f90; }

        .s2-prompt {
          font-size: 8.5px;
          color: #222;
          font-family: sans-serif;
          text-align: center;
          line-height: 1.4;
          padding: 0 4px;
        }

        .s2-allow-btn {
          width: 100%;
          background: #f0c040;
          color: #111;
          border: none;
          border-radius: 20px;
          padding: 7px;
          font-size: 9px;
          font-family: sans-serif;
          font-weight: 600;
          text-align: center;
        }

        .s2-cancel {
          font-size: 7.5px;
          color: #1a73e8;
          font-family: sans-serif;
          text-align: center;
        }

        /* Step 3 screen */
        .s3-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 12px;
          gap: 10px;
        }

        .s3-check {
          width: 40px;
          height: 40px;
          background: #1a73e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 20px;
        }

        .s3-title {
          font-size: 10px;
          font-family: sans-serif;
          font-weight: 700;
          color: #111;
          text-align: center;
          line-height: 1.3;
        }

        .s3-desc {
          font-size: 7.5px;
          color: #666;
          font-family: sans-serif;
          text-align: center;
        }

        .s3-next {
          width: 100%;
          background: #1a73e8;
          color: #fff;
          border: none;
          border-radius: 20px;
          padding: 7px;
          font-size: 9px;
          font-family: sans-serif;
          font-weight: 600;
          text-align: center;
          margin-top: 8px;
        }

        /* Step 4 screen */
        .s4-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 12px;
          gap: 8px;
          background: #f8f8f8;
        }

        .s4-icon { font-size: 28px; }

        .s4-title {
          font-size: 9px;
          font-family: sans-serif;
          font-weight: 700;
          color: #333;
          text-align: center;
        }

        .s4-coming {
          font-size: 7px;
          color: #999;
          font-family: sans-serif;
          text-align: center;
          font-style: italic;
        }

        /* Voice commands card */
        .voice-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .voice-item {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(201,168,76,0.1);
          border-radius: 10px;
          padding: 10px 14px;
        }

        .voice-de {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.9rem;
          font-style: italic;
          color: #e8dfc0;
          margin-bottom: 2px;
        }

        .voice-en {
          font-size: 0.72rem;
          color: rgba(232,223,192,0.4);
          letter-spacing: 0.05em;
        }

        /* Status checklist */
        .checklist {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .check-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          color: rgba(232,223,192,0.55);
        }

        .check-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid rgba(201,168,76,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 11px;
          color: rgba(201,168,76,0.4);
        }

        .check-dot.done {
          background: rgba(201,168,76,0.15);
          border-color: rgba(201,168,76,0.4);
          color: #c9a84c;
        }

        /* FOOTER */
        .setup-footer {
          margin-top: 48px;
          padding: 16px 0;
          border-top: 1px solid rgba(201,168,76,0.1);
          text-align: center;
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          color: rgba(201,168,76,0.35);
          text-transform: uppercase;
        }
      `}</style>

      <div className="setup-root">
        <div className="setup-inner">

          {/* HEADER */}
          <header className="setup-header">
            <Link href="/dashboard" className="setup-logo">
              <div className="setup-logo-icon">🕌</div>
              <div>
                <div className="setup-logo-text">AZAN TIME</div>
                <div className="setup-logo-sub">Automatic Azan</div>
              </div>
            </Link>
            <Link href="/dashboard" className="back-btn">
              ← Back to Dashboard
            </Link>
          </header>

          {/* HERO */}
          <div className="setup-hero">
            <div className="setup-hero-eyebrow">Alexa Skill Setup Guide</div>
            <h1 className="setup-hero-title">
              Hear the <span>Azan</span><br />through your Alexa
            </h1>
            <div className="setup-hero-ar">دليل إعداد الأذان على أليكسا</div>
            <p className="setup-hero-desc">
              Follow these steps to enable the Azan Time skill on your Amazon Alexa device and hear the Adhan automatically at every prayer time.
            </p>
          </div>

          {/* PROGRESS */}
          <div className="progress-bar-wrap">
            {SKILL_STEPS.map((step, i) => (
              <>
                <button
                  key={step.id}
                  className="progress-step-btn"
                  onClick={() => setActiveStep(step.id)}
                >
                  <div className={`progress-circle${activeStep === step.id ? ' active' : activeStep > step.id ? ' done' : ''}`}>
                    {activeStep > step.id ? '✓' : step.id}
                  </div>
                  <div className={`progress-label${activeStep === step.id ? ' active' : ''}`}>
                    {step.phase}
                  </div>
                </button>
                {i < SKILL_STEPS.length - 1 && (
                  <div key={`conn-${step.id}`} className={`progress-connector${activeStep > step.id ? ' done' : ''}`} />
                )}
              </>
            ))}
          </div>

          {/* LAYOUT */}
          <div className="setup-layout">

            {/* STEPS */}
            <div className="steps-list">
              {SKILL_STEPS.map((step) => {
                const isActive = activeStep === step.id
                return (
                  <div
                    key={step.id}
                    className={`step-card${isActive ? ' active' : ''}`}
                    onClick={() => setActiveStep(step.id)}
                  >
                    <div className="step-header">
                      <div className="step-icon-wrap">{step.icon}</div>
                      <div className="step-header-text">
                        <div className="step-badge">{step.badge} · {step.phase}</div>
                        <div className="step-title">{step.title}</div>
                      </div>
                      <div className="step-chevron">›</div>
                    </div>
                    <div className={`step-body${isActive ? ' open' : ''}`}>
                      <div className="step-body-inner">
                        <p className="step-desc">{step.desc}</p>
                        <div className="step-detail">{step.detail}</div>
                        {step.action && (
                          <a
                            href={step.action.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="step-action-btn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🔔 {step.action.label} →
                          </a>
                        )}
                        {step.comingSoon && (
                          <div className="coming-soon-badge">
                            ⚙️ &nbsp;Routine screenshots guide — coming soon
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Voice commands */}
              <div className="card" style={{ marginTop: '8px' }}>
                <div className="panel-title">Voice Commands</div>
                <div className="voice-list">
                  {VOICE_COMMANDS.map((v, i) => (
                    <div key={i} className="voice-item">
                      <div className="voice-de">{v.de}</div>
                      <div className="voice-en">{v.en}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="right-panel">

              {/* Phone preview */}
              <div className="card">
                <div className="panel-title" style={{ textAlign: 'center' }}>Preview</div>
                <div className="phone-wrap">
                  <div className="phone-frame">
                    <div className="phone-notch" />
                    <div className="phone-screen">

                      {/* Step 1 */}
                      <div className={`screen-step${activeStep === 1 ? ' visible' : ''}`} style={{ flexDirection: 'column' }}>
                        <div className="s1-header">Azan Time</div>
                        <div className="s1-body">
                          <div className="s1-skill-name">Azan Time</div>
                          <div className="s1-stars">☆☆☆☆☆ 0</div>
                          <div className="s1-enable-btn">ENABLE TO USE</div>
                          <div className="s1-link-note">Account linking required</div>
                          <div className="s1-desc">Azan Time plays the Adhan automatically on your Alexa device at daily prayer times.</div>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className={`screen-step${activeStep === 2 ? ' visible' : ''}`} style={{ flexDirection: 'column' }}>
                        <div className="s2-header">Link Account</div>
                        <div className="s2-body">
                          <div className="s2-amazon-logo">amazon<span>.</span></div>
                          <div className="s2-prompt">Click 'Allow' to Sign-In to Azan Time.</div>
                          <div style={{ width: '100%' }}>
                            <div className="s2-allow-btn">Allow</div>
                            <div className="s2-cancel" style={{ marginTop: '6px' }}>Cancel</div>
                          </div>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className={`screen-step${activeStep === 3 ? ' visible' : ''}`} style={{ flexDirection: 'column' }}>
                        <div className="s3-body">
                          <div className="s3-check">✓</div>
                          <div className="s3-title">Skill has been<br/>successfully linked</div>
                          <div className="s3-desc">Next, continue to discover your device.</div>
                          <div className="s3-next">Next</div>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className={`screen-step${activeStep === 4 ? ' visible' : ''}`} style={{ flexDirection: 'column' }}>
                        <div className="s4-body">
                          <div className="s4-icon">⚙️</div>
                          <div className="s4-title">Alexa Routine Setup</div>
                          <div className="s4-coming">Guide with screenshots coming soon</div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Progress checklist */}
              <div className="card">
                <div className="panel-title">Setup Progress</div>
                <div className="checklist">
                  {SKILL_STEPS.map((step) => (
                    <div key={step.id} className="check-item">
                      <div className={`check-dot${activeStep > step.id ? ' done' : ''}`}>
                        {activeStep > step.id ? '✓' : step.id}
                      </div>
                      <span style={{ color: activeStep > step.id ? 'rgba(201,168,76,0.7)' : undefined }}>
                        {step.title}
                        {step.comingSoon && <span style={{ fontSize: '0.7em', color: 'rgba(232,223,192,0.3)', marginLeft: '6px' }}>(soon)</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <footer className="setup-footer">
            Azan Time · Automatic Adhan for Alexa
          </footer>

        </div>
      </div>
    </>
  )
}
