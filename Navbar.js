"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { getInitials } from "../lib/utils";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (session) {
      fetch("/api/notifications?limit=5")
        .then((r) => r.json())
        .then((d) => setNotifs(d.notifications || []))
        .catch(() => {});
    }
  }, [session]);

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const getDashboardLink = () => {
    if (!session) return "/auth/login";
    if (session.user.role === "ADMIN") return "/admin/dashboard";
    if (session.user.role === "VENDOR" || session.user.role === "ORGANIZER") return "/organizer/dashboard";
    return "/dashboard";
  };

  const navLinks = [
    { href: "/events", label: "Events" },
    { href: "/vendors", label: "Find Vendors" },
    { href: "/plan", label: "Event Planner" },
    { href: "/my-bookings", label: "My Bookings" },
    { href: "/compare", label: "Compare" },
  ];

  return (
    <>
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="container-lg">
          <div className="navbar-inner">
            {/* Logo */}
            <Link href="/" className="navbar-logo">
              PREVIA <span>EVENTS</span>
            </Link>

            {/* Desktop Nav */}
            <div className="navbar-nav">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link${pathname === link.href ? " active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="navbar-actions" ref={userMenuRef}>
              {session ? (
                <>
                  {/* Notifications */}
                  <div style={{ position: "relative" }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                      title="Notifications"
                      style={{ position: "relative" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                      </svg>
                      {unreadCount > 0 && (
                        <span style={{
                          position: "absolute", top: 6, right: 6,
                          width: 14, height: 14, borderRadius: "50%",
                          background: "var(--gold)", color: "white",
                          fontSize: "0.625rem", fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        width: 320, background: "white", borderRadius: "var(--radius-lg)",
                        border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xl)",
                        zIndex: 100, overflow: "hidden",
                      }}>
                        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)", fontWeight: 700, fontSize: "0.875rem" }}>
                          Recent Notifications
                        </div>
                        {notifs.length === 0 ? (
                          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                            No new notifications
                          </div>
                        ) : notifs.map((n) => (
                          <div key={n.id} style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)", background: !n.isRead ? "var(--gold-surface)" : "white" }}>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 2 }}>{n.title}</div>
                            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{n.body}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* User Profile Pill */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 14px 4px 6px",
                        borderRadius: "var(--radius-full)",
                        border: "1px solid var(--border-subtle)",
                        background: "white",
                        cursor: "pointer",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <div className="avatar avatar-sm">
                        {getInitials(session.user.name)}
                      </div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {session.user.name?.split(" ")[0]}
                      </span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </button>

                    {userMenuOpen && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        background: "white", border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)",
                        minWidth: 220, overflow: "hidden", zIndex: 100,
                      }}>
                        <div style={{ padding: "16px", borderBottom: "1px solid var(--border-subtle)" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{session.user.name}</div>
                          <div style={{ fontSize: "0.775rem", color: "var(--text-muted)" }}>{session.user.email}</div>
                          <span className="badge badge-gold" style={{ marginTop: 6, fontSize: "0.7rem" }}>
                            {session.user.role}
                          </span>
                        </div>

                        <Link
                          href={getDashboardLink()}
                          onClick={() => setUserMenuOpen(false)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", fontSize: "0.875rem", color: "var(--text-main)", transition: "background 0.15s" }}
                        >
                          <span>📊</span> Command Dashboard
                        </Link>

                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "12px 16px", fontSize: "0.875rem", color: "var(--error)",
                            background: "transparent", border: "none", cursor: "pointer",
                            borderTop: "1px solid var(--border-subtle)", textAlign: "left",
                          }}
                        >
                          <span>🚪</span> Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="navbar-guest-actions">
                  <Link href="/auth/login" className="btn btn-secondary btn-sm navbar-signin">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="btn btn-primary btn-sm navbar-join">
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                className="navbar-menu-btn btn btn-ghost btn-icon"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle Navigation"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(6px)", display: "flex", justifyContent: "flex-end",
        }} onClick={() => setMobileOpen(false)}>
          <div style={{
            width: "80%", maxWidth: 320, height: "100%", background: "white",
            padding: 24, display: "flex", flexDirection: "column", gap: 16,
          }} onClick={(e) => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <span className="navbar-logo">PREVIA <span>EVENTS</span></span>
              <button onClick={() => setMobileOpen(false)} style={{ fontSize: "1.25rem" }}>✕</button>
            </div>

            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} style={{ fontSize: "1rem", fontWeight: 600, padding: "8px 0", color: "var(--primary)" }} onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}

            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {session ? (
                <>
                  <Link href={getDashboardLink()} className="btn btn-primary w-full" onClick={() => setMobileOpen(false)}>
                    Go to Dashboard
                  </Link>
                  <button onClick={() => signOut()} className="btn btn-secondary w-full" style={{ color: "var(--error)" }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="btn btn-secondary w-full" onClick={() => setMobileOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="btn btn-primary w-full" onClick={() => setMobileOpen(false)}>
                    Register Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
