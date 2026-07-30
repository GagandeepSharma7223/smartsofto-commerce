import Link from 'next/link'
import { footerGroups } from '@/lib/storefront'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="storefront-shell site-footer-main">
        <div className="site-footer-brand">
          <Link href="/" className="site-footer-logo" aria-label="FreshMooz home">
            <img src="/media/logo.png" alt="FreshMooz" className="h-11 w-auto" />
          </Link>
          <p className="site-footer-description">
            Trusted dairy, traditional favourites, and useful pantry staples for the family kitchen.
          </p>
          <Link href="/products" className="site-footer-primary-link">Shop all products</Link>
        </div>

        <FooterColumn title="Shop" links={footerGroups.shop} />
        <FooterColumn title="FreshMooz" links={footerGroups.freshmooz} />
        <FooterColumn title="Help" links={footerGroups.help} />
        <FooterColumn title="Account" links={footerGroups.account} />
      </div>
      <div className="site-footer-bottom">
        <div className="storefront-shell site-footer-bottom-inner">
          <p>© {year} FreshMooz. All rights reserved.</p>
          <Link href="/products" className="site-footer-bottom-link">Browse products</Link>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <details className="site-footer-column group" open>
      <summary className="site-footer-column-title">
        <span className="flex items-center justify-between">
          {title}
          <span className="site-footer-column-toggle">+</span>
        </span>
      </summary>
      <ul className="site-footer-links">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="site-footer-link">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  )
}
