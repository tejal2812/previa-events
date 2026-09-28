"use client";
import Link from "next/link";
import { formatINR } from "../lib/utils";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { IconStar, IconMapPin, IconHeart, IconShieldCheck, IconArrowRight } from "./Icons";

export default function VendorCard({ vendor, onCompare, compareList = [] }) {
  const { data: session } = useSession();
  const [isFav, setIsFav] = useState(vendor.isFavorited || false);
  const [favLoading, setFavLoading] = useState(false);
  const inCompare = compareList.includes(vendor.id);

  const primaryCat = vendor.categories?.[0]?.category?.name || "Event Service";

  const toggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }
    setFavLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: isFav ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vendor.id }),
      });
      if (res.ok) setIsFav(!isFav);
    } catch {/* ignore */}
    setFavLoading(false);
  };

  return (
    <div className="vendor-card">
      <Link href={`/vendors/${vendor.id}`} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div className="vendor-card-image">
          <img
            src={vendor.coverImage || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=85"}
            alt={vendor.businessName}
            loading="lazy"
          />
          {vendor.isFeatured && (
            <div className="vendor-badge-featured">
              ⭐ Featured in Ahmedabad
            </div>
          )}
          <button
            className={`vendor-card-fav${isFav ? " active" : ""}`}
            onClick={toggleFav}
            disabled={favLoading}
            title={isFav ? "Saved to Shortlist" : "Save to Shortlist"}
            type="button"
          >
            <IconHeart size={18} filled={isFav} />
          </button>
        </div>

        <div className="vendor-card-body">
          <div className="flex-between" style={{ marginBottom: 4 }}>
            <span className="vendor-card-category">{primaryCat}</span>
            {vendor.isVerified && (
              <span className="badge badge-verified" style={{ padding: "2px 8px", fontSize: "0.7rem" }}>
                <IconShieldCheck size={12} /> Verified Pro
              </span>
            )}
          </div>

          <h3 className="vendor-card-name" title={vendor.businessName}>
            {vendor.businessName}
          </h3>

          <div className="vendor-card-location">
            <IconMapPin size={13} />
            <span>{vendor.area?.name ? `${vendor.area.name}, ` : ""}Ahmedabad</span>
          </div>

          <div className="vendor-card-rating">
            <div className="rating-badge">
              <IconStar size={11} fill={true} />
              <span>{vendor.rating?.toFixed(1) || "4.8"}</span>
            </div>
            <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
              ({vendor.reviewCount || 48} verified reviews)
            </span>
          </div>

          {vendor.description && (
            <p style={{ fontSize: "0.835rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 14, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {vendor.description}
            </p>
          )}

          <div className="vendor-card-price">
            <div>
              <div className="text-muted" style={{ fontSize: "0.725rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                Starting Package
              </div>
              <div className="amount">{formatINR(vendor.startingPrice)}</div>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              {vendor.responseTime || "Responds in 2h"}
            </span>
          </div>
        </div>
      </Link>

      <div className="vendor-card-footer">
        <Link href={`/vendors/${vendor.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
          View Details <IconArrowRight size={14} />
        </Link>
        {onCompare && (
          <button
            onClick={() => onCompare(vendor.id)}
            className={`btn btn-sm ${inCompare ? "btn-primary" : "btn-secondary"}`}
            title={inCompare ? "Remove from compare" : "Add to comparison"}
            disabled={!inCompare && compareList.length >= 3}
            type="button"
          >
            {inCompare ? "✓ Compared" : "Compare"}
          </button>
        )}
      </div>
    </div>
  );
}
