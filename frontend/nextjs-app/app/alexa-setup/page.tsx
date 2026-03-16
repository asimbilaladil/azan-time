'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Two phases, 7 sub-steps total ──────────────────────────────
const PHASES = [
  {
    id: 'skill',
    label: 'Enable Skill',
    steps: [
      {
        id: 1,
        icon: '🔔',
        title: 'Open & Enable the Alexa Skill',
        desc: 'In the Alexa app go to Skills & Games, search for "Azan Time" and tap Enable to Use.',
        detail: 'The skill is free. You need an Amazon account already linked to your Alexa device.',
        action: { label: 'Open Skill in Amazon Store', href: 'https://www.amazon.de/dp/B0GS1SD9LF/' },
      },
      {
        id: 2,
        icon: '🔗',
        title: 'Allow Account Linking',
        desc: 'Amazon will show a sign-in page. Tap "Allow" to connect your Azan Time account to Alexa.',
        detail: 'This tells the skill which mosque you selected so it triggers Azan at the right times for your location.',
      },
      {
        id: 3,
        icon: '✅',
        title: 'Device Discovered & Ready',
        desc: 'Alexa scans for devices and finds "1 Azan Time doorbell". Tap Next — setup complete.',
        detail: 'A virtual "Azan" doorbell device is now in your Alexa account. This is what triggers the routine.',
      },
    ],
  },
  {
    id: 'routine',
    label: 'Create Routine',
    steps: [
      {
        id: 4,
        icon: '➕',
        title: 'Create a New Routine',
        desc: 'In the Alexa app go to More → Routines → tap the + button to create a New Routine.',
        detail: 'Routines let Alexa react automatically when something happens — in this case when Azan time is triggered.',
      },
      {
        id: 5,
        icon: '🏠',
        title: 'Set Trigger: Smart Home → Azan',
        desc: 'Under WHEN tap "Add an event" → choose Smart Home → select the "Azan" device → confirm "When Azan is pressed".',
        detail: 'You will see two devices: your Echo Dot and "Azan". Select "Azan" — that is the virtual prayer-time trigger.',
      },
      {
        id: 6,
        icon: '🎵',
        title: 'Add Action: Open Azan Time Skill',
        desc: 'Under ALEXA WILL tap "Add an action" → Skills → Your Skills → select "Azan Time".',
        detail: 'This makes Alexa open the Azan Time skill and play the Adhan audio whenever the trigger fires.',
      },
      {
        id: 7,
        icon: '💾',
        title: 'Choose Device & Save',
        desc: 'Under "Hear Alexa from" tap "+ Choose Device" and select your Echo device, then tap Save.',
        detail: 'The routine is now named "Azan is pressed" and is fully active. Alexa will play Azan at every prayer time automatically.',
      },
    ],
  },
]

const ALL_STEPS = PHASES.flatMap(p => p.steps)

const VOICE_COMMANDS = [
  { de: '"Alexa, schalte Azan ein"', en: 'Turn Azan on' },
  { de: '"Alexa, schalte Azan aus"', en: 'Turn Azan off' },
  { de: '"Alexa, aktiviere Azan"', en: 'Activate Azan' },
]

