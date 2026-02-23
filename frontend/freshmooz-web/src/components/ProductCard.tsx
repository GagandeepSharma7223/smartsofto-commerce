import Link from 'next/link'
import ImageWithFallback from '@/components/ImageWithFallback'
import type { Product } from '@/lib/products'
import AddToCartButton from './AddToCartButton'

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="border border-[#E7E1D6] rounded-2xl overflow-hidden flex flex-col bg-[#fffdf7] shadow-[0_10px_30px_rgba(217,19,138,0.06)] hover:shadow-[0_16px_36px_rgba(217,19,138,0.12)] transition">
      <div className="relative aspect-[4/3] bg-[#f7f3ea] text-slate-400">
        <ImageWithFallback src={product.image || '/media/placeholder.svg'} alt={product.name} fill sizes="(min-width: 768px) 25vw, 50vw" style={{objectFit:'cover'}} />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="font-semibold leading-tight">{product.name}</div>
        <div className="text-sm text-[#5a5a5a]">{product.description}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold">{String.fromCharCode(8377)}{product.price}</span>
          <div className="flex items-center gap-2">
            <AddToCartButton id={product.id} label="Add" className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white" />
            <Link href={`/product/${product.slug}`} className="text-[#4DB6E2] hover:underline text-sm">View</Link>
          </div>
        </div>
      </div>
    </div>
  )
}


