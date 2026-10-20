# Murang'a County Service Requests

A web system for reporting and following up public service problems in Murang'a County. A citizen registers, reports an issue such as a broken streetlight, a water problem or missed garbage collection, and follows it until it is resolved. County staff review the requests, move them forward and see simple statistics.

It has two parts: a React client (`client/`) and a NestJS API with a PostgreSQL database (`server/`).

## Project status

Working:

- Registration and sign-in with email or national ID number and a password
- Password reset by SMS code (TiaraConnect)
- Two roles, citizen and administrator, enforced on the server
- Submitting a request with a category, location, description and up to 3 photos
- Request list with status filter, category filter, search and paging
- Status history for every request, with an optional note from the county on each change
- Public tracking page that needs no account
- In-app notifications: citizens hear about status changes, administrators about new requests
- Administrator dashboard, users list and analytics (7, 30 or 90 days)

Not done, or limited:

- There are no automated tests. Both packages compile without type errors.
- Notifications appear inside the app only and are checked every 30 seconds. There are no email, SMS or push notifications for status changes.
- No email is ever sent and email addresses are not verified. Password reset works through SMS only.
- Administrators can only be created with the seed script. There is no screen for adding or promoting one.
- A request can only move forward (Pending, In Progress, Resolved). It cannot be reopened.
- The users list shows the 200 most recent accounts and has no search.
- The API is meant to run as a single instance.

## Requirements

- Node.js 20 or newer
- PostgreSQL. A local install, a Docker container or a free Neon project all work.
- Optional: a Cloudflare R2 bucket (photo uploads) and a TiaraConnect account (SMS). Without them the rest of the system still runs. Photo upload returns an error, and reset codes are printed in the API console instead of being sent.

## Running it locally

### 1. Database

With Docker or Podman:

```bash
docker run --name service-requests-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=service_requests -p 5432:5432 -d postgres:16
```

The connection string is then `postgresql://postgres:postgres@localhost:5432/service_requests`.

### 2. API

```bash
cd server
cp .env.example .env
```

Edit `.env`. For a local run only these need real values:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/service_requests"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/service_requests"
JWT_SECRET="<a long random string>"
ADMIN_EMAIL="admin@murangacounty.example"
ADMIN_ID_NUMBER="00000001"
ADMIN_PASSWORD="@Admin@123"
```

Generate a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

Then:

```bash
npm install            # also generates the Prisma client
npm run db:deploy      # creates the tables
npm run db:seed        # creates the administrator from the ADMIN_* values
npm run start:dev      # http://localhost:3000/api
```

### 3. Client

In a second terminal:

```bash
cd client
npm install
npm run dev            # http://localhost:5173
```

Open http://localhost:5173. Vite forwards `/api` to the API on port 3000.

### Sample data (optional)

```bash
cd server && npm run db:seed-demo
```

This adds a citizen (`john@example.com`, password `Password123`) and about 40 requests spread over the last 30 days so the dashboard and charts have something to show. Run it only on a database you are happy to fill with sample data.

### Production build check

```bash
cd server && npm run build
cd client && npm run build
```

### If the API fails to compile with `imageKeys` or other Prisma errors

The Prisma client is generated from `server/prisma/schema.prisma`. After pulling a change that touches the schema, run this in `server/`:

```bash
npm run db:migrate     # applies new migrations to your local database and regenerates the client
```

## Using the system

**Citizen**

1. Choose Register on the sign-in page and enter name, email, ID number (8 or 9 digits), Kenyan phone number and a password of at least 8 characters.
2. Use New Request, pick a category, give the location and a description, optionally attach photos, and submit. The request gets a reference such as `PRS-2026-0012`.
3. My Requests lists your requests. Open one to see its status history and any note from the county.
4. The bell in the top bar shows unread notifications.

**Administrator**

1. Sign in with the email or ID number from the seed values.
2. Dashboard shows counts by status, the latest requests and the category split for the last 30 days.
3. Requests lists every request. Filter by status or category, or search by reference, location or description. Open a request, choose the next status, add an optional note and save.
4. Users lists registered accounts. Analytics shows submitted and resolved requests per day, the average time to resolve and the busiest categories.

**Without an account**

Open Track request from the landing page and enter the reference and the last 4 digits of the phone number used to submit it. Only the status, category, dates and the county's notes are shown.

**Forgot password**

Choose Forgot password on the sign-in page and enter your email or ID number. A 6-digit code is sent by SMS to the phone number on the account. It expires after 10 minutes and allows 5 attempts. The code is checked first; only then are you asked for a new password. When `TIARA_API_KEY` is empty outside production, the code is printed in the API console instead.

## Environment variables (`server/.env`)

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. On Neon, use the pooled string |
| `DIRECT_URL` | Direct connection string used by migrations. For a local database it is the same as `DATABASE_URL` |
| `JWT_SECRET` | Long random string. The API will not start without it |
| `PORT` | Defaults to `3000` |
| `NODE_ENV` | Set to `production` when deployed. This makes the session cookie `Secure` |
| `ADMIN_EMAIL`, `ADMIN_ID_NUMBER`, `ADMIN_PASSWORD` | Used by `npm run db:seed` to create the first administrator |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Photo storage. Leave empty to run without photo upload |
| `R2_JURISDICTION` | Only if the bucket was created with a jurisdiction (`eu` or `fedramp`) |
| `TIARA_API_KEY` | TiaraConnect key. Required in production for reset codes |
| `TIARA_SENDER_ID` | Sender ID approved on your TiaraConnect account. Defaults to `TIARA`. An unapproved sender ID can make the gateway reject messages, which the API logs |
| `TIARA_BASE_URL` | Optional. Defaults to `https://api2.tiaraconnect.io` |

