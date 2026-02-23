import type { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/products'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.standardpaneer.example'
  const prodEntries = getAllProducts().map(p => ({
    url: `${base}/product/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }))
  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    ...prodEntries
  ]
}
