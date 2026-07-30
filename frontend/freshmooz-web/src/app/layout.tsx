import './globals.css'
import './landing.css'
import type { Metadata } from 'next'
import AuthGate from '@/components/AuthGate'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'

export const metadata: Metadata = {
  metadataBase: new URL('https://freshmooz.com'),
  title: {
    default: 'FreshMooz | Quality food and household favourites',
    template: '%s | FreshMooz'
  },
  description: 'Shop FreshMooz for trusted dairy, pantry essentials, traditional favourites, and selected products for everyday living.',
  openGraph: {
    title: 'FreshMooz',
    description: 'A premium food storefront for dairy, pantry essentials, and traditional favourites.',
    url: 'https://freshmooz.com',
    siteName: 'FreshMooz',
    type: 'website'
  },
  alternates: {
    canonical: '/'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthGate />
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
