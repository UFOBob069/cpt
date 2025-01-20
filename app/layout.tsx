import { Metadata } from 'next'
import './globals.css'
import GrammarlyCleanup from './components/GrammarlyCleanup'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: "Crypto Price Targets",
  description: "Cryptocurrency price predictions and targets",
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <GrammarlyCleanup>
          <Navbar />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </GrammarlyCleanup>
      </body>
    </html>
  );
}
