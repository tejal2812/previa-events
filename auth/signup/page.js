"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "CUSTOMER" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      // Auto sign in
      const signInRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInRes?.error) {
        setLoading(false);
        router.push("/auth/login");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-bg" />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, color: "white", marginBottom: 16 }}>
            PREVIA <span style={{ color: "var(--gold)" }}>EVENTS</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "white", lineHeight: 1.2, marginBottom: 16 }}>
            Find the right people for your celebration
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1rem", lineHeight: 1.7, marginBottom: 24 }}>
            Create a free profile to save vendors, plan your event, and start conversations with trusted professionals.
          </p>
          {["🎉 Complimentary access to premium portfolios", "💬 Initiate unrestricted dialogue with elite professionals", "📊 Centralize and oversee your financial architecture", "⭐ Gain entry to our meticulously verified network"].map((f) => (
            <div key={f} style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9375rem", marginBottom: 8 }}>{f}</div>
          ))}
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-form">
          <div style={{ marginBottom: 32 }}>
            <Link href="/" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
              PREVIA <span style={{ color: "var(--gold)" }}>EVENTS</span>
            </Link>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: 24, marginBottom: 8 }}>Create your profile</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Start planning something worth remembering.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Full name</label>
              <input type="text" className="form-input" placeholder="Priya Sharma" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" className="form-input" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
            </div>

            <div className="form-group">
              <label className="form-label">Phone number</label>
              <input type="tel" className="form-input" placeholder="+91 98765 43210" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Min. 6 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="new-password" />
              <span className="form-hint">At least 6 characters</span>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="spinner spinner-sm" /> Creating profile...</> : "Create account →"}
            </button>

            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center" }}>
              By signing up, you agree to our{" "}
              <Link href="#" style={{ color: "var(--gold-dark)" }}>Terms of Service</Link> and{" "}
              <Link href="#" style={{ color: "var(--gold-dark)" }}>Privacy Policy</Link>
            </p>
          </form>

          <div style={{ marginTop: 24, textAlign: "center", fontSize: "0.9375rem" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>Authenticate</Link>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="divider-text">Are you an event professional?</div>
            <div style={{ marginTop: 12 }}>
              <Link href="/auth/vendor-signup" className="btn btn-secondary w-full">Apply for Partnership →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