// ── Phone screen components ─────────────────────────────────────
function ScreenStep1() {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ background:'#f0f0f0', padding:'8px 10px 6px', fontSize:'8px', fontFamily:'sans-serif', fontWeight:700, textAlign:'center', borderBottom:'1px solid #e0e0e0', color:'#333' }}>Azan Time</div>
      <div style={{ padding:'10px 10px', flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
          {/* Skill icon without Dev badge */}
          <div style={{ width:28, height:28, borderRadius:6, background:'linear-gradient(135deg,#1a5c3a,#0d3322)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>🕌</div>
          <div>
            <div style={{ fontSize:'9px', fontFamily:'sans-serif', fontWeight:700, color:'#111', lineHeight:1.2 }}>Azan Time</div>
            <div style={{ fontSize:'8px', color:'#f90', fontFamily:'sans-serif' }}>☆☆☆☆☆ 0</div>
          </div>
        </div>
        <div style={{ width:'100%', background:'#1a73e8', color:'#fff', borderRadius:3, padding:'5px 0', fontSize:'7px', fontFamily:'sans-serif', fontWeight:700, letterSpacing:'0.05em', textAlign:'center', marginBottom:4 }}>ENABLE TO USE</div>
        <div style={{ textAlign:'center', fontSize:'6.5px', color:'#888', fontFamily:'sans-serif', marginBottom:6 }}>Account linking required</div>
        <div style={{ fontSize:'7px', color:'#555', fontFamily:'sans-serif', lineHeight:1.5 }}>Plays the Adhan automatically on your Alexa device at daily prayer times.</div>
      </div>
    </div>
  )
}

function ScreenStep2() {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ background:'#f0f0f0', padding:'8px 10px 6px', fontSize:'8px', fontFamily:'sans-serif', fontWeight:700, textAlign:'center', borderBottom:'1px solid #e0e0e0', color:'#333' }}>Link Account</div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', padding:'18px 10px 10px' }}>
        <div style={{ fontSize:'16px', fontFamily:'sans-serif', fontWeight:700, color:'#232f3e' }}>amazon<span style={{color:'#f90'}}>.</span></div>
        <div style={{ fontSize:'8px', color:'#222', fontFamily:'sans-serif', textAlign:'center', lineHeight:1.4, padding:'0 4px' }}>Click 'Allow' to Sign-In to Azan Time.</div>
        <div style={{ width:'100%' }}>
          <div style={{ width:'100%', background:'#f0c040', color:'#111', borderRadius:20, padding:'6px 0', fontSize:'8.5px', fontFamily:'sans-serif', fontWeight:600, textAlign:'center', marginBottom:5 }}>Allow</div>
          <div style={{ textAlign:'center', fontSize:'7px', color:'#1a73e8', fontFamily:'sans-serif' }}>Cancel</div>
        </div>
      </div>
    </div>
  )
}

function ScreenStep3() {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'16px 10px', gap:8 }}>
        <div style={{ width:36, height:36, background:'#1a73e8', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18 }}>✓</div>
        <div style={{ fontSize:'9px', fontFamily:'sans-serif', fontWeight:700, color:'#111', textAlign:'center', lineHeight:1.3 }}>Skill has been<br/>successfully linked</div>
        <div style={{ fontSize:'7px', color:'#666', fontFamily:'sans-serif', textAlign:'center' }}>Next, continue to discover your device.</div>
        <div style={{ width:'100%', background:'#1a73e8', color:'#fff', borderRadius:20, padding:'6px 0', fontSize:'8px', fontFamily:'sans-serif', fontWeight:600, textAlign:'center', marginTop:4 }}>Next</div>
      </div>
    </div>
  )
}

