"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get("reservationId");
  const [reservation, setReservation] = useState(null);
  const [attendee, setAttendee] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reservationId) return;
    fetch(`/api/ticket-reservations?id=${encodeURIComponent(reservationId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load reservation.");
        setReservation(data.reservation);
      })
      .catch((checkoutError) => setError(checkoutError.message))
      .finally(() => setLoading(false));
  }, [reservationId]);

  const total = reservation?.items?.reduce((sum, item) => sum + item.quantity * item.ticketType.price, 0) || 0;

  const startPayment = async (event) => {
    event.preventDefault();
    if (!attendee.name.trim() || !attendee.email.trim()) {
      setError("Enter the attendee name and email to continue.");
      return;
    }
    setError("");
    setPaying(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const orderResponse = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, idempotencyKey }),
      });
      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.error || "Unable to start payment.");

      await loadRazorpay();
      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "PREVIA EVENTS",
        description: reservation.event.name,
        order_id: orderData.gatewayOrderId,
        prefill: { name: attendee.name, email: attendee.email },
        theme: { color: "#C5A059" },
        handler: async (response) => {
          const verifyResponse = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: orderData.order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              attendee,
            }),
          });
          const verifyData = await verifyResponse.json();
          if (!verifyResponse.ok) throw new Error(verifyData.error || "Payment verification failed.");
          router.push(`/confirmation?orderId=${verifyData.orderId}`);
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      razorpay.open();
    } catch (paymentError) {
      setError(paymentError.message);
      setPaying(false);
    }
  };

  if (loading) return <div className="loading-state" style={{ minHeight: "70vh" }}><div className="spinner spinner-lg" /><p>Loading your reservation...</p></div>;
  if (!reservationId) return <section className="section"><div className="container-sm"><div className="alert alert-error">This checkout link is missing a reservation.</div></div></section>;

  return (
    <section className="section checkout-page">
      <div className="container-sm">
        <div className="checkout-header">
          <span className="section-tag">Secure checkout</span>
          <h1 className="heading-xl">Complete your booking</h1>
          <p className="text-muted">Your tickets are held for a limited time. Enter the attendee details before paying.</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {reservation && (
          <div className="checkout-shell">
            <div className="checkout-event-summary">
              <div><span className="section-tag">Your reservation</span><h2 className="heading-lg">{reservation.event.name}</h2><p className="text-muted">{reservation.event.venueName}, {reservation.event.venueAddress}</p><p className="text-muted">{reservation.event.city}, {reservation.event.state || "Gujarat"}</p></div>
              <span className="badge badge-gold">Held until {new Date(reservation.expiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="checkout-items">
              {reservation.items.map((item) => <div key={item.id} className="checkout-item"><span>{item.ticketType.name} × {item.quantity}</span><strong>₹{(item.quantity * item.ticketType.price).toLocaleString("en-IN")}</strong></div>)}
              <div className="checkout-total"><span>Total</span><strong>₹{total.toLocaleString("en-IN")}</strong></div>
            </div>
            <form onSubmit={startPayment} className="checkout-form">
              <h2 className="heading-lg">Attendee details</h2>
              <div className="form-group"><label className="form-label" htmlFor="attendee-name">Full name</label><input id="attendee-name" className="form-input" value={attendee.name} onChange={(event) => setAttendee({ ...attendee, name: event.target.value })} required /></div>
              <div className="form-group"><label className="form-label" htmlFor="attendee-email">Email for tickets</label><input id="attendee-email" type="email" className="form-input" value={attendee.email} onChange={(event) => setAttendee({ ...attendee, email: event.target.value })} required /></div>
              <button className="btn btn-primary btn-lg w-full" disabled={paying}>{paying ? "Opening secure payment..." : `Pay ₹${total.toLocaleString("en-IN")}`}</button>
              <p className="form-hint checkout-secure-note">Payments are processed securely by Razorpay. Your booking is confirmed only after signature verification.</p>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
