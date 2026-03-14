export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-900 to-teal-700 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Terms of Use</h1>
        <p className="text-sm opacity-60 mb-8">Last updated: March 2026</p>

        <section className="space-y-6 text-white/80 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">1. Service Description</h2>
            <p>Azan Time is a free service that automatically plays the Adhan (Islamic call to prayer) on your Amazon Alexa device at the five daily prayer times based on your selected mosque.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">2. Eligibility</h2>
            <p>You must have a valid Amazon account and a compatible Alexa device to use this service. By using Azan Time, you agree to Amazon's Terms of Service in addition to these terms.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">3. Use of Service</h2>
            <p>Azan Time is provided for personal, non-commercial use only. You agree not to misuse the service, attempt to reverse engineer it, or use it in any way that could harm other users or the service itself.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">4. Accuracy of Prayer Times</h2>
            <p>Prayer times are sourced from my-masjid.com based on your selected mosque. While we strive for accuracy, Azan Time does not guarantee that prayer times will always be exact. Please verify times with your local mosque.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">5. Availability</h2>
            <p>We aim to keep the service running at all times but do not guarantee uninterrupted availability. The service may be temporarily unavailable due to maintenance or technical issues.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">6. Changes to Terms</h2>
            <p>We reserve the right to update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">7. Contact</h2>
            <p>For any questions about these terms, contact us at: <a href="mailto:legal@azantime.de" className="text-yellow-400 underline">legal@azantime.de</a></p>
          </div>
        </section>
      </div>
    </main>
  )
}