function ScreenStep4() {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ background:'#f8f8f8', padding:'8px 10px 6px', fontSize:'8px', fontFamily:'sans-serif', fontWeight:700, textAlign:'center', borderBottom:'1px solid #e8e8e8', color:'#333' }}>New Routine</div>
      <div style={{ padding:'10px', flex:1, display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ background:'#ececec', borderRadius:6, overflow:'hidden' }}>
          <div style={{ padding:'5px 8px', fontSize:'6.5px', fontFamily:'sans-serif', fontWeight:700, letterSpacing:'0.08em', color:'#555', background:'#e0e0e0' }}>WHEN</div>
          <div style={{ padding:'8px', fontSize:'7.5px', color:'#1a73e8', fontFamily:'sans-serif', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>Add an event</span>
            <span style={{ fontSize:12, fontWeight:700, color:'#1a73e8' }}>⊕</span>
          </div>
        </div>
        <div style={{ background:'#ececec', borderRadius:6, overflow:'hidden' }}>
          <div style={{ padding:'5px 8px', fontSize:'6.5px', fontFamily:'sans-serif', fontWeight:700, letterSpacing:'0.08em', color:'#555', background:'#e0e0e0' }}>ALEXA WILL</div>
          <div style={{ padding:'8px', fontSize:'7.5px', color:'#1a73e8', fontFamily:'sans-serif', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>Add an action</span>
            <span style={{ fontSize:12, fontWeight:700, color:'#1a73e8' }}>⊕</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScreenStep5() {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ background:'#f8f8f8', padding:'8px 10px 6px', fontSize:'8px', fontFamily:'sans-serif', fontWeight:700, textAlign:'center', borderBottom:'1px solid #e8e8e8', color:'#333' }}>Choose Device</div>
      <div style={{ flex:1, padding:'8px 0' }}>
        {['Echo Dot', 'Azan'].map((name, i) => (
          <div key={i} style={{ padding:'9px 12px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:8, background: name === 'Azan' ? 'rgba(26,115,232,0.06)' : 'transparent' }}>
            <span style={{ fontSize:12 }}>🏠</span>
            <span style={{ fontSize:'8px', fontFamily:'sans-serif', color: name === 'Azan' ? '#1a73e8' : '#222', fontWeight: name === 'Azan' ? 700 : 400 }}>{name}</span>
            {name === 'Azan' && <span style={{ fontSize:'6px', color:'#1a73e8', marginLeft:'auto' }}>← select this</span>}
          </div>
        ))}
        <div style={{ padding:'12px 12px 4px', fontSize:'7px', color:'#888', fontFamily:'sans-serif', fontStyle:'italic', textAlign:'center' }}>"When Azan is pressed"</div>
      </div>
    </div>
  )
}

function ScreenStep6() {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ background:'#f8f8f8', padding:'8px 10px 6px', fontSize:'8px', fontFamily:'sans-serif', fontWeight:700, textAlign:'center', borderBottom:'1px solid #e8e8e8', color:'#333' }}>Your Skills</div>
      <div style={{ flex:1, padding:'4px 0' }}>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:7, background:'rgba(26,115,232,0.06)' }}>
          <div style={{ width:22, height:22, borderRadius:4, background:'linear-gradient(135deg,#1a5c3a,#0d3322)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0 }}>🕌</div>
          <div>
            <div style={{ fontSize:'8px', fontFamily:'sans-serif', fontWeight:700, color:'#1a73e8' }}>Azan Time</div>
            <div style={{ fontSize:'6.5px', color:'#888', fontFamily:'sans-serif' }}>Spielt automatisch den Adhan...</div>
          </div>
          <span style={{ fontSize:'6px', color:'#1a73e8', marginLeft:'auto' }}>← tap</span>
        </div>
        {['myTuner Radio','My Pod'].map((s,i) => (
          <div key={i} style={{ padding:'7px 10px', borderBottom:'1px solid #f5f5f5', fontSize:'7.5px', fontFamily:'sans-serif', color:'#555' }}>{s}</div>
        ))}
      </div>
    </div>
  )
}

function ScreenStep7() {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ background:'#f8f8f8', padding:'8px 10px 6px', fontSize:'8px', fontFamily:'sans-serif', fontWeight:700, textAlign:'center', borderBottom:'1px solid #e8e8e8', color:'#333' }}>New Routine</div>
      <div style={{ padding:'8px 10px', flex:1, display:'flex', flexDirection:'column', gap:7 }}>
        <div style={{ fontSize:'9px', fontFamily:'sans-serif', fontWeight:700, color:'#111' }}>Azan is pressed</div>
        <div style={{ background:'#ececec', borderRadius:6, overflow:'hidden' }}>
          <div style={{ padding:'4px 8px', fontSize:'6px', fontFamily:'sans-serif', fontWeight:700, letterSpacing:'0.08em', color:'#555', background:'#e0e0e0' }}>WHEN</div>
          <div style={{ padding:'7px 8px', fontSize:'7px', color:'#222', fontFamily:'sans-serif', display:'flex', alignItems:'center', gap:5 }}>
            <span>🏠</span><span>Azan is pressed</span>
          </div>
        </div>
        <div style={{ background:'#ececec', borderRadius:6, overflow:'hidden' }}>
          <div style={{ padding:'4px 8px', fontSize:'6px', fontFamily:'sans-serif', fontWeight:700, letterSpacing:'0.08em', color:'#555', background:'#e0e0e0' }}>ALEXA WILL</div>
          <div style={{ padding:'7px 8px', fontSize:'7px', color:'#222', fontFamily:'sans-serif', display:'flex', alignItems:'center', gap:5 }}>
            <span>⊕</span><span>Open Azan Time</span>
          </div>
        </div>
        <div style={{ width:'100%', background:'#1a73e8', color:'#fff', borderRadius:18, padding:'5px 0', fontSize:'8px', fontFamily:'sans-serif', fontWeight:600, textAlign:'center', marginTop:'auto' }}>Save</div>
      </div>
    </div>
  )
}

