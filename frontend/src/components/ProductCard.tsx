import Link from 'next/link'
import ImageWithFallback from '@/components/ImageWithFallback'
import type { Product } from '@/lib/products'
import AddToCartButton from './AddToCartButton'

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="border border-[#f0e6ee] rounded-2xl overflow-hidden flex flex-col bg-white shadow-[0_10px_30px_rgba(217,19,138,0.06)] hover:shadow-[0_16px_36px_rgba(217,19,138,0.12)] transition">
      <div className="relative aspect-[4/3] bg-slate-50 text-slate-400">
        <ImageWithFallback src={product.image || '/media/placeholder.svg'} alt={product.name} fill sizes="(min-width: 768px) 25vw, 50vw" style={{objectFit:'cover'}} />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="font-semibold leading-tight">{product.name}</div>
        <div className="text-sm text-slate-600">{product.description}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold">{String.fromCharCode(8377)}{product.price}</span>
          <div className="flex items-center gap-2">
            <AddToCartButton id={product.id} label="Add" className="bg-[#d9138a] hover:bg-[#c2107c] text-white" />
            <Link href={`/product/${product.slug}`} className="text-[#d9138a] hover:underline text-sm">View</Link>
          </div>
        </div>
      </div>
    </div>
  )
}


