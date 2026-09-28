"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import VendorCard from "../../components/VendorCard";
import { LAUNCH_CITY } from "../../lib/locations";

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const initialCategory = searchParams.get("category") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialCity = searchParams.get("city") || LAUNCH_CITY;

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(250000);
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Compare list state
  const [compareList, setCompareList] = useState([]);

  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setCities(d.cities || []);
      })
      .catch(() => {});
  }, []);

  const fetchVendors = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
    if (search) params.append("search", search);
    if (selectedCity) params.append("city", selectedCity);
    if (verifiedOnly) params.append("verified", "true");
    if (maxPrice < 250000) params.append("maxPrice", maxPrice.toString());
    if (minRating > 0) params.append("minRating", minRating.toString());
    params.append("page", page.toString());
    params.append("limit", "12");

    fetch(`/api/vendors?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setVendors(data.vendors || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVendors();
  }, [selectedCategory, selectedCity, verifiedOnly, maxPrice, minRating, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchVendors();
  };

  const handleCompareToggle = (id) => {
    setCompareList((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        alert("A maximum of 3 professionals can be evaluated concurrently.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setSearch("");
    setVerifiedOnly(false);
    setMaxPrice(250000);
    setMinRating(0);
    setPage(1);
  };

  return (
    <div className="section" style={{ minHeight: "80vh", background: "var(--bg-secondary)" }}>
      <div className="container-lg">
        {/* Top Header */}
        <div style={{ marginBottom: 32 }}>
          <div className="flex-between flex-wrap gap-4" style={{ alignItems: "flex-end" }}>
            <div>
              <span className="section-tag">The Eventora Marketplace</span>
              <h1 className="heading-xl" style={{ marginTop: 8 }}>
                {selectedCategory ? `${categories.find((c) => c.slug === selectedCategory)?.name || "Professionals"} in ${LAUNCH_CITY}` : `Discover ${LAUNCH_CITY}'s Event Professionals`}
              </h1>
              <p className="text-muted" style={{ marginTop: 4 }}>
                Presenting <strong>{total}</strong> meticulously verified service providers
              </p>
            </div>

            {/* Quick compare bar float */}
            {compareList.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--neutral-900)", color: "white", padding: "8px 16px", borderRadius: "var(--radius-full)", boxShadow: "var(--shadow-lg)" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{compareList.length} Portfolios Selected</span>
                <button
                  onClick={() => router.push(`/compare?ids=${compareList.join(",")}`)}
                  className="btn btn-primary btn-sm"
                >
                  Evaluate Portfolios →
                </button>
                <button
                  onClick={() => setCompareList([])}
                  style={{ color: "var(--neutral-400)", fontSize: "0.8rem", cursor: "pointer" }}
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Search bar row */}
          <form onSubmit={handleSearchSubmit} style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by professional name, expertise, or specific service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 42 }}
              />
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>🔍</span>
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: "inline-flex", gap: 8 }}
            >
              <span>⚙️ Filters</span>
            </button>
          </form>
        </div>

        {/* Main Grid with Sidebar */}
        <div className="marketplace-layout">
          {/* Sidebar */}
          <aside className={`filter-sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <h3 className="heading-sm">Refine Search</h3>
              <button onClick={resetFilters} style={{ fontSize: "0.8125rem", color: "var(--gold-dark)", fontWeight: 600 }}>
                Clear Criteria
              </button>
            </div>

            {/* City */}
            <div className="filter-section">
              <div className="filter-title">City</div>
              <select
                className="form-input form-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="">All cities</option>
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}, {c.state}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="filter-section">
              <div className="filter-title">Category</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 220, overflowY: "auto" }}>
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={!selectedCategory}
                    onChange={() => setSelectedCategory("")}
                  />
                  <span>All Categories</span>
                </label>
                {categories.map((cat) => (
                  <label key={cat.id} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedCategory === cat.slug}
                      onChange={() => setSelectedCategory(selectedCategory === cat.slug ? "" : cat.slug)}
                    />
                    <span>{cat.icon} {cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Verified only */}
            <div className="filter-section">
              <label className="filter-option" style={{ fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                />
                <span>✓ Exclusively Show Verified Professionals</span>
              </label>
            </div>

            {/* Price Range */}
            <div className="filter-section">
              <div className="filter-title">
                <span>Maximum Financial Parameter</span>
                <span style={{ color: "var(--gold-dark)" }}>₹{maxPrice.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="250000"
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              />
              <div className="flex-between text-muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
                <span>₹5,000</span>
                <span>₹2,50,000+</span>
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="filter-section">
              <div className="filter-title">Rating</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Any Rating", val: 0 },
                  { label: "4.5★ & above", val: 4.5 },
                  { label: "4.0★ & above", val: 4.0 },
                  { label: "3.5★ & above", val: 3.5 },
                ].map((r) => (
                  <label key={r.val} className="filter-option">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === r.val}
                      onChange={() => setMinRating(r.val)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Vendors Feed */}
          <div>
            {loading ? (
              <div className="loading-state">
                <div className="spinner spinner-lg" />
                <p>Curating Ahmedabad&apos;s finest event professionals...</p>
              </div>
            ) : vendors.length === 0 ? (
              <div className="empty-state" style={{ background: "var(--white)", borderRadius: "var(--radius-lg)" }}>
                <div className="empty-state-icon">🔍</div>
                <h3>No professionals align with these exact parameters</h3>
                <p className="text-muted">We recommend broadening your search criteria or adjusting financial constraints.</p>
                <button onClick={resetFilters} className="btn btn-secondary btn-sm" style={{ marginTop: 16 }}>
                  Clear Refinements
                </button>
              </div>
            ) : (
              <>
                <div className="vendors-grid">
                  {vendors.map((vendor) => (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor}
                      onCompare={handleCompareToggle}
                      compareList={compareList}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      ←
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`page-btn ${p === page ? "active" : ""}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      className="page-btn"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="loading-state"><div className="spinner spinner-lg" /></div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
