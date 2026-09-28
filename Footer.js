import Link from "next/link";

export default function Footer() {
  const categories = [
    "Photography", "Decoration", "Catering", "Makeup & Beauty",
    "Mehendi", "DJ & Music", "Venues", "Event Planners",
  ];

  const eventTypes = [
    "Wedding", "Engagement", "Birthday", "Corporate Event",
    "Baby Shower", "Anniversary", "Private Party",
  ];

  const company = [
    { label: "About Us", href: "#" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
  ];

  const support = [
    { label: "Help Centre", href: "#" },
    { label: "Safety & Trust", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="logo">PREVIA <span>EVENTS</span></div>
            <p>
              A considered destination for memorable events, trusted organizers, and the people who make every celebration feel personal.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {["Instagram", "Facebook", "WhatsApp", "YouTube"].map((s) => (
                <a key={s} href="#" className="social-link-btn" title={s}>
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="footer-heading">Categories</div>
            <div className="footer-links">
              {categories.map((c) => (
                <Link key={c} href={`/vendors?category=${c.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and")}`} className="footer-link">
                  {c}
                </Link>
              ))}
            </div>
          </div>

          {/* Events */}
          <div>
            <div className="footer-heading">Plan Events</div>
            <div className="footer-links">
              {eventTypes.map((e) => (
                <Link key={e} href={`/plan?type=${e}`} className="footer-link">
                  {e}
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="footer-heading">Company</div>
            <div className="footer-links">
              {company.map((c) => (
                <Link key={c.label} href={c.href} className="footer-link">{c.label}</Link>
              ))}
            </div>
            <div className="footer-heading" style={{ marginTop: 24 }}>Support</div>
            <div className="footer-links">
              {support.map((s) => (
                <Link key={s.label} href={s.href} className="footer-link">{s.label}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Vendor CTA strip */}
        <div 
          style={{ 
            background: "linear-gradient(135deg, rgba(197, 160, 89, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)", 
            border: "1px solid rgba(197, 160, 89, 0.3)", 
            borderRadius: "var(--radius-lg)", 
            padding: "32px 40px", 
            marginBottom: 56, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            flexWrap: "wrap", 
            gap: 24,
            boxShadow: "0 12px 32px -8px rgba(197, 160, 89, 0.15)",
            backdropFilter: "blur(12px)"
          }}
        >
          <div>
            <div style={{ color: "#F5E6C8", fontFamily: "var(--font-serif)", fontSize: "1.35rem", fontWeight: 700, marginBottom: 6 }}>
              Are you an event service provider?
            </div>
            <div style={{ color: "#94A3B8", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Put your work in front of people planning their next memorable event.
            </div>
          </div>
          <Link href="/auth/vendor-signup" className="btn btn-gold btn-lg" style={{ flexShrink: 0 }}>
            Register Your Business
          </Link>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} PREVIA EVENTS. All rights reserved. Built for Vadodara.</div>
          <div style={{ display: "flex", gap: 20 }}>
            <span>SSL Secured</span>
            <span>Made in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
