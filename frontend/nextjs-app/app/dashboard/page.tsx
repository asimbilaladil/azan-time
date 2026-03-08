'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || '/api'

const PRAYERS = [
  { key: 'fajr',    label: 'Fajr',    ar: 'الفجر',  icon: '🌙' },
  { key: 'dhuhr',   label: 'Dhuhr',   ar: 'الظهر',  icon: '☀️' },
  { key: 'asr',     label: 'Asr',     ar: 'العصر',  icon: '🌤' },
  { key: 'maghrib', label: 'Maghrib', ar: 'المغرب', icon: '🌅' },
  { key: 'isha',    label: 'Isha',    ar: 'العشاء', icon: '⭐' },
]

function getCurrentPrayerKey(times: Record<string, string>): string | null {
  if (!times) return null
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const toMin = (t: string) => {
    if (!t) return -1
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const keys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
  let current = null
  for (const k of keys) {
    if (toMin(times[k]) <= nowMin) current = k
  }
  return current
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser]               = useState<any>(null)
  const [mosque, setMosque]           = useState<any>(null)
  const [prayerTimes, setPrayerTimes] = useState<any>(null)
  const [loading, setLoading]         = useState(true)
  const [now, setNow]                 = useState(new Date())

  // Mosque search
  const [showSearch, setShowSearch]   = useState(false)
  const [query, setQuery]             = useState('')
  const [results, setResults]         = useState<any[]>([])
  const [searching, setSearching]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const searchTimeout                 = useRef<any>(null)

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const jwt = localStorage.getItem('jwt')
    if (!jwt) { router.push('/connect'); return }
    const headers = { Authorization: `Bearer ${jwt}` }

    axios.get(`${API}/user/me`, { headers })
      .then(r => {
        setUser(r.data)
        if (r.data.mosque_guid) {
          return axios.get(`${API}/mosques/${r.data.mosque_guid}/times`, { headers })
            .then(t => {
              setMosque(t.data.mosque)
              setPrayerTimes(t.data.times)
            })
        }
      })
      .catch(() => router.push('/connect'))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (q: string) => {
    setQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (q.length < 2) { setResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await axios.get(`${API}/mosques/search?q=${encodeURIComponent(q)}`)
        setResults(r.data)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 400)
  }

  const handleSelectMosque = async (m: any) => {
    const jwt = localStorage.getItem('jwt')
    if (!jwt) return
    setSaving(true)
    try {
      await axios.put(`${API}/user/settings`, { mosque_guid: m.guid }, { headers: { Authorization: `Bearer ${jwt}` } })
      const t = await axios.get(`${API}/mosques/${m.guid}/times`, { headers: { Authorization: `Bearer ${jwt}` } })
      setMosque(t.data.mosque)
      setPrayerTimes(t.data.times)
      setShowSearch(false)
      setQuery('')
      setResults([])
    } catch {}
    finally { setSaving(false) }
  }

  const currentPrayer = prayerTimes ? getCurrentPrayerKey(prayerTimes) : null

  const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pattern-bg">
      <div className="font-display text-2xl animate-pulse" style={{ color: 'var(--gold-light)' }}>Loading...</div>
    </div>
  )

  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)' }}>

      {/* Top emerald header */}
      <header className="pattern-bg relative overflow-hidden" style={{ paddingBottom: '80px' }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
          style={{ border: '40px solid var(--gold)' }} />

        <div className="relative z-10 max-w-xl mx-auto px-6 pt-8">
          {/* Nav */}
          <div className="flex items-center justify-between mb-12">
            <div className="font-display text-xl" style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>
              Azan Time
            </div>
            <button
              onClick={() => { localStorage.removeItem('jwt'); router.push('/') }}
              style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', letterSpacing: '1px' }}
              className="uppercase hover:text-white transition-colors duration-200">
              Sign out
            </button>
          </div>

          {/* Clock */}
          <div className="text-center">
            <div className="font-display animate-fade-up"
              style={{ fontSize: 'clamp(64px, 15vw, 96px)', fontWeight: 300, color: 'white', lineHeight: 1, letterSpacing: '-2px' }}>
              {timeStr}
            </div>
            <div className="animate-fade-up animate-delay-1 mt-2"
              style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', letterSpacing: '1px' }}>
              {dateStr}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6" style={{ marginTop: '-60px', paddingBottom: '40px' }}>

        {/* Mosque card — floats over the header */}
        <div className="rounded-2xl p-5 mb-6 animate-fade-up"
          style={{ background: 'white', boxShadow: '0 8px 40px rgba(15,76,58,0.15)', border: '1px solid var(--cream-dark)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'var(--emerald)', color: 'var(--gold-light)' }}>
                🕌
              </div>
              <div>
                {mosque ? (
                  <>
                    <div className="font-medium text-sm" style={{ color: 'var(--ink)' }}>{mosque.name}</div>
                    <div className="text-xs" style={{ color: '#8a9aaa' }}>{mosque.city}{mosque.country ? `, ${mosque.country}` : ''}</div>
                  </>
                ) : (
                  <div className="text-sm" style={{ color: '#8a9aaa' }}>No mosque selected</div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="text-xs px-4 py-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ background: showSearch ? 'var(--emerald)' : 'var(--cream)', color: showSearch ? 'white' : 'var(--emerald)', border: '1px solid var(--emerald)', fontWeight: 500, letterSpacing: '0.5px' }}>
              {showSearch ? 'Cancel' : mosque ? 'Change' : 'Select Mosque'}
            </button>
          </div>

          {/* Search panel */}
          {showSearch && (
            <div className="mt-4 animate-fade-in">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search mosque by name or city..."
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: 'var(--cream)', border: '1.5px solid var(--cream-dark)', color: 'var(--ink)', fontFamily: 'DM Sans' }}
                />
                {searching && (
                  <div className="absolute right-3 top-3 text-xs" style={{ color: '#8a9aaa' }}>Searching...</div>
                )}
              </div>

              {results.length > 0 && (
                <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid var(--cream-dark)' }}>
                  {results.slice(0, 6).map((m, i) => (
                    <button
                      key={m.guid}
                      onClick={() => handleSelectMosque(m)}
                      disabled={saving}
                      className="w-full text-left px-4 py-3 transition-colors duration-150 hover:bg-opacity-80 flex items-center gap-3"
                      style={{ background: i % 2 === 0 ? 'white' : 'var(--cream)', borderBottom: i < results.length - 1 ? '1px solid var(--cream-dark)' : 'none' }}>
                      <span style={{ color: 'var(--emerald)', fontSize: '16px' }}>🕌</span>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{m.name}</div>
                        <div className="text-xs" style={{ color: '#8a9aaa' }}>{m.city}{m.country ? `, ${m.country}` : ''}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query.length >= 2 && !searching && results.length === 0 && (
                <div className="mt-3 text-center text-sm py-4" style={{ color: '#8a9aaa' }}>
                  No mosques found. Try a different name.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prayer times */}
        {!mosque ? (
          /* No mosque selected state */
          <div className="rounded-2xl p-10 text-center animate-fade-up animate-delay-2"
            style={{ background: 'white', border: '2px dashed var(--cream-dark)' }}>
            <div className="font-display text-5xl mb-4" style={{ color: 'var(--gold)', opacity: 0.5 }}>🕌</div>
            <div className="font-display text-xl mb-2" style={{ color: 'var(--emerald)' }}>Select your mosque</div>
            <p className="text-sm" style={{ color: '#8a9aaa', lineHeight: 1.6 }}>
              Choose your local mosque above to see today's prayer times and enable automatic Adhan on your Alexa.
            </p>
            <button
              onClick={() => setShowSearch(true)}
              className="mt-6 px-8 py-3 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{ background: 'var(--emerald)', color: 'var(--gold-light)', letterSpacing: '0.5px' }}>
              Search Mosque →
            </button>
          </div>
        ) : (
          /* Prayer times grid */
          <div className="space-y-3">
            <div className="ornament mb-4">
              <span style={{ color: '#8a9aaa', fontSize: '11px', letterSpacing: '3px' }} className="uppercase">Today's Prayers</span>
            </div>

            {PRAYERS.map((p, i) => {
              const isActive = currentPrayer === p.key
              const time = prayerTimes?.[p.key] || '--:--'
              return (
                <div
                  key={p.key}
                  className={`animate-fade-up rounded-2xl flex items-center justify-between px-5 py-4 transition-all duration-300 ${isActive ? 'prayer-card-active' : ''}`}
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    opacity: 0,
                    background: isActive ? 'var(--emerald)' : 'white',
                    border: isActive ? '1px solid var(--emerald-mid)' : '1px solid var(--cream-dark)',
                    boxShadow: isActive ? '0 4px 24px rgba(15,76,58,0.25)' : '0 1px 4px rgba(0,0,0,0.04)',
                  }}>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                      style={{ background: isActive ? 'rgba(255,255,255,0.15)' : 'var(--cream)' }}>
                      {p.icon}
                    </div>
                    <div>
                      <div className="font-display text-sm" style={{ color: isActive ? 'var(--gold-light)' : '#8a9aaa', fontStyle: 'italic' }}>
                        {p.ar}
                      </div>
                      <div className="font-medium text-sm" style={{ color: isActive ? 'white' : 'var(--ink)' }}>
                        {p.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="font-display"
                      style={{ fontSize: '26px', fontWeight: 300, color: isActive ? 'white' : 'var(--emerald)', letterSpacing: '-0.5px' }}>
                      {time}
                    </div>
                    {isActive && (
                      <div className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--gold-light)', fontSize: '10px', letterSpacing: '1px' }}>
                        NOW
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Alexa device status */}
        {user && (
          <div className="mt-6 rounded-2xl p-4 animate-fade-up animate-delay-6"
            style={{
              background: user.device_id ? 'rgba(15,76,58,0.06)' : 'rgba(201,168,76,0.08)',
              border: `1px solid ${user.device_id ? 'rgba(15,76,58,0.15)' : 'rgba(201,168,76,0.25)'}`,
            }}>
            <div className="flex items-center gap-3">
              <div className="text-lg">{user.device_id ? '✅' : '⚠️'}</div>
              <div>
                <div className="text-sm font-medium" style={{ color: user.device_id ? 'var(--emerald)' : 'var(--gold)' }}>
                  {user.device_id ? 'Alexa device linked' : 'No Alexa device linked'}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#8a9aaa' }}>
                  {user.device_id
                    ? `Device: ${user.device_id}`
                    : 'Enable the Azan Time skill in your Alexa app to link a device.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs mt-8" style={{ color: '#aab3be', letterSpacing: '0.5px' }}>
          Prayer times provided by your mosque via my-masjid.com
        </p>
      </div>
    </main>
  )
}