const SCREENS: Record<number, () => JSX.Element> = {
  1: ScreenStep1, 2: ScreenStep2, 3: ScreenStep3,
  4: ScreenStep4, 5: ScreenStep5, 6: ScreenStep6, 7: ScreenStep7,
}

// ── Page ────────────────────────────────────────────────────────
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
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a2a1f', color:'#c9a84c', fontFamily:'serif', fontSize:'1.2rem', letterSpacing:'0.2em' }}>
      بسم الله...
    </div>
  )

  const currentPhase = PHASES.find(p => p.steps.some(s => s.id === activeStep))
  const currentStep = ALL_STEPS.find(s => s.id === activeStep)!
  const ScreenComp = SCREENS[activeStep]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Cinzel:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f2d1c; }

        .sp-root {
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

        .sp-root::before {
          content: '';
          position: fixed; inset: 0;
          background-image:
            repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(201,168,76,0.03) 59px, rgba(201,168,76,0.03) 60px),
            repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(201,168,76,0.03) 59px, rgba(201,168,76,0.03) 60px);
          pointer-events: none; z-index: 0;
        }

        .sp-inner {
          position: relative; z-index: 1;
          max-width: 1100px; margin: 0 auto;
          padding: 0 24px 60px;
        }

        /* ── HEADER ── */
        .sp-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 0 16px;
          border-bottom: 1px solid rgba(201,168,76,0.15);
          margin-bottom: 40px;
        }

        .sp-logo { display:flex; align-items:center; gap:12px; text-decoration:none; }

        .sp-logo-icon {
          width:44px; height:44px;
          background: linear-gradient(135deg, #c9a84c, #8b6a1e);
          border-radius:50%; display:flex; align-items:center; justify-content:center;
          font-size:22px; box-shadow: 0 0 20px rgba(201,168,76,0.3);
        }

        .sp-logo-text { font-family:'Cinzel',serif; font-size:1.3rem; font-weight:500; letter-spacing:0.12em; color:#c9a84c; }
        .sp-logo-sub { font-size:0.7rem; letter-spacing:0.2em; color:rgba(201,168,76,0.5); text-transform:uppercase; margin-top:1px; }

        .sp-back {
          display:flex; align-items:center; gap:8px;
          padding:9px 18px; background:transparent;
          border:1px solid rgba(201,168,76,0.3); border-radius:10px;
          color:rgba(201,168,76,0.7); font-family:'Cinzel',serif;
          font-size:0.7rem; letter-spacing:0.12em; text-decoration:none;
          transition:all 0.2s;
        }
        .sp-back:hover { background:rgba(201,168,76,0.08); border-color:rgba(201,168,76,0.5); color:#c9a84c; }

        /* ── HERO ── */
        .sp-hero { text-align:center; margin-bottom:44px; }

        .sp-eyebrow {
          font-family:'Cinzel',serif; font-size:0.68rem; letter-spacing:0.35em;
          text-transform:uppercase; color:rgba(201,168,76,0.7); margin-bottom:12px;
        }

        .sp-title {
          font-family:'Cormorant Garamond',serif;
          font-size: clamp(2rem, 4.5vw, 3.2rem);
          font-weight:300; line-height:1.15; color:#e8dfc0; margin-bottom:14px;
        }
        .sp-title span { color:#c9a84c; font-style:italic; }

        .sp-ar { font-family:'Noto Naskh Arabic',serif; font-size:1.2rem; color:rgba(201,168,76,0.7); direction:rtl; margin-bottom:16px; }
        .sp-desc { font-size:1.05rem; color:rgba(232,223,192,0.82); max-width:520px; margin:0 auto; line-height:1.8; }

        /* ── PHASE TABS ── */
        .sp-phases {
          display:flex; justify-content:center; gap:12px; margin-bottom:36px;
        }

        .sp-phase-tab {
          display:flex; align-items:center; gap:8px;
          padding:10px 24px;
          background:transparent;
          border:1px solid rgba(201,168,76,0.18);
          border-radius:30px;
          font-family:'Cinzel',serif; font-size:0.72rem; letter-spacing:0.12em;
          color:rgba(201,168,76,0.65);
          cursor:pointer; transition:all 0.2s;
          text-transform:uppercase;
        }

        .sp-phase-tab.active {
          background:rgba(201,168,76,0.1);
          border-color:rgba(201,168,76,0.45);
          color:#c9a84c;
          box-shadow: 0 0 16px rgba(201,168,76,0.1);
        }

        .sp-phase-dot {
          width:6px; height:6px; border-radius:50%;
          background:rgba(201,168,76,0.3);
        }
        .sp-phase-tab.active .sp-phase-dot { background:#c9a84c; }

        /* ── STEP PROGRESS (mini dots) ── */
        .sp-step-dots {
          display:flex; justify-content:center; gap:6px; margin-bottom:36px;
        }

        .sp-dot {
          width:8px; height:8px; border-radius:50%;
          border:1px solid rgba(201,168,76,0.25);
          background:transparent;
          cursor:pointer; transition:all 0.2s;
        }

        .sp-dot.done { background:rgba(201,168,76,0.35); border-color:rgba(201,168,76,0.4); }
        .sp-dot.active { background:#c9a84c; border-color:#c9a84c; box-shadow:0 0 8px rgba(201,168,76,0.5); width:24px; border-radius:4px; }

        /* ── LAYOUT ── */
        .sp-layout {
          display:grid;
          grid-template-columns: 1fr 320px;
          gap:24px;
          align-items:start;
        }

        @media (max-width: 840px) { .sp-layout { grid-template-columns:1fr; } }

        /* ── LEFT: step cards ── */
        .sp-steps { display:flex; flex-direction:column; gap:12px; }

        .sp-step-card {
          background:linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
          border:1px solid rgba(201,168,76,0.1);
          border-radius:16px; overflow:hidden;
          cursor:pointer; transition:all 0.25s;
        }
        .sp-step-card:hover { border-color:rgba(201,168,76,0.22); }
        .sp-step-card.active {
          border-color:rgba(201,168,76,0.38);
          background:linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(255,255,255,0.02) 100%);
        }
        .sp-step-card.active::before {
          content:''; display:block; height:2px;
          background:linear-gradient(90deg, transparent, #c9a84c 40%, transparent);
        }

        .sp-step-head {
          display:flex; align-items:center; gap:14px; padding:18px 20px;
        }

        .sp-step-num {
          width:32px; height:32px; border-radius:50%; flex-shrink:0;
          border:1.5px solid rgba(201,168,76,0.25);
          display:flex; align-items:center; justify-content:center;
          font-family:'Cinzel',serif; font-size:0.75rem;
          color:rgba(201,168,76,0.4);
          transition:all 0.25s;
        }
        .active .sp-step-num {
          background:linear-gradient(135deg,#c9a84c,#8b6a1e);
          border-color:#c9a84c; color:#0a1f14;
          box-shadow:0 0 12px rgba(201,168,76,0.3);
        }
        .done-step .sp-step-num {
          background:rgba(201,168,76,0.12); border-color:rgba(201,168,76,0.35); color:#c9a84c;
        }

        .sp-step-info { flex:1; min-width:0; }
        .sp-step-phase-tag {
          font-family:'Cinzel',serif; font-size:0.6rem; letter-spacing:0.18em;
          text-transform:uppercase; color:rgba(201,168,76,0.6); margin-bottom:3px;
        }
        .active .sp-step-phase-tag { color:rgba(201,168,76,0.85); }

        .sp-step-title {
          font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600;
          color:#f0e8cc; line-height:1.2;
        }

        .sp-chevron {
          color:rgba(201,168,76,0.25); font-size:1.1rem; flex-shrink:0;
          transition:transform 0.3s;
        }
        .active .sp-chevron { transform:rotate(90deg); color:rgba(201,168,76,0.55); }

        .sp-step-body { max-height:0; overflow:hidden; transition:max-height 0.4s ease; }
        .sp-step-body.open { max-height:360px; }

        .sp-step-body-inner {
          padding:0 20px 20px;
          border-top:1px solid rgba(201,168,76,0.07); padding-top:16px;
        }

        .sp-step-desc {
          font-size:1.02rem; color:rgba(232,223,192,0.92); line-height:1.75; margin-bottom:10px;
        }

        .sp-step-note {
          font-size:0.85rem; color:rgba(232,223,192,0.65); line-height:1.65;
          padding:10px 14px;
          background:rgba(0,0,0,0.2);
          border-radius:8px; border-left:2px solid rgba(201,168,76,0.3);
          margin-bottom:14px;
        }

        .sp-action-btn {
          display:inline-flex; align-items:center; gap:8px;
          padding:10px 20px;
          background:linear-gradient(135deg,#c9a84c,#8b6a1e);
          border:none; border-radius:10px; color:#0a1f14;
          font-family:'Cinzel',serif; font-size:0.7rem; font-weight:600;
          letter-spacing:0.12em; text-decoration:none; cursor:pointer;
          transition:all 0.2s;
          box-shadow:0 4px 16px rgba(201,168,76,0.2);
        }
        .sp-action-btn:hover { transform:translateY(-1px); box-shadow:0 6px 24px rgba(201,168,76,0.35); }

        /* Nav buttons */
        .sp-step-nav {
          display:flex; align-items:center; gap:10px; margin-top:14px;
        }

        .sp-nav-btn {
          padding:8px 18px; background:transparent;
          border:1px solid rgba(201,168,76,0.3); border-radius:8px;
          color:rgba(201,168,76,0.8); font-family:'Cinzel',serif;
          font-size:0.68rem; letter-spacing:0.1em; cursor:pointer;
          transition:all 0.2s;
        }
        .sp-nav-btn:hover { background:rgba(201,168,76,0.08); border-color:rgba(201,168,76,0.4); color:#c9a84c; }
        .sp-nav-btn:disabled { opacity:0.25; cursor:not-allowed; }

        .sp-nav-btn.primary {
          background:rgba(201,168,76,0.12); border-color:rgba(201,168,76,0.4); color:#c9a84c;
        }
        .sp-nav-btn.primary:hover { background:rgba(201,168,76,0.2); }

        /* ── Voice commands ── */
        .sp-card {
          background:linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
          border:1px solid rgba(201,168,76,0.18); border-radius:16px; padding:22px;
          position:relative; overflow:hidden;
        }
        .sp-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent);
        }

        .sp-card-title {
          font-family:'Cinzel',serif; font-size:0.78rem; font-weight:500;
          letter-spacing:0.1em; color:#c9a84c; margin-bottom:14px; text-transform:uppercase;
        }

        .sp-voice-list { display:flex; flex-direction:column; gap:8px; }

        .sp-voice-item {
          background:rgba(0,0,0,0.2); border:1px solid rgba(201,168,76,0.1);
          border-radius:9px; padding:9px 12px;
        }
        .sp-voice-de { font-family:'Cormorant Garamond',serif; font-size:1rem; font-style:italic; color:#f0e8cc; margin-bottom:3px; }
        .sp-voice-en { font-size:0.78rem; color:rgba(232,223,192,0.65); letter-spacing:0.04em; }

        /* ── RIGHT PANEL ── */
        .sp-right { display:flex; flex-direction:column; gap:16px; position:sticky; top:24px; }

        /* Phone */
        .sp-phone-wrap { display:flex; justify-content:center; margin-bottom:2px; }

        .sp-phone {
          width:168px;
          background:#181818; border-radius:28px;
          padding:10px 8px;
          border:2px solid #242424;
          box-shadow:0 20px 60px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.04);
        }

        .sp-phone-notch {
          width:58px; height:8px; background:#0a0a0a;
          border-radius:4px; margin:0 auto 8px;
        }

        .sp-phone-screen {
          background:#fff; border-radius:18px;
          overflow:hidden; min-height:290px;
        }

        /* Checklist */
        .sp-checklist { display:flex; flex-direction:column; gap:0; }

        .sp-check-phase {
          font-family:'Cinzel',serif; font-size:0.62rem; letter-spacing:0.18em;
          text-transform:uppercase; color:rgba(201,168,76,0.65);
          padding:10px 0 6px; border-bottom:1px solid rgba(201,168,76,0.1);
          margin-bottom:6px;
        }
        .sp-check-phase:first-child { padding-top:0; }

        .sp-check-item {
          display:flex; align-items:center; gap:10px;
          padding:5px 0;
          font-size:0.87rem; color:rgba(232,223,192,0.6);
          cursor:pointer; transition:color 0.2s;
        }
        .sp-check-item:hover { color:rgba(232,223,192,0.85); }
        .sp-check-item.current { color:rgba(232,223,192,0.95); }
        .sp-check-item.completed { color:rgba(201,168,76,0.8); }

        .sp-check-dot {
          width:20px; height:20px; border-radius:50%; flex-shrink:0;
          border:1.5px solid rgba(201,168,76,0.2);
          display:flex; align-items:center; justify-content:center;
          font-size:10px; color:rgba(201,168,76,0.3);
          transition:all 0.2s;
        }
        .sp-check-item.completed .sp-check-dot { background:rgba(201,168,76,0.15); border-color:rgba(201,168,76,0.45); color:#c9a84c; }
        .sp-check-item.current .sp-check-dot { background:rgba(201,168,76,0.12); border-color:rgba(201,168,76,0.5); color:#c9a84c; }

        /* FOOTER */
        .sp-footer {
          margin-top:44px; padding:16px 0;
          border-top:1px solid rgba(201,168,76,0.1);
          text-align:center; font-family:'Cinzel',serif;
          font-size:0.65rem; letter-spacing:0.2em;
          color:rgba(201,168,76,0.3); text-transform:uppercase;
        }
      `}</style>

      <div className="sp-root">
        <div className="sp-inner">

          {/* HEADER */}
          <header className="sp-header">
            <Link href="/dashboard" className="sp-logo">
              <div className="sp-logo-icon">🕌</div>
              <div>
                <div className="sp-logo-text">AZAN TIME</div>
                <div className="sp-logo-sub">Automatic Azan</div>
              </div>
            </Link>
            <Link href="/dashboard" className="sp-back">← Back to Dashboard</Link>
          </header>

          {/* HERO */}
          <div className="sp-hero">
            <div className="sp-eyebrow">Alexa Skill Setup Guide</div>
            <h1 className="sp-title">Hear the <span>Azan</span><br />through your Alexa</h1>
            <div className="sp-ar">دليل إعداد الأذان على أليكسا</div>
            <p className="sp-desc">
              Follow these 7 steps to enable the Azan Time skill and create an Alexa Routine that plays the Adhan automatically at every prayer time.
            </p>
          </div>

          {/* PHASE TABS */}
          <div className="sp-phases">
            {PHASES.map(phase => {
              const isActive = phase.steps.some(s => s.id === activeStep)
              return (
                <button
                  key={phase.id}
                  className={`sp-phase-tab${isActive ? ' active' : ''}`}
                  onClick={() => setActiveStep(phase.steps[0].id)}
                >
                  <div className="sp-phase-dot" />
                  {phase.label}
                </button>
              )
            })}
          </div>

          {/* STEP DOTS */}
          <div className="sp-step-dots">
            {ALL_STEPS.map(s => (
              <button
                key={s.id}
                className={`sp-dot${activeStep === s.id ? ' active' : activeStep > s.id ? ' done' : ''}`}
                onClick={() => setActiveStep(s.id)}
                aria-label={`Step ${s.id}`}
              />
            ))}
          </div>

          {/* LAYOUT */}
          <div className="sp-layout">

            {/* LEFT */}
            <div>
              <div className="sp-steps">
                {ALL_STEPS.map(step => {
                  const isActive = activeStep === step.id
                  const isDone = activeStep > step.id
                  const phase = PHASES.find(p => p.steps.some(s => s.id === step.id))
                  return (
                    <div
                      key={step.id}
                      className={`sp-step-card${isActive ? ' active' : isDone ? ' done-step' : ''}`}
                      onClick={() => setActiveStep(step.id)}
                    >
                      <div className="sp-step-head">
                        <div className="sp-step-num">
                          {isDone ? '✓' : step.id}
                        </div>
                        <div className="sp-step-info">
                          <div className="sp-step-phase-tag">{phase?.label} · Step {step.id}</div>
                          <div className="sp-step-title">{step.title}</div>
                        </div>
                        <div className="sp-chevron">›</div>
                      </div>

                      <div className={`sp-step-body${isActive ? ' open' : ''}`}>
                        <div className="sp-step-body-inner">
                          <p className="sp-step-desc">{step.desc}</p>
                          <div className="sp-step-note">{step.detail}</div>

                          {step.action && (
                            <a
                              href={step.action.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sp-action-btn"
                              onClick={e => e.stopPropagation()}
                            >
                              🔔 {step.action.label} →
                            </a>
                          )}

                          <div className="sp-step-nav" onClick={e => e.stopPropagation()}>
                            <button
                              className="sp-nav-btn"
                              disabled={step.id === 1}
                              onClick={() => setActiveStep(step.id - 1)}
                            >← Prev</button>
                            {step.id < ALL_STEPS.length && (
                              <button
                                className="sp-nav-btn primary"
                                onClick={() => setActiveStep(step.id + 1)}
                              >Next Step →</button>
                            )}
                            {step.id === ALL_STEPS.length && (
                              <span style={{ fontSize:'0.8rem', color:'rgba(201,168,76,0.6)', fontStyle:'italic', fontFamily:'Cormorant Garamond, serif' }}>
                                🎉 Setup complete!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Voice commands */}
              <div className="sp-card" style={{ marginTop:16 }}>
                <div className="sp-card-title">Voice Commands</div>
                <div className="sp-voice-list">
                  {VOICE_COMMANDS.map((v, i) => (
                    <div key={i} className="sp-voice-item">
                      <div className="sp-voice-de">{v.de}</div>
                      <div className="sp-voice-en">{v.en}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="sp-right">

              {/* Phone preview */}
              <div className="sp-card">
                <div className="sp-card-title" style={{ textAlign:'center' }}>
                  Step {activeStep} Preview
                </div>
                <div className="sp-phone-wrap">
                  <div className="sp-phone">
                    <div className="sp-phone-notch" />
                    <div className="sp-phone-screen" style={{ minHeight:290 }}>
                      <ScreenComp />
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="sp-card">
                <div className="sp-card-title">All Steps</div>
                <div className="sp-checklist">
                  {PHASES.map(phase => (
                    <div key={phase.id}>
                      <div className="sp-check-phase">{phase.label}</div>
                      {phase.steps.map(step => (
                        <div
                          key={step.id}
                          className={`sp-check-item${activeStep === step.id ? ' current' : activeStep > step.id ? ' completed' : ''}`}
                          onClick={() => setActiveStep(step.id)}
                        >
                          <div className="sp-check-dot">
                            {activeStep > step.id ? '✓' : step.id}
                          </div>
                          <span>{step.title}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <footer className="sp-footer">
            Azan Time · Automatic Adhan for Alexa · 7-Step Setup Guide
          </footer>

        </div>
      </div>
    </>
  )
}
