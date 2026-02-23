import './globals.css'
import './landing.css'
import AuthGate from '@/components/AuthGate'
import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { Nunito, Poppins } from 'next/font/google'

const heading = Poppins({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-heading' })
const body = Nunito({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.standardpaneer.example'),
  title: {
    default: 'FreshMooz — Fresh Dairy Products',
    template: '%s | FreshMooz'
  },
  description: 'Buy fresh paneer and dairy products online. Fast delivery and great prices.',
  openGraph: {
    title: 'FreshMooz',
    description: 'Fresh paneer and dairy products online',
    url: 'https://www.standardpaneer.example',
    siteName: 'FreshMooz',
    type: 'website'
  },
  alternates: {
    canonical: '/'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const Header = dynamic(() => import('@/components/SiteHeader'), { ssr: false })
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
      </head>
      <body>
        <AuthGate />
        <Header />
        {children}
      </body>
    </html>
  )
}
