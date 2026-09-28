"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LAUNCH_CITY } from "../../../lib/locations";

export default function VendorSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: account, 2: business
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "",
    businessName: "", subcategory: "", description: "", cityId: "", areaId: "", businessAddress: "",
    startingPrice: "", experienceYears: "", instagram: "", website: "", whatsapp: "",
    panNumber: "", gstin: "", businessRegistration: "", consent: false,
  });
  const [documents, setDocuments] = useState({ PAN: null, GSTIN: null, BUSINESS_REGISTRATION: null, ADDRESS_PROOF: null, PORTFOLIO: null });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/meta").then((r) => r.json()).then((d) => {
      setCategories(d.categories || []);
      const availableCities = d.cities || [];
        setCities(availableCities);
        const launchCity = availableCities.find((city) => city.name === LAUNCH_CITY);
        if (launchCity) setForm((current) => ({ ...current, cityId: launchCity.id }));
    }).catch(() => {});
  }, []);

  const selectedCity = cities.find((c) => c.id === form.cityId);

  const handleStep1 = (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCats.length) return setError("Please select at least one service category.");
    setError("");
    setLoading(true);

    try {
      // Register user
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone, role: "VENDOR" }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) { setError(regData.error || "Registration failed."); setLoading(false); return; }

      // Sign in
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });

      // Create vendor profile
      const vendorRes = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          description: form.description,
          phone: form.phone,
          whatsapp: form.whatsapp,
          email: form.email,
          instagram: form.instagram,
          website: form.website,
          subcategory: form.subcategory,
          businessAddress: form.businessAddress,
          panNumber: form.panNumber,
          gstin: form.gstin,
          businessRegistration: form.businessRegistration,
          consent: form.consent,
          cityId: form.cityId,
          areaId: form.areaId || null,
          startingPrice: form.startingPrice,
          experienceYears: form.experienceYears,
          categoryIds: selectedCats,
        }),
      });

      if (vendorRes.ok) {
        const vendorData = await vendorRes.json();
        await Promise.all(Object.entries(documents).filter(([, file]) => file).map(async ([documentType, file]) => {
          const upload = new FormData();
          upload.append("documentType", documentType);
          upload.append("file", file);
          await fetch(`/api/vendors/${vendorData.vendor.id}/verification/documents`, { method: "POST", body: upload });
        }));
        router.push("/vendor/dashboard");
      } else {
        router.push("/vendor/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual" style={{ background: "linear-gradient(135deg, #1A0A00, #2D1500)" }}>
        <div className="auth-visual-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80')" }} />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, color: "white", marginBottom: 16 }}>
            Event<span style={{ color: "var(--gold)" }}>ora</span> for Vendors
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "white", lineHeight: 1.2, marginBottom: 16 }}>
            Elevate Your Professional Reach
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1rem", lineHeight: 1.7, marginBottom: 24 }}>
            Partner with Vadodara&apos;s event marketplace to showcase your expertise to local clients.
          </p>
          {["🆓 Complimentary induction with zero initiation fees", "📨 Direct acquisition of high-value client inquiries", "🗂️ Prestigious professional portfolio exhibition", "📊 Comprehensive business analytics and insights suite", "🏅 Exclusive verification accreditation for enhanced trust"].map((f) => (
            <div key={f} style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9375rem", marginBottom: 8 }}>{f}</div>
          ))}
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-form" style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 28 }}>
            <Link href="/" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Event<span style={{ color: "var(--gold)" }}>ora</span>
            </Link>
            <div style={{ display: "flex", gap: 8, marginTop: 20, marginBottom: 20 }}>
              {[1, 2].map((s) => (
                <div key={s} style={{ flex: 1, height: 4, borderRadius: 99, background: step >= s ? "var(--gold)" : "var(--border-default)", transition: "background 0.3s" }} />
              ))}
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>
              {step === 1 ? "Establish Your Credentials" : "Define Your Professional Profile"}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
              Step {step} of 2 — {step === 1 ? "Primary Information" : "Operational Details"}
            </p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleStep1} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Your full name</label>
                <input type="text" className="form-input" placeholder="Harsh Patel" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input type="email" className="form-input" placeholder="you@business.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone number</label>
                <input type="tel" className="form-input" placeholder="+91 98765 43210" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="Min. 6 characters" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary w-full">Continue →</button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Business name *</label>
                <input type="text" className="form-input" placeholder="Harsh Patel Photography" value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Service categories * (select all that apply)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCats((prev) => prev.includes(cat.id) ? prev.filter((c) => c !== cat.id) : [...prev, cat.id])}
                      style={{
                        padding: "6px 12px", borderRadius: 99, fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
                        fontFamily: "var(--font-body)", transition: "all 0.2s",
                        background: selectedCats.includes(cat.id) ? "var(--gold)" : "white",
                        color: selectedCats.includes(cat.id) ? "white" : "var(--text-secondary)",
                        border: `1.5px solid ${selectedCats.includes(cat.id) ? "var(--gold)" : "var(--border-default)"}`,
                      }}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <select className="form-input form-select" value={form.cityId}
                    onChange={(e) => setForm({ ...form, cityId: e.target.value, areaId: "" })} required>
                    <option value="">Select city</option>
                    {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Area / Locality</label>
                  <select className="form-input form-select" value={form.areaId}
                    onChange={(e) => setForm({ ...form, areaId: e.target.value })} disabled={!form.cityId}>
                    <option value="">Select area</option>
                    {(selectedCity?.areas || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Vendor subcategory *</label>
                <input type="text" className="form-input" placeholder="Wedding photographer, live band, venue..." value={form.subcategory}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Business address *</label>
                <input type="text" className="form-input" placeholder="Street, landmark, locality" value={form.businessAddress}
                  onChange={(e) => setForm({ ...form, businessAddress: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Short description</label>
                <textarea className="form-input form-textarea" placeholder="Tell customers what you do and what makes you special..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Starting price (₹)</label>
                  <input type="number" className="form-input" placeholder="e.g. 15000" value={form.startingPrice}
                    onChange={(e) => setForm({ ...form, startingPrice: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Experience (years)</label>
                  <input type="number" className="form-input" placeholder="e.g. 5" value={form.experienceYears}
                    onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input type="url" className="form-input" placeholder="https://yourwebsite.com" value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Instagram</label>
                  <input type="text" className="form-input" placeholder="@yourhandle" value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
                </div>
              </div>

              <div className="vendor-verification-fields">
                <div className="vendor-section-heading">Verification details</div>
                <p className="form-hint">These details are private and visible only to authorized PREVIA administrators.</p>
                <div className="vendor-verification-grid">
                  <div className="form-group"><label className="form-label">PAN *</label><input className="form-input" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} required /></div>
                  <div className="form-group"><label className="form-label">GSTIN <span className="form-hint">(if applicable)</span></label><input className="form-input" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} /></div>
                  <div className="form-group"><label className="form-label">Business registration / Udyam <span className="form-hint">(if applicable)</span></label><input className="form-input" value={form.businessRegistration} onChange={(e) => setForm({ ...form, businessRegistration: e.target.value })} /></div>
                </div>
                <div className="vendor-document-grid">
                  {["PAN", "GSTIN", "BUSINESS_REGISTRATION", "ADDRESS_PROOF", "PORTFOLIO"].map((type) => <label key={type} className="vendor-document-field"><span>{type.replaceAll("_", " ")} {type === "PAN" || type === "ADDRESS_PROOF" ? "*" : ""}</span><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required={type === "PAN" || type === "ADDRESS_PROOF"} onChange={(e) => setDocuments({ ...documents, [type]: e.target.files?.[0] || null })} /></label>)}
                </div>
                <label className="vendor-consent"><input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} required /> I consent to PREVIA collecting and reviewing these details for identity, business verification, and payouts. PAN, documents, and payout information will not be public.</label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Instagram handle</label>
                  <input type="text" className="form-input" placeholder="@yourhandle" value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp number</label>
                  <input type="tel" className="form-input" placeholder="9876543210" value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
                  {loading ? <><span className="spinner spinner-sm" /> Enrolling...</> : "Submit Professional Profile →"}
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: 20, textAlign: "center", fontSize: "0.9375rem" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>Authenticate</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
