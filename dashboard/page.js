"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatINR, formatDate, timeAgo } from "../../lib/utils";

export default function CustomerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [events, setEvents] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected quotation for modal viewing
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Event checklist
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Finalize total guest list & send invites", done: true },
    { id: 2, text: "Book venue & verify timing slot", done: true },
    { id: 3, text: "Confirm catering menu & per-plate pricing", done: false },
    { id: 4, text: "Schedule pre-wedding photography session", done: false },
    { id: 5, text: "Trial bridal makeup & hairstyling", done: false },
    { id: 6, text: "Select sangeet song playlist with DJ", done: false },
  ]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (session?.user) {
      Promise.all([
        fetch("/api/events").then((r) => r.json()),
        fetch("/api/enquiries").then((r) => r.json()),
        fetch("/api/quotations").then((r) => r.json()),
        fetch("/api/bookings").then((r) => r.json()),
        fetch("/api/favorites").then((r) => r.json()),
      ])
        .then(([evData, enqData, quoteData, bookData, favData]) => {
          setEvents(evData.events || []);
          setEnquiries(enqData.enquiries || []);
          setQuotations(quoteData.quotations || []);
          setBookings(bookData.bookings || []);
          setFavorites(favData.favorites || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session, status]);

  const activeEvent = events[0] || null;

  const totalSpent = bookings.reduce((sum, b) => sum + (b.bookingAmount || 0), 0);
  const totalQuoted = quotations
    .filter((q) => q.status === "SENT" || q.status === "CHANGES_REQUESTED")
    .reduce((sum, q) => sum + (q.totalAmount || 0), 0);
  const totalBudget = activeEvent?.totalBudget || 600000;
  const remainingBudget = Math.max(0, totalBudget - totalSpent - totalQuoted);

  const handleQuoteAction = async (quoteId, action) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/quotations/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        alert(
          action === "accept"
            ? "🎉 Quotation Accepted! Booking record created."
            : action === "reject"
            ? "Quotation rejected."
            : "Changes requested from vendor."
        );
        setSelectedQuote(null);
        // Refresh data
        const [qData, bData] = await Promise.all([
          fetch("/api/quotations").then((r) => r.json()),
          fetch("/api/bookings").then((r) => r.json()),
        ]);
        setQuotations(qData.quotations || []);
        setBookings(bData.bookings || []);
      } else {
        const d = await res.json();
        alert(d.error || "Action failed");
      }
    } catch {
      alert("Something went wrong");
    }
    setActionLoading(false);
  };

  const toggleChecklistItem = (id) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: "80vh" }}>
        <div className="spinner spinner-lg" />
        <p>Initializing your event architecture dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="avatar avatar-md">{session?.user?.name?.[0] || "C"}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{session?.user?.name}</div>
              <span className="badge badge-gold" style={{ fontSize: "0.7rem", marginTop: 2 }}>Event Architect</span>
            </div>
          </div>
        </div>

        <div className="sidebar-section-label">Event Blueprint</div>
        <div
          className={`sidebar-nav-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span className="icon">📊</span> Master Overview
        </div>
        <div
          className={`sidebar-nav-item ${activeTab === "quotations" ? "active" : ""}`}
          onClick={() => setActiveTab("quotations")}
        >
          <span className="icon">📋</span> Proposals ({quotations.length})
        </div>
        <div
          className={`sidebar-nav-item ${activeTab === "enquiries" ? "active" : ""}`}
          onClick={() => setActiveTab("enquiries")}
        >
          <span className="icon">💬</span> Dispatched Inquiries ({enquiries.length})
        </div>
        <div
          className={`sidebar-nav-item ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          <span className="icon">🎉</span> Finalized Engagements ({bookings.length})
        </div>
        <div
          className={`sidebar-nav-item ${activeTab === "shortlist" ? "active" : ""}`}
          onClick={() => setActiveTab("shortlist")}
        >
          <span className="icon">❤️</span> Curated Professionals ({favorites.length})
        </div>

        <div className="sidebar-section-label" style={{ marginTop: 24 }}>Actions</div>
        <Link href="/plan" className="sidebar-nav-item">
          <span className="icon">➕</span> Architect New Event
        </Link>
        <Link href="/vendors" className="sidebar-nav-item">
          <span className="icon">🔍</span> Explore Professionals
        </Link>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            {/* Event Summary Banner */}
            <div
              className="card card-body"
              style={{
                background: "linear-gradient(135deg, #1A0F00, #2D1A00)",
                color: "white",
                marginBottom: 24,
                position: "relative",
              }}
            >
              <div className="flex-between flex-wrap gap-4">
                <div>
                  <span className="badge badge-gold" style={{ marginBottom: 8 }}>
                    {activeEvent?.eventType || "Wedding"} Celebration
                  </span>
                  <h1 className="heading-lg" style={{ color: "white" }}>
                    {activeEvent?.name || `${session?.user?.name}'s Grand Celebration`}
                  </h1>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: "0.875rem", opacity: 0.85, flexWrap: "wrap" }}>
                    <span>📍 {activeEvent?.area ? `${activeEvent.area}, ` : ""}{activeEvent?.city || "Vadodara"}</span>
                    <span>🗓️ {activeEvent?.eventDate ? formatDate(activeEvent.eventDate) : "Date TBD"}</span>
                    <span>👥 {activeEvent?.guestCount || 300} Guests</span>
                  </div>
                </div>

                <Link href="/plan" className="btn btn-primary btn-sm">
                  Refine Architecture ⚙️
                </Link>
              </div>
            </div>

            {/* Budget Stat Cards */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="label">Master Financial Allocation</div>
                <div className="value" style={{ color: "var(--text-primary)" }}>{formatINR(totalBudget)}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Projected maximum investment</div>
              </div>

              <div className="stat-card">
                <div className="label">Committed Capital</div>
                <div className="value" style={{ color: "var(--success)" }}>{formatINR(totalSpent)}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>{bookings.length} secured professionals</div>
              </div>

              <div className="stat-card">
                <div className="label">Proposals Under Review</div>
                <div className="value" style={{ color: "var(--warning)" }}>{formatINR(totalQuoted)}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Pending client authorization</div>
              </div>

              <div className="stat-card">
                <div className="label">Unallocated Reserves</div>
                <div className="value" style={{ color: "var(--gold-dark)" }}>{formatINR(remainingBudget)}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Available contingency funds</div>
              </div>
            </div>

            {/* Service Status Breakdown & Checklist Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, alignItems: "start" }}>
              {/* Service Hiring Status */}
              <div className="card card-body">
                <h3 className="heading-sm" style={{ marginBottom: 16 }}>Professional Engagement Status</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(activeEvent?.services?.length > 0 ? activeEvent.services : [
                    { serviceName: "Venue", allocatedBudget: 180000, status: "CONFIRMED" },
                    { serviceName: "Catering", allocatedBudget: 150000, status: "QUOTE_RECEIVED" },
                    { serviceName: "Photography", allocatedBudget: 75000, status: "PENDING" },
                    { serviceName: "Decoration", allocatedBudget: 60000, status: "SHORTLISTED" },
                    { serviceName: "Makeup", allocatedBudget: 25000, status: "PENDING" },
                    { serviceName: "DJ & Music", allocatedBudget: 20000, status: "CONFIRMED" },
                  ]).map((svc) => (
                    <div key={svc.serviceName} className="flex-between" style={{ padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{svc.serviceName}</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          Allocated: {formatINR(svc.allocatedBudget)}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={`status-badge status-${svc.status.toLowerCase()}`}>
                          {svc.status.replace("_", " ")}
                        </span>
                        <Link href={`/vendors?category=${svc.serviceName.toLowerCase().replace(/\s+/g, "-")}`} style={{ fontSize: "0.8rem", color: "var(--gold-dark)", fontWeight: 600 }}>
                          Discover →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Checklist */}
              <div className="card card-body">
                <h3 className="heading-sm" style={{ marginBottom: 16 }}>Execution Protocol</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {checklist.map((item) => (
                    <label
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: item.done ? "var(--text-muted)" : "var(--text-primary)",
                        textDecoration: item.done ? "line-through" : "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleChecklistItem(item.id)}
                        style={{ accentColor: "var(--gold)", width: 16, height: 16 }}
                      />
                      <span>{item.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUOTATIONS */}
        {activeTab === "quotations" && (
          <div>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h2 className="heading-lg">Received Proposals</h2>
              <span className="text-muted">{quotations.length} active proposals</span>
            </div>

            {quotations.length === 0 ? (
              <div className="empty-state" style={{ background: "white", borderRadius: "var(--radius-lg)" }}>
                <div className="empty-state-icon">📋</div>
                <h3>No proposals currently available</h3>
                <p className="text-muted">Dispatch inquiries to our premium network to receive bespoke proposals.</p>
                <Link href="/vendors" className="btn btn-primary" style={{ marginTop: 16 }}>
                  Discover Professionals to Initiate Proposals
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {quotations.map((quote) => (
                  <div key={quote.id} className="card card-body" style={{ borderLeft: "4px solid var(--gold)" }}>
                    <div className="flex-between flex-wrap gap-4">
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h3 className="heading-md">{quote.vendor?.businessName}</h3>
                          <span className={`status-badge status-${quote.status.toLowerCase()}`}>
                            {quote.status}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.8125rem", marginTop: 4 }}>
                          For {quote.enquiry?.eventType || "Event"} • Received {timeAgo(quote.createdAt)}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Total Proposed Investment</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--gold-dark)" }}>
                          {formatINR(quote.totalAmount)}
                        </div>
                      </div>
                    </div>

                    {quote.items?.length > 0 && (
                      <div style={{ margin: "16px 0", background: "var(--neutral-50)", padding: 12, borderRadius: "var(--radius-md)" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                          Comprehensive Deliverables:
                        </div>
                        {quote.items.map((item, idx) => (
                          <div key={idx} className="flex-between" style={{ fontSize: "0.875rem", padding: "4px 0" }}>
                            <span>• {item.description} (x{item.quantity})</span>
                            <span style={{ fontWeight: 600 }}>{formatINR(item.total)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {quote.notes && (
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: 16 }}>
                        <strong>Professional Insight:</strong> {quote.notes}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      {quote.status === "SENT" || quote.status === "CHANGES_REQUESTED" ? (
                        <>
                          <button
                            onClick={() => handleQuoteAction(quote.id, "reject")}
                            className="btn btn-secondary btn-sm"
                            disabled={actionLoading}
                          >
                            Decline Proposal
                          </button>
                          <button
                            onClick={() => handleQuoteAction(quote.id, "request_changes")}
                            className="btn btn-secondary btn-sm"
                            disabled={actionLoading}
                          >
                            Request Changes
                          </button>
                          <button
                            onClick={() => handleQuoteAction(quote.id, "accept")}
                            className="btn btn-primary btn-sm"
                            disabled={actionLoading}
                          >
                            Authorize & Finalize Engagement 🎉
                          </button>
                        </>
                      ) : (
                        <span className="badge badge-success">✓ Engagement Finalized</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ENQUIRIES */}
        {activeTab === "enquiries" && (
          <div>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h2 className="heading-lg">Dispatched Inquiries</h2>
              <span className="text-muted">{enquiries.length} inquiries</span>
            </div>

            {enquiries.length === 0 ? (
              <div className="empty-state" style={{ background: "white", borderRadius: "var(--radius-lg)" }}>
                <div className="empty-state-icon">💬</div>
                <h3>No inquiries dispatched</h3>
                <p className="text-muted">Explore our curated network of Vadodara professionals and initiate inquiries.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Professional</th>
                      <th>Service & Event</th>
                      <th>Date</th>
                      <th>Budget</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((enq) => (
                      <tr key={enq.id}>
                        <td>
                          <strong>{enq.vendor?.businessName}</strong>
                        </td>
                        <td>
                          {enq.service} • {enq.eventType}
                        </td>
                        <td>{enq.eventDate}</td>
                        <td>{formatINR(enq.budget)}</td>
                        <td>
                          <span className={`status-badge status-${enq.status.toLowerCase()}`}>
                            {enq.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <Link href={`/vendors/${enq.vendorId}`} className="btn btn-ghost btn-sm">
                            View Professional →
                          </Link>
                        </td>
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
                <h3>No engagements finalized</h3>
                <p className="text-muted">Upon authorization of a professional proposal, the finalized engagement will be documented here.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {bookings.map((b) => (
                  <div key={b.id} className="card card-body">
                    <div className="flex-between flex-wrap gap-4">
                      <div>
                        <span className="badge badge-verified" style={{ marginBottom: 6 }}>✓ Finalized Engagement</span>
                        <h3 className="heading-md">{b.vendor?.businessName}</h3>
                        <div className="text-muted" style={{ fontSize: "0.8125rem", marginTop: 4 }}>
                          Booking ID: <code>{b.id.slice(0, 8).toUpperCase()}</code> • Event Date: {b.eventDate || "Upcoming"}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Authorized Capital Commitment</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--success)" }}>
                          {formatINR(b.bookingAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SHORTLIST */}
        {activeTab === "shortlist" && (
          <div>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h2 className="heading-lg">Curated Professionals</h2>
              <span className="text-muted">{favorites.length} saved</span>
            </div>

            {favorites.length === 0 ? (
              <div className="empty-state" style={{ background: "white", borderRadius: "var(--radius-lg)" }}>
                <div className="empty-state-icon">❤️</div>
                <h3>Your curation list is empty</h3>
                <p className="text-muted">Curate profiles of exceptional professionals during your exploration for subsequent comparative analysis.</p>
              </div>
            ) : (
              <div className="vendors-grid">
                {favorites.map((fav) => (
                  <div key={fav.id} className="card card-body">
                    <h3 className="heading-sm">{fav.vendor?.businessName}</h3>
                    <div className="text-muted" style={{ fontSize: "0.8125rem", margin: "4px 0 12px" }}>
                      📍 {fav.vendor?.area?.name || "Vadodara"} • Starting {formatINR(fav.vendor?.startingPrice)}
                    </div>
                    <Link href={`/vendors/${fav.vendorId}`} className="btn btn-primary btn-sm w-full">
                      View Profile & Enquire →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
