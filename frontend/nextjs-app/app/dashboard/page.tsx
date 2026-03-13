'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || '/api'

const PRAYERS = [
  { key: 'fajr', label: 'Fajr', ar: 'الفجر', icon: '🌙' },
  { key: 'dhuhr', label: 'Dhuhr', ar: 'الظهر', icon: '☀️' },
  { key: 'asr', label: 'Asr', ar: 'العصر', icon: '🌤' },
  { key: 'maghrib', label: 'Maghrib', ar: 'المغرب', icon: '🌅' },
  { key: 'isha', label: 'Isha', ar: 'العشاء', icon: '⭐' },
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

  const [user, setUser] = useState<any>(null)
  const [mosque, setMosque] = useState<any>(null)
  const [prayerTimes, setPrayerTimes] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [now, setNow] = useState(new Date())

  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  const searchTimeout = useRef<any>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const jwt = localStorage.getItem('jwt')
    if (!jwt) {
      router.push('/connect')
      return
    }

    const headers = { Authorization: `Bearer ${jwt}` }

    axios
      .get(`${API}/user/me`, { headers })
      .then((r) => {
        setUser(r.data)

        if (r.data.mosque_guid) {
          return axios
            .get(`${API}/mosques/${r.data.mosque_guid}/times`, { headers })
            .then((t) => {
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

    if (q.length < 2) {
      setResults([])
      return
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true)

      try {
        const r = await axios.get(
          `${API}/mosques/search?q=${encodeURIComponent(q)}`
        )

        setResults(r.data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const handleSelectMosque = async (m: any) => {
    const jwt = localStorage.getItem('jwt')
    if (!jwt) return

    setSaving(true)

    try {
      await axios.put(
        `${API}/user/settings`,
        { mosque_guid: m.guid
          mosque_lat: m.latitude,   // ADD
          mosque_lng: m.longitude   // ADD
        },
        { headers: { Authorization: `Bearer ${jwt}` } }
      )

      const t = await axios.get(`${API}/mosques/${m.guid}/times`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })

      setMosque(t.data.mosque)
      setPrayerTimes(t.data.times)

      setShowSearch(false)
      setQuery('')
      setResults([])
    } catch {}

    setSaving(false)
  }

  const currentPrayer = prayerTimes
    ? getCurrentPrayerKey(prayerTimes)
    : null

  const timeStr = now.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const dateStr = now.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-900 text-white">
        Loading...
      </div>
    )

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-900 to-teal-700 text-white p-8">

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN */}

        <div className="space-y-6">

          {/* Mosque card */}

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">

            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">🕌</div>

              <div>
                {mosque ? (
                  <>
                    <div className="font-semibold">
                      {mosque.name}
                    </div>

                    <div className="text-sm opacity-70">
                      {mosque.city}
                    </div>
                  </>
                ) : (
                  <div className="text-sm opacity-70">
                    No mosque selected
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:scale-105 transition"
            >
              Change Masjid
            </button>

            {showSearch && (
              <div className="mt-4">

                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search mosque..."
                  className="w-full p-2 rounded text-black"
                />

                {results.map((m) => (
                  <button
                    key={m.guid}
                    onClick={() => handleSelectMosque(m)}
                    className="block w-full text-left p-2 hover:bg-white/10"
                  >
                    {m.name} – {m.city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clock */}

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">

            <div
              style={{
                fontSize: '64px',
                fontWeight: 300,
                color: '#facc15',
                textShadow: '0 0 20px rgba(250,204,21,0.8)',
              }}
            >
              {timeStr}
            </div>

            <div className="text-sm opacity-70 mt-2">
              {dateStr}
            </div>
          </div>

        </div>

        {/* CENTER */}

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">

          <div className="text-center text-xl mb-4">
            Automatic Adhan
          </div>

          <div className="text-center text-3xl mb-6">
            Next Prayer
          </div>

          <table className="w-full">

            <tbody>

              {PRAYERS.map((p) => {
                const time = prayerTimes?.[p.key] || '--:--'
                const isActive = currentPrayer === p.key

                return (
                  <tr
                    key={p.key}
                    className={`border-b border-white/20 ${
                      isActive ? 'text-yellow-300 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3">
                      {p.icon} {p.label}
                    </td>

                    <td className="text-center">
                      {p.ar}
                    </td>

                    <td className="text-right">
                      {time}
                    </td>
                  </tr>
                )
              })}
            </tbody>

          </table>
        </div>

        {/* RIGHT */}

        <div className="space-y-6">

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">

            <div className="text-lg font-semibold mb-2">
              Hear Adhan on Alexa
            </div>

            <p className="text-sm opacity-70 mb-4">
              Hear the Adhan automatically on your Alexa device for every prayer.
            </p>

            <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:scale-105 transition">
              Connect Alexa
            </button>

          </div>

          {user && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">

              {user.device_id ? (
                <div>✅ Device linked: {user.device_id}</div>
              ) : (
                <div>⚠️ No Alexa device linked</div>
              )}

            </div>
          )}

        </div>

      </div>
    </main>
  )
}
