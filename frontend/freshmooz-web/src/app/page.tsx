import Link from 'next/link'
import CategoryCard from '@/components/CategoryCard'
import CollectionBanner from '@/components/CollectionBanner'
import FeatureStrip from '@/components/FeatureStrip'
import HomeHero from '@/components/HomeHero'
import { NewsletterCard, OnlineConfidenceCard } from '@/components/HomeSupportForms'
import MasalaCollectionCard from '@/components/MasalaCollectionCard'
import PopularProductCard from '@/components/PopularProductCard'
import { ShoppingSteps, WhyFreshMooz } from '@/components/StorefrontFeatures'
import { fetchProducts } from '@/lib/api'
import {
  getFallbackStorefrontProducts,
  getMasalaCollection,
  getPopularProducts,
  normalizeStorefrontProducts,
  storefrontCategories,
  trustPoints,
} from '@/lib/storefront'

export const revalidate = 60

// Keep catalogue data fresh while preserving a useful local fallback.


export default async function HomePage() {
  const products = await getHomeProducts()
  const popularProducts = getPopularProducts(products)
  const masalaCollection = getMasalaCollection(products)

  return (
    <main id="main-content">
      <HomeHero />
      <FeatureStrip items={trustPoints} />

      <section id="categories" className="storefront-section category-browser-section">
        <div className="storefront-shell space-y-5">
          <SectionIntro kicker="Shop by category" title="Good food starts with dependable essentials." copy="Browse everyday dairy, cooking staples, and traditional favourites for the recipes you make most." />
          <div className="category-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {storefrontCategories.map((category) => <CategoryCard key={category.name} category={category} />)}
          </div>
        </div>
      </section>

      <section id="popular-products" className="storefront-section bg-white">
        <div className="storefront-shell space-y-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <SectionIntro kicker="FreshMooz favourites" title="Popular picks" copy="Easy-to-compare pack details and prices make stocking the kitchen simpler." />
            <Link href="/products" className="storefront-button-secondary shrink-0">View all products</Link>
          </div>
          <div className="popular-products-grid grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {popularProducts.map((product) => <PopularProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      <CollectionBanner />

      {masalaCollection.length ? (
        <section id="everyday-essentials" className="storefront-section masala-collection-section bg-white">
          <div className="storefront-shell space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <SectionIntro kicker="Masala collection" title="Masalas for Every Kitchen." copy="Compact spice essentials selected for daily cooking, quick meal prep, and fuller flavour." />
              <Link href="/products" className="storefront-button-secondary shrink-0">Shop masalas</Link>
            </div>
            <div className="masala-collection-grid">
              {masalaCollection.map((product) => <MasalaCollectionCard key={product.id} product={product} />)}
            </div>
          </div>
        </section>
      ) : null}

      <WhyFreshMooz />
      <ShoppingSteps />

      <section id="online-shopping" className="online-confidence-section storefront-section">
        <div className="storefront-shell grid gap-7 lg:grid-cols-[0.72fr,1.28fr] lg:items-center">
          <SectionIntro kicker="Shop online" title="Shop FreshMooz online with confidence" copy="Everything is set up for straightforward online browsing, cart building, and checkout." />
          <OnlineConfidenceCard />
        </div>
      </section>

      <section id="newsletter" className="newsletter-section storefront-section bg-[var(--color-accent-soft)]">
        <div className="storefront-shell grid gap-6 lg:grid-cols-[0.86fr,1.14fr] lg:items-center">
          <SectionIntro kicker="FreshMooz updates" title="Get FreshMooz updates" copy="Occasional notes about product additions and seasonal availability." />
          <NewsletterCard />
        </div>
      </section>
    </main>
  )
}

function SectionIntro({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return (
    <div className="max-w-2xl">
      <div className="storefront-kicker">{kicker}</div>
      <h2 className="storefront-heading">{title}</h2>
      <p className="mt-3 storefront-copy">{copy}</p>
    </div>
  )
}

async function getHomeProducts() {
  try {
    const items = await fetchProducts()
    if (Array.isArray(items) && items.length) return normalizeStorefrontProducts(items as any)
  } catch {}
  return getFallbackStorefrontProducts()
}
