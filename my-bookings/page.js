"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyBookingsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(() => fetch("/api/ticket-orders").then(async (response) => {
    const data = await response.json();
    if (response.status === 401) return router.push("/auth/login?redirect=/my-bookings");
    if (!response.ok) throw new Error(data.error || "Unable to load bookings.");
    setOrders(data.orders || []);
  }), [router]);

  useEffect(() => { loadOrders().catch((loadError) => setError(loadError.message)).finally(() => setLoading(false)); }, [loadOrders]);

  const refund = async (orderId) => {
    if (!window.confirm("Cancel this booking and request a full refund?")) return;
    const response = await fetch(`/api/ticket-orders/${orderId}/refund`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Customer requested cancellation" }) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unable to cancel booking.");
    loadOrders().catch((loadError) => setError(loadError.message));
  };

  if (loading) return <div className="loading-state" style={{ minHeight: "70vh" }}><div className="spinner spinner-lg" /><p>Loading your bookings...</p></div>;
  return <section className="section my-bookings-page"><div className="container-lg"><div className="page-heading-row"><div><span className="section-tag">Your tickets</span><h1 className="heading-xl">My bookings</h1><p className="text-muted">Your upcoming event tickets and booking history.</p></div><Link href="/events" className="btn btn-primary">Find events</Link></div>{error && <div className="alert alert-error">{error}</div>}{orders.length === 0 ? <div className="empty-state"><h2>No ticket bookings yet</h2><p className="text-muted">Your confirmed event tickets will appear here.</p><Link href="/events" className="btn btn-primary">Browse events</Link></div> : <div className="booking-list">{orders.map((order) => <article key={order.id} className="booking-card"><div><span className={`badge ${order.status === "PAID" ? "badge-verified" : "badge-neutral"}`}>{order.status}</span><h2 className="heading-lg">{order.event.name}</h2><p className="text-muted">{new Date(order.event.startsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p><p className="text-muted">{order.event.venueName}, {order.event.venueAddress}</p><p className="booking-card-total">₹{order.totalAmount.toLocaleString("en-IN")} · {order.tickets.length} ticket(s)</p></div><div className="booking-card-actions">{order.status === "PAID" && <Link href={`/confirmation?orderId=${order.id}`} className="btn btn-secondary">View tickets</Link>}{order.status === "PAID" && new Date(order.event.startsAt) > new Date() && <button className="btn btn-ghost" onClick={() => refund(order.id)}>Cancel &amp; refund</button>}</div></article>)}</div>}</div></section>;
}