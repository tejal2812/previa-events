"use client";
import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatINR, EVENT_TYPES } from "../../../lib/utils";

export default function VendorProfilePage({ params }) {
  const resolvedParams = use(params);
  const vendorId = resolvedParams.id;

  const { data: session } = useSession();
  const router = useRouter();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [isFavorited, setIsFavorited] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [enquiryLoading, setEnquiryLoading] = useState(false);

  // Enquiry Form State
  const [enquiryForm, setEnquiryForm] = useState({
    eventType: "Wedding",
    eventDate: "",
    eventCity: "Ahmedabad",
    guestCount: 200,
    budget: 50000,
    service: "",
    requirements: "",
    message: "",
  });

  useEffect(() => {
    fetch(`/api/vendors/${vendorId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.vendor) {
          setVendor(data.vendor);
          setIsFavorited(data.vendor.isFavorited || false);
          if (data.vendor.categories?.[0]?.category?.name) {
            setEnquiryForm((prev) => ({
              ...prev,
              service: data.vendor.categories[0].category.name,
              budget: data.vendor.startingPrice || 50000,
            }));
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vendorId]);

  const toggleFavorite = async () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    const res = await fetch("/api/favorites", {
      method: isFavorited ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId }),
    });
    if (res.ok) setIsFavorited(!isFavorited);
  };

  const handleSendEnquiry = async (e) => {
    e.preventDefault();
    if (!session) {
      router.push("/auth/login");
      return;
    }

    setEnquiryLoading(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...enquiryForm,
          vendorId: vendor.id,
        }),
      });

      if (res.ok) {
        setEnquirySuccess(true);
        setTimeout(() => {
          setEnquiryModalOpen(false);
          setEnquirySuccess(false);
        }, 2500);
      } else {
        const d = await res.json();
        alert(d.error || "Failed to send enquiry");
      }
    } catch {
      alert("Something went wrong");
    }
    setEnquiryLoading(false);
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: "70vh" }}>
        <div className="spinner spinner-lg" />
        <p>Loading vendor profile...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="empty-state section" style={{ minHeight: "70vh" }}>
        <div className="empty-state-icon">🏢</div>
        <h2>Vendor Not Found</h2>
        <p className="text-muted">The vendor profile you are looking for does not exist or is pending approval.</p>
        <Link href="/vendors" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const primaryCat = vendor.categories?.[0]?.category?.name || "Vendor";

  return (
    <div>
      {/* Cover Image Banner */}
      <div className="vendor-profile-cover">
        <img
          src={vendor.coverImage || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=80"}
          alt={vendor.businessName}
        />
        <div className="vendor-profile-cover-overlay" />
      </div>

      {/* Profile Header Bar */}
      <div className="vendor-profile-header">
        <div className="container-lg">
          <div className="flex-between flex-wrap gap-4" style={{ alignItems: "center" }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  border: "3px solid white",
                  boxShadow: "var(--shadow-md)",
                  background: "white",
                  flexShrink: 0,
                }}
              >
                <img
                  src={vendor.logoImage || vendor.coverImage || "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=200&q=80"}
                  alt={vendor.businessName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge badge-gold">{primaryCat}</span>
                  {vendor.isVerified && vendor.verificationStatus === "VERIFIED" && <span className="badge badge-verified">✓ Verified by PREVIA</span>}
                  {vendor.isFeatured && <span className="badge badge-info">⭐ Top Rated</span>}
                </div>
                <h1 className="heading-lg" style={{ marginTop: 4 }}>{vendor.businessName}</h1>
                <div className="text-muted" style={{ display: "flex", alignItems: "center", gap: 16, fontSize: "0.875rem", marginTop: 4, flexWrap: "wrap" }}>
                  <span>📍 {vendor.area?.name ? `${vendor.area.name}, ` : ""}{vendor.city?.name || "Ahmedabad"}</span>
                  <span>⭐ <strong>{vendor.rating?.toFixed(1) || "4.8"}</strong> ({vendor.reviewCount || 0} reviews)</span>
                  <span>⚡ Responds {vendor.responseTime || "within 2 hours"}</span>
                </div>
              </div>
            </div>

            {/* Quick CTAs */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                onClick={toggleFavorite}
                className="btn btn-secondary btn-icon"
                title={isFavorited ? "Shortlisted" : "Shortlist"}
                style={{ background: isFavorited ? "#FEE2E2" : "white" }}
              >
                {isFavorited ? "❤️" : "🤍"}
              </button>
              <button
                onClick={() => setEnquiryModalOpen(true)}
                className="btn btn-primary"
              >
                Request Free Quote 💬
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="container-lg">
        <div className="vendor-profile-layout">
          {/* Main Column */}
          <div>
            {/* Tabs */}
            <div className="tabs">
              {[
                { id: "portfolio", label: "📸 Portfolio", count: vendor.portfolioImages?.length },
                { id: "packages", label: "📦 Packages & Pricing", count: vendor.packages?.length },
                { id: "about", label: "ℹ️ About & Services" },
                { id: "reviews", label: "⭐ Reviews", count: vendor.reviews?.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label} {tab.count !== undefined && <span style={{ opacity: 0.7 }}>({tab.count})</span>}
                </button>
              ))}
            </div>

            {/* Tab 1: Portfolio */}
            {activeTab === "portfolio" && (
              <div>
                {vendor.portfolioImages?.length > 0 ? (
                  <div className="portfolio-grid">
                    {vendor.portfolioImages.map((img) => (
                      <div key={img.id} className="portfolio-item">
                        <img src={img.url} alt={img.caption || vendor.businessName} loading="lazy" />
                        <div className="portfolio-item-overlay">
                          {img.caption && (
                            <span style={{ fontSize: "0.8125rem", color: "white", padding: 8, textAlign: "center" }}>
                              {img.caption}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ background: "white", borderRadius: "var(--radius-lg)" }}>
                    <p className="text-muted">Portfolio photos will be uploaded soon.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Packages */}
            {activeTab === "packages" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {vendor.packages?.length > 0 ? (
                  vendor.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="card card-body"
                      style={{
                        border: pkg.isPopular ? "2px solid var(--gold)" : "1px solid var(--border-light)",
                        position: "relative",
                      }}
                    >
                      {pkg.isPopular && (
                        <span
                          className="badge badge-gold"
                          style={{ position: "absolute", top: 16, right: 16 }}
                        >
                          Most Popular
                        </span>
                      )}
                      <div className="flex-between flex-wrap gap-2">
                        <div>
                          <h3 className="heading-md">{pkg.name}</h3>
                          <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: 4 }}>
                            {pkg.description}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
                            {formatINR(pkg.price)}
                          </span>
                        </div>
                      </div>

                      {pkg.inclusions && (
                        <div style={{ marginTop: 16, borderTop: "1px solid var(--border-light)", paddingTop: 16 }}>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
                            What&apos;s Included:
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
                            {pkg.inclusions.split(",").map((inc, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem" }}>
                                <span style={{ color: "var(--success)" }}>✓</span> {inc.trim()}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: 20 }}>
                        <button
                          onClick={() => {
                            setEnquiryForm((prev) => ({
                              ...prev,
                              requirements: `Interested in the ${pkg.name} package (${formatINR(pkg.price)})`,
                              budget: pkg.price,
                            }));
                            setEnquiryModalOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Select This Package & Enquire →
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ background: "white", borderRadius: "var(--radius-lg)" }}>
                    <p className="text-muted">Custom packages available on enquiry.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: About */}
            {activeTab === "about" && (
              <div className="card card-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <h3 className="heading-md" style={{ marginBottom: 12 }}>About {vendor.businessName}</h3>
                  <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
                    {vendor.longDescription || vendor.description || "Trusted event service professional serving Ahmedabad."}
                  </p>
                </div>

                <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 20 }}>
                  <h4 className="heading-sm" style={{ marginBottom: 16 }}>Key Highlights</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    <div style={{ background: "var(--neutral-50)", padding: 16, borderRadius: "var(--radius-md)" }}>
                      <div className="text-muted" style={{ fontSize: "0.8125rem" }}>Experience</div>
                      <div style={{ fontWeight: 700, fontSize: "1.125rem", marginTop: 4 }}>{vendor.experienceYears || 5}+ Years</div>
                    </div>
                    <div style={{ background: "var(--neutral-50)", padding: 16, borderRadius: "var(--radius-md)" }}>
                      <div className="text-muted" style={{ fontSize: "0.8125rem" }}>Bookings Done</div>
                      <div style={{ fontWeight: 700, fontSize: "1.125rem", marginTop: 4 }}>{vendor.bookingCount || 50}+ Events</div>
                    </div>
                    <div style={{ background: "var(--neutral-50)", padding: 16, borderRadius: "var(--radius-md)" }}>
                      <div className="text-muted" style={{ fontSize: "0.8125rem" }}>Response Time</div>
                      <div style={{ fontWeight: 700, fontSize: "1.125rem", marginTop: 4 }}>{vendor.responseTime || "Within 2 hrs"}</div>
                    </div>
                  </div>
                </div>

                {vendor.instagram && (
                  <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 20 }}>
                    <h4 className="heading-sm" style={{ marginBottom: 8 }}>Social Media</h4>
                    <span className="badge badge-neutral" style={{ fontSize: "0.875rem", padding: "6px 12px" }}>
                      📸 Instagram: {vendor.instagram}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Reviews */}
            {activeTab === "reviews" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {vendor.reviews?.length > 0 ? (
                  vendor.reviews.map((r) => (
                    <div key={r.id} className="card card-body">
                      <div className="flex-between">
                        <div>
                          <div style={{ fontWeight: 700 }}>{r.customer?.name || "Verified Customer"}</div>
                          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                            Event: {r.eventType || "Celebration"} • Verified Booking
                          </div>
                        </div>
                        <div className="stars">{"★".repeat(r.rating || 5)}</div>
                      </div>
                      {r.comment && (
                        <p style={{ marginTop: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                          &quot;{r.comment}&quot;
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ background: "white", borderRadius: "var(--radius-lg)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>⭐</div>
                    <h3>Overall Rating: {vendor.rating?.toFixed(1) || "4.8"} / 5</h3>
                    <p className="text-muted">Based on {vendor.reviewCount || 100}+ past client bookings in Ahmedabad.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar CTA Card */}
          <div className="vendor-profile-sidebar">
            <div className="enquiry-card">
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <div>
                  <span className="text-muted" style={{ fontSize: "0.8125rem" }}>Starting from</span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--gold-dark)" }}>
                    {formatINR(vendor.startingPrice)}
                  </div>
                </div>
                <span className="badge badge-success">Available</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  <span>✓</span> Direct quote within 24 hours
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  <span>✓</span> No advance payment required for quote
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  <span>✓</span> 100% price transparency
                </div>
              </div>

              <button
                onClick={() => setEnquiryModalOpen(true)}
                className="btn btn-primary w-full"
                style={{ padding: "14px 20px", fontSize: "1rem" }}
              >
                Send Enquiry / Get Quote 💬
              </button>

              <button
                onClick={() => router.push(`/compare?ids=${vendor.id}`)}
                className="btn btn-secondary w-full"
                style={{ marginTop: 10 }}
              >
                Compare with Others ⚖️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      {enquiryModalOpen && (
        <div className="modal-backdrop" onClick={() => setEnquiryModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="heading-md">Request Quote from {vendor.businessName}</h3>
                <p className="text-muted" style={{ fontSize: "0.8125rem" }}>Get customized pricing directly to your dashboard.</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setEnquiryModalOpen(false)}>✕</button>
            </div>

            {enquirySuccess ? (
              <div className="modal-body" style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎉</div>
                <h3 className="heading-md" style={{ color: "var(--success)" }}>Enquiry Sent Successfully!</h3>
                <p className="text-muted" style={{ marginTop: 8 }}>
                  {vendor.businessName} has received your request and will provide a quotation shortly in your dashboard.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendEnquiry}>
                <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Event Type *</label>
                      <select
                        className="form-input form-select"
                        value={enquiryForm.eventType}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, eventType: e.target.value })}
                        required
                      >
                        {EVENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Event Date *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={enquiryForm.eventDate}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, eventDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Guest Count *</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 250"
                        value={enquiryForm.guestCount}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, guestCount: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Budget for this service (₹) *</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 60000"
                        value={enquiryForm.budget}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, budget: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Specific Requirements / Message</label>
                    <textarea
                      className="form-input form-textarea"
                      placeholder="Tell the vendor about specific themes, timing, venue location or special requests..."
                      value={enquiryForm.message}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEnquiryModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={enquiryLoading}>
                    {enquiryLoading ? <><span className="spinner spinner-sm" /> Sending...</> : "Submit Enquiry →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
