export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-900 to-teal-700 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm opacity-60 mb-8">Last updated: March 2026</p>

        <section className="space-y-6 text-white/80 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">1. What We Collect</h2>
            <p>Azan Time collects your Amazon account ID and email address when you log in via Amazon. We also store your selected mosque and Alexa device ID to deliver the Adhan at prayer times.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">2. How We Use Your Data</h2>
            <p>Your data is used solely to identify your prayer times based on your selected mosque and to trigger the Adhan on your linked Alexa device. We do not use your data for advertising or any other purpose.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">3. Data Sharing</h2>
            <p>We do not sell, share, or disclose your personal data to any third parties. We interact with Amazon's Alexa API solely to deliver the prayer notification you have requested.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">4. Data Retention</h2>
            <p>Your data is retained as long as you have an active account. You may request deletion of your data at any time by contacting us.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">5. Contact</h2>
            <p>For any privacy-related questions, contact us at: <a href="mailto:privacy@azantime.de" className="text-yellow-400 underline">privacy@azantime.de</a></p>
          </div>
        </section>
      </div>
    </main>
  )
}
