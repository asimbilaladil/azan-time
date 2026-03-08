import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-7xl mb-6">🕌</div>
        <h1 className="text-4xl font-bold text-white mb-4">Azan Time</h1>
        <p className="text-slate-300 text-lg mb-4">
          Automatically plays the Adhan on your Amazon Alexa device — 5 times daily, hands-free.
        </p>
        <p className="text-slate-400 text-sm mb-10">
          Set up once. Hear Fajr, Dhuhr, Asr, Maghrib, and Isha automatically.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/connect"
            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Get Started →
          </Link>
          <Link
            href="/setup"
            className="border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Setup Guide
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            { icon: '🔗', title: 'Link Amazon',  desc: 'Connect your Amazon account securely with Login With Amazon.' },
            { icon: '🌍', title: 'Select City',  desc: 'Choose your city or mosque. We calculate prayer times for you.' },
            { icon: '📿', title: 'Hear Adhan',   desc: 'The Adhan plays automatically on your Alexa device at every prayer.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
              <div className="text-2xl mb-2">{icon}</div>
              <h3 className="text-white font-semibold mb-1">{title}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
