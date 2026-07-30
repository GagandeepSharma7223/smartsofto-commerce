import { BadgeCheck, Headphones, Info, PackageCheck, Search, ShoppingBag } from 'lucide-react'

const principles = [
  { title: 'Thoughtful selection', text: 'Dependable essentials and traditional favourites chosen for everyday usefulness.', icon: BadgeCheck },
  { title: 'Clear information', text: 'Pack details, pricing, availability, and product links stay easy to compare.', icon: Info },
  { title: 'Careful packaging', text: 'A considered presentation designed to support confident ordering.', icon: PackageCheck },
  { title: 'Customer-first support', text: 'Account access, order history, and responsive shopping tools stay within reach.', icon: Headphones },
]

const steps = [
  { title: 'Browse products', text: 'Explore everyday essentials with clear pack details.', icon: Search },
  { title: 'Add your favourites to cart', text: 'Choose the products and quantities that suit your kitchen.', icon: ShoppingBag },
  { title: 'Place your order online', text: 'Review your basket and complete checkout securely.', icon: PackageCheck },
]

export function WhyFreshMooz() {
  return (
    <section id="quality" className="quality-editorial-section storefront-section bg-[var(--color-primary-strong)] text-white">
      <div className="quality-editorial-shell storefront-shell">
        <div className="quality-editorial-intro">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#e8c786]">Why FreshMooz</div>
          <h2 className="mt-4 storefront-heading text-white">Quality is at the heart of FreshMooz.</h2>
          <p className="mt-4 text-base leading-7 text-white/70">A calmer storefront, clearer product information, and practical support for confident everyday shopping.</p>
        </div>

        <div className="quality-editorial-list" aria-label="FreshMooz quality principles">
          {principles.map(({ title, text, icon: Icon }) => (
            <article key={title} className="quality-editorial-item">
              <span className="quality-editorial-icon" aria-hidden="true">
                <Icon className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ShoppingSteps() {
  return (
    <section id="shopping-steps" className="shopping-steps-section storefront-section bg-white">
      <div className="storefront-shell">
        <div className="shopping-steps-intro max-w-2xl">
          <div className="storefront-kicker">How shopping works</div>
          <h2 className="storefront-heading">From browsing to basket, simply.</h2>
        </div>
        <ol className="shopping-steps-list">
          {steps.map(({ title, text, icon: Icon }, index) => (
            <li key={title} className="shopping-step-card">
              <span className="shopping-step-marker">
                <span className="shopping-step-number">{String(index + 1).padStart(2, '0')}</span>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="shopping-step-copy">
                <span className="shopping-step-label">Step {index + 1}</span>
                <span className="shopping-step-title">{title}</span>
                <span className="shopping-step-text">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
