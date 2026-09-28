import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import TicketSelector from "./TicketSelector";
import { LAUNCH_CITY } from "../../../lib/locations";

async function getEvent(slug) {
  return prisma.publishedEvent.findFirst({
    where: { slug, status: "PUBLISHED", city: { equals: LAUNCH_CITY, mode: "insensitive" } },
    include: {
      organizer: { select: { name: true } },
      category: { select: { name: true } },
      images: { orderBy: { sortOrder: "asc" } },
      ticketTypes: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  return event ? { title: event.name, description: event.description.slice(0, 160), openGraph: { title: event.name, description: event.description.slice(0, 160), images: event.coverImage ? [event.coverImage] : [] } } : { title: "Event not found" };
}

export default async function EventDetailsPage({ params }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  return (
    <section className="section event-detail-page">
      <div className="container-lg">
        <Link href="/events" className="back-link">← All events</Link>
        <div className="event-detail-shell">
          {event.coverImage && <img className="event-detail-hero" src={event.coverImage} alt={event.name} />}
          <div className="event-detail-content">
            <span className="section-tag">{event.category?.name || "Event"}</span>
            <h1 className="heading-xl event-detail-title">{event.name}</h1>
            <p className="text-muted">Organized by {event.organizer.name}</p>
            <div className="event-detail-facts">
              <div><strong>Date & time</strong><br />{new Date(event.startsAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}</div>
              <div><strong>Venue</strong><br />{event.venueName}<br />{event.venueAddress}, {event.city}</div>
            </div>
            <p className="event-description">{event.description}</p>

            <h2 className="heading-lg event-ticket-heading">Choose your ticket</h2>
            <TicketSelector eventId={event.id} tickets={event.ticketTypes} />
          </div>
        </div>
      </div>
    </section>
  );
}
