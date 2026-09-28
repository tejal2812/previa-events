"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      // Get session to redirect to correct dashboard
      const session = await fetch("/api/auth/session").then((r) => r.json());
      const role = session?.user?.role;
      if (role === "ADMIN") router.push("/admin");
      else if (role === "VENDOR") router.push("/vendor/dashboard");
      else router.push("/dashboard");
    }
  };

  return (
    <div className="auth-page auth-page-minimal">
      <div className="auth-form-wrap">
        <div className="auth-form auth-form-minimal">
          <Link href="/" className="auth-wordmark">PREVIA <span>EVENTS</span></Link>
          <div className="auth-form-heading">
            <p className="auth-eyebrow">Welcome back</p>
            <h1>Sign in to continue your event journey.</h1>
          </div>

          <form onSubmit={handleSubmit} className="auth-login-form">
            {error && (
              <div className="alert alert-error">{error}</div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@yourdomain.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <div className="auth-password-label">
                <label className="form-label" htmlFor="login-password">Password</label>
                <Link href="/auth/forgot-password" className="auth-forgot-link">Forgot password?</Link>
              </div>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary w-full auth-submit" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm" /> Signing in...</> : "Sign in"}
            </button>
          </form>

          <p className="auth-create-account">New to PREVIA? <Link href="/auth/signup">Create account</Link></p>
          <p className="auth-location-note">Thoughtful events and trusted professionals in Vadodara, Gujarat.</p>
        </div>
      </div>
    </div>
  );
}
