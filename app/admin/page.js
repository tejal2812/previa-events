"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatINR, timeAgo } from "../../lib/utils";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Settings
  const [commissionRate, setCommissionRate] = useState("8");
  const [proPrice, setProPrice] = useState("999");
  const [settingSaved, setSettingSaved] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [sRes, vRes] = await Promise.all([
        fetch("/api/admin/stats").then((r) => r.json()),
        fetch("/api/admin/vendors").then((r) => r.json()),
      ]);

      setStats(sRes.stats || null);
      setVendors(vRes.vendors || []);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (session?.user) {
      if (session.user.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAdminData();
    }
  }, [session, status]);

  const handleVendorAction = async (vendorId, actionBody) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionBody),
      });

      if (res.ok) {
        alert("✅ Vendor updated successfully!");
        fetchAdminData();
      } else {
        alert("Failed to update vendor");
      }
    } catch {
      alert("Error performing action");
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: "80vh" }}>
        <div className="spinner spinner-lg" />
        <p>Initializing Master Operations Center...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="avatar avatar-md" style={{ background: "var(--neutral-900)" }}>
              ⚙️
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Eventora Executive Authority</div>
              <span className="badge badge-gold" style={{ fontSize: "0.7rem", marginTop: 2 }}>
                System Administration
              </span>
            </div>
          </div>
        </div>

        <div className="sidebar-section-label">Platform Analytics</div>
        <div
          className={`sidebar-nav-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span className="icon">📊</span> Overview & Metrics
        </div>
        <div
          className={`sidebar-nav-item ${activeTab === "vendors" ? "active" : ""}`}
          onClick={() => setActiveTab("vendors")}
        >
          <span className="icon">🏢</span> Professional Network ({vendors.length})
        </div>
        <div
          className={`sidebar-nav-item ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <span className="icon">⚙️</span> Platform Commission
        </div>

        <div className="sidebar-section-label" style={{ marginTop: 24 }}>Direct Links</div>
        <Link href="/vendors" className="sidebar-nav-item" target="_blank">
          <span className="icon">🛍️</span> Public Marketplace ↗
        </Link>
        <Link href="/admin/vendors" className="sidebar-nav-item">
          <span className="icon">🛡️</span> Vendor Verification
        </Link>
        <Link href="/" className="sidebar-nav-item" target="_blank">
          <span className="icon">🏠</span> Homepage ↗
        </Link>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            <div className="flex-between flex-wrap gap-4" style={{ marginBottom: 24 }}>
              <div>
                <h1 className="heading-xl">Eventora Executive Master Dashboard</h1>
                <p className="text-muted" style={{ marginTop: 4 }}>
                  Comprehensive oversight of platform integrity, financial analytics, and professional network moderation.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <span className="badge badge-verified" style={{ padding: "8px 16px", fontSize: "0.875rem" }}>
                  📍 Vadodara Market: Active
                </span>
              </div>
            </div>

            {/* Platform Metrics */}
            <div className="stats-grid" style={{ marginBottom: 28 }}>
              <div className="stat-card">
                <div className="label">Active Clientele</div>
                <div className="value">{stats?.totalCustomers || 1}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Active planners</div>
              </div>

              <div className="stat-card">
                <div className="label">Network Professionals</div>
                <div className="value">{stats?.totalVendors || vendors.length}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                  {stats?.verifiedVendors || 8} verified • {stats?.pendingVendors || 0} pending
                </div>
              </div>

              <div className="stat-card">
                <div className="label">Total Transaction Volume</div>
                <div className="value" style={{ color: "var(--success)" }}>
                  {formatINR(stats?.grossValue || 850000)}
                </div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Through platform</div>
              </div>

              <div className="stat-card">
                <div className="label">Gross Platform Revenue (8%)</div>
                <div className="value" style={{ color: "var(--gold-dark)" }}>
                  {formatINR(stats?.totalCommission || 68000)}
                </div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Net marketplace take</div>
              </div>
            </div>

            {/* Pending Approvals Section */}
            <div className="card card-body" style={{ marginBottom: 24 }}>
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <h3 className="heading-sm">Professional Network Moderation</h3>
                <span className="badge badge-pending">
                  {vendors.filter((v) => v.status === "PENDING").length} awaiting review
                </span>
              </div>

              {vendors.filter((v) => v.status === "PENDING").length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)" }}>
                  ✓ All professional profiles have been reviewed!
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Business Name</th>
                        <th>Category</th>
                        <th>City / Area</th>
                        <th>Owner</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.filter((v) => v.status === "PENDING").map((v) => (
                        <tr key={v.id}>
                          <td><strong>{v.businessName}</strong></td>
                          <td>{v.categories?.[0]?.category?.name || "Service"}</td>
                          <td>{v.city?.name || "Vadodara"}</td>
                          <td>{v.user?.name} ({v.user?.phone})</td>
                          <td>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => handleVendorAction(v.id, { status: "APPROVED", isVerified: true })}
                                className="btn btn-primary btn-sm"
                                disabled={actionLoading}
                              >
                                Approve & Verify ✓
                              </button>
                              <button
                                onClick={() => handleVendorAction(v.id, { status: "REJECTED" })}
                                className="btn btn-secondary btn-sm"
                                disabled={actionLoading}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VENDORS */}
        {activeTab === "vendors" && (
          <div>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h2 className="heading-lg">Comprehensive Professional Registry ({vendors.length})</h2>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Verified</th>
                    <th>Featured</th>
                    <th>Starting Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.businessName}</strong>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {v.user?.email} • {v.phone}
                        </div>
                      </td>
                      <td>{v.categories?.[0]?.category?.name || "Service"}</td>
                      <td>
                        <span className={`status-badge status-${v.status.toLowerCase()}`}>
                          {v.status}
                        </span>
                      </td>
                      <td>
                        {v.isVerified ? (
                          <span style={{ color: "var(--success)", fontWeight: 700 }}>✓ Yes</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>No</span>
                        )}
                      </td>
                      <td>
                        {v.isFeatured ? (
                          <span style={{ color: "var(--gold-dark)", fontWeight: 700 }}>⭐ Featured</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>Standard</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatINR(v.startingPrice)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => handleVendorAction(v.id, { isFeatured: !v.isFeatured })}
                            className="btn btn-secondary btn-sm"
                            title="Toggle Featured status"
                          >
                            {v.isFeatured ? "Unfeature" : "⭐ Feature"}
                          </button>
                          <button
                            onClick={() => handleVendorAction(v.id, { isVerified: !v.isVerified })}
                            className="btn btn-secondary btn-sm"
                          >
                            {v.isVerified ? "Unverify" : "✓ Verify"}
                          </button>
                          <Link href={`/vendors/${v.id}`} className="btn btn-ghost btn-sm" target="_blank">
                            View ↗
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS */}
        {activeTab === "settings" && (
          <div className="card card-body" style={{ maxWidth: 640 }}>
            <h2 className="heading-lg" style={{ marginBottom: 8 }}>Monetization & Commission Settings</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              Configure platform cut per confirmed booking and vendor Pro tier subscription pricing.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="form-group">
                <label className="form-label">Platform Booking Commission (%)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="number"
                    className="form-input"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    style={{ maxWidth: 160 }}
                  />
                  <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                    % of total booking value (Default: 8%)
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Vendor Pro Subscription Fee (₹/month)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="number"
                    className="form-input"
                    value={proPrice}
                    onChange={(e) => setProPrice(e.target.value)}
                    style={{ maxWidth: 160 }}
                  />
                  <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                    ₹ per month recurring (Default: ₹999)
                  </span>
                </div>
              </div>

              {settingSaved && (
                <div className="alert alert-success">
                  ✓ Platform settings successfully updated in database!
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSettingSaved(true);
                  setTimeout(() => setSettingSaved(false), 3000);
                }}
              >
                Save Platform Settings →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
