# Vercel + Supabase deployment

Production deployment and DNS changes require the owner's approval. No deployment or DNS changes have been performed by this task.

## 1. Validate locally / staging

Use Node 22.16+ (Node 24 recommended). Use `npm ci` with the included generated lockfile. Installation and lockfile reproducibility were checked in this workspace. Follow README for env setup, migration, tests and build. npm registry latest tags were checked: Next.js 16.4.3 and React 19.3.1. ESLint 9.39.5 is retained because the current Next React/import/accessibility plugins declare ESLint 9 support but not 10; npm reports ESLint 9 as out of support. Track plugin compatibility and upgrade this development toolchain when supported.

Create a Supabase staging project. Apply `supabase/migrations/202610310001_initial.sql` with SQL Editor or Supabase CLI (`supabase link --project-ref ...`, `supabase db push`). Migration is versioned and not designed to be pasted repeatedly. Review SQL in staging before production. Enable email confirmation; require minimum 10-character passwords; enable leaked-password protection when available. Configure SMTP for production rather than relying on the default test sender. Set Auth sign-up/sign-in rate limits and CAPTCHA using Supabase's supported configuration before broad launch. The current frontend does not supply CAPTCHA tokens; enabling mandatory CAPTCHA also requires adding its widget/token flow in a follow-up change.

Set Auth URL Configuration:

- Site URL: `https://nghiemhanphong.id.vn`
- Redirect URL: `https://nghiemhanphong.id.vn/auth/callback`
- For local/staging, add only explicit trusted callback URLs (e.g. `http://localhost:3000/auth/callback`). Avoid broad production wildcards.

The auth email template must use Supabase's PKCE confirmation/link flow (`ConfirmationURL`) for this callback. Test confirmation in the same browser as registration; PKCE relies on its verifier cookie. No external `next` redirect is accepted.

## 2. Prepare Vercel (after approval)

Import the GitHub repository, Framework: Next.js, project root: repository root, install command `npm ci`, build command `npm run build`, Node 24. Set all variables from `.env.example` separately for Preview/Production. `NEXT_PUBLIC_SITE_URL` must equal each deployment's canonical origin, with https in production. Keep service-role and OpenAI keys server-only. Do not use production data in preview deployments.

The PDF worker resolves pdf-parse inside its Node runtime to avoid bundler module IDs. Next tracing explicitly includes the parser, adjacent PDF.js worker and canvas/native assets. Run `npm run build` followed by `npm run test:pdf:built` to exercise the compiled worker and route with local fixtures. Verify Vercel's tracing includes it and that worker_threads + PDF.js work using a real small PDF in staging. Function maxDuration is 60s for AI and 30s for documents; confirm the Vercel plan supports these limits. Upload limit 4 MiB accounts for Vercel ingress. No filesystem persistence is used.

## 3. Custom domain (after explicit approval)

In Vercel Project → Settings → Domains add `nghiemhanphong.id.vn`. Vercel will show the exact current DNS records required for this project. At your DNS provider, add those displayed records, preserving unrelated MX/TXT records and checking conflicting apex A/AAAA/CNAME entries. Do not guess or hard-code Vercel IPs from old documentation. Wait for DNS verification and TLS issuance, then choose the canonical production domain. Add `www` only if desired and redirect it to canonical. Update Supabase's exact URLs to match.

Check https, login/registration/email callback, cookies, sign-out, all three tools, quota errors, deletion and unauthorized APIs on the final domain. Confirm Origin enforcement doesn't reject valid requests. CSP allows Supabase's standard `*.supabase.co` domain; custom Supabase domains require a deliberate CSP update.

## Dependency audit status

Production dependency audit reports zero vulnerabilities. Full audit reports 16 moderate findings in the ESLint development dependency graph, associated with minimatch (GHSA-g3hv-75wg-m249). This does not warrant blindly downgrading ESLint or overriding incompatible major APIs. Track upstream plugin/toolchain updates and review the remaining development risk before release.

## Production checklist

- [x] Lockfile generated, npm ci/build/typecheck/lint verified locally; current stable Next/React tags checked.
- [ ] Review official deployment docs and toolchain lifecycle before launch; track ESLint 10 plugin compatibility.
- [ ] npm audit reviewed, no unsupported Next/React/PDF.js release; parser worker smoke tested.
- [ ] Separate staging and production projects; migration applied, RLS/integration tests pass with two users.
- [ ] Supabase email confirmation, SMTP and auth rate limits verified; abuse protection evaluated.
- [ ] OpenAI billing and spending limits configured; keys scoped, rotated, never NEXT_PUBLIC.
- [ ] Free quota concurrency/idempotency and provider-failure refund checked in staging.
- [ ] Global abuse/DoS controls configured via Vercel firewall; evaluate malware scanning for public PDF uploads.
- [ ] Data retention/usage-result cleanup policy and account-deletion/support process established; backup restoration tested.
- [ ] Monitoring records status/request IDs only; never prompts, extracted text, passwords or secrets.
- [ ] Mobile, keyboard, focus trapping, reduced motion and screen-reader status verified in browser.
- [ ] Legal/privacy notice reflects actual OpenAI/Supabase processing and retention policies.
- [ ] Production deployment and domain/DNS changes explicitly approved by owner.
- [ ] Real domain HTTPS, security headers, callback and all functional checks pass.

## Rollback

Revert Vercel to the last known working deployment. Do not automatically reverse a schema migration that contains user data. Take a database backup and design forward fixes separately. Disable AI endpoints/remove provider access if abuse is detected; avoid deleting customer data during incident response.
