'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || '/api'

const METHODS = [
  'MuslimWorldLeague', 'ISNA', 'Egyptian', 'Karachi',
  'UmmAlQura', 'Turkey', 'MoonsightingCommittee', 'Singapore',
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser]     = useState<any>(null)
  const [cities, setCities] = useState<any[]>([])
  const [cityId, setCityId] = useState('')
  const [method, setMethod] = useState('MuslimWorldLeague')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    const jwt = localStorage.getItem('jwt')
    if (!jwt) { router.push('/connect'); return }
    const headers = { Authorization: `Bearer ${jwt}` }

    Promise.all([
      axios.get(`${API}/user/me`,  { headers }),
      axios.get(`${API}/cities`),
    ]).then(([userRes, citiesRes]) => {
      setUser(userRes.data)
      setCities(citiesRes.data)
      setCityId(String(userRes.data.city_id || ''))
      setMethod(userRes.data.calculation_method || 'MuslimWorldLeague')
    }).catch(() => { router.push('/connect') })
  }, [])

  const handleSave = async () => {
    const jwt = localStorage.getItem('jwt')
    if (!jwt) return
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await axios.put(
        `${API}/user/settings`,
        { city_id: parseInt(cityId), calculation_method: method },
        { headers: { Authorization: `Bearer ${jwt}` } }
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('jwt')
    router.push('/')
  }

  if (!user) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-400 text-sm">Loading...</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-800">⚙️ Your Settings</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {user.email || `Amazon user ${user.amazon_user_id?.slice(0, 8)}...`}
            </p>
          </div>
          <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-slate-600">
            Sign out
          </button>
        </div>

        {/* Device status */}
        <div className={`rounded-xl p-4 mb-6 text-sm ${
          user.device_id
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-amber-50 border border-amber-200 text-amber-700'
        }`}>
          {user.device_id
            ? `✅ Alexa device linked: ${user.device_id}`
            : '⚠️ No Alexa device linked yet. Enable the Azan Time skill in the Alexa app.'
          }
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5 border border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
            <select
              value={cityId}
              onChange={e => setCityId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">Select city...</option>
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name}, {c.country}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Calculation Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSave}
            disabled={!cityId || saving}
            className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {saved ? '✅ Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link href="/setup" className="text-xs text-slate-400 hover:text-slate-600 underline">
            View Alexa routine setup guide
          </Link>
        </div>
      </div>
    </main>
  )
}
