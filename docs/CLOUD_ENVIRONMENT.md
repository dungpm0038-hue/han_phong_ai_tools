# Hàn Phong AI Tools development

Use the existing checkout /workspace/han_phong_ai_tools. Cloud tasks are already isolated; do not create a Git worktree unless the user explicitly requests one.

Read TASKS.md, README.md and any AGENTS.md first. Use Node 24 and npm. Dependencies and the .next build may be retained in the snapshot, but server processes must be started again. If dependencies are missing, run npm ci from the repository root. Never print environment/credential values.

Check the presence (not values) of NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY and NEXT_PUBLIC_SITE_URL. Configure missing credentials securely via environment settings or an ignored .env.local file; never invent them or bypass auth. Apply supabase/migrations/202610310001_initial.sql only to the intended user-authorized Supabase project. Public pages work without credentials; dashboard and AI remain unavailable until configured. See docs/DEPLOYMENT.md for Auth callback/SMTP and deployment checks.

Start development from /workspace/han_phong_ai_tools with npm run dev -- --hostname 127.0.0.1. For production-mode local verification, npm run build then npm start -- --hostname 127.0.0.1. Check the public landing page with an internal HTTP request and confirm its Vietnamese headline. Run npm test, npm run lint, npm run typecheck and npm run format:check as relevant. With the production server running and Supabase variables unset, TEST_BASE_URL=http://127.0.0.1:3000 npm run test:browser validates public desktop/mobile flows and auth setup guards. Use the separately documented disposable Supabase integration test only when credentials and authorization are available.

Do not deploy to production, publish on Vercel, change DNS or activate payments without explicit user approval. Do not provide loopback preview links in onboarding. Report unverified external integrations accurately.
