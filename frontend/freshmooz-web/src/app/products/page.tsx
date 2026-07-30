import ProductsClientVariants from './ProductsClientVariants'

export const metadata = {
  title: 'Products',
  description: 'Browse the FreshMooz catalogue of dairy, traditional favourites, and everyday essentials.'
}

export const revalidate = 60

export default function CatalogPage() {
  return (
    <main id="main-content" className="storefront-shell space-y-6 py-10">
      <div className="flex flex-col gap-4">
        <div className="space-y-3">
          <div className="storefront-kicker">Catalogue</div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Browse products</h1>
            <p className="storefront-copy max-w-[31ch] break-words sm:max-w-2xl">Explore the live FreshMooz catalogue with the same product links and cart behavior used on the homepage.</p>
          </div>
        </div>
      </div>

      <ProductsClientVariants />
    </main>
  )
}
