'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || '/api'

function ConnectForm() {
  const params = useSearchParams()
  const router = useRouter()
  const tokenParam = params.get('token')
  const [checking, setChecking] = useState(true)
  const [linked, setLinked] = useState(false)

  useEffect(() => {
    if (tokenParam) localStorage.setItem('jwt', tokenParam)
    const jwt = localStorage.getItem('jwt')
    if (jwt) {
      setLinked(true)
      setTimeout(() => router.push('/dashboard'), 1200)
    }
    setChecking(false)
  }, [tokenParam])

  if (checking) return null

  return (
    <main className="min-h-screen pattern-bg relative overflow-hidden flex items-center justify-center px-6">

      {/* Decorative circles */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
        style={{ border: '60px solid var(--gold)' }} />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10"
        style={{ border: '50px solid var(--gold)' }} />

      <div className="relative z-10 w-full max-w-sm animate-fade-up">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-display mb-1" style={{ fontSize: '40px', fontWeight: 300, color: 'white', letterSpacing: '-1px' }}>
            Azan <em style={{ color: 'var(--gold-light)' }}>Time</em>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', letterSpacing: '3px' }} className="uppercase">
            Automatic Adhan
          </div>
        </div>

        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>

          {linked ? (
            <div className="text-center py-4 animate-fade-in">
              <div className="text-4xl mb-3">✅</div>
              <div className="font-display text-xl mb-1" style={{ color: 'white' }}>Connected!</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Redirecting to your dashboard...</div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="font-display text-2xl mb-2" style={{ color: 'white', fontWeight: 300 }}>
                  Welcome
                </div>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: 1.7 }}>
                  Connect your Amazon account to set up automatic Adhan on your Alexa device.
                </p>
              </div>

              {/* Steps preview */}
              <div className="space-y-3 mb-8">
                {[
                  { step: '1', text: 'Link your Amazon account' },
                  { step: '2', text: 'Choose your mosque' },
                  { step: '3', text: 'Hear the Adhan automatically' },
                ].map(s => (
                  <div key={s.step} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
                      style={{ background: 'rgba(201,168,76,0.2)', color: 'var(--gold-light)', border: '1px solid rgba(201,168,76,0.3)' }}>
                      {s.step}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{s.text}</span>
                  </div>
                ))}
              </div>

              <a
                href={`${API}/auth/lwa`}
                className="block w-full text-center py-4 rounded-2xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ background: 'var(--gold)', color: 'var(--ink)', fontSize: '15px', letterSpacing: '0.3px' }}>
                Connect with Amazon →
              </a>

              <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Secure · No passwords stored · Free
              </p>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <a href="/" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}
            className="hover:text-white transition-colors duration-200">
            ← Back to home
          </a>
        </div>
      </div>
    </main>
  )
}

export default function ConnectPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen pattern-bg flex items-center justify-center">
        <div className="font-display text-2xl animate-pulse" style={{ color: 'var(--gold-light)' }}>Loading...</div>
      </main>
    }>
      <ConnectForm />
    </Suspense>
  )
}
