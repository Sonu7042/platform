# Website Builder

React dashboard and Express/PostgreSQL API for creating, editing, publishing, and exporting websites.

## Run locally

Requires Node.js 22.12+ and PostgreSQL 14+ (or Docker for the included database).

1. Run `docker compose up -d` if you need a local database.
2. Copy `backend/.env.example` to `backend/.env`, configure `DATABASE_URL`, and set a random `JWT_SECRET`. Keep an existing `.env` if already configured.
3. Run `npm run setup`.
4. Run `npm run db:deploy` to create tables on a new database. For an existing database created with `prisma db push`, baseline the initial migration before using migrate deploy.
5. Run `npm run dev`, then open http://localhost:5173 and register an account.

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

## Workflows

- Create a website, select it in Templates, and apply a starter template to an empty project.
- Edit pages and sections in Website Editor, choose a home page, save, and preview.
- Add collections and published records in CMS; these render on website pages.
- Upload PNG/JPEG/WebP images in Media Library and paste their URLs into page sections.
- Create forms, publish from the project detail page, and view submissions in Forms & Submissions. Public pages live at `/sites/<website-slug>`.
- Set colors, fonts, SEO defaults, and contact information in Website Settings.
- Download frontend, backend, or fullstack ZIP files from Export & Download. Backend/fullstack exports include an independent Node.js server with no package dependencies; run `npm start` in the extracted folder. Submissions persist in `data/submissions.jsonl`. Static frontend export forms use the source platform API and require the source project to remain published.

## Validation and production

`npm test` runs database integration tests, including authentication, access control, editing, publishing, submissions, uploads, and export. Tests create and remove their own accounts; use a dedicated development/test database. `npm run build` builds the dashboard; `npm run lint` checks it.

With the app running and Google Chrome installed, `npm run test:e2e` runs the browser workflow from registration through publishing, download, and a real form submission. Set `E2E_BASE_URL` to test another local app URL. Test accounts are removed automatically.

Run `npm run build` and `npm start` to serve the dashboard and API together on port 4000. Uploads persist in `backend/uploads`; keep that directory on persistent storage and back it up with PostgreSQL. Set `FRONTEND_ORIGIN` to the deployed dashboard origin. A reverse proxy should forward `/api`, `/sites`, and `/uploads` to the backend when hosting the dashboard separately.

The optional `npm --prefix backend run seed` creates the local demo account documented by its console output. Do not run demo seeding against production.
