# Hàn Phong AI Tools

Triển khai lần đầu: [hướng dẫn đưa website lên Vercel bằng tiếng Việt](docs/GO_LIVE_VI.md).

Vietnamese AI workspace: Chat, Writer and PDF. Next.js App Router, TypeScript, Tailwind v4, shadcn-style Radix/CVA UI, Lucide, Motion, Supabase Auth/PostgreSQL and OpenAI. Dark-first responsive interface for `https://nghiemhanphong.id.vn`.

**Status:** implementation written; see [TASKS.md](TASKS.md) for executed checks and external blockers. Do not treat unexecuted build or integrations as verified. No real secrets or production deployment included.

## Run locally

```bash
cd /workspace/han_phong_ai_tools
npm ci
cp .env.example .env.local
# Fill .env.local securely with your Supabase and OpenAI configuration.
npm test
npm run typecheck
npm run lint
npm run build
npm run dev
```

Use Node 24 (minimum 22.16). A generated package-lock.json is included and `npm ci` has been exercised. Use `npm install` only when intentionally changing dependencies; use `npm ci` for normal setup and CI/deployment. Open the local development server on port 3000. Production locally: `npm run build && npm start`.

## Required configuration

| Variable                               | Purpose                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project HTTPS URL                                                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable key (legacy anon key also accepted)                                         |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server-only credential for quota RPCs and validated PDF insertion                              |
| `OPENAI_API_KEY`                       | Server-only OpenAI credential with model access                                                |
| `OPENAI_MODEL`                         | Optional model; defaults to `gpt-4.1-mini`                                                     |
| `NEXT_PUBLIC_SITE_URL`                 | Canonical app origin, local `http://localhost:3000`, production `https://nghiemhanphong.id.vn` |

Never paste keys in chat or commit `.env.local`. Public Supabase keys are intended for browsers; service-role credentials bypass RLS and must remain server-only. Configure Auth confirmation and SMTP. Apply `supabase/migrations/202610310001_initial.sql` to your Supabase project before registering accounts. It also backfills existing auth users. See [deployment instructions](docs/DEPLOYMENT.md).

Without Supabase configuration the public landing/pricing still render; auth forms report setup required and dashboard redirects to login. Protected endpoints fail closed. No mock accounts or placeholder AI results are used.

## Features and limits

- Email/password registration, login, confirmation callback, secure cookie sessions, protected workspace, name settings and sign-out.
- Chat creation, stored user/assistant messages, recent-context generation, rename/delete, the latest 100 messages in each conversation and up to 100 recent conversations.
- Writer: blog, social captions, professional email, marketing, rewrite, summary; four tones and clipboard.
- PDF upload, MIME/signature/parser validation, bounded worker, stored text, summarize and ask questions, scope disclosure and deletion.
- Daily quota: 15 successful/pending AI requests per user, resets at 00:00 UTC (07:00 Vietnam); 5 accepted requests/minute. Atomic per-user PostgreSQL locking; idempotency UUIDs prevent duplicate spend. Failed requests release quota; crashed reservations expire after 5 minutes on next claim.
- PDF: 4 MiB ingress, max 80 pages, first 20 pages and 24,000 characters only; 20 attempts/day, 3/minute, 20 retained documents. No OCR/full-document retrieval.
- Pro schema prepared; no checkout, paid entitlement or payment integration. AI responses currently non-streaming to finalize persistence before success.

Schema: profiles, conversations, messages, documents, usage_records, subscriptions. RLS and restrictive grants block client quota/plan tampering and cross-user access. APIs verify identity, Origin and bounded bodies. AI instructions/content are rendered as escaped plain text, not raw HTML.

## Validation

`npm test` runs Node tests for bounded streaming bodies, actual PDF worker parsing and PostgreSQL migration/RLS/quota behavior using PGlite. These tests use no external credentials. PGlite validates PostgreSQL behavior in one embedded connection; it does not substitute for multi-connection tests against Supabase staging.

After a production build, run `npm run test:pdf:built`. This copies only traced parser/native assets into an isolated directory, executes the compiled PDF worker, then exercises the production upload route against disposable local Auth/RPC fixtures. It checks production bundling without contacting Supabase or OpenAI and does not replace a live Vercel smoke test. CI runs it after build.

To test database policies and atomic reservations, use a **disposable staging Supabase project**, apply migration and configure `.env.local`, then:

```bash
ALLOW_INTEGRATION_TESTS=1 node --env-file=.env.local tests/database.integration.mjs
```

This creates and deletes two test accounts and checks cross-user RLS, privilege escalation, concurrent quota reservations and idempotent replay. Requires raw usable credentials; proxy placeholders cannot be used outside their configured HTTPS destination. Never run against production.

Browser smoke tests (public pages and fail-closed auth, with no Supabase variables configured):

```bash
# Terminal 1
npm run build
npm start
# Terminal 2; Chromium must be installed, or use Playwright's downloaded browser.
npm run test:browser
```

`BROWSER_EXECUTABLE_PATH` overrides the Chromium location; otherwise use system `/usr/bin/chromium` or `npx --no-install playwright-core install chromium`. Screenshots go to ignored `artifacts/`. GitHub CI also runs these checks; the workflow file has been prepared, but no remote CI run has been triggered.

Manual staging checks: sign up/confirm/login; verify second user cannot read first user's chat/PDF; send a chat and reload; rename/delete; generate each Writer mode; upload text PDF; question and summarize; reject oversized, encrypted, scan-only or malformed PDFs; confirm partial-document notice for >20 pages; exhaust daily quota; retry request UUID; sign out and verify API 401. Browser/mobile and deployed PDF worker still require validation.

See [architecture and data lifecycle](docs/ARCHITECTURE.md), [deployment/domain configuration and production checklist](docs/DEPLOYMENT.md), [progress](TASKS.md). Application data is sent to Supabase and relevant prompts/context to OpenAI. Deleting sources does not automatically remove historical AI results in usage_records; define and publish a retention policy before launch.
