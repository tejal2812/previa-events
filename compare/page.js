"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatINR } from "../../lib/utils";

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawIds = searchParams.get("ids") || "";

  const [vendors, setVendors] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendors?limit=50")
      .then((r) => r.json())
      .then((d) => {
        const list = d.vendors || [];
        setAllVendors(list);

        if (rawIds) {
          const selected = rawIds.split(",").map((id) => list.find((v) => v.id === id)).filter(Boolean);
          setVendors(selected.slice(0, 3));
        } else if (list.length >= 2) {
          setVendors(list.slice(0, 2));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [rawIds]);

  const addVendorToCompare = (id) => {
    if (vendors.length >= 3) return;
    const vendorToAdd = allVendors.find((v) => v.id === id);
    if (vendorToAdd && !vendors.some((v) => v.id === id)) {
      const updated = [...vendors, vendorToAdd];
      setVendors(updated);
      router.push(`/compare?ids=${updated.map((v) => v.id).join(",")}`);
    }
  };

  const removeVendor = (id) => {
    const updated = vendors.filter((v) => v.id !== id);
    setVendors(updated);
    router.push(`/compare?ids=${updated.map((v) => v.id).join(",")}`);
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: "70vh" }}>
        <div className="spinner spinner-lg" />
        <p>Loading vendor comparison...</p>
      </div>
    );
  }

  return (
    <div className="section" style={{ minHeight: "80vh", background: "var(--bg-secondary)" }}>
      <div className="container-lg">
        <div className="flex-between flex-wrap gap-4" style={{ marginBottom: 32 }}>
          <div>
            <span className="section-tag">Comparative Analysis</span>
            <h1 className="heading-xl" style={{ marginTop: 8 }}>Evaluate Elite Professionals</h1>
            <p className="text-muted" style={{ marginTop: 4 }}>
              Meticulously compare portfolios, financial requirements, and operational metrics to select your ideal event partner.
            </p>
          </div>

          <Link href="/vendors" className="btn btn-secondary btn-sm">
            ← Explore Additional Professionals
          </Link>
        </div>

        {vendors.length === 0 ? (
          <div className="empty-state" style={{ background: "white", borderRadius: "var(--radius-lg)" }}>
            <div className="empty-state-icon">⚖️</div>
            <h3>No Portfolios Selected for Analysis</h3>
            <p className="text-muted">Select up to 3 professionals from our premium marketplace for a comprehensive side-by-side evaluation.</p>
            <Link href="/vendors" className="btn btn-primary" style={{ marginTop: 16 }}>
              Discover Professionals
            </Link>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
            {/* Header Cards Row */}
            <div className="compare-row" style={{ background: "var(--neutral-50)", borderBottom: "2px solid var(--border-light)" }}>
              <div className="compare-label" style={{ display: "flex", alignItems: "center" }}>
                <strong>Professional Profile</strong>
              </div>
              {vendors.map((v) => (
                <div key={v.id} className="compare-cell" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--neutral-200)" }}>
                      <img src={v.coverImage} alt={v.businessName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <button
                      onClick={() => removeVendor(v.id)}
                      style={{ color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer", background: "none", border: "none" }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                  <h3 className="heading-sm" style={{ marginBottom: 4 }}>{v.businessName}</h3>
                  <div className="text-muted" style={{ fontSize: "0.8125rem", marginBottom: 12 }}>
                    {v.categories?.[0]?.category?.name || "Event Service"}
                  </div>
                  <Link href={`/vendors/${v.id}`} className="btn btn-primary btn-sm w-full">
                    View Full Portfolio →
                  </Link>
                </div>
              ))}
              {Array.from({ length: 3 - vendors.length }).map((_, idx) => (
                <div key={idx} className="compare-cell" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 180, background: "var(--neutral-100)" }}>
                  <span style={{ fontSize: "1.5rem", marginBottom: 8, opacity: 0.5 }}>➕</span>
                  <p className="text-muted" style={{ fontSize: "0.8125rem", marginBottom: 12 }}>Include another professional</p>
                  <select
                    className="form-input form-select"
                    style={{ maxWidth: 200, fontSize: "0.8125rem" }}
                    onChange={(e) => {
                      if (e.target.value) addVendorToCompare(e.target.value);
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select Vendor</option>
                    {allVendors.filter((av) => !vendors.some((v) => v.id === av.id)).map((av) => (
                      <option key={av.id} value={av.id}>{av.businessName}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Initial Investment */}
            <div className="compare-row">
              <div className="compare-label">Initial Investment</div>
              {vendors.map((v) => (
                <div key={v.id} className="compare-cell" style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--gold-dark)" }}>
                  {formatINR(v.startingPrice)}
                </div>
              ))}
              {Array.from({ length: 3 - vendors.length }).map((_, i) => <div key={i} className="compare-cell" />)}
            </div>

            {/* Rating & Endorsements */}
            <div className="compare-row">
              <div className="compare-label">Client Satisfaction & Endorsements</div>
              {vendors.map((v) => (
                <div key={v.id} className="compare-cell">
                  <span style={{ fontWeight: 700 }}>⭐ {v.rating?.toFixed(1) || "4.8"}</span>
                  <span className="text-muted" style={{ fontSize: "0.8125rem", marginLeft: 6 }}>({v.reviewCount || 0} reviews)</span>
                </div>
              ))}
              {Array.from({ length: 3 - vendors.length }).map((_, i) => <div key={i} className="compare-cell" />)}
            </div>

            {/* Location */}
            <div className="compare-row">
                  <div className="compare-label">Location in Vadodara</div>
              {vendors.map((v) => (
                <div key={v.id} className="compare-cell">
                  📍 {v.area?.name || "Vadodara City Center"}
                </div>
              ))}
              {Array.from({ length: 3 - vendors.length }).map((_, i) => <div key={i} className="compare-cell" />)}
            </div>

            {/* Accreditation */}
            <div className="compare-row">
              <div className="compare-label">Trust & Accreditation</div>
              {vendors.map((v) => (
                <div key={v.id} className="compare-cell">
                  {v.isVerified ? (
                    <span className="badge badge-verified">✓ Verified Pro</span>
                  ) : (
                    <span className="badge badge-neutral">Standard</span>
                  )}
                </div>
              ))}
              {Array.from({ length: 3 - vendors.length }).map((_, i) => <div key={i} className="compare-cell" />)}
            </div>

            {/* Communication Promptness */}
            <div className="compare-row">
              <div className="compare-label">Communication Promptness</div>
              {vendors.map((v) => (
                <div key={v.id} className="compare-cell">
                  ⚡ {v.responseTime || "Within 2 hours"}
                </div>
              ))}
              {Array.from({ length: 3 - vendors.length }).map((_, i) => <div key={i} className="compare-cell" />)}
            </div>

            {/* Professional Tenure */}
            <div className="compare-row">
              <div className="compare-label">Professional Tenure</div>
              {vendors.map((v) => (
                <div key={v.id} className="compare-cell">
                  💼 {v.experienceYears || 5}+ Years in Gujarat
                </div>
              ))}
              {Array.from({ length: 3 - vendors.length }).map((_, i) => <div key={i} className="compare-cell" />)}
            </div>

            {/* Executed Engagements */}
            <div className="compare-row">
              <div className="compare-label">Executed Engagements</div>
              {vendors.map((v) => (
                <div key={v.id} className="compare-cell">
                  🎉 {v.bookingCount || 50}+ Successful Events
                </div>
              ))}
              {Array.from({ length: 3 - vendors.length }).map((_, i) => <div key={i} className="compare-cell" />)}
            </div>

            {/* Direct Action */}
            <div className="compare-row" style={{ background: "var(--neutral-50)" }}>
              <div className="compare-label">Actions</div>
              {vendors.map((v) => (
                <div key={v.id} className="compare-cell">
                  <Link href={`/vendors/${v.id}`} className="btn btn-primary btn-sm w-full">
                    Request Proposal 💬
                  </Link>
                </div>
              ))}
              {Array.from({ length: 3 - vendors.length }).map((_, i) => <div key={i} className="compare-cell" />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="loading-state"><div className="spinner spinner-lg" /></div>}>
      <CompareContent />
    </Suspense>
  );
}
