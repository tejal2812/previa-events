"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const statusLabels = { PENDING: "Pending", UNDER_REVIEW: "Under review", VERIFIED: "Verified", REJECTED: "Rejected", SUSPENDED: "Suspended" };

export default function VendorVerificationPage() {
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVendors = async () => {
    const response = await fetch("/api/admin/vendors");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load vendors.");
    setVendors(data.vendors || []);
  };

  // The initial fetch synchronizes this page with the protected admin API.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadVendors().catch((loadError) => setError(loadError.message)).finally(() => setLoading(false)); }, []);

  const openVendor = async (vendor) => {
    setError("");
    const response = await fetch(`/api/admin/vendors/${vendor.id}/verification`);
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unable to load verification details.");
    setSelected(data.vendor);
    setReason(data.vendor.verificationReason || "");
  };

  const updateVerification = async (action) => {
    if (["REJECTED", "SUSPENDED", "REQUEST_INFORMATION"].includes(action) && !reason.trim()) return setError("Add a reason before continuing.");
    const response = await fetch(`/api/admin/vendors/${selected.id}/verification`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unable to update verification.");
    setSelected({ ...selected, ...data.vendor });
    await loadVendors();
  };

  if (loading) return <div className="loading-state" style={{ minHeight: "70vh" }}><div className="spinner spinner-lg" /><p>Loading verification queue...</p></div>;
  return <section className="section admin-vendors-page"><div className="container-lg"><div className="page-heading-row"><div><span className="section-tag">PREVIA trust &amp; safety</span><h1 className="heading-xl">Vendor verification</h1><p className="text-muted">Review identity and business documents separately from quality and reputation reviews.</p></div><Link href="/admin/dashboard" className="btn btn-secondary">Back to dashboard</Link></div>{error && <div className="alert alert-error">{error}</div>}<div className="admin-verification-layout"><div className="admin-vendor-queue">{vendors.map((vendor) => <button key={vendor.id} className={`admin-vendor-queue-item ${selected?.id === vendor.id ? "active" : ""}`} onClick={() => openVendor(vendor)}><span><strong>{vendor.businessName}</strong><small>{vendor.city?.name || "Location pending"} · {vendor.user?.email}</small></span><span className={`badge ${vendor.verificationStatus === "VERIFIED" ? "badge-verified" : vendor.verificationStatus === "REJECTED" || vendor.verificationStatus === "SUSPENDED" ? "badge-pending" : "badge-neutral"}`}>{statusLabels[vendor.verificationStatus] || "Pending"}</span></button>)}{vendors.length === 0 && <div className="empty-state"><h3>No vendor applications</h3><p className="text-muted">New applications will appear here.</p></div>}</div>{selected ? <div className="card card-body admin-verification-detail"><div className="flex-between flex-wrap gap-4"><div><span className="section-tag">Application</span><h2 className="heading-lg">{selected.businessName}</h2><p className="text-muted">{selected.user?.name} · {selected.user?.email} · {selected.user?.phone}</p></div><span className="badge badge-gold">{statusLabels[selected.verificationStatus]}</span></div><div className="admin-detail-grid"><div><strong>Services</strong><p>{selected.categories?.map((item) => item.category.name).join(", ") || "Not provided"}</p></div><div><strong>Location</strong><p>{selected.area?.name ? `${selected.area.name}, ` : ""}{selected.city?.name || "Not provided"}</p></div><div><strong>Experience</strong><p>{selected.experienceYears || "Not provided"} years</p></div><div><strong>Starting price</strong><p>{selected.startingPrice ? `₹${selected.startingPrice.toLocaleString("en-IN")}` : "Not provided"}</p></div></div><div className="admin-sensitive-notice">Sensitive information is visible only to authorized administrators. Do not copy PAN, bank, or identity details into public notes.</div><h3 className="heading-md" style={{ marginTop: 24 }}>Submitted documents</h3><div className="admin-document-list">{(selected.documents || []).map((document) => <a key={document.id} href={document.signedUrl || "#"} target="_blank" rel="noreferrer" className="admin-document-item"><span><strong>{document.documentType}</strong><small>{document.originalName} · {Math.ceil(document.sizeBytes / 1024)} KB</small></span><span>{document.signedUrl ? "Open securely ↗" : "Unavailable"}</span></a>)}{!selected.documents?.length && <p className="text-muted">No documents submitted.</p>}</div><h3 className="heading-md" style={{ marginTop: 24 }}>Decision note</h3><textarea className="form-input form-textarea" rows={3} placeholder="Required for rejection, suspension, or additional information." value={reason} onChange={(event) => setReason(event.target.value)} /><div className="admin-verification-actions"><button className="btn btn-secondary" onClick={() => updateVerification("UNDER_REVIEW")}>Mark under review</button><button className="btn btn-secondary" onClick={() => updateVerification("REQUEST_INFORMATION")}>Request information</button><button className="btn btn-primary" onClick={() => updateVerification("VERIFIED")}>Approve verification</button><button className="btn btn-ghost" onClick={() => updateVerification("REJECTED")}>Reject</button><button className="btn btn-ghost" onClick={() => updateVerification("SUSPENDED")}>Suspend</button></div><h3 className="heading-md" style={{ marginTop: 24 }}>Verification history</h3><div className="admin-audit-list">{(selected.verificationAudits || []).map((audit) => <div key={audit.id}><strong>{audit.action}</strong><span>{audit.admin?.name || audit.admin?.email} · {new Date(audit.createdAt).toLocaleString("en-IN")}</span>{audit.reason && <p>{audit.reason}</p>}</div>)}{!selected.verificationAudits?.length && <p className="text-muted">No decisions recorded yet.</p>}</div></div> : <div className="empty-state admin-verification-empty"><h2>Select a vendor application</h2><p className="text-muted">Review documents and record a decision securely.</p></div>}</div></div></section>;
}