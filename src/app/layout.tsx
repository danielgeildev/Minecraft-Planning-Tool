import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { AppShell } from '@/components/layout/AppShell'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ATM10 Tracker — Alina\'s Quest & Item Planner',
  description: 'Quest-, Bau- und Item-Tracking für All the Mods 10',
}

// Reads explicit user choice from localStorage; falls back to OS color-scheme
// when no choice has been made. Runs synchronously before paint to avoid FOUC.
const darkModeInitScript = `(function(){try{var s=localStorage.getItem('atm10-dark-mode');var d=s==='true'||(s===null&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark')}}catch(e){}})()`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeInitScript }} />
      </head>
      <body className="h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
