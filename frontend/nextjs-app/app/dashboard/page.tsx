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
<main className="min-h-screen bg-gradient-to-b from-teal-900 to-teal-700 text-white p-8">

<div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">

{/* LEFT PANEL */}

<div className="space-y-6">

{/* Mosque card */}

<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
<div className="flex items-center gap-3 mb-3">
<div className="text-3xl">🕌</div>

<div>
<div className="font-semibold text-lg">
{mosque ? mosque.name : "No Mosque Selected"}
</div>

<div className="text-sm opacity-70">
{mosque ? `${mosque.city}` : "Select mosque"}
</div>
</div>
</div>

<button
onClick={() => setShowSearch(!showSearch)}
className="mt-3 bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:scale-105 transition">
Change Masjid
</button>

</div>


{/* CLOCK */}

<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">

<div className="text-5xl font-mono text-yellow-300 drop-shadow-lg">
{timeStr}
</div>

<div className="mt-2 opacity-70 text-sm">
{dateStr}
</div>

</div>

</div>



{/* CENTER PANEL */}

<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">

<div className="opacity-70 mb-2">
Automatic Adhan
</div>

<div className="text-3xl font-semibold mb-4">
Next Prayer
</div>

<div className="text-6xl font-bold text-yellow-300 drop-shadow-[0_0_25px_rgba(251,191,36,0.8)] mb-6">
{currentPrayer?.toUpperCase()}
</div>


{/* Prayer Table */}

<table className="w-full text-left">

<tbody>

{PRAYERS.map((p) => {

const time = prayerTimes?.[p.key] || "--:--"
const isActive = currentPrayer === p.key

return (

<tr key={p.key}
className={`border-b border-white/20 hover:bg-white/10 transition ${isActive ? "bg-yellow-400/20 text-yellow-300 font-semibold" : ""}`}>

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



{/* RIGHT PANEL */}

<div className="space-y-6">

<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">

<div className="text-lg font-semibold mb-2">
Hear Adhan on Alexa
</div>

<p className="text-sm opacity-70 mb-4">
Hear the Adhan automatically on your Alexa device for every prayer.
</p>

<button
className="bg-yellow-400 text-black px-5 py-3 rounded-xl font-semibold hover:scale-105 transition">
Connect Alexa
</button>

</div>



{/* Device Status */}

{user && (

<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">

<div className="text-sm">

{user.device_id
? `✅ Device linked: ${user.device_id}`
: "⚠️ No Alexa device linked"}

</div>

</div>

)}

</div>

</div>

</main>
)
