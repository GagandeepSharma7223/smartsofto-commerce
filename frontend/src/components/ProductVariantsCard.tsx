"use client"
import AddToCartButton from '@/components/AddToCartButton'
import ImageWithFallback from '@/components/ImageWithFallback'

type Variant = { id: string; label: string; price: number; currency?: string; slug?: string }
type Group = { baseName: string; image?: string; variants: Variant[] }

export default function ProductVariantsCard({ group }: { group: Group }) {
  return (
    <div className="border border-[#f0e6ee] rounded-2xl overflow-hidden flex flex-col bg-white shadow-[0_10px_30px_rgba(217,19,138,0.06)] hover:shadow-[0_16px_36px_rgba(217,19,138,0.12)] transition">
      <div className="relative aspect-[4/3] bg-slate-50 text-slate-400">
        <ImageWithFallback src={group.image || '/media/placeholder.svg'} alt={group.baseName} fill sizes="(min-width: 768px) 25vw, 50vw" style={{ objectFit: 'cover' }} />
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="font-semibold leading-tight">{group.baseName}</div>
        <div className="space-y-2">
          {group.variants.map(v => (
            <div key={v.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div className="text-sm">
                <span className="font-medium mr-2">{v.label}</span>
                <span className="text-slate-600">{String.fromCharCode(8377)}{v.price}</span>
              </div>
              <AddToCartButton id={v.id} label="Add" className="bg-[#d9138a] hover:bg-[#c2107c] text-white" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
