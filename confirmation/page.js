"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/ticket-orders/${encodeURIComponent(orderId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load booking.");
        const tickets = await Promise.all((data.order.tickets || []).map(async (ticket) => ({ ...ticket, qr: await QRCode.toDataURL(ticket.token, { width: 180, margin: 1 }) })));
        setOrder({ ...data.order, tickets });
      })
      .catch((confirmationError) => setError(confirmationError.message));
  }, [orderId]);

  if (error || !orderId) return <section className="section"><div className="container-sm"><div className="alert alert-error">{error || "Booking reference is missing."}</div><Link href="/events" className="btn btn-primary">Back to events</Link></div></section>;
  if (!order) return <div className="loading-state" style={{ minHeight: "70vh" }}><div className="spinner spinner-lg" /><p>Preparing your digital tickets...</p></div>;

  return (
    <section className="section confirmation-page">
      <div className="container-sm">
        <div className="confirmation-header"><span className="confirmation-check">✓</span><span className="section-tag">Booking confirmed</span><h1 className="heading-xl">You&apos;re on the list.</h1><p className="text-muted">Your payment was verified and your digital tickets are ready.</p></div>
        <div className="confirmation-summary"><h2 className="heading-lg">{order.event.name}</h2><p>{new Date(order.event.startsAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}</p><p>{order.event.venueName}, {order.event.venueAddress}</p><p className="confirmation-reference">Booking reference: {order.id}</p></div>
        <div className="digital-ticket-list">{order.tickets.map((ticket) => <article key={ticket.id} className="digital-ticket"><div><span className="section-tag">Digital ticket</span><h3>{ticket.attendeeName || "Attendee"}</h3><p className="text-muted">{ticket.attendeeEmail}</p><p className="ticket-token">{ticket.token}</p></div><img src={ticket.qr} alt={`QR code for ${ticket.attendeeName || "ticket"}`} width="180" height="180" /></article>)}</div>
        <div className="confirmation-actions"><Link href="/dashboard?tab=tickets" className="btn btn-primary">View my bookings</Link><Link href="/events" className="btn btn-secondary">Find another event</Link></div>
      </div>
    </section>
  );
}
