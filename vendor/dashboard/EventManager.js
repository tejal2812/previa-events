"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LAUNCH_CITY, LAUNCH_STATE } from "../../../lib/locations";

const blankEvent = { name: "", description: "", venueName: "", venueAddress: "", city: LAUNCH_CITY, state: LAUNCH_STATE, startsAt: "", endsAt: "", coverImage: "", ticketName: "General Admission", price: 0, quantity: 50 };

export default function EventManager() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(blankEvent);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadEvents = () => fetch("/api/vendor/events").then((response) => response.json()).then((data) => setEvents(data.events || []));
  useEffect(() => { loadEvents(); }, []);

  const createEvent = async (event) => {
    event.preventDefault();
    setSaving(true); setError("");
    const response = await fetch("/api/published-events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ticketTypes: [{ name: form.ticketName, price: Number(form.price), quantity: Number(form.quantity), minimumQuantity: 1, maximumQuantity: 10 }] }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Unable to create event.");
    else { setForm(blankEvent); setOpen(false); loadEvents(); }
    setSaving(false);
  };

  const updateStatus = async (slug, status) => {
    const response = await fetch(`/api/published-events/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) loadEvents();
    else { const data = await response.json(); setError(data.error || "Unable to update event."); }
  };

  return <div className="vendor-events-manager"><div className="flex-between flex-wrap gap-4" style={{ marginBottom: 20 }}><div><h2 className="heading-lg">Ticketed events</h2><p className="text-muted">Create events, manage inventory, and publish when the details are ready.</p></div><button className="btn btn-primary" onClick={() => setOpen(!open)}>{open ? "Close form" : "Create event"}</button></div>{error && <div className="alert alert-error">{error}</div>}{open && <form className="card card-body vendor-event-form" onSubmit={createEvent}><h3 className="heading-md">New event</h3><div className="form-group"><label className="form-label">Event name</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div><div className="form-group"><label className="form-label">Description</label><textarea className="form-input form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div><div className="vendor-event-grid"><div className="form-group"><label className="form-label">Venue</label><input className="form-input" value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} required /></div><div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.venueAddress} onChange={(e) => setForm({ ...form, venueAddress: e.target.value })} required /></div><div className="form-group"><label className="form-label">City</label><input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div><div className="form-group"><label className="form-label">Cover image URL</label><input className="form-input" type="url" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} /></div><div className="form-group"><label className="form-label">Starts</label><input className="form-input" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required /></div><div className="form-group"><label className="form-label">Ends</label><input className="form-input" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required /></div><div className="form-group"><label className="form-label">Ticket name</label><input className="form-input" value={form.ticketName} onChange={(e) => setForm({ ...form, ticketName: e.target.value })} required /></div><div className="form-group"><label className="form-label">Ticket price (₹)</label><input className="form-input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div><div className="form-group"><label className="form-label">Inventory</label><input className="form-input" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></div></div><button className="btn btn-primary" disabled={saving}>{saving ? "Creating..." : "Save as draft"}</button></form>}<div className="vendor-event-list">{events.length === 0 ? <div className="empty-state"><h3>No events yet</h3><p className="text-muted">Create your first ticketed event to start selling.</p></div> : events.map((event) => <article className="card card-body vendor-event-row" key={event.id}><div><span className={`badge ${event.status === "PUBLISHED" ? "badge-verified" : "badge-neutral"}`}>{event.status}</span><h3 className="heading-md">{event.name}</h3><p className="text-muted">{new Date(event.startsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {event.venueName}, {event.city}</p><p className="text-muted">{event.ticketTypes.reduce((sum, ticket) => sum + ticket.soldQuantity, 0)} sold · {event.ticketTypes.reduce((sum, ticket) => sum + ticket.availableQuantity, 0)} available</p></div><div className="vendor-event-actions">{event.status === "DRAFT" && <button className="btn btn-primary btn-sm" onClick={() => updateStatus(event.slug, "PUBLISHED")}>Publish</button>}{event.status === "PUBLISHED" && <Link href={`/events/${event.slug}`} className="btn btn-secondary btn-sm">View event</Link>}{event.status === "PUBLISHED" && <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(event.slug, "CANCELLED")}>Cancel event</button>}</div></article>)}</div></div>;
}