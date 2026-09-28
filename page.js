import Link from "next/link";
import { prisma } from "../lib/prisma";
import VendorCard from "../components/VendorCard";
import HeroSearch from "../components/HeroSearch";
import { LAUNCH_CITY } from "../lib/locations";
import {
  IconCamera,
  IconUtensils,
  IconPalette,
  IconMusic,
  IconBuilding,
  IconClipboard,
  IconCake,
  IconShieldCheck,
  IconStar,
  IconArrowRight,
  IconCheck,
} from "../components/Icons";

async function getFeaturedVendors() {
  try {
    return await prisma.vendorProfile.findMany({
      where: { status: "APPROVED", isFeatured: true },
      include: {
        categories: { include: { category: true }, take: 1 },
        city: true,
        area: true,
      },
      take: 6,
      orderBy: { rating: "desc" },
    });
  } catch {
    return [];
  }
}

// Category visual cards with curated high-definition photos
const CATEGORY_SHOWCASE = [
  {
    name: "Wedding Photography",
    slug: "photography",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=85",
  },
  {
    name: "Luxury Stage & Decor",
    slug: "decoration",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=85",
  },
  {
    name: "Gourmet Catering",
    slug: "catering",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=85",
  },
  {
    name: "Bridal Makeup & Hair",
    slug: "makeup",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=85",
  },
  {
    name: "Banquet & Garden Venues",
    slug: "venue",
    image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=85",
  },
  {
    name: "DJ, Sound & Lights",
    slug: "dj",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=85",
  },
  {
    name: "Traditional Mehendi",
    slug: "mehendi",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=85",
  },
  {
    name: "Full Event Planners",
    slug: "event-planner",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=85",
  },
];

const INDIAN_CITIES = [LAUNCH_CITY];

