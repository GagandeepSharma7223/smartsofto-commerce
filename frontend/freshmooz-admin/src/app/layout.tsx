import './globals.css'
import './landing.css'
import AuthGate from '@/components/AuthGate'
import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.standardpaneer.example'),
  title: {
    default: 'Standard Paneer — Fresh Dairy Products',
    template: '%s | Standard Paneer'
  },
  description: 'Buy fresh paneer and dairy products online. Fast delivery and great prices.',
  openGraph: {
    title: 'Standard Paneer',
    description: 'Fresh paneer and dairy products online',
    url: 'https://www.standardpaneer.example',
    siteName: 'Standard Paneer',
    type: 'website'
  },
  alternates: {
    canonical: '/'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const Header = dynamic(() => import('@/components/SiteHeader'), { ssr: false })
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
      </head>
      <body className={inter.className}>
        <AuthGate />
        <Header />
        {children}
      </body>
    </html>
  )
}

