import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)' }}>

      {/* Hero — full emerald panel */}
      <section className="pattern-bg relative overflow-hidden" style={{ minHeight: '100vh' }}>

        {/* Decorative gold arc top-right */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ border: '60px solid var(--gold)' }} />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
          style={{ border: '40px solid var(--gold)' }} />

        {/* Decorative arc bottom-left */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10"
          style={{ border: '50px solid var(--gold)' }} />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20 text-center">

          {/* Crescent + minaret icon row */}
          <div className="animate-fade-up animate-delay-1 mb-6 flex items-center gap-3">
            <div className="h-px w-12 opacity-40" style={{ background: 'var(--gold)' }} />
            <span style={{ color: 'var(--gold)', fontSize: '13px', letterSpacing: '4px', fontFamily: 'DM Sans' }} className="uppercase font-light">
              Automatic Adhan
            </span>
            <div className="h-px w-12 opacity-40" style={{ background: 'var(--gold)' }} />
          </div>

          <h1 className="font-display animate-fade-up animate-delay-2"
            style={{ fontSize: 'clamp(56px, 10vw, 100px)', fontWeight: 300, color: 'white', lineHeight: 1.05, letterSpacing: '-1px' }}>
            Azan<br />
            <em style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>Time</em>
          </h1>

          <p className="animate-fade-up animate-delay-3 mt-6 max-w-md"
            style={{ color: 'rgba(255,255,255,0.65)', fontSize: '17px', lineHeight: 1.7, fontWeight: 300 }}>
            Hear the Adhan on your Alexa device at every prayer — automatically, beautifully, hands-free.
          </p>

          <div className="animate-fade-up animate-delay-4 mt-12 flex flex-col sm:flex-row gap-4">
            <Link href="/connect"
              className="group relative px-10 py-4 rounded-full font-medium transition-all duration-300"
              style={{ background: 'var(--gold)', color: 'var(--ink)', fontSize: '15px', letterSpacing: '0.5px' }}>
              <span className="relative z-10">Connect with Amazon →</span>
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'var(--gold-light)' }} />
            </Link>
            <Link href="/dashboard"
              className="px-10 py-4 rounded-full font-light transition-all duration-300"
              style={{ border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>
              My Dashboard
            </Link>
          </div>

          {/* Prayer times preview */}
          <div className="animate-fade-up animate-delay-5 mt-20 grid grid-cols-5 gap-2 sm:gap-4 max-w-lg w-full">
            {[
              { name: 'Fajr',    ar: 'الفجر',   time: '05:14' },
              { name: 'Dhuhr',   ar: 'الظهر',   time: '12:38' },
              { name: 'Asr',     ar: 'العصر',   time: '15:52' },
              { name: 'Maghrib', ar: 'المغرب',  time: '18:29' },
              { name: 'Isha',    ar: 'العشاء',  time: '20:05' },
            ].map((p) => (
              <div key={p.name} className="rounded-2xl p-3 text-center transition-all duration-300 hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="font-display text-base mb-0.5" style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>{p.ar}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '1px' }} className="uppercase mb-1">{p.name}</div>
                <div className="font-display font-light" style={{ color: 'white', fontSize: '18px' }}>{p.time}</div>
              </div>
            ))}
          </div>

          {/* Scroll hint */}
          <div className="animate-fade-up animate-delay-6 mt-16 flex flex-col items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', letterSpacing: '2px' }}>
            <span className="uppercase">Scroll</span>
            <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)' }} />
          </div>
        </div>
      </section>

      {/* How it works — cream section */}
      <section className="px-6 py-24" style={{ background: 'var(--cream)' }}>
        <div className="max-w-3xl mx-auto">

          <div className="ornament mb-4">
            <span style={{ color: 'var(--gold)', fontSize: '11px', letterSpacing: '4px' }} className="uppercase">How it works</span>
          </div>
          <h2 className="font-display text-center mb-16"
            style={{ fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 300, color: 'var(--emerald)', lineHeight: 1.15 }}>
            Three steps to <em>sacred sound</em>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                num: '١',
                title: 'Link Amazon',
                desc: 'Securely connect your Amazon account. We use official Login with Amazon — no passwords stored.',
              },
              {
                num: '٢',
                title: 'Choose Mosque',
                desc: 'Search and select your local mosque. We fetch real prayer times directly from your mosque.',
              },
              {
                num: '٣',
                title: 'Hear the Adhan',
                desc: 'The Adhan plays automatically on your Alexa at every prayer — Fajr through Isha.',
              },
            ].map((s) => (
              <div key={s.num} className="relative group">
                <div className="font-display mb-4"
                  style={{ fontSize: '52px', color: 'var(--gold)', opacity: 0.6, lineHeight: 1 }}>
                  {s.num}
                </div>
                <h3 className="font-display mb-2"
                  style={{ fontSize: '24px', fontWeight: 500, color: 'var(--emerald)' }}>
                  {s.title}
                </h3>
                <p style={{ color: '#5a6672', fontSize: '15px', lineHeight: 1.7, fontWeight: 300 }}>{s.desc}</p>
                <div className="mt-6 h-px w-12 transition-all duration-500 group-hover:w-24"
                  style={{ background: 'var(--gold)' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-6 py-20 pattern-bg relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, var(--gold) 0%, transparent 60%)' }} />
        <div className="max-w-xl mx-auto text-center relative z-10">
          <h2 className="font-display mb-4"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, color: 'white', lineHeight: 1.2 }}>
            Never miss a prayer <em style={{ color: 'var(--gold-light)' }}>again</em>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', marginBottom: '32px', fontWeight: 300 }}>
            Set up in under 2 minutes. Free forever.
          </p>
          <Link href="/connect"
            className="inline-block px-12 py-4 rounded-full font-medium transition-all duration-300 hover:scale-105"
            style={{ background: 'var(--gold)', color: 'var(--ink)', fontSize: '15px' }}>
            Get Started →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center" style={{ background: 'var(--ink)' }}>
        <div className="font-display" style={{ color: 'var(--gold)', fontSize: '20px', marginBottom: '4px' }}>
          Azan Time
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
          © 2026 · azantime.de
        </p>
      </footer>

    </main>
  )
}
