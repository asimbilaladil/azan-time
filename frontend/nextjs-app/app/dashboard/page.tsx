'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || '/api'

const PRAYERS = [
  { key: 'fajr',    label: 'Fajr',    ar: 'فجر',   icon: '🌙' },
  { key: 'dhuhr',   label: 'Zuhr',    ar: 'ظهر',   icon: '☀️' },
  { key: 'asr',     label: 'Asr',     ar: 'عصر',   icon: '🌤' },
  { key: 'maghrib', label: 'Maghrib', ar: 'مغرب',  icon: '🌅' },
  { key: 'isha',    label: 'Isha',    ar: 'عشاء',  icon: '🌙' },
]

function getNextPrayer(times: Record<string, string>): { key: string; label: string; time: string; minutesLeft: number } | null {
  if (!times) return null
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  for (const p of PRAYERS) {
    if (!times[p.key]) continue
    const [h, m] = times[p.key].split(':').map(Number)
    const pMin = h * 60 + m
    if (pMin > nowMin) {
      return { key: p.key, label: p.label, time: times[p.key], minutesLeft: pMin - nowMin }
    }
  }
  if (times.fajr) {
    const [h, m] = times.fajr.split(':').map(Number)
    return { key: 'fajr', label: 'Fajr', time: times.fajr, minutesLeft: (24 * 60 - nowMin) + h * 60 + m }
  }
  return null
}

function getCurrentPrayerKey(times: Record<string, string>): string | null {
  if (!times) return null
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const toMin = (t: string) => { if (!t) return -1; const [h, m] = t.split(':').map(Number); return h * 60 + m }
  let current = null
  for (const p of PRAYERS) {
    if (toMin(times[p.key]) <= nowMin) current = p.key
  }
  return current
}

