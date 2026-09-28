"use client";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatINR, EVENT_TYPES, ALL_SERVICES, suggestBudgetAllocation } from "../../lib/utils";
import { LAUNCH_CITY, LAUNCH_STATE, LAUNCH_AREAS } from "../../lib/locations";

function PlanWizardContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Wizard state
  const initialType = searchParams.get("type") || "Wedding";
  const [eventType, setEventType] = useState(initialType);
  const [city, setCity] = useState(LAUNCH_CITY);
  const [area, setArea] = useState(LAUNCH_AREAS[0]);
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState(300);
  const [totalBudget, setTotalBudget] = useState(600000);
  const [customBudget, setCustomBudget] = useState("");
  const [customBudgetOpen, setCustomBudgetOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState([
    "Venue", "Catering", "Photography", "Decoration", "DJ", "Makeup"
  ]);
  const [budgetAllocations, setBudgetAllocations] = useState({});

  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then((d) => setCities(d.cities || []))
      .catch(() => {});
  }, []);

  // Recalculate allocations when entering Step 7 or changing budget/services
  useEffect(() => {
    const suggested = suggestBudgetAllocation(eventType, totalBudget, selectedServices);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBudgetAllocations(suggested);
  }, [eventType, totalBudget, selectedServices]);

  const toggleService = (svc) => {
    setSelectedServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
  };

  const handleAllocationChange = (svc, amount) => {
    setBudgetAllocations((prev) => ({
      ...prev,
      [svc]: Math.max(0, parseInt(amount) || 0),
    }));
  };

  const selectBudget = (amount) => {
    setTotalBudget(amount);
    setCustomBudget("");
    setCustomBudgetOpen(false);
  };

  const handleCustomBudgetChange = (value) => {
    const digitsOnly = value.replace(/\D/g, "");
    setCustomBudgetOpen(true);
    setCustomBudget(digitsOnly);
    if (digitsOnly) setTotalBudget(Number(digitsOnly));
  };

  const totalAllocated = Object.values(budgetAllocations).reduce((a, b) => a + b, 0);
  const remainingBudget = totalBudget - totalAllocated;

  const handleSaveEvent = async () => {
    if (!session) {
      // Save to localStorage for resume after login
      localStorage.setItem(
        "eventora_draft_event",
        JSON.stringify({
          eventType,
          city,
          area,
          eventDate,
          guestCount,
          totalBudget,
          services: Object.entries(budgetAllocations).map(([name, budget]) => ({ name, budget })),
        })
      );
      router.push("/auth/signup?redirect=/dashboard");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          city,
          area,
          eventDate,
          guestCount,
          totalBudget,
          services: Object.entries(budgetAllocations).map(([name, budget]) => ({ name, budget })),
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to save event");
      }
    } catch {
      alert("Something went wrong");
    }
    setLoading(false);
  };

  const steps = [
    { num: 1, title: "Event Type" },
    { num: 2, title: "Location" },
    { num: 3, title: "Date" },
    { num: 4, title: "Guests" },
    { num: 5, title: "Budget" },
    { num: 6, title: "Services" },
    { num: 7, title: "Budget Plan" },
  ];

  return (
    <div className="section" style={{ minHeight: "85vh", background: "var(--bg-secondary)" }}>
      <div className="container-sm">
        {/* Wizard Progress Bar */}
        <div style={{ marginBottom: 32 }}>
          <div className="wizard-steps">
            {steps.map((s, idx) => (
              <div
                key={s.num}
                className={`wizard-step ${currentStep === s.num ? "active" : currentStep > s.num ? "done" : ""}`}
              >
                <div className="wizard-step-circle">
                  {currentStep > s.num ? "✓" : s.num}
                </div>
                {idx < steps.length - 1 && <div className="wizard-step-line" />}
              </div>
            ))}
          </div>
          <div className="text-center" style={{ marginTop: 8 }}>
            <span className="text-muted" style={{ fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Step {currentStep} of 7 — {steps[currentStep - 1].title}
            </span>
          </div>
        </div>

        {/* Wizard Card Form */}
        <div className="card card-body" style={{ boxShadow: "var(--shadow-lg)", padding: "36px 32px" }}>
          {/* STEP 1: EVENT TYPE */}
          {currentStep === 1 && (
            <div>
              <h2 className="heading-lg" style={{ marginBottom: 8 }}>Select Your Event Category</h2>
              <p className="text-muted" style={{ marginBottom: 24 }}>Define the occasion to receive highly curated vendor portfolios.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setEventType(t.value)}
                    style={{
                      padding: "20px 14px",
                      borderRadius: "var(--radius-lg)",
                      border: `2px solid ${eventType === t.value ? "var(--gold)" : "var(--border-light)"}`,
                      background: eventType === t.value ? "var(--gold-muted)" : "white",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>{t.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>{t.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION */}
          {currentStep === 2 && (
            <div>
              <h2 className="heading-lg" style={{ marginBottom: 8 }}>Specify Event Location</h2>
              <p className="text-muted" style={{ marginBottom: 24 }}>Indicate the city and locality within Vadodara for your celebration.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <select className="form-input form-select" value={city} onChange={(e) => setCity(e.target.value)}>
                    <option value={LAUNCH_CITY}>{LAUNCH_CITY} ({LAUNCH_STATE})</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Area / Locality</label>
                  <select className="form-input form-select" value={area} onChange={(e) => setArea(e.target.value)}>
                    {LAUNCH_AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DATE */}
          {currentStep === 3 && (
            <div>
              <h2 className="heading-lg" style={{ marginBottom: 8 }}>Select Event Date</h2>
              <p className="text-muted" style={{ marginBottom: 24 }}>This ensures we match you exclusively with professionals available on your chosen date.</p>

              <div className="form-group">
                <label className="form-label">Event Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={eventDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setEventDate(e.target.value)}
                  style={{ fontSize: "1.125rem", padding: "16px" }}
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 4: GUEST COUNT */}
          {currentStep === 4 && (
            <div>
              <h2 className="heading-lg" style={{ marginBottom: 8 }}>Estimate Guest Attendance</h2>
              <p className="text-muted" style={{ marginBottom: 24 }}>Crucial for accurately sizing venues and formulating precise catering proposals.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", fontWeight: 700, color: "var(--gold-dark)" }}>
                    {guestCount}
                  </span>
                  <span className="text-muted" style={{ display: "block", fontSize: "1rem" }}>Estimated Guests</span>
                </div>

                <input
                  type="range"
                  min="20"
                  max="2000"
                  step="20"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value))}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  {[50, 150, 300, 500, 1000].map((count) => (
                    <button
                      key={count}
                      type="button"
                      className={`btn btn-sm ${guestCount === count ? "btn-dark" : "btn-secondary"}`}
                      onClick={() => setGuestCount(count)}
                    >
                      {count} guests
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: TOTAL BUDGET */}
          {currentStep === 5 && (
            <div>
              <h2 className="heading-lg" style={{ marginBottom: 8 }}>Define Your Financial Parameters</h2>
              <p className="text-muted" style={{ marginBottom: 24 }}>Our proprietary algorithm will intelligently distribute this across your chosen services.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", fontWeight: 700, color: "var(--gold-dark)" }}>
                    {formatINR(totalBudget)}
                  </span>
                  <span className="text-muted" style={{ display: "block", fontSize: "1rem" }}>Total Planned Budget</span>
                </div>

                <input
                  type="range"
                  min="50000"
                  max="5000000"
                  step="25000"
                  value={totalBudget}
                  onChange={(e) => selectBudget(parseInt(e.target.value))}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  {[
                    { label: "₹2 Lakhs", val: 200000 },
                    { label: "₹5 Lakhs", val: 500000 },
                    { label: "₹10 Lakhs", val: 1000000 },
                    { label: "₹25 Lakhs", val: 2500000 },
                    { label: "₹50 Lakhs", val: 5000000 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      className={`btn btn-sm ${totalBudget === preset.val ? "btn-dark" : "btn-secondary"}`}
                      onClick={() => selectBudget(preset.val)}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`btn btn-sm ${customBudgetOpen ? "btn-dark" : "btn-secondary"}`}
                    onClick={() => setCustomBudgetOpen(true)}
                  >
                    + Custom Budget
                  </button>
                </div>

                {customBudgetOpen && (
                  <div className="custom-budget-field">
                    <div>
                      <label htmlFor="custom-budget">Enter your custom budget</label>
                      <p>Add the exact total amount you want to spend.</p>
                    </div>
                    <div className="custom-budget-input-wrap">
                      <span aria-hidden="true">₹</span>
                      <input
                        id="custom-budget"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="e.g. 7,50,000"
                        value={customBudget ? Number(customBudget).toLocaleString("en-IN") : ""}
                        onChange={(e) => handleCustomBudgetChange(e.target.value)}
                        aria-label="Custom total budget in rupees"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: SERVICES */}
          {currentStep === 6 && (
            <div>
              <h2 className="heading-lg" style={{ marginBottom: 8 }}>Curate Your Required Services</h2>
              <p className="text-muted" style={{ marginBottom: 24 }}>Select the distinct professional services necessary to execute your {eventType} flawlessly.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                {ALL_SERVICES.map((svc) => {
                  const isSelected = selectedServices.includes(svc);
                  return (
                    <button
                      key={svc}
                      type="button"
                      onClick={() => toggleService(svc)}
                      style={{
                        padding: "16px 12px",
                        borderRadius: "var(--radius-lg)",
                        border: `2px solid ${isSelected ? "var(--gold)" : "var(--border-light)"}`,
                        background: isSelected ? "var(--gold-muted)" : "white",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: "1.25rem" }}>{isSelected ? "✅" : "➕"}</span>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{svc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: BUDGET PLAN GENERATION */}
          {currentStep === 7 && (
            <div>
              <div className="flex-between flex-wrap gap-2" style={{ marginBottom: 12 }}>
                <div>
                  <h2 className="heading-lg">Your Bespoke Event Financial Architecture</h2>
                  <p className="text-muted" style={{ fontSize: "0.875rem" }}>
                    A meticulous baseline derived from premium {eventType} benchmarks in Vadodara. Please adjust allocations as desired.
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="text-muted" style={{ fontSize: "0.8125rem" }}>Total Budget</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--gold-dark)" }}>
                    {formatINR(totalBudget)}
                  </div>
                </div>
              </div>

              {/* Allocation List */}
              <div style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)", overflow: "hidden", margin: "20px 0" }}>
                {Object.entries(budgetAllocations).map(([service, amount]) => {
                  const pct = Math.round((amount / totalBudget) * 100);
                  return (
                    <div key={service} className="budget-item">
                      <div className="budget-item-name">{service}</div>
                      <div className="budget-item-bar">
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>{pct}% of budget</span>
                      </div>
                      <div className="budget-item-amount">
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => handleAllocationChange(service, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Remaining calculation banner */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "var(--radius-md)",
                  background: remainingBudget >= 0 ? "var(--success-bg)" : "var(--error-bg)",
                  color: remainingBudget >= 0 ? "var(--success)" : "var(--error)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontWeight: 700,
                }}
              >
                <span>{remainingBudget >= 0 ? "✓ Unallocated Contingency Reserve:" : "⚠️ Deficit/Over-Allocated:"}</span>
                <span style={{ fontSize: "1.25rem" }}>{formatINR(Math.abs(remainingBudget))}</span>
              </div>
            </div>
          )}

          {/* Wizard Navigation Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, borderTop: "1px solid var(--border-light)", paddingTop: 24 }}>
            {currentStep > 1 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 7 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (currentStep === 3 && !eventDate) {
                    alert("Please pick an event date.");
                    return;
                  }
                  if (currentStep === 5 && totalBudget < 50000) {
                    alert("Please enter a budget of at least ₹50,000.");
                    return;
                  }
                  if (currentStep === 6 && selectedServices.length === 0) {
                    alert("Please pick at least one service.");
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleSaveEvent}
                disabled={loading}
              >
                {loading ? <><span className="spinner spinner-sm" /> Saving...</> : "Save Event & Discover Vendors ✨"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanWizardPage() {
  return (
    <Suspense fallback={<div className="loading-state"><div className="spinner spinner-lg" /></div>}>
      <PlanWizardContent />
    </Suspense>
  );
}
