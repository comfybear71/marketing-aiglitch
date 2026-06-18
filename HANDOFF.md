# HANDOFF.md — marketing-aiglitch

> Session log + work tracker. Updated at the end of every session.
> Never delete. Newest entries at the top.

---

## Session log (newest first)

### 2026-06-18 — first commit (bootstrap)

**Status:** Empty Next.js shell + login + nav placeholder. Sister to
admin.aiglitch.app. Hosted at marketing.aiglitch.app.

**This session shipped:**
- Next.js 16 App Router scaffold
- Tailwind config + design tokens (copied from admin-aiglitch)
- Login page that POSTs to `/api/auth/admin` (proxied to
  `https://api.aiglitch.app/api/auth/admin` via `next.config.ts`
  `beforeFiles` rewrites — strangler pattern)
- Layout + left **sidebar** with 10 placeholder nav entries, each
  rendering a "Coming next session" placeholder
- Vitest unit tests (nav config + auth cookie helper)
- GitHub Actions workflow (typecheck + vitest + build on push/PR)
- Vercel auto-deploy from `master`

**Tag:** `v0.1.0`

**Sidebar entries (all placeholders this session):**
- Ad Creator — THE big new tab, lands in marketing session 2
- Sponsors — proof-of-pattern move from admin in marketing session 3
- AI Costs
- Events
- Ad Campaigns
- X Growth
- Spec Ads
- Merch Studio
- Emails
- Contact

**Notes for next session:**
- Backend Ad Creator endpoints live at `/api/admin/ads/*` on
  api.aiglitch.app (added in aiglitch-api v1.52.0 + v1.53.0):
  - `GET/POST /api/admin/ads` — list / create brief
  - `GET/PATCH/DELETE /api/admin/ads/[id]` — read / update / soft-delete
  - `POST /api/admin/ads/[id]/upload` — Vercel Blob client-upload token
  - `DELETE /api/admin/ads/[id]/assets/[assetId]` — remove asset
  - `POST /api/admin/ads/[id]/generate` — generate MP4 (3-4 min, ~$1.55)
  - Diagnostic surface: `brief.last_video_url`, `brief.last_error`,
    `brief.generation_log` in `GET /api/admin/ads/[id]`.
- Cookie scope is `.aiglitch.app` — log into admin.aiglitch.app,
  navigate to marketing.aiglitch.app, you stay authed (and vice versa).
- Sidebar entries that need content: all 10. Build them one at a time
  in later sessions so blast radius stays small.
- See `docs/ROADMAP.md` in aiglitch-api for the multi-session plan.
- Next ship target: ROADMAP session 2 — Ad Creator UI (consumes the
  v1.53.0 backend).

---

<!-- Append new sessions ABOVE this line. Newest first. -->
