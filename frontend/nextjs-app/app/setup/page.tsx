import Link from 'next/link'

const STEPS = [
  { step: 1, title: 'Open the Alexa App',       body: 'On your phone, open the Amazon Alexa app.' },
  { step: 2, title: 'Go to More → Routines',    body: 'Tap "More" in the bottom navigation, then tap "Routines".' },
  { step: 3, title: 'Tap the + button',          body: 'Tap the + button in the top right to create a new routine.' },
  { step: 4, title: 'Set WHEN trigger',          body: 'Tap "When this happens" → Smart Home → Azan → Turned On.' },
  { step: 5, title: 'Set ACTION',                body: 'Tap "Add action" → Skills → Open Skill → Azan Time.' },
  { step: 6, title: 'Save the routine',          body: 'Tap Save. You\'re done! The Adhan will now play automatically 5× daily.' },
]

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">✅</div>
          <h1 className="text-2xl font-bold text-slate-800">One Last Step</h1>
          <p className="text-slate-500 mt-1 text-sm">Create an Alexa routine to complete your setup</p>
        </div>

        <div className="space-y-4">
          {STEPS.map(({ step, title, body }) => (
            <div key={step} className="flex gap-4 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <div className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6 text-sm text-amber-800">
          <strong>💡 Tip:</strong> Make sure your Alexa device is signed in to the same Amazon account you linked.
        </div>

        <div className="text-center mt-8 space-y-3">
          <p className="text-slate-500 text-sm">All done? Your Adhan will play automatically at every prayer time.</p>
          <Link href="/dashboard" className="inline-block text-slate-600 underline text-sm hover:text-slate-800">
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </main>
  )
}
