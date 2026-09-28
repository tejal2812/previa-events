"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatINR, timeAgo } from "../../../lib/utils";
import EventManager from "./EventManager";

export default function VendorDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [vendor, setVendor] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quote Creation Modal State
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    items: [{ description: "Primary Event Service Package", quantity: 1, unitPrice: 45000 }],
    discount: 0,
    taxes: 0,
    extraCharges: 0,
    notes: "Includes all travel and setup costs within Ahmedabad.",
    terms: "20% advance required upon acceptance to lock the date.",
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    businessName: "",
    description: "",
    startingPrice: 35000,
    phone: "",
    whatsapp: "",
    instagram: "",
    experienceYears: 5,
    responseTime: "Within 2 hours",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const fetchVendorData = async () => {
    try {
      const [enqData, quoteData, bookData] = await Promise.all([
        fetch("/api/enquiries").then((r) => r.json()),
        fetch("/api/quotations").then((r) => r.json()),
        fetch("/api/bookings").then((r) => r.json()),
      ]);

      setEnquiries(enqData.enquiries || []);
      setQuotations(quoteData.quotations || []);
      setBookings(bookData.bookings || []);

      // Fetch vendor profile for current user
      const vRes = await fetch("/api/vendors?limit=100");
      const vData = await vRes.json();
      const myVendor = vData.vendors?.find((v) => v.userId === session?.user?.id) || vData.vendors?.[0];
      if (myVendor) {
        setVendor(myVendor);
        setProfileForm({
          businessName: myVendor.businessName || "",
          description: myVendor.description || "",
          startingPrice: myVendor.startingPrice || 35000,
          phone: myVendor.phone || "",
          whatsapp: myVendor.whatsapp || "",
          instagram: myVendor.instagram || "",
          experienceYears: myVendor.experienceYears || 5,
          responseTime: myVendor.responseTime || "Within 2 hours",
        });
      }
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchVendorData();
    }
  }, [session, status]);

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.vendorAmount || 0), 0);
  const pendingQuotes = quotations.filter((q) => q.status === "SENT").length;

  const handleOpenQuoteModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setQuoteForm({
      items: [{ description: `${enquiry.service} for ${enquiry.eventType}`, quantity: 1, unitPrice: enquiry.budget || 45000 }],
      discount: 0,
      taxes: 0,
      extraCharges: 0,
      notes: "Full event coverage in Ahmedabad.",
      terms: "10% advance required upon date confirmation.",
    });
    setQuoteModalOpen(true);
  };

  const handleAddItem = () => {
    setQuoteForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: "Additional Service", quantity: 1, unitPrice: 5000 }],
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...quoteForm.items];
    updated[index][field] = field === "description" ? value : parseInt(value) || 0;
    setQuoteForm({ ...quoteForm, items: updated });
  };

  const handleRemoveItem = (index) => {
    setQuoteForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSendQuotation = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    setSubmittingQuote(true);

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryId: selectedEnquiry.id,
          items: quoteForm.items,
          discount: quoteForm.discount,
          taxes: quoteForm.taxes,
          extraCharges: quoteForm.extraCharges,
          notes: quoteForm.notes,
          terms: quoteForm.terms,
        }),
      });

      if (res.ok) {
        alert("✅ Quotation sent successfully to customer!");
        setQuoteModalOpen(false);
        fetchVendorData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to send quotation");
      }
    } catch {
      alert("Something went wrong");
    }
    setSubmittingQuote(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!vendor) return;
    setProfileSaving(true);

    try {
      const res = await fetch(`/api/vendors/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });

      if (res.ok) {
        alert("✅ Profile updated successfully!");
        fetchVendorData();
      } else {
        alert("Failed to update profile");
      }
    } catch {
      alert("Something went wrong");
    }
    setProfileSaving(false);
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: "80vh" }}>
        <div className="spinner spinner-lg" />
        <p>Initializing professional command center...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="avatar avatar-md" style={{ background: "var(--gold-dark)" }}>
              {vendor?.businessName?.[0] || session?.user?.name?.[0] || "V"}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                {vendor?.businessName || session?.user?.name}
              </div>
              <span className="badge badge-verified" style={{ fontSize: "0.7rem", marginTop: 2 }}>
                ✓ Accredited Professional
              </span>
            </div>
          </div>
        </div>

        <div className="sidebar-section-label">Professional Operations</div>
        <div
          className={`sidebar-nav-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span className="icon">📊</span> Performance Analytics
        </div>
        <div
          className={`sidebar-nav-item ${activeTab === "enquiries" ? "active" : ""}`}
          onClick={() => setActiveTab("enquiries")}
        >
          <span className="icon">💬</span> Client Inquiries ({enquiries.length})
        </div>
        <div
          className={`sidebar-nav-item ${activeTab === "quotations" ? "active" : ""}`}
          onClick={() => setActiveTab("quotations")}
        >
          <span className="icon">📋</span> Issued Proposals ({quotations.length})
        </div>
        <div
          className={`sidebar-nav-item ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          <span className="icon">🎉</span> Secured Engagements ({bookings.length})
        </div>
        <div
          className={`sidebar-nav-item ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          <span className="icon">🎟️</span> Ticketed Events
        </div>
        <div
          className={`sidebar-nav-item ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <span className="icon">🏢</span> Professional Portfolio
        </div>
        <div
          className={`sidebar-nav-item ${activeTab === "subscription" ? "active" : ""}`}
          onClick={() => setActiveTab("subscription")}
        >
          <span className="icon">⭐</span> Elite Membership
        </div>

        <div className="sidebar-section-label" style={{ marginTop: 24 }}>Public Profile</div>
        {vendor && (
          <Link href={`/vendors/${vendor.id}`} className="sidebar-nav-item" target="_blank">
            <span className="icon">👁️</span> View Live Listing ↗
          </Link>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            <div className="flex-between flex-wrap gap-4" style={{ marginBottom: 24 }}>
              <div>
                <h1 className="heading-xl">Professional Command Center</h1>
                <p className="text-muted" style={{ marginTop: 4 }}>
                  Centralized hub for inquiries, engagements, and client communications in Vadodara.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("enquiries")}
                className="btn btn-primary btn-sm"
              >
                Address Client Inquiries ({enquiries.filter((e) => e.status === "SENT" || e.status === "VIEWED").length})
              </button>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid" style={{ marginBottom: 28 }}>
              <div className="stat-card">
                <div className="label">Pending Inquiries</div>
                <div className="value" style={{ color: "var(--info)" }}>
                  {enquiries.filter((e) => e.status === "SENT" || e.status === "VIEWED").length}
                </div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>{enquiries.length} total received</div>
              </div>

              <div className="stat-card">
                <div className="label">Active Proposals</div>
                <div className="value" style={{ color: "var(--warning)" }}>{pendingQuotes}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Awaiting client reply</div>
              </div>

              <div className="stat-card">
                <div className="label">Finalized Engagements</div>
                <div className="value" style={{ color: "var(--success)" }}>{bookings.length}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Total events locked</div>
              </div>

              <div className="stat-card">
                <div className="label">Net Earnings</div>
                <div className="value" style={{ color: "var(--gold-dark)" }}>{formatINR(totalRevenue)}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>After platform commission</div>
              </div>
            </div>

            {/* Recent Enquiries Table */}
            <div className="card card-body" style={{ marginBottom: 24 }}>
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <h3 className="heading-sm">Recent Client Inquiries</h3>
                <button
                  onClick={() => setActiveTab("enquiries")}
                  style={{ fontSize: "0.8125rem", color: "var(--gold-dark)", fontWeight: 600 }}
                >
                  View All ({enquiries.length}) →
                </button>
              </div>

              {enquiries.length === 0 ? (
                <p className="text-muted" style={{ padding: "16px 0" }}>No client inquiries yet.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Event & Date</th>
                        <th>Location</th>
                        <th>Budget</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enquiries.slice(0, 5).map((enq) => (
                        <tr key={enq.id}>
                          <td>
                            <strong>{enq.customer?.name || "Client"}</strong>
                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>{enq.customer?.phone}</div>
                          </td>
                          <td>
                            {enq.eventType} • {enq.eventDate}
                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>{enq.guestCount} guests</div>
                          </td>
                          <td>📍 {enq.eventCity || "Vadodara"}</td>
                          <td style={{ fontWeight: 700 }}>{formatINR(enq.budget)}</td>
                          <td>
                            <button
                              onClick={() => handleOpenQuoteModal(enq)}
                              className="btn btn-primary btn-sm"
                            >
                              Dispatch Proposal 📋
                            </button>
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

        {/* TAB 2: ENQUIRIES */}
        {activeTab === "enquiries" && (
          <div>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h2 className="heading-lg">Client Inquiries</h2>
              <span className="text-muted">{enquiries.length} total inquiries</span>
            </div>

            {enquiries.length === 0 ? (
              <div className="empty-state" style={{ background: "white", borderRadius: "var(--radius-lg)" }}>
                <div className="empty-state-icon">💬</div>
                <h3>No inquiries received yet</h3>
                <p className="text-muted">Ensure your profile pricing and portfolio are updated to attract inquiries.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {enquiries.map((enq) => (
                  <div key={enq.id} className="card card-body" style={{ borderLeft: "4px solid var(--info)" }}>
                    <div className="flex-between flex-wrap gap-4">
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h3 className="heading-md">{enq.customer?.name || "Event Client"}</h3>
                          <span className={`status-badge status-${enq.status.toLowerCase()}`}>
                            {enq.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.8125rem", marginTop: 4 }}>
                          {enq.eventType} on <strong>{enq.eventDate}</strong> • {enq.guestCount} Guests • Received {timeAgo(enq.createdAt)}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Client Stated Budget</div>
                        <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)" }}>
                          {formatINR(enq.budget)}
                        </div>
                      </div>
                    </div>

                    {enq.message && (
                      <div style={{ margin: "14px 0", background: "var(--neutral-50)", padding: 12, borderRadius: "var(--radius-md)" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
                          Client Notes & Requirements:
                        </div>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{enq.message}</p>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
                      <a
                        href={`https://wa.me/91${enq.customer?.phone?.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        WhatsApp Client 📱
                      </a>
                      <button
                        onClick={() => handleOpenQuoteModal(enq)}
                        className="btn btn-primary btn-sm"
                      >
                        Create & Send Quotation 📋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUOTATIONS */}
        {activeTab === "quotations" && (
          <div>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h2 className="heading-lg">Issued Proposals</h2>
              <span className="text-muted">{quotations.length} total quotes</span>
            </div>

            {quotations.length === 0 ? (
              <div className="empty-state" style={{ background: "white", borderRadius: "var(--radius-lg)" }}>
                <div className="empty-state-icon">📋</div>
                <h3>No proposals created yet</h3>
                <p className="text-muted">Go to the inquiries tab to create and dispatch custom proposals to clients.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Event</th>
                      <th>Quoted Amount</th>
                      <th>Status</th>
                      <th>Sent Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map((q) => (
                      <tr key={q.id}>
                        <td><strong>{q.customer?.name || "Client"}</strong></td>
                        <td>{q.enquiry?.eventType || "Event"}</td>
                        <td style={{ fontWeight: 700, color: "var(--gold-dark)" }}>{formatINR(q.totalAmount)}</td>
                        <td>
                          <span className={`status-badge status-${q.status.toLowerCase()}`}>
                            {q.status}
                          </span>
                        </td>
                        <td>{timeAgo(q.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BOOKINGS */}
        {activeTab === "bookings" && (
          <div>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h2 className="heading-lg">Finalized Engagements</h2>
              <span className="text-muted">{bookings.length} confirmed</span>
            </div>

            {bookings.length === 0 ? (
              <div className="empty-state" style={{ background: "white", borderRadius: "var(--radius-lg)" }}>
                <div className="empty-state-icon">🎉</div>
                <h3>No finalized engagements yet</h3>
                <p className="text-muted">Authorized proposals will automatically appear here as finalized engagements.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {bookings.map((b) => (
                  <div key={b.id} className="card card-body">
                    <div className="flex-between flex-wrap gap-4">
                      <div>
                        <span className="badge badge-verified" style={{ marginBottom: 6 }}>✓ Finalized Engagement</span>
                        <h3 className="heading-md">{b.customer?.name || "Client"}</h3>
                        <div className="text-muted" style={{ fontSize: "0.8125rem", marginTop: 4 }}>
                          Event: {b.eventType} • Date: <strong>{b.eventDate}</strong> • Phone: {b.customer?.phone}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Total Engagement Value</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>{formatINR(b.bookingAmount)}</div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--success)" }}>
                          Your Payout: {formatINR(b.vendorAmount)} (8% comm. applied)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "events" && <EventManager />}

        {/* TAB 5: PROFILE EDIT */}
        {activeTab === "profile" && (
          <div className="card card-body" style={{ maxWidth: 720 }}>
            <h2 className="heading-lg" style={{ marginBottom: 20 }}>Edit Professional Portfolio</h2>

            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.businessName}
                  onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Business Bio & Summary</label>
                <textarea
                  className="form-input form-textarea"
                  rows={4}
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Starting Price (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={profileForm.startingPrice}
                    onChange={(e) => setProfileForm({ ...profileForm, startingPrice: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Experience (Years)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={profileForm.experienceYears}
                    onChange={(e) => setProfileForm({ ...profileForm, experienceYears: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={profileForm.whatsapp}
                    onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Instagram Handle</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="@yourhandle"
                  value={profileForm.instagram}
                  onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={profileSaving}
                style={{ marginTop: 8 }}
              >
                {profileSaving ? <><span className="spinner spinner-sm" /> Saving Changes...</> : "Save Profile Details →"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: PRO SUBSCRIPTION */}
        {activeTab === "subscription" && (
          <div style={{ maxWidth: 760 }}>
            <h2 className="heading-lg" style={{ marginBottom: 8 }}>Eventora Vendor Pro</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              Supercharge your professional profile in Ahmedabad with Elite visibility and tools.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, alignItems: "start" }}>
              <div className="card card-body">
                <span className="badge badge-neutral" style={{ marginBottom: 12 }}>Current Plan</span>
                <h3 className="heading-md">Free Partner</h3>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, margin: "8px 0 16px" }}>₹0 / mo</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  <div>✓ Standard listing in Ahmedabad</div>
                  <div>✓ 5 Portfolio photos</div>
                  <div>✓ Receive client inquiries</div>
                </div>
              </div>

              <div className="card card-body" style={{ border: "2px solid var(--gold)", background: "linear-gradient(135deg, white, var(--gold-muted))" }}>
                <span className="badge badge-gold" style={{ marginBottom: 12 }}>Recommended</span>
                <h3 className="heading-md">Eventora Pro</h3>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--gold-dark)", margin: "8px 0 16px" }}>
                  ₹999 <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-muted)" }}>/ month</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: 24 }}>
                  <div>✓ <strong>Top placement</strong> in search results & categories</div>
                  <div>✓ <strong>Unlimited</strong> portfolio gallery uploads</div>
                  <div>✓ Instant WhatsApp lead notifications</div>
                  <div>✓ Advanced quotation builder & contract terms</div>
                  <div>✓ Verified Pro badge ⭐</div>
                </div>

                <button
                  onClick={() => alert("🎉 Eventora Pro enabled for testing in development mode!")}
                  className="btn btn-primary w-full"
                >
                  Upgrade to Pro (₹999/mo) →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Quote Builder Modal */}
      {quoteModalOpen && (
        <div className="modal-backdrop" onClick={() => setQuoteModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="heading-md">Create Bespoke Proposal</h3>
                <p className="text-muted" style={{ fontSize: "0.8125rem" }}>
                  For {selectedEnquiry?.customer?.name} ({selectedEnquiry?.eventType})
                </p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setQuoteModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSendQuotation}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "65vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="form-label">Quotation Line Items</label>
                  <button type="button" onClick={handleAddItem} style={{ fontSize: "0.8125rem", color: "var(--gold-dark)", fontWeight: 700 }}>
                    + Add Item
                  </button>
                </div>

                {quoteForm.items.map((item, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                      required
                    />
                    {quoteForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{ color: "var(--error)", cursor: "pointer", background: "none", border: "none" }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <div className="form-group">
                  <label className="form-label">Special Notes & Inclusions</label>
                  <textarea
                    className="form-input form-textarea"
                    rows={2}
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment & Booking Terms</label>
                  <input
                    type="text"
                    className="form-input"
                    value={quoteForm.terms}
                    onChange={(e) => setQuoteForm({ ...quoteForm, terms: e.target.value })}
                  />
                </div>

                {/* Total Preview */}
                <div style={{ background: "var(--neutral-50)", padding: 16, borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>Total Quotation Amount:</span>
                  <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--gold-dark)" }}>
                    {formatINR(quoteForm.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0))}
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setQuoteModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingQuote}>
                  {submittingQuote ? <><span className="spinner spinner-sm" /> Sending...</> : "Send Quotation to Client 📋"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
