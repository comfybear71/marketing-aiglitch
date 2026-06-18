# HANDOFF.md — marketing-aiglitch

> Session log + work tracker. Updated at the end of every session.
> Never delete. Newest entries at the top.

---

## Session log (newest first)

### 2026-06-18 — session 2: Ad Creator UI

**Status:** Ad Creator tab is live and fully wired to the v1.53.0
backend (`/api/admin/ads/*`). First real feature on top of the
bootstrap shell.

**This session shipped:**
- `src/lib/ads-types.ts` — types mirrored from the backend
  (`aiglitch-api/src/lib/content/ad-briefs.ts`) + pure helpers
  (status chips, target_socials CSV parse/format, generation_log
  parse, cost sum, byte formatting). Unit tested.
- `src/lib/ads-api.ts` — typed browser client over the proxied
  `/api/admin/ads/*` routes (list / create / get / update / archive /
  delete asset / generate). Throws `ApiError` with the backend message.
- `src/lib/blob-upload.ts` — Safari-safe Vercel Blob client upload
  (ported from admin), brief-scoped path `ad-briefs/<id>/…`.
- `src/app/ad-creator/page.tsx` + `ad-creator-client.tsx` — brief list
  with status filters, archived toggle, and a create-brief modal.
- `src/app/ad-creator/[id]/page.tsx` + `brief-detail-client.tsx` —
  edit brief, upload/delete assets, generate (cost-cap + advanced
  avatar/voice overrides), and a diagnostics panel (last video player,
  last error, per-step generation_log table with est. cost).
- Vitest: +10 tests for the pure helpers (19 total).

**Generation UX notes (important for next session):**
- `POST /api/admin/ads/[id]/generate` is **synchronous, 3-4 min**
  (backend `maxDuration` 800s). The UI shows an elapsed timer and tells
  the operator they can leave — the backend persists final status +
  `generation_log` on completion, so reloading the brief recovers state
  if the long request drops.
- `generation_log` is only written at the END of the run, so there's no
  live per-step progress to poll. If we want live progress later, the
  backend would need to stream or persist steps incrementally.
- Asset rows are inserted by the Blob `onUploadCompleted` webhook, so
  the UI waits ~1.2s after upload before reloading the brief.

**Tag:** `v0.2.0` (suggested)

**Notes for next session:**
- ROADMAP session 3 (marketing): move the **Sponsors** tab from admin
  (proof-of-pattern). ROADMAP item 14 also bundles moving **Ad
  Campaigns** + further Ad Creator polish.
- HeyGen avatar/voice IDs: `GET /api/admin/heygen/catalog` lists valid
  V-compatible IDs — wire a picker into the generate "advanced" section
  instead of free-text override.

---

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
