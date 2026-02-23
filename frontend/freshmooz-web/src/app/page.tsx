import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="landing">
      {/* Sticky Buy/Store CTA */}
      <a className="cta-float" href="#contact">Find a Store</a>

      {/* NAV is rendered globally via layout header */}

      {/* HERO (video background) */}
      <section className="hero" aria-label="Hero">
        <video autoPlay muted loop playsInline poster="/media/hero-poster.jpg">
          <source src="/media/hero-paneer2.mp4" type="video/mp4" />
        </video>
        <div className="tint" aria-hidden="true"></div>

        <div className="badge">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9Z" stroke="currentColor" strokeWidth="2"/><path d="M8 12h8" stroke="currentColor" strokeWidth="2"/></svg>
          Farm Fresh Promise
        </div>

        <div className="copy">
          <h1>Farm Fresh Dairy & Organic Goodness.</h1>
          <p className="lead">Clean, creamy essentials made from fresh milk and thoughtfully sourced ingredients for every family meal.</p>
          <Link className="btn primary" href="/products">Shop Fresh Picks</Link>
          <a className="btn ghost" href="#contact">Locate Retailers</a>
          <div className="chips">
            <span className="chip">Protein-rich</span>
            <span className="chip">Preservative-free</span>
            <span className="chip">Cold-chain</span>
            <span className="chip">Vegetarian</span>
          </div>
        </div>
      </section>

      {/* Milk wave separator */}
      <div className="wave" aria-hidden="true">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1440,20 1440,20 L1440,80 L0,80 Z" fill="var(--cream)"></path>
        </svg>
      </div>

      {/* VALUE BAND (why buy) */}
      <section id="value" className="value">
        <h2>Why families choose FreshMooz</h2>
        <p className="sub">Real milk. Real craft. Real taste.</p>
        <div className="value__grid">
          <div className="value__card"><span className="dot"></span><div><strong>Milk-first recipe</strong><br /><span className="muted">No shortcuts, no fillers.</span></div></div>
          <div className="value__card"><span className="dot"></span><div><strong>Batch-wise quality</strong><br /><span className="muted">Every lot is tested for consistency.</span></div></div>
          <div className="value__card"><span className="dot"></span><div><strong>Cold-chain freshness</strong><br /><span className="muted">Chilled from plant to store.</span></div></div>
          <div className="value__card"><span className="dot"></span><div><strong>Clean label</strong><br /><span className="muted">Preservative-free and vegetarian.</span></div></div>
        </div>
      </section>

      {/* PRODUCTS (teaser) */}
      <section id="products">
        <h2>Fresh Dairy Favourites</h2>
        <p className="sub">From everyday meals to festive sweets.</p>
        <div className="grid">
          <article className="card">
            <img src="/media/paneer.jpg" alt="Malai Paneer pack" loading="lazy" />
            <div className="card__body">
              <h3 className="card__title">Malai Paneer</h3>
              <p className="card__text">Soft, creamy bite - perfect for curries and grills.</p>
            </div>
          </article>
          <article className="card">
            <img src="/media/white_butter.jpg" alt="White Butter / Makkhan" loading="lazy" />
            <div className="card__body">
              <h3 className="card__title">White Butter / Makkhan</h3>
              <p className="card__text">Unsalted, traditionally churned purity.</p>
            </div>
          </article>
          <article className="card">
            <img src="/media/khoya.jpg" alt="Khoya" loading="lazy" />
            <div className="card__body">
              <h3 className="card__title">Khoya</h3>
              <p className="card__text">Rich and granular - ideal for classic mithai.</p>
            </div>
          </article>
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="story">
        <div className="story__inner">
          <h2>From our dairy to your table</h2>
          <p>We stay committed to honest dairy, sourcing quality milk, maintaining hygienic standards, and crafting products that let ingredients shine.</p>
          <div className="chips" style={{justifyContent:'center',marginTop:14}}>
            <span className="chip" style={{borderColor:'#e1f1e9',color:'var(--primary)'}}>Farm-sourced milk</span>
            <span className="chip">FSSAI</span>
            <span className="chip">Traceable lots</span>
          </div>
        </div>
      </section>

      {/* QUALITY BAND */}
      <section aria-label="Quality">
        <div className="quality">
          <h2 style={{color:'#fff'}}>Quality you can taste</h2>
          <p style={{color:'#e9efe3'}}>Rapid chilling, modern processing, and sensory checks keep every bite consistent.</p>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact">
        <h2>Find a Store &amp; Contact</h2>
        <p className="sub">Available across leading supermarkets and local retailers.</p>
        <div style={{maxWidth:720,margin:'auto',textAlign:'center'}}>
          <form action="#" style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginBottom:14}}>
            <input type="text" placeholder="Enter city or pincode" aria-label="City or pincode" style={{flex:1,minWidth:240,maxWidth:420,padding:'.9rem 1rem',border:'1px solid var(--border)',borderRadius:14,background:'#fff'}} />
            <button className="btn primary" type="submit">Search</button>
          </form>
          <p>Email: <strong>hello@freshmooz.com</strong></p>
          <p>WhatsApp: <strong>+91-XXXXXXXXXX</strong></p>
          <p>Instagram: <strong>@freshmooz</strong></p>
        </div>
      </section>

      <footer>Copyright {new Date().getFullYear()} FreshMooz. All rights reserved.</footer>
    </div>
  )
}
