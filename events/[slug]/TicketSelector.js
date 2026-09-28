"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TicketSelector({ eventId, tickets }) {
  const router = useRouter();
  const [quantities, setQuantities] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const total = tickets.reduce((sum, ticket) => sum + (quantities[ticket.id] || 0) * ticket.price, 0);

  const updateQuantity = (ticket, value) => {
    const quantity = Math.max(0, Math.min(ticket.maximumQuantity, Number(value) || 0));
    setQuantities((current) => ({ ...current, [ticket.id]: quantity }));
  };

  const reserveTickets = async () => {
    setError("");
    const items = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));
    if (items.length === 0) {
      setError("Choose at least one ticket to continue.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ticket-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, items, idempotencyKey: crypto.randomUUID() }),
      });
      const data = await response.json();
      if (response.status === 401) {
        router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!response.ok) throw new Error(data.error || "Unable to reserve tickets.");
      router.push(`/checkout?reservationId=${data.reservation.id}`);
    } catch (reservationError) {
      setError(reservationError.message);
      setLoading(false);
    }
  };

  return (
    <div className="ticket-selector">
      <div className="event-ticket-list">
        {tickets.map((ticket) => {
          const soldOut = ticket.availableQuantity < ticket.minimumQuantity;
          const quantity = quantities[ticket.id] || 0;
          return (
            <div key={ticket.id} className="event-ticket-row">
              <div>
                <strong>{ticket.name}</strong>
                <p className="text-muted">{ticket.description || "General admission"}</p>
                <small>{soldOut ? "Sold out" : `${ticket.availableQuantity} remaining`}</small>
              </div>
              <div className="event-ticket-action">
                <strong>₹{ticket.price.toLocaleString("en-IN")}</strong>
                <label className="ticket-quantity-label">
                  <span className="sr-only">Quantity for {ticket.name}</span>
                  <select value={quantity} disabled={soldOut} onChange={(event) => updateQuantity(ticket, event.target.value)} className="form-select ticket-quantity">
                    <option value="0">0</option>
                    {Array.from({ length: Math.min(ticket.maximumQuantity, ticket.availableQuantity) }, (_, index) => index + 1)
                      .filter((value) => value >= ticket.minimumQuantity)
                      .map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="alert alert-error ticket-selector-error">{error}</p>}
      <div className="ticket-selector-summary">
        <div><span className="text-muted">Total</span><strong>₹{total.toLocaleString("en-IN")}</strong></div>
        <button type="button" className="btn btn-primary btn-lg" onClick={reserveTickets} disabled={loading}>
          {loading ? "Holding tickets..." : "Continue to checkout"}
        </button>
      </div>
      <p className="text-muted event-detail-note">Tickets are held for 10 minutes while you complete checkout.</p>
    </div>
  );
}