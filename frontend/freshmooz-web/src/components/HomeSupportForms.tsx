"use client"

import Link from 'next/link'
import { useState } from 'react'
import { CreditCard, Headphones, Info, ShoppingBag } from 'lucide-react'

const confidencePoints = [
  { title: 'Easy online ordering', text: 'Browse the catalogue and add favourites to your cart.', icon: ShoppingBag },
  { title: 'Clear product information', text: 'Review names, pack sizes, prices, and availability before you buy.', icon: Info },
  { title: 'Secure checkout', text: 'Complete your order through the online checkout flow.', icon: CreditCard },
  { title: 'Helpful customer support', text: 'Get practical support when you need help with your order.', icon: Headphones },
]

export function OnlineConfidenceCard() {
  return (
    <div className="online-confidence-card">
      <div className="online-confidence-grid">
        {confidencePoints.map(({ title, text, icon: Icon }) => (
          <div key={title} className="online-confidence-point">
            <span className="online-confidence-icon" aria-hidden="true">
              <Icon className="h-4 w-4" strokeWidth={1.9} />
            </span>
            <span>
              <span className="online-confidence-title">{title}</span>
              <span className="online-confidence-text">{text}</span>
            </span>
          </div>
        ))}
      </div>

      <Link href="/products" className="storefront-button-primary mt-5 inline-flex">Browse products</Link>
    </div>
  )
}

export function NewsletterCard() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const isLoading = status === 'loading'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setStatus('error')
      setMessage('Enter an email address.')
      return
    }

    if (!/.+@.+\..+/.test(trimmedEmail)) {
      setStatus('error')
      setMessage('Enter a valid email address.')
      return
    }

    setStatus('loading')
    setMessage('Submitting your email...')

    const endpoint = process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT
    if (!endpoint) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setStatus('error')
      setMessage('Newsletter signup is not connected yet. Please check back soon.')
      return
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      if (!response.ok) throw new Error('Newsletter request failed')

      setStatus('success')
      setMessage('Thanks — your email was submitted.')
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('We could not submit your email right now. Please try again later.')
    }
  }

  return (
    <div className="newsletter-card">
      <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input
            id="newsletter-email"
            className="newsletter-input storefront-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (status !== 'idle') {
                setStatus('idle')
                setMessage('')
              }
            }}
            placeholder="Email address"
            aria-describedby="newsletter-note newsletter-status"
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="newsletter-submit storefront-button-primary" disabled={isLoading}>
          {isLoading ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>

      <p id="newsletter-note" className="newsletter-note">
        One field, no account required.
      </p>
      {message ? (
        <div id="newsletter-status" className={`newsletter-status newsletter-status--${status}`} role={status === 'error' ? 'alert' : 'status'} aria-live="polite">
          {message}
        </div>
      ) : null}
    </div>
  )
}