export default async function HomePage() {
  const featuredVendors = await getFeaturedVendors();

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero-luxury">
        <div className="hero-luxury-bg" />
        <div className="hero-luxury-overlay" />
        <div className="container">
          <div className="hero-luxury-content">
            <div className="hero-kicker animate-fade-in-up">
              <span className="hero-kicker-dot" />
              India&apos;s event directory
            </div>
            <h1 className="animate-fade-in-up">
              Find the people behind<br />
              <span className="gold-gradient">your best days.</span>
            </h1>
            <p className="hero-luxury-subtitle animate-fade-in-up delay-100">
              Browse trusted vendors, upcoming events, and considered spaces for weddings, parties, and everything in between.
            </p>
            <div className="animate-fade-in-up delay-200">
              <HeroSearch />
            </div>
            <div className="hero-proof animate-fade-in-up delay-300">
              <span><strong>2,400+</strong> event professionals</span>
              <span className="hero-proof-rule" />
              <span>Built for celebrations across India</span>
            </div>
          </div>
        </div>
      </section>

      <section className="events-promo section-sm">
        <div className="container">
          <div className="events-promo-inner">
            <div>
              <span className="section-tag">What&apos;s happening</span>
              <h2 className="section-title">Make a date of it.</h2>
              <p className="text-muted">Find intimate gigs, cultural nights, and ticketed experiences from organizers worth following.</p>
            </div>
            <Link href="/events" className="btn btn-primary btn-lg">Browse the calendar <IconArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* ─── Curated Category Grid ───────────────────────────────────────── */}
      <section className="section collections-section">
        <div className="container">
          <div className="flex-between flex-wrap gap-4" style={{ marginBottom: 40, alignItems: "flex-end" }}>
            <div>
              <span className="section-tag">Curated Collections</span>
              <h2 className="section-title">Discover Our Exclusive Services</h2>
              <p className="text-muted">An elite portfolio of professionals dedicated to bringing your grandest visions to life.</p>
            </div>
            <Link href="/vendors" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", gap: 6 }}>
              <span>Explore All Services</span>
              <IconArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {CATEGORY_SHOWCASE.map((cat) => (
              <Link key={cat.slug} href={`/vendors?category=${cat.slug}`}>
                <div className="category-editorial-card">
                  <img src={cat.image} alt={cat.name} loading="lazy" />
                  <div className="category-editorial-overlay" />
                  <div className="category-editorial-content">
                    <h3>{cat.name}</h3>
                    <span>Explore collection</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Interactive Event Planning CTA Banner ───────────────────────── */}
      <section className="section-sm planner-section">
        <div className="container">
          <div
            className="home-planner-cta"
          >
            <div className="home-planner-copy">
              <h2 className="serif-heading">
                The right setting makes the moment.
              </h2>
              <p>
                From intimate gatherings to grand wedding weekends, discover the spaces, people, and details that make an occasion feel entirely yours.
              </p>
              <div className="home-planner-actions">
                <Link href="/plan" className="btn btn-gold btn-lg">
                  Explore Venues
                </Link>
                <Link href="/compare" className="home-planner-link">
                  Discover Vendors <IconArrowRight size={15} />
                </Link>
              </div>
            </div>

            <figure className="home-editorial-image">
              <img src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=88" alt="Elegant Indian wedding venue prepared for an evening celebration" loading="lazy" />
              <figcaption className="home-editorial-card">
                <strong>The Grand Venue</strong>
                <span>India · Weddings &amp; celebrations</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ─── Top Rated Vendors ───────────────────────────────────────────── */}
      {featuredVendors.length > 0 && (
        <section className="section" style={{ background: "white" }}>
          <div className="container">
            <div className="flex-between flex-wrap gap-4" style={{ marginBottom: 40, alignItems: "flex-end" }}>
              <div>
                <span className="section-tag">Hallmark of Excellence</span>
                <h2 className="section-title">India&apos;s Distinguished Event Professionals</h2>
                <p className="text-muted">Discover trusted professionals for celebrations across the country.</p>
              </div>
              <Link href="/vendors" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", gap: 6 }}>
                <span>Explore all vendors</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            <div className="vendors-grid">
              {featuredVendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Popular Cities in India ─────────────────────────────────────── */}
      <section className="section-sm city-section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 32 }}>
            <span className="section-tag">City directory</span>
            <h2 className="serif-heading" style={{ fontSize: "1.75rem" }}>Discover Event Professionals Across India</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {INDIAN_CITIES.map((city) => (
              <Link key={city} href={`/vendors?city=${city}`}>
                <div
                  style={{
                    background: "white",
                    padding: "16px 20px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease",
                  }}
                  className="card"
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--primary)" }}>{city}</div>
                  </div>
                  <IconArrowRight size={14} className="text-muted" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why PREVIA EVENTS works ─────────────────────────────────────── */}
      <section className="section benefits-section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-tag">The PREVIA advantage</span>
            <h2 className="section-title">Everything you need to plan with confidence</h2>
            <p className="section-subtitle">
              Discover trusted professionals, clear options, and experiences worth remembering.
            </p>
          </div>

          <div className="advantage-grid">
            {[
              {
                icon: <IconShieldCheck size={22} className="text-gold" />,
                title: "Trusted Professionals",
                desc: "Discover experienced event professionals and venues, carefully presented in one place.",
              },
              {
                icon: <IconClipboard size={22} className="text-gold" />,
                title: "Clear Pricing",
                desc: "Compare services and packages with straightforward details before you book.",
              },
              {
                icon: <IconStar size={22} className="text-gold" />,
                title: "Real Experiences",
                desc: "Explore feedback from customers who have actually booked through PREVIA.",
              },
              {
                icon: <IconUtensils size={22} className="text-gold" />,
                title: "Direct Connections",
                desc: "Connect with event professionals and discuss your requirements directly.",
              },
            ].map((pillar, idx) => (
              <div key={idx} className="advantage-card">
                <div className="advantage-icon">{pillar.icon}</div>
                <h3>{pillar.title}</h3>
                <p>{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Real Testimonials ───────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--bg-page)" }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-tag">Client Stories</span>
            <h2 className="section-title">Celebrations across India</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            {[
              {
                name: "Pooja & Siddharth Shah",
                event: "Wedding at The Grand Bhagwati, Bodakdev",
                quote: "PREVIA allowed us to compare exceptional photography studios and premium decorators in a single afternoon. The professionals we chose delivered an experience that exceeded our expectations.",
                rating: 5,
              },
              {
                name: "Anand Mehta",
                event: "Corporate Gala at YMCA Club, SG Highway",
                quote: "Architecting an annual corporate gala for 400 dignitaries was effortless. The transparent, itemized quotation system facilitated immediate executive approval without any friction.",
                rating: 5,
              },
              {
                name: "Dr. Rashmi Patel",
                event: "Engagement Ceremony, Satellite",
                quote: "We discovered exceptional artistry within our exact financial parameters. Having our entire vendor ecosystem integrated into one sophisticated dashboard rendered our celebration completely stress-free.",
                rating: 5,
              },
            ].map((t, idx) => (
              <div key={idx} className="card card-body" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", color: "#F59E0B", marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <IconStar key={s} size={16} fill={true} />
                  ))}
                </div>
                <p style={{ fontStyle: "italic", fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-main)", marginBottom: 20, flex: 1 }}>
                  &quot;{t.quote}&quot;
                </p>
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
                  <div style={{ fontWeight: 700, color: "var(--primary)" }}>{t.name}</div>
                  <div style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginTop: 2 }}>{t.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final High-End Banner ───────────────────────────────────────── */}
      <section className="section" style={{ background: "#0B0F19", color: "white", textAlign: "center" }}>
        <div className="container-sm">
          <span className="badge badge-gold" style={{ marginBottom: 16, color: "#F5E6C8", borderColor: "rgba(245,230,200,0.3)" }}>
            Commence Your Journey
          </span>
          <h2 className="serif-heading" style={{ color: "white", fontSize: "2.4rem", marginBottom: 16 }}>
            Ready to Bring Your Visionary Celebration to Life?
          </h2>
          <p style={{ color: "#94A3B8", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: 32 }}>
            Find the right people, places, and details for an event worth remembering.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/plan" className="btn btn-gold btn-lg">
              Begin Event Architecture
            </Link>
            <Link href="/auth/vendor-signup" className="btn btn-secondary btn-lg" style={{ background: "transparent", color: "white", borderColor: "rgba(255,255,255,0.25)" }}>
              Apply as a Vendor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
