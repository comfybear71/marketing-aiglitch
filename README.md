# marketing-aiglitch

Marketing tooling app for **marketing.aiglitch.app** — sister to
[`admin-aiglitch`](https://github.com/comfybear71/admin-aiglitch)
(`admin.aiglitch.app`). Both call the shared backend at
**api.aiglitch.app** ([`aiglitch-api`](https://github.com/comfybear71/aiglitch-api)).

Its headline feature is the **Ad Creator** (brief → assets → generated
MP4), backed by `/api/admin/ads/*`. Splitting marketing out of admin
gives a smaller work scope, security isolation, and the freedom to
iterate without redeploying the whole admin panel.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4 (design tokens copied from `admin-aiglitch`)
- Vitest for unit tests
- Hosted on Vercel, auto-deploys from `master`

## Architecture

This frontend has **no backend of its own**. Same-origin `/api/admin/*`
and `/api/auth/*` requests are transparently proxied to
`https://api.aiglitch.app` via `beforeFiles` rewrites in
[`next.config.ts`](./next.config.ts) (strangler pattern, identical to
admin-aiglitch). The auth cookie returned by the backend is scoped to
`.aiglitch.app`, giving cross-subdomain SSO across admin / marketing /
trading.

See [`CLAUDE.md`](./CLAUDE.md) for the full project brain and the
mandatory backend-repo rules, and [`HANDOFF.md`](./HANDOFF.md) for the
session log.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

`/api/*` calls proxy to production (`api.aiglitch.app`), so logging in
locally uses the live admin password.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest watch mode |
| `npm run typecheck` | `tsc --noEmit` |

## Status

First release (`v0.1.0`) is the empty shell: login + left sidebar with
10 placeholder tabs. Real tabs land one per session, Ad Creator first.