## How it is built

| Part | Technology |
| --- | --- |
| Client | React, Vite, Tailwind CSS v4, React Router, Recharts |
| API | NestJS, Prisma |
| Database | PostgreSQL |
| Photos | Cloudflare R2 through presigned URLs |
| SMS | TiaraConnect |

Notes on the design:

- **Sessions.** Sign-in sets a JWT in an `httpOnly` cookie valid for 7 days. Passwords are hashed with bcrypt. Sign-in, registration, password reset and public tracking are rate limited, and every other route has a general limit of 120 requests a minute.
- **Same-origin API.** The client always calls `/api/...`. Vite forwards it to the API in development, and `client/vercel.json` rewrites it to the API host in production, so the cookie is first-party and no CORS setup is needed.
- **Roles.** A global guard requires a valid session on every route except those marked public, and a second guard checks the role. Citizens can read only their own requests. Only administrators can change a status.
- **Status history.** Every status change is stored with who made it and when. The history timeline and the analytics both read from it.
- **Photos.** The browser asks the API for a short-lived upload URL and sends the file directly to a private bucket. When the request is created, the API checks that each photo exists, belongs to the user and is at most 5 MB. Photos are shown through signed links that expire after an hour.
- **Loading.** The dashboard is served by one endpoint (`/requests/dashboard`). The API remembers each session check for 30 seconds instead of querying the database on every call. The client keeps recent responses in memory, so a screen you have visited shows immediately and refreshes in the background. Screens show placeholder shapes while data loads. Charts and rarely used screens are loaded on demand, and the landing and sign-in images are compressed WebP files.

## Project layout

```
client/
  src/components/   shared interface pieces, route guards, loading placeholders
  src/lib/          API client, session, data hook, constants, formatting
  src/pages/        one file per screen
  public/           images and favicon
  vercel.json       /api rewrite and single-page fallback
server/
  prisma/           schema, migrations, seed scripts
  src/auth/         sign-in, registration, password reset, guards
  src/requests/     create, list, detail, status changes, dashboard, public tracking
  src/notifications/  in-app notifications
  src/uploads/      presigned photo uploads
  src/analytics/    administrator analytics
  src/sms/          TiaraConnect client
  src/users/        administrator users list
```

## API

All routes are under `/api` and need the session cookie unless marked public.

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | public | Health check |
| POST | `/auth/register` | public | Create a citizen account and sign in |
| POST | `/auth/login` | public | Sign in with email or ID number |
| POST | `/auth/logout` | public | Clear the session cookie |
| POST | `/auth/forgot-password` | public | Send a reset code by SMS |
| POST | `/auth/verify-reset-code` | public | Check the SMS code, returns a short-lived reset token |
| POST | `/auth/reset-password` | public | Set a new password with that token |
| GET | `/auth/me` | any | Current user |
| GET | `/requests/track` | public | Status lookup by reference and last 4 phone digits |
| GET | `/requests` | any | List. Query: `status`, `category`, `q`, `page`, `pageSize`. Citizens get their own, administrators get all |
| GET | `/requests/stats` | any | Counts by status |
| GET | `/requests/dashboard` | any | Counts, latest requests and, for administrators, the category split |
| GET | `/requests/:id` | any | Detail with history. A citizen gets 404 for someone else's request |
| POST | `/requests` | citizen | Create a request |
| PATCH | `/requests/:id/status` | admin | Move the status forward, with an optional note |
| POST | `/uploads/presign` | citizen | Presigned URL for one photo |
| GET | `/notifications` | any | List. Query: `unreadOnly`, `page`, `pageSize` |
| GET | `/notifications/unread-count` | any | Number of unread notifications |
| PATCH | `/notifications/:id/read` | any | Mark one as read |
| POST | `/notifications/read-all` | any | Mark all as read |
| GET | `/analytics?days=7\|30\|90` | admin | Analytics |
| GET | `/users` | admin | Registered users |

## Deployment

This is the setup the project was prepared for: Neon for the database, Cloudflare R2 for photos, Render for the API and Vercel for the client.

1. **Neon.** Create a project and copy the pooled and direct connection strings.
2. **Cloudflare R2.** Create a private bucket and an API token with read and write access to it. Add a CORS policy that allows `PUT`, `GET` and `HEAD` from your Vercel address and `http://localhost:5173`, with `Content-Type` as an allowed header. For a bucket with a jurisdiction, add `--jurisdiction eu` to each `wrangler` command.
3. **Render (API).** Create a Web Service with root directory `server`, health check path `/api/health`, start command `npm start`, all the variables above set, and this build command:
   ```
   npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build && npx prisma db seed
   ```
   `--include=dev` is needed because Render sets `NODE_ENV=production`, which would otherwise skip the build tools. The seed can run on every deploy: an existing administrator is not changed.
4. **Vercel (client).** In `client/vercel.json` replace `YOUR-API-NAME` with the Render service name. Import the repository with root directory `client`.
