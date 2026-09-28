 # Eventora Marketplace

Eventora is an event-services marketplace for discovering vendors, planning events, sending enquiries, receiving quotations, and confirming bookings.

The ticketing foundation is being added alongside the existing vendor marketplace under the PREVIA EVENTS product direction. Public event discovery is available at `/events`; ticket reservations use database-backed inventory holds with expiry and idempotency protection.

## Production stack

The target deployment stack is Next.js on Vercel, TypeScript for new and migrated modules, Prisma against Supabase PostgreSQL, Razorpay for INR payments, and Supabase Storage for event media. NextAuth remains the authentication layer during the migration so existing users and routes continue to work.

## Local setup

Requirements: Node.js 20 or newer and npm.

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

The seed script creates demo accounts for local development only. Change or remove these accounts before any public deployment.

## Production checklist

1. Create a Supabase project and set the pooler `DATABASE_URL` plus direct `DIRECT_URL`. Create and review a PostgreSQL migration before deploying.
2. Set a long, random `NEXTAUTH_SECRET`, the public HTTPS `NEXTAUTH_URL`, and the production `NEXT_PUBLIC_APP_URL`.
3. Do not deploy the local `.env` file or demo passwords.
4. Run `npm run db:deploy` during deployment, then run `npm run build` and `npm run start`.
5. Configure database backups, error monitoring, rate limiting, email delivery, and an image storage provider.
6. Before accepting real bookings, integrate and test payment capture, webhook verification, refunds, cancellations, and dispute handling.

The current ticketing slice is not production-complete: payment gateway integration, organizer/admin event approval, checkout confirmation, digital ticket generation, QR check-in, refunds, and concurrency test coverage still need implementation. Do not enable public ticket sales until those flows are verified end to end.

Health check: `GET /api/health`.

## Verification commands

```bash
npm run lint
npm run build
npm audit --omit=dev
```

The current app supports enquiry and quotation workflows. Payment processing is not enabled yet, so do not represent a confirmed booking as paid until a payment provider and webhook flow are implemented.