function getHijriDate(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    return formatter.format(new Date())
  } catch {
    return ''
  }
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
  const [fabExpanded, setFabExpanded] = useState(false)
  const searchTimeout = useRef<any>(null)
  const searchRef = useRef<any>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const jwt = localStorage.getItem('jwt')
    if (!jwt) { router.push('/connect'); return }
    const headers = { Authorization: `Bearer ${jwt}` }
    axios.get(`${API}/user/me`, { headers })
      .then((r) => {
        setUser(r.data)
        if (r.data.mosque_guid) {
          return axios.get(`${API}/mosques/${r.data.mosque_guid}/times`, { headers })
            .then((t) => { setMosque(t.data.mosque); setPrayerTimes(t.data.times) })
        }
      })
      .catch(() => router.push('/connect'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false); setQuery(''); setResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
      setMosque(t.data.mosque); setPrayerTimes(t.data.times)
      setShowSearch(false); setQuery(''); setResults([])
    } catch {}
    setSaving(false)
  }

  const nextPrayer = prayerTimes ? getNextPrayer(prayerTimes) : null
  const currentPrayer = prayerTimes ? getCurrentPrayerKey(prayerTimes) : null
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const hijriDate = getHijriDate()
  const gregorianDate = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const countdownH = nextPrayer ? Math.floor(nextPrayer.minutesLeft / 60) : 0
  const countdownM = nextPrayer ? nextPrayer.minutesLeft % 60 : 0

  if (loading) return (
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

        .dash-root {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at 20% 0%, rgba(139,101,30,0.18) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(10,80,45,0.35) 0%, transparent 50%),
            linear-gradient(160deg, #1a3d28 0%, #0f2318 40%, #132d1e 100%);
          color: #e8dfc0;
          font-family: 'Cormorant Garamond', serif;
          padding: 0;
          position: relative;
          overflow-x: hidden;
        }

        .dash-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(201,168,76,0.03) 59px, rgba(201,168,76,0.03) 60px),
            repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(201,168,76,0.03) 59px, rgba(201,168,76,0.03) 60px);
          pointer-events: none;
          z-index: 0;
        }

        .dash-inner {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px 40px;
        }

        /* ── HEADER ── */
        .dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0 16px;
          border-bottom: 1px solid rgba(201,168,76,0.15);
          margin-bottom: 32px;
        }

        .dash-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dash-logo-icon {
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

        .dash-logo-text {
          font-family: 'Cinzel', serif;
          font-size: 1.3rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          color: #c9a84c;
        }

        .dash-logo-sub {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: rgba(201,168,76,0.5);
          text-transform: uppercase;
          margin-top: 1px;
        }

        .dash-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .notification-btn {
          width: 40px;
          height: 40px;
          border: 1px solid rgba(201,168,76,0.3);
          border-radius: 50%;
          background: rgba(201,168,76,0.05);
          color: #c9a84c;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .notification-btn:hover {
          background: rgba(201,168,76,0.15);
          border-color: rgba(201,168,76,0.6);
        }

        /* ── GRID ── */
        .dash-grid {
          display: grid;
          grid-template-columns: 300px 1fr 280px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1100px) {
          .dash-grid { grid-template-columns: 1fr 1fr; }
          .dash-center { grid-column: 1 / -1; order: -1; }
        }
        @media (max-width: 680px) {
          .dash-grid { grid-template-columns: 1fr; }
        }

        /* ── CARD ── */
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

        /* ── MOSQUE CARD ── */
        .mosque-card { display: flex; align-items: flex-start; gap: 14px; }

        .mosque-img {
          width: 52px; height: 52px; border-radius: 12px;
          background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05));
          border: 1px solid rgba(201,168,76,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; flex-shrink: 0;
        }

        .mosque-info { flex: 1; min-width: 0; }

        .mosque-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem; font-weight: 600; color: #e8dfc0;
          line-height: 1.3; margin-bottom: 3px;
        }

        .mosque-address { font-size: 0.75rem; color: rgba(232,223,192,0.5); line-height: 1.4; }

        .change-btn {
          margin-top: 16px; width: 100%; padding: 10px;
          background: transparent; border: 1px solid rgba(201,168,76,0.35);
          border-radius: 10px; color: #c9a84c;
          font-family: 'Cinzel', serif; font-size: 0.72rem;
          letter-spacing: 0.12em; cursor: pointer; transition: all 0.2s;
        }

        .change-btn:hover { background: rgba(201,168,76,0.1); border-color: rgba(201,168,76,0.6); }

        .search-wrap { margin-top: 14px; position: relative; }

        .search-input {
          width: 100%; padding: 10px 14px;
          background: rgba(0,0,0,0.3); border: 1px solid rgba(201,168,76,0.3);
          border-radius: 10px; color: #e8dfc0;
          font-family: 'Cormorant Garamond', serif; font-size: 0.95rem; outline: none;
        }

        .search-input::placeholder { color: rgba(232,223,192,0.35); }
        .search-input:focus { border-color: rgba(201,168,76,0.6); }

        .search-results {
          margin-top: 6px; background: #0d2a1a;
          border: 1px solid rgba(201,168,76,0.2); border-radius: 10px;
          overflow: hidden; max-height: 220px; overflow-y: auto;
        }

        .search-result-item {
          width: 100%; text-align: left; padding: 10px 14px;
          background: transparent; border: none; color: #e8dfc0;
          font-family: 'Cormorant Garamond', serif; font-size: 0.9rem;
          cursor: pointer; border-bottom: 1px solid rgba(201,168,76,0.08);
          transition: background 0.15s;
        }

        .search-result-item:hover { background: rgba(201,168,76,0.08); }
        .search-result-item:last-child { border-bottom: none; }
        .search-result-city { font-size: 0.75rem; color: rgba(232,223,192,0.45); margin-top: 1px; }

        /* ── CLOCK CARD ── */
        .clock-card { text-align: center; }

        .clock-icons { display: flex; justify-content: center; gap: 20px; margin-bottom: 16px; font-size: 1.1rem; opacity: 0.6; }

        .clock-time {
          font-family: 'Cinzel', serif; font-size: 3.8rem; font-weight: 400;
          color: #c9a84c; letter-spacing: 0.04em; line-height: 1;
          text-shadow: 0 0 30px rgba(201,168,76,0.4); margin-bottom: 4px;
        }

        .clock-seconds { font-size: 1.4rem; opacity: 0.5; vertical-align: super; }

        .clock-hijri {
          font-family: 'Noto Naskh Arabic', serif; font-size: 0.85rem;
          color: rgba(201,168,76,0.7); margin-top: 6px; direction: rtl;
        }

        .clock-gregorian { font-size: 0.8rem; color: rgba(232,223,192,0.4); margin-top: 4px; letter-spacing: 0.05em; }

        /* ── CENTER CARD ── */
        .center-card { padding: 32px 36px; }

        .center-label {
          font-family: 'Cinzel', serif; font-size: 0.7rem; letter-spacing: 0.25em;
          text-transform: uppercase; color: rgba(201,168,76,0.6); text-align: center; margin-bottom: 6px;
        }

        .next-prayer-heading {
          font-family: 'Cormorant Garamond', serif; font-size: 2.4rem; font-weight: 300;
          text-align: center; color: #e8dfc0; margin-bottom: 2px;
        }

        .next-prayer-heading span { color: #c9a84c; font-weight: 600; }

        .countdown-row {
          display: flex; align-items: baseline; justify-content: center;
          gap: 6px; margin: 16px 0 28px;
        }

        .countdown-num {
          font-family: 'Cinzel', serif; font-size: 3.5rem; font-weight: 600;
          color: #c9a84c; text-shadow: 0 0 40px rgba(201,168,76,0.5); line-height: 1;
        }

        .countdown-unit {
          font-size: 0.75rem; color: rgba(201,168,76,0.5); letter-spacing: 0.15em;
          text-transform: uppercase; align-self: flex-end; margin-bottom: 8px;
        }

        .countdown-sep { font-family: 'Cinzel', serif; font-size: 2.5rem; color: rgba(201,168,76,0.3); line-height: 1; }

        .prayer-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent);
          margin-bottom: 20px;
        }

        .prayer-table { width: 100%; border-collapse: collapse; }

        .prayer-table thead th {
          font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 0.2em;
          color: rgba(201,168,76,0.45); text-transform: uppercase; padding-bottom: 10px;
          font-weight: 400; text-align: left;
        }

        .prayer-table thead th:last-child { text-align: right; }
        .prayer-table thead th:nth-child(2) { text-align: center; }

        .prayer-row { border-top: 1px solid rgba(201,168,76,0.06); transition: background 0.15s; }
        .prayer-row:hover { background: rgba(201,168,76,0.04); }
        .prayer-row.active { background: linear-gradient(90deg, rgba(201,168,76,0.1), rgba(201,168,76,0.04)); }
        .prayer-row td { padding: 11px 6px; font-size: 1rem; }

        .prayer-icon-label { display: flex; align-items: center; gap: 10px; color: #e8dfc0; }
        .prayer-icon-label.active { color: #c9a84c; font-weight: 600; }

        .prayer-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(201,168,76,0.08);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }

        .active .prayer-icon { background: rgba(201,168,76,0.18); }

        .prayer-label-en { font-size: 0.95rem; }

        .prayer-label-ar {
          font-family: 'Noto Naskh Arabic', serif; font-size: 0.95rem;
          text-align: center; color: rgba(232,223,192,0.5); direction: rtl;
        }

        .active .prayer-label-ar { color: rgba(201,168,76,0.7); }

        .prayer-time-cell {
          text-align: right; font-family: 'Cinzel', serif; font-size: 0.95rem;
          color: rgba(232,223,192,0.75); letter-spacing: 0.05em;
        }

        .active .prayer-time-cell { color: #c9a84c; }

        .active-badge {
          display: inline-block;
          background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.3);
          border-radius: 4px; font-size: 0.6rem; letter-spacing: 0.12em;
          color: #c9a84c; padding: 1px 6px; margin-left: 6px;
          font-family: 'Cinzel', serif; vertical-align: middle;
        }

        /* ── RIGHT CARDS ── */
        .alexa-title {
          font-family: 'Cinzel', serif; font-size: 0.9rem; font-weight: 500;
          letter-spacing: 0.08em; color: #e8dfc0; margin-bottom: 8px;
        }

        .alexa-desc { font-size: 0.83rem; color: rgba(232,223,192,0.5); line-height: 1.6; margin-bottom: 16px; }

        .alexa-brand { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; }

        .alexa-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(0,168,232,0.1); border: 1px solid rgba(0,168,232,0.2);
          border-radius: 6px; padding: 3px 10px; font-size: 0.72rem;
          color: #52c8f0; letter-spacing: 0.08em;
        }

        .skill-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #c9a84c, #8b6a1e);
          border: none; border-radius: 10px; color: #0a1f14;
          font-family: 'Cinzel', serif; font-size: 0.75rem; font-weight: 600;
          letter-spacing: 0.15em; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(201,168,76,0.25); text-decoration: none;
        }

        .skill-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(201,168,76,0.4); }

        .skill-steps { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }

        .skill-step { display: flex; align-items: flex-start; gap: 10px; font-size: 0.78rem; color: rgba(232,223,192,0.5); line-height: 1.4; }

        .skill-step-num {
          width: 18px; height: 18px; border-radius: 50%;
          border: 1px solid rgba(201,168,76,0.3); color: rgba(201,168,76,0.6);
          font-family: 'Cinzel', serif; font-size: 0.6rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }

        /* ── SETUP GUIDE LINK ── */
        .setup-guide-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 14px;
          padding: 9px 14px;
          background: transparent;
          border: 1px dashed rgba(201,168,76,0.25);
          border-radius: 10px;
          color: rgba(201,168,76,0.6);
          font-family: 'Cinzel', serif;
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-decoration: none;
          transition: all 0.2s;
          text-align: center;
        }

        .setup-guide-link:hover {
          border-color: rgba(201,168,76,0.5);
          color: #c9a84c;
          background: rgba(201,168,76,0.05);
        }

        /* ── FLOATING ACTION BUTTON ── */
        .fab-container {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }

        /* Tooltip bubble */
        .fab-tooltip {
          background: rgba(10,26,18,0.97);
          border: 1px solid rgba(201,168,76,0.3);
          border-radius: 14px;
          padding: 14px 18px;
          width: 230px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          transform: translateY(4px) scale(0.96);
          opacity: 0;
          pointer-events: none;
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }

        .fab-tooltip.visible {
          transform: translateY(0) scale(1);
          opacity: 1;
          pointer-events: all;
        }

        /* small arrow pointing down-right */
        .fab-tooltip::after {
          content: '';
          position: absolute;
          bottom: -7px;
          right: 20px;
          width: 12px;
          height: 12px;
          background: rgba(10,26,18,0.97);
          border-right: 1px solid rgba(201,168,76,0.3);
          border-bottom: 1px solid rgba(201,168,76,0.3);
          transform: rotate(45deg);
        }

        .fab-tooltip-title {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          color: #c9a84c;
          margin-bottom: 5px;
        }

        .fab-tooltip-desc {
          font-size: 0.8rem;
          color: rgba(232,223,192,0.55);
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .fab-tooltip-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          width: 100%;
          padding: 9px;
          background: linear-gradient(135deg, #c9a84c, #8b6a1e);
          border: none;
          border-radius: 8px;
          color: #0a1f14;
          font-family: 'Cinzel', serif;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fab-tooltip-btn:hover {
          box-shadow: 0 4px 16px rgba(201,168,76,0.35);
        }

        /* Main FAB button */
        .fab-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #c9a84c, #8b6a1e);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(201,168,76,0.35), 0 0 0 0 rgba(201,168,76,0.4);
          transition: all 0.25s;
          position: relative;
          animation: fab-pulse 3s ease-in-out infinite;
        }

        .fab-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 28px rgba(201,168,76,0.5);
          animation: none;
        }

        .fab-btn.open {
          background: linear-gradient(135deg, #8b6a1e, #c9a84c);
          animation: none;
        }

        @keyframes fab-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(201,168,76,0.35), 0 0 0 0 rgba(201,168,76,0.4); }
          50% { box-shadow: 0 4px 20px rgba(201,168,76,0.35), 0 0 0 10px rgba(201,168,76,0); }
        }

        .fab-icon {
          font-size: 22px;
          transition: transform 0.25s;
          color: #0a1f14;
          font-weight: 700;
          line-height: 1;
        }

        .fab-btn.open .fab-icon { transform: rotate(45deg); }

        /* Unread dot */
        .fab-dot {
          position: absolute;
          top: 3px;
          right: 3px;
          width: 12px;
          height: 12px;
          background: #e74c3c;
          border-radius: 50%;
          border: 2px solid #0f2318;
          animation: dot-pulse 2s ease-in-out infinite;
        }

        @keyframes dot-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* ── FOOTER ── */
        .dash-footer {
          margin-top: 32px;
          padding: 16px 0;
          border-top: 1px solid rgba(201,168,76,0.1);
          text-align: center;
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          color: rgba(201,168,76,0.35);
          text-transform: uppercase;
        }

        .footer-mosque-name { color: rgba(201,168,76,0.55); }
      `}</style>

      <div className="dash-root">
        <div className="dash-inner">

          {/* HEADER */}
          <header className="dash-header">
            <div className="dash-logo">
              <div className="dash-logo-icon">🕌</div>
              <div>
                <div className="dash-logo-text">AZAN TIME</div>
                <div className="dash-logo-sub">Automatic Azan</div>
              </div>
            </div>
            <div className="dash-header-right">
              <button className="notification-btn">🔔</button>
            </div>
          </header>

          {/* GRID */}
          <div className="dash-grid">

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Mosque Card */}
              <div className="card" ref={searchRef}>
                <div className="mosque-card">
                  <div className="mosque-img">🕌</div>
                  <div className="mosque-info">
                    {mosque ? (
                      <>
                        <div className="mosque-name">{mosque.name}</div>
                        <div className="mosque-address">{mosque.city}{mosque.country ? `, ${mosque.country}` : ''}</div>
                      </>
                    ) : (
                      <div className="mosque-name" style={{ opacity: 0.4 }}>No mosque selected</div>
                    )}
                  </div>
                </div>
                <button className="change-btn" onClick={() => setShowSearch(!showSearch)}>
                  {showSearch ? '✕ CANCEL' : '⟳ CHANGE MASJID'}
                </button>
                {showSearch && (
                  <div className="search-wrap">
                    <input
                      type="text"
                      className="search-input"
                      value={query}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search mosque name or city..."
                      autoFocus
                    />
                    {searching && (
                      <div style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'rgba(232,223,192,0.4)', fontStyle: 'italic' }}>
                        Searching...
                      </div>
                    )}
                    {results.length > 0 && (
                      <div className="search-results">
                        {results.map((m) => (
                          <button key={m.guid} className="search-result-item" onClick={() => handleSelectMosque(m)} disabled={saving}>
                            <div>{m.name}</div>
                            <div className="search-result-city">{m.city}{m.country ? `, ${m.country}` : ''}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Clock Card */}
              <div className="card clock-card">
                <div className="clock-icons">
                  <span>🌙</span><span>☀️</span><span>🌅</span>
                </div>
                <div className="clock-time">
                  {hours}:{minutes}
                  <span className="clock-seconds">:{seconds}</span>
                </div>
                {hijriDate && <div className="clock-hijri">{hijriDate}</div>}
                <div className="clock-gregorian">{gregorianDate}</div>
              </div>
            </div>

            {/* CENTER */}
            <div className="card center-card dash-center">
              <div className="center-label">Automatic Azan</div>
              {nextPrayer ? (
                <>
                  <div className="next-prayer-heading">
                    <span>{nextPrayer.label}</span> Azan in:
                  </div>
                  <div className="countdown-row">
                    {countdownH > 0 && (
                      <>
                        <div style={{ textAlign: 'center' }}>
                          <div className="countdown-num">{String(countdownH).padStart(2,'0')}</div>
                          <div className="countdown-unit">hr</div>
                        </div>
                        <div className="countdown-sep">:</div>
                      </>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div className="countdown-num">{String(countdownM).padStart(2,'0')}</div>
                      <div className="countdown-unit">min</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="next-prayer-heading" style={{ marginBottom: '24px' }}>
                  Select a mosque to begin
                </div>
              )}
              <div className="prayer-divider" />
              <table className="prayer-table">
                <thead>
                  <tr>
                    <th>Prayer</th>
                    <th style={{ textAlign: 'center' }}>—</th>
                    <th style={{ textAlign: 'right' }}>Azan Time</th>
                  </tr>
                </thead>
                <tbody>
                  {PRAYERS.map((p) => {
                    const time = prayerTimes?.[p.key] || '--:--'
                    const isActive = currentPrayer === p.key
                    const isNext = nextPrayer?.key === p.key && !isActive
                    return (
                      <tr key={p.key} className={`prayer-row${isActive ? ' active' : ''}`}>
                        <td>
                          <div className={`prayer-icon-label${isActive ? ' active' : ''}`}>
                            <div className="prayer-icon">{p.icon}</div>
                            <span className="prayer-label-en">
                              {p.label}
                              {isActive && <span className="active-badge">NOW</span>}
                              {isNext && <span className="active-badge" style={{ color: 'rgba(232,223,192,0.6)', borderColor: 'rgba(232,223,192,0.2)', background: 'transparent' }}>NEXT</span>}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={`prayer-label-ar${isActive ? ' active' : ''}`}>{p.ar}</div>
                        </td>
                        <td>
                          <div className={`prayer-time-cell${isActive ? ' active' : ''}`}>{time}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card">
                <div className="alexa-title">Hear Azan on Alexa</div>
                <p className="alexa-desc">
                  Enable the Azan Time skill on your Alexa device and hear the Azan automatically at every prayer — hands-free.
                </p>
                <div className="alexa-brand">
                  <span className="alexa-badge">⌘ amazon</span>
                  <span className="alexa-badge" style={{ color: 'rgba(232,223,192,0.5)', borderColor: 'rgba(232,223,192,0.1)', background: 'transparent' }}>alexa skill</span>
                </div>
                <a
                  href="https://www.amazon.de/dp/B0GS1SD9LF/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="skill-btn"
                >
                  <span>🔔</span>
                  ENABLE ALEXA SKILL
                </a>
                <div className="skill-steps">
                  <div className="skill-step">
                    <div className="skill-step-num">1</div>
                    <span>Open the Alexa skill in the Amazon store</span>
                  </div>
                  <div className="skill-step">
                    <div className="skill-step-num">2</div>
                    <span>Enable the skill and link your account</span>
                  </div>
                  <div className="skill-step">
                    <div className="skill-step-num">3</div>
                    <span>Set up an Alexa Routine to play Azan</span>
                  </div>
                </div>

                {/* Step-by-step guide link */}
                <Link href="/alexa-setup" className="setup-guide-link">
                  📖 &nbsp;View full setup guide →
                </Link>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          {mosque && (
            <footer className="dash-footer">
              <span className="footer-mosque-name">{mosque.name}</span>
              {mosque.city ? ` | ${mosque.city.toUpperCase()}` : ''}
            </footer>
          )}
        </div>
      </div>

      {/* ── FLOATING HELP BUTTON ── */}
      <div className="fab-container">
        {/* Tooltip */}
        <div className={`fab-tooltip${fabExpanded ? ' visible' : ''}`}>
          <div className="fab-tooltip-title">ALEXA SETUP GUIDE</div>
          <div className="fab-tooltip-desc">
            New here? Follow our step-by-step guide to hear Azan on your Alexa device.
          </div>
          <Link
            href="/alexa-setup"
            className="fab-tooltip-btn"
            onClick={() => setFabExpanded(false)}
          >
            📖 &nbsp;Open Setup Guide →
          </Link>
        </div>

        {/* FAB */}
        <button
          className={`fab-btn${fabExpanded ? ' open' : ''}`}
          onClick={() => setFabExpanded(!fabExpanded)}
          aria-label="Alexa setup guide"
          title="Alexa Setup Guide"
        >
          {!fabExpanded && <div className="fab-dot" />}
          <span className="fab-icon">{fabExpanded ? '✕' : '?'}</span>
        </button>
      </div>
    </>
  )
}
