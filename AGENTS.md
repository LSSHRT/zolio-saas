# Repository Guidelines

## Project Structure & Module Organization
`src/app` contains the Next.js App Router pages, layouts, and API handlers under `src/app/api/*`. Put shared UI in `src/components`, and keep reusable business logic, Prisma access, mail helpers, and support utilities in `src/lib`. Database schema changes live in `prisma/schema.prisma`; static assets belong in `public/`. Treat root-level `*.js` files such as `test-db.js` or `update_landing.js` as one-off maintenance scripts, not application modules.

## Build, Test, and Development Commands
Use npm in this repo; `package-lock.json` is the source of truth.

- `npm install`: installs dependencies and runs `prisma generate` via `postinstall`.
- `npm run dev`: starts the local app at `http://localhost:3000`.
- `npm run build`: regenerates Prisma Client and creates a production build. Run this before opening a PR.
- `npm run start`: serves the production build locally.
- `npm run lint -- .`: runs ESLint. For focused checks, prefer a scoped path such as `npm run lint -- src prisma`.

## Coding Style & Naming Conventions
TypeScript runs in `strict` mode. Follow the existing style: 2-space indentation, double quotes, semicolons, and `@/*` path aliases from `tsconfig.json`. Use PascalCase for React components (`LandingPage.tsx`), kebab-case for utility files in `src/lib` (`public-devis-token.ts`), and lowercase route segment names in `src/app` (`nouveau-devis`, `signer/[numero]`).

## Testing Guidelines
There is no dedicated automated test runner checked in today. Minimum validation for changes is `npm run build`, then a manual smoke test of the affected page or API flow. Existing root scripts like `node test-db.js` and `node test_scraper.js` are ad hoc checks; keep any new verification scripts similarly focused and disposable.

## Commit & Pull Request Guidelines
Match the existing Conventional Commit style from git history: `feat: ...`, `fix: ...`, written in the imperative. PRs should include a short user-facing summary, linked issue or task when available, notes for env/schema changes, and screenshots for UI updates.

## Security & Configuration Tips
Copy `.env.example` to `.env.local` for local setup and never commit secrets. Keep sensitive values such as `DATABASE_URL`, Clerk keys, Stripe keys, `PUBLIC_DEVIS_LINK_SECRET`, and `CRON_SECRET` in environment variables only.
