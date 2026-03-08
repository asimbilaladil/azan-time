'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import axios from 'axios'

interface City {
  id: number
  name: string
  country: string
  timezone: string
  calculation_method: string
}

const METHODS = [
  { value: 'MuslimWorldLeague', label: 'Muslim World League (Europe, Far East)' },
  { value: 'ISNA',              label: 'ISNA — North America' },
  { value: 'Egyptian',          label: 'Egyptian General Authority' },
  { value: 'Karachi',           label: 'University of Islamic Sciences, Karachi' },
  { value: 'UmmAlQura',         label: 'Umm Al-Qura — Saudi Arabia' },
  { value: 'Turkey',            label: 'Turkey (Diyanet)' },
  { value: 'MoonsightingCommittee', label: 'Moonsighting Committee (UK)' },
  { value: 'Singapore',         label: 'MUIS — Singapore / Malaysia / Indonesia' },
]

const API = process.env.NEXT_PUBLIC_API_URL || '/api'

function ConnectForm() {
  const params = useSearchParams()
  const router = useRouter()
  const tokenParam = params.get('token')

  const [isLinked, setIsLinked] = useState(false)
  const [cities, setCities]     = useState<City[]>([])
  const [cityId, setCityId]     = useState('')
  const [method, setMethod]     = useState('MuslimWorldLeague')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (tokenParam) {
      localStorage.setItem('jwt', tokenParam)
    }
    const jwt = localStorage.getItem('jwt')
    setIsLinked(!!jwt)
    axios.get(`${API}/cities`).then(r => setCities(r.data)).catch(() => {})
  }, [tokenParam])

  const handleSave = async () => {
    const jwt = localStorage.getItem('jwt')
    if (!jwt || !cityId) return
    setSaving(true)
    setError('')
    try {
      await axios.put(
        `${API}/user/settings`,
        { city_id: parseInt(cityId), calculation_method: method },
        { headers: { Authorization: `Bearer ${jwt}` } }
      )
      setSaved(true)
      setTimeout(() => router.push('/setup'), 1500)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🕌</div>
          <h1 className="text-2xl font-bold text-slate-800">Azan Time</h1>
          <p className="text-slate-500 mt-1 text-sm">Setup your automatic Adhan</p>
        </div>

        {!isLinked ? (
          <div className="text-center">
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Connect your Amazon account to link your Alexa devices and enable automatic Adhan.
            </p>
            <a
              href={`${API}/auth/lwa`}
              className="inline-block bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-8 py-3 rounded-xl transition-colors w-full text-center"
            >
              Connect Amazon Account
            </a>
            <p className="text-xs text-slate-400 mt-4">
              We only request your profile and device access. No passwords stored.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 rounded-lg p-3">
              <span>✅</span>
              <span>Amazon account linked successfully!</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Your City *
              </label>
              <select
                value={cityId}
                onChange={e => setCityId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
              >
                <option value="">Choose a city...</option>
                {cities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}, {c.country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Calculation Method
              </label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
              >
                {METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={!cityId || saving}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {saved ? '✅ Saved! Redirecting...' : saving ? 'Saving...' : 'Save & Continue →'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default function ConnectPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </main>
    }>
      <ConnectForm />
    </Suspense>
  )
}
