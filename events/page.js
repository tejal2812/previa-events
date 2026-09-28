import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { LAUNCH_CITY } from "../../lib/locations";

export const metadata = {
  title: "Vadodara Events",
  description: "Discover and book upcoming events in Vadodara with PREVIA EVENTS.",
};

export default async function EventsPage({ searchParams }) {
  const params = await searchParams;
  const search = typeof params?.search === "string" ? params.search.trim() : "";
  const city = LAUNCH_CITY;
  const events = await prisma.publishedEvent.findMany({
    where: {
      status: "PUBLISHED",
      startsAt: { gte: new Date() },
      city: { equals: LAUNCH_CITY, mode: "insensitive" },
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { venueName: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    select: {
      slug: true,
      name: true,
      description: true,
      coverImage: true,
      venueName: true,
      city: true,
      startsAt: true,
      ticketTypes: { select: { price: true }, orderBy: { price: "asc" }, take: 1 },
    },
    orderBy: { startsAt: "asc" },
    take: 24,
  });

  return (
    <section className="section events-page">
      <div className="container-lg">
        <div className="events-page-intro">
          <span className="section-tag">PREVIA EVENTS</span>
          <h1 className="heading-xl">Find your next Vadodara experience</h1>
          <p className="text-muted">Browse upcoming events in Vadodara and reserve tickets directly from verified organizers.</p>
        </div>

        <form method="get" className="events-search">
          <label className="sr-only" htmlFor="event-search">Search events or venues</label>
          <input id="event-search" name="search" defaultValue={search} className="form-input" placeholder="Search events or venues" />
          <label className="sr-only" htmlFor="event-city">Filter by city</label>
          <select id="event-city" name="city" defaultValue={LAUNCH_CITY} className="form-input form-select" aria-label="Event city">
            <option value={LAUNCH_CITY}>{LAUNCH_CITY}, Gujarat</option>
          </select>
          <button className="btn btn-primary" type="submit">Search events</button>
        </form>

        {events.length === 0 ? (
          <div className="empty-state" style={{ background: "white" }}>
            <h2>No upcoming events yet</h2>
            <p className="text-muted">Organizer events will appear here once approved and published.</p>
          </div>
        ) : (
          <div className="event-grid">
            {events.map((event) => (
              <Link key={event.slug} href={`/events/${event.slug}`} className="event-card">
                <div className="event-card-media">
                  {event.coverImage ? <img src={event.coverImage} alt={event.name} loading="lazy" /> : <div className="event-card-placeholder" />}
                  <span className="event-card-date">{new Date(event.startsAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                </div>
                <div className="event-card-body">
                  <p className="event-card-kicker">Live experience</p>
                  <h2 className="heading-md">{event.name}</h2>
                  <p className="event-card-meta">{new Date(event.startsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                  <p className="event-card-meta">{event.venueName}, {event.city}</p>
                  {event.ticketTypes[0] && <p className="event-card-price">From ₹{event.ticketTypes[0].price.toLocaleString("en-IN")}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
