import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CollectionBanner() {
  return (
    <section className="storefront-section py-8 sm:py-12">
      <div className="storefront-shell">
        <div className="collection-banner overflow-hidden rounded-[var(--radius-xl)] text-white shadow-[var(--shadow-soft)]">
          <div className="collection-banner-grid grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[0.92fr,1.08fr] lg:p-10">
            <div className="relative z-10 max-w-xl">
              <div className="collection-banner-kicker">Traditional Collection</div>
              <h2 className="mt-3 max-w-lg text-3xl font-semibold leading-tight text-white sm:text-4xl">Festival-ready dairy essentials, all in one collection.</h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-white/78">Explore paneer, khoya, ghee, sweets, and more—selected for everyday cooking and special moments.</p>
              <p className="collection-banner-copy mt-3 max-w-lg text-base leading-7 text-white/78">Explore paneer, khoya, ghee, and butter selected for everyday cooking, sweets, and special occasions.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold text-white/82" aria-label="Collection highlights">
                <span className="collection-banner-pill">Paneer</span>
                <span className="collection-banner-pill">Khoya</span>
                <span className="collection-banner-pill">Ghee</span>
                <span className="collection-banner-pill">Butter</span>
              </div>
              <Link href="/products" className="collection-banner-cta mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-6 py-3 font-bold text-[var(--color-primary-strong)] transition">
                Shop traditional collection <ArrowRight className="collection-banner-arrow h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="collection-banner-stage" aria-label="FreshMooz traditional dairy products">
              <div className="collection-banner-plate" aria-hidden="true" />
              <div className="collection-banner-product collection-banner-product-paneer">
                <Image src="/media/paneer.jpg" alt="FreshMooz paneer pack" fill sizes="(min-width: 1024px) 14vw, 42vw" className="object-contain p-3" />
                <span>Paneer</span>
              </div>
              <div className="collection-banner-product collection-banner-product-ghee">
                <Image src="/media/cow_ghee.png" alt="FreshMooz cow ghee jar" fill sizes="(min-width: 1024px) 15vw, 44vw" className="object-contain" />
                <span>Ghee</span>
              </div>
              <div className="collection-banner-product collection-banner-product-khoya">
                <Image src="/media/khoya.jpg" alt="FreshMooz khoya pack" fill sizes="(min-width: 1024px) 12vw, 38vw" className="object-contain p-3" />
                <span>Khoya</span>
              </div>
              <div className="collection-banner-product collection-banner-product-butter">
                <Image src="/media/white_butter.jpg" alt="FreshMooz white butter packs" fill sizes="(min-width: 1024px) 11vw, 36vw" className="object-contain p-3" />
                <span>Butter</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
