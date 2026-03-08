import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Azan Time — Automatic Alexa Adhan',
  description: 'Automatically play the Adhan on your Alexa device at prayer times',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
