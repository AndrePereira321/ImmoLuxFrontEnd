# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Dev server on port 8080 (backend expected on 8082, no proxy)
npm run build         # Production build (adapter-node) → build/; run with `node build`
npm run build:analyze # Build + bundle report (stats.html); POSIX env syntax — use Git Bash on Windows
npm run preview       # Serve production build locally
npm run check         # svelte-kit sync + Svelte/TypeScript type checking
npm run check:watch   # Type checking in watch mode
npm run lint          # Prettier check + ESLint
npm run format        # Auto-format with Prettier
```

There is no test suite. Requires Node `^22.13 || >=24` (`.npmrc` sets `engine-strict`; the floor comes from ESLint 10, vite-imagetools and rollup-plugin-visualizer); develop on **Node 26 + npm 12**. The production deploy installs with `npm ci`, so keep `package-lock.json` in sync. The backend lives in `../immo-lux-back-end`.

**Install scripts:** npm 12 skips dependency install scripts unless `package.json` `allowScripts` approves them. `es5-ext` (its script only prints a message) and `esbuild` (pulled in by svelte-i18n, which never calls it) are denied on purpose. When a new dependency needs its script, `npm install` lists it at the end — review it with `npm install-scripts ls`, then `npm install-scripts approve <pkg>` (or `deny`). npm < 12 ignores `allowScripts` and runs every script.

Majors deliberately held back — don't blindly `ncu -u`:

- **SvelteKit 2.x / adapter-node 5.x**: `sveltekit-superforms` supports Kit 3 only in its `3.x` prerelease. Kit 3 also needs Node ≥ 22.17 and is a large migration (config moves into `vite.config.ts`, `$app/stores` removed, `$app/paths` changes, single `src/params.ts`)
- **TypeScript 6.x**: `typescript-eslint` (`<6.1`) and `svelte-check` (`^5 || ^6`) don't support TypeScript 7

Formatting: tabs, single quotes, no trailing commas, `printWidth: 120`, with `prettier-plugin-svelte` and `prettier-plugin-tailwindcss`.

## Architecture

**Hybrid SSR + client-only.** SvelteKit with `@sveltejs/adapter-node`, deployed as a Node server (systemd `immolux-frontend`) behind a reverse proxy that sends `/v1/api/*` to the Go backend. Public pages are server-rendered for SEO; the admin panel is client-only.

| Route                               | Rendering       | Data                                                                                                          |
| ----------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `/`                                 | **SSR**         | 3 newest available properties (`orderBy=created_desc&limit=3`) + images                                       |
| `/houses`                           | **SSR**         | Search: filtered/paginated `/properties` + `/properties/facets` + images; state in query string               |
| `/houses/[id=integer]`              | **SSR**         | Single property + images; 404 when missing                                                                    |
| `/houses/[district]`                | **SSR**         | Slug → name via `/locations/stats` (404 if unknown), then first 12 properties; more pages fetched client-side |
| `/houses/[district]/[municipality]` | **SSR**         | Same pattern, scoped to a municipality                                                                        |
| `/panel/properties`                 | **Client-only** | User's own properties (`/my-properties`) fetched in `onMount`                                                 |
| `/panel/properties/new`             | **Client-only** | `<AppPropertyForm />`                                                                                         |
| `/panel/properties/[id]`            | **Client-only** | `<AppPropertyForm propertyId=…>` — the form loads the property itself in `onMount`                            |
| `/sitemap.xml`                      | **Dynamic**     | Sitemap **index** → `/sitemap-properties.xml` + `/sitemap-locations.xml`; all CDN-cached 1h                   |

- `src/params/integer.ts` is what separates `/houses/123` (detail) from `/houses/porto` (district).
- `/panel/+layout.ts` only sets `ssr = false` / `prerender = false`. There is no `/login` route — login is a modal in `AppMenu`.
- Each SSR loader makes one extra `/properties/{id}/images` request per property to get image IDs.
- `src/hooks.server.ts` is a pass-through and `App.Locals` is empty.

**Backend URLs.** Server load functions (`+page.server.ts`) use `PRIVATE_SERVER_URL` from `$env/static/private`; browser code uses `VITE_SERVER_URL` via `apiClient`. Exception: the two child sitemap endpoints use `import.meta.env.VITE_SERVER_URL`. Both come from `env/.env.development` / `env/.env.production` (Vite `envDir` and `kit.env.dir` both point to `./env`; process env vars override them, e.g. `VITE_SERVER_URL=… npm run build`) and are **baked in at build time** — changing them needs a rebuild. SSR loads never carry the user's cookie, which is why anything authenticated must stay under `/panel`.

**Key lib layout:**

```
src/lib/
├── api/api-client.ts         # Axios wrapper — single export `apiClient`
├── stores/                   # auth, notification, theme, locations
├── components/               # All reusable UI components
├── actions/inview.ts         # use:inview — adds `in-view` class to trigger .reveal animations
├── types/                    # TypeScript interfaces (hand-mirrored from backend DTOs)
├── schemas/                  # Zod validation schemas for forms
├── utils/                    # property-search, format, language, slug (unused)
├── assets/labels/            # i18n JSON files (pt.json, en.json, fr.json)
├── styles/app.css            # Tailwind v4 theme: OKLCH tokens, animations, components layer
└── i18n.ts                   # Registers + initializes svelte-i18n
```

## Search (`/houses`)

All search state lives in the URL query string and is parsed/serialized by `src/lib/utils/property-search.ts`:

- Params: `q`, `district`, `municipality`, `parish`, `propertyType`, `status`, `minPrice`, `maxPrice`, `orderBy`, `offset`; page size `SEARCH_PAGE_SIZE = 12`
- `readSearchParams` validates (unknown sort → default); `toQueryString` builds the backend query; `toPageQuery` builds the browser URL and omits defaults
- Filter values are canonical names (`?district=Porto`), not slugs. Param names and sort keys must match the backend's `property_public.go` / `property_repository.go`
- The page is canonical to `/houses` and emits `noindex, follow` whenever a filter is active

Location slugs (`/houses/{district}/{municipality}`) are owned by the backend: pages resolve them via `/locations/stats`, and the sitemap gets them from `/locations/published`. `src/lib/utils/format.ts` holds the locale-aware `formatPrice` (EUR, no decimals) / `formatArea` helpers.

## Styling

**Framework:** Tailwind CSS v4 via `@tailwindcss/vite` plugin. No `tailwind.config.js` — all theme customization lives in `src/lib/styles/app.css`. The visual identity is Portuguese azulejo tiles (see `AppAzulejo`, an SVG tile used for homepage tiles and as the placeholder when a property has no photos).

**Color tokens (OKLCH):**

| Token prefix          | Palette                          | Use                   |
| --------------------- | -------------------------------- | --------------------- |
| `--color-primary-*`   | Cobalt (azulejo blue) (50–950)   | Brand, buttons, links |
| `--color-secondary-*` | Champagne gold (50–950)          | Accents, highlights   |
| `--color-tertiary-*`  | Warm gray-blue (50–950)          | Neutral UI elements   |
| `--color-light-*`     | Cool lime-washed wall            | Light backgrounds     |
| `--color-dark-*`      | Deep midnight blue (incl. `850`) | Dark mode backgrounds |

Also: `--color-glaze`/`--color-glaze-dark`, `--color-grout`/`--color-grout-dark`, and status tokens `--color-error-*`, `--color-warning-*`, `--color-success-*`, `--color-info-*`.

**Typography** (Google Fonts loaded in `src/app.html`):

- Headings (`--font-display`): **Fraunces** (variable), falling back to locally hosted Playfair Display — Playfair weight 600 is disabled (corrupted file), only 400 exists
- Body: Plus Jakarta Sans, falling back to local Inter
- Mono (`--font-mono`): DM Mono, used by `.type-record` / `.type-label`

**Defined in `app.css`:**

- `@layer components`: `.azulejo-*`, `.type-display`, `.type-record`, `.type-label` — utilities override them
- Scroll reveal: `.reveal*` classes, triggered by `use:inview`
- Animations: `fadeInUp`, `fadeIn`, `shimmer`, `float`, `pulse-soft`, `heroSettle`/`heroRise` (`.hero-settle`/`.hero-rise`)
- `.grain::before` noise overlay, `.glass`, 8px scrollbar styling
- Dark mode: `@variant dark (&:is(.dark *))`, with `.dark` on `document.documentElement` set client-side by `themeStore` (no inline pre-hydration script, so SSR pages render light first)

**Plugins:** `@tailwindcss/forms` (form element resets), `@tailwindcss/typography` (prose content).

## SEO

Public pages are SSR-rendered and include full meta tags. Follow this pattern when adding new public pages:

```svelte
<svelte:head>
	<title>{$_('page.title')}</title>
	<meta name="description" content={$_('page.description')} />
	<meta property="og:title" content={$_('page.title')} />
	<meta property="og:description" content={$_('page.description')} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://immolux.pt/..." />
	<meta property="og:image" content="..." />
	<link rel="canonical" href="https://immolux.pt/..." />
</svelte:head>
```

- **Sitemaps:** `sitemap.xml` is an index; `sitemap-properties.xml` lists `/`, `/houses` and every available property; `sitemap-locations.xml` lists district/municipality landing pages from the backend's `/locations/published`
- **robots.txt:** `/static/robots.txt` — disallows `/panel/`, points to the sitemap
- **Structured data (JSON-LD):** RealEstateAgent in `app.html`; WebSite on `/`; CollectionPage on `/houses`; BreadcrumbList on district/municipality pages; listing data on property detail pages. Image URLs in `og:image`/JSON-LD are absolute `https://immolux.pt/v1/api/images/{id}`
- SSR always renders Portuguese (`<html lang="pt">`): the stored language is only read client-side, and there are no per-language URLs

## Svelte 5 Runes

The entire codebase uses Svelte 5 runes — never use Svelte 4 reactive syntax (`$:`, `export let`). Prefer `$app/state` over the legacy `$app/stores` (still used in a couple of places).

```typescript
let count = $state(0);                    // mutable reactive
let doubled = $derived(count * 2);        // computed (read-only)
let { value = $bindable() } = $props();   // two-way bindable prop
$effect(() => { /* runs after state changes */ });

// Component children
const { children } = $props();
{@render children?.()}                    // replaces <slot />
```

## API Client

`apiClient` in `src/lib/api/api-client.ts` wraps Axios with two critical settings:

- `withCredentials: true` — always sends session cookies
- `validateStatus: () => true` — **never throws** on any HTTP status

Always check `response.data.success`, never rely on try/catch for API errors:

```typescript
const response = await apiClient.get<PropertyDTO>('/properties/123');
if (response.data.success) {
	const property = response.data.data;
} else {
	notificationStore.error(response.data.error?.message ?? 'Error');
}
```

All URLs are auto-prefixed with `/v1/api` inside the client. Pass paths without it:

```typescript
apiClient.get('/properties'); // → GET /v1/api/properties
```

The base URL is `VITE_SERVER_URL`, falling back to `window.location.origin`. Backend error `message`s are English; only `INVALID_CREDENTIALS` and `RATE_LIMIT_EXCEEDED` are mapped to i18n keys (in `AppLoginForm`).

## Authentication

Auth state lives in `src/lib/stores/auth.ts`. It is **ephemeral** — relies entirely on the backend's HttpOnly `session_token` cookie (`SameSite=Strict`, so the dev front end and backend must both be on `localhost`). On each full page load the root layout calls `authStore.checkAuth()` (`GET /v1/api/isconnected`) and shows a full-screen `AppLoadingSpinner` until it resolves.

Panel pages guard themselves (the panel layout does not):

```typescript
onMount(() => {
	const unsub = authStore.subscribe((state) => {
		if (!state.isLoading && !state.isAuthenticated) goto(resolve('/'));
	});
	return unsub;
});
```

Never store auth state in localStorage; the cookie is HttpOnly and managed by the backend.

## Forms

`AppPropertyForm` and `AppContactForm` use **Superforms + Zod** in SPA mode (`AppLoginForm` is a plain `onsubmit`). Always call `cancel()` in `onSubmit` to prevent the default form submission, then call the API manually:

```typescript
const { form, errors, enhance, submitting } = superForm(defaults, {
	validators: zodClient(mySchema),
	SPA: true,
	dataType: 'json',
	onSubmit: async ({ cancel }) => {
		cancel(); // required — no SvelteKit action to submit to
		const res = await apiClient.post('/endpoint', $form);
		if (res.data.success) notificationStore.success('Saved!');
		else notificationStore.error(res.data.error?.message);
	}
});
```

With Zod 4, `zodClient(...)` needs a type workaround (`schema as any` / `@ts-expect-error`) — follow the existing forms. Enum values and `.max()` lengths in `src/lib/schemas/` mirror the backend's Ent schema; keep them in sync.

**Validation error messages are i18n keys** (e.g., `'properties.titleRequired'`). Translate before displaying:

```typescript
const t = (e: string | undefined) => (e ? $_(`${e}`) : '');
// Use: error={t($errors.title?.[0])}
```

## Internationalization

Three languages: `pt` (initial), `en` (fallback locale), `fr`. Label files: `src/lib/assets/labels/{lang}.json`.

**Rule: never hardcode user-visible strings.** Every label, button, heading, error message, and placeholder must use `$_('key')`. When adding a new string, add the key to all three files — `pt.json`, `en.json`, and `fr.json` — before using it in a component.

```svelte
<script>
	import { _ } from 'svelte-i18n';
</script>

<h1>{$_('houses.title')}</h1>
```

To change language, use the utility — not `locale.set()` directly — so it also persists to `localStorage` (key `immo-lux-language`):

```typescript
import { changeLanguage } from '$lib/utils/language';
changeLanguage('en');
```

i18n is initialized in `src/lib/i18n.ts` and the root `+layout.ts` awaits `waitLocale()` before rendering.

## Stores

| Store               | File                     | Purpose                                                                                               |
| ------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `authStore`         | `stores/auth.ts`         | `{ user, isAuthenticated, isLoading }` + `checkAuth()`, `login()`, `logout()`                         |
| `notificationStore` | `stores/notification.ts` | `.success()`, `.error()`, `.warning()`, `.info()` toasts (5s default; `0` = sticky), `.remove(id)`    |
| `locationsStore`    | `stores/locations.ts`    | Lazy-loads `/locations` once; flat district/municipality/parish name lists                            |
| `themeStore`        | `stores/theme.ts`        | `setTheme()` / `toggle()`, persisted to localStorage `theme`; subscribers get resolved `light`/`dark` |

`locationsStore` deduplicates — call `locationsStore.loadLocations()` freely, it only fetches once.

## Components

Key non-obvious component behaviors:

- **`AppInput`** — floating label; requires `bind:value` (uses `$bindable()`); accepts `error` string (translated)
- **`AppPropertyForm`** — handles both create and edit; pass `propertyId` for edit mode, and it loads the property itself. Manages the image lifecycle: new images are uploaded after the property is saved, deleted image IDs are queued and deleted after save, and display order is saved via `PUT /images/{id}/order`
- **`AppImageUpload`** — creates object URLs via `URL.createObjectURL()` and revokes them on removal; accepts `image/*` up to 10 MB / 10 images, but the backend only decodes JPEG/PNG/WebP/TIFF/BMP
- **`AppModal`** — controlled by a bindable `open` prop (renders itself inside `{#if open}`); optional `title`, `size`, `closeOnBackdrop`, `onClose`; Escape closes it; not a portal
- **`AppPropertyGrid`** — shared public card grid + pager; link mode (`pageHref`) or callback mode (`onPageChange`), with an `empty` snippet
- **`AppHomeHero`** — homepage intro + latest-properties grid

## Image Serving

Images are stored as BLOBs in the backend. Serve them via:

```
${VITE_SERVER_URL}/v1/api/images/{imageId}
```

To find a property's image IDs, call `/properties/{propertyId}/images`, which returns `{ images: PropertyImageDTO[] }`. `<img src>` is always built from `VITE_SERVER_URL`, even on SSR pages.

## Leaflet Maps

The property detail page is SSR, so Leaflet must never load on the server: `leaflet` and `svelte-leafletjs` are in `ssr.external` (`vite.config.ts`), and the page imports `svelte-leafletjs` dynamically inside `onMount`. Leaflet CSS comes from unpkg.

If the property has no `latitude`/`longitude`, the page geocodes its address client-side via `nominatim.openstreetmap.org`.

## Build Notes

- **All `console.*` calls and `debugger` statements are stripped in production** (`drop_console: true` in the terser config) — including `console.error`
- **Environment files** are in `env/`, not the project root (`envDir` in `vite.config.ts`, `kit.env.dir` in `svelte.config.js`). `.env.development` and `.env.production` are committed; `env/.env.template` lists the required keys (both are needed — the build fails without `PRIVATE_SERVER_URL`), and `.env.local` is gitignored
- **No service worker or web app manifest (deliberately):** an `@vite-pwa/sveltekit` setup was removed because nothing ever registered its worker, listings are live API data (offline adds little), and its ~2.4 MB precache would have been downloaded by every visitor. For a proper name/icon when someone adds the site to their home screen, a static `static/manifest.webmanifest` plus `<link rel="manifest">` in `app.html` is enough
- **Precompression** (`.br`/`.gz` next to every client asset, served by `node build`) comes from adapter-node's `precompress` (on by default); don't add a Vite compression plugin on top
- **No manual vendor chunking — keep it that way**: Rolldown `codeSplitting` groups also capture their matches' dependencies (`includeDependenciesRecursively` defaults to `true`), so the old `/node_modules\/.*svelte/` group swallowed svelte-i18n, svelte-leafletjs, svelte-fontawesome and superforms + zod into one ~680 kB chunk loaded on every page. Rolldown's automatic per-route splitting cut public pages from ~866 kB to ~587 kB of JS and keeps form code on `/panel`. Run `npm run build:analyze` before adding groups back
- **Build noise that is expected**: the `node:dns/promises … externalized for browser compatibility` warning comes from `@vinejs/vine`, which Vite resolves through superforms' all-adapters barrel (`sveltekit-superforms/adapters`) and then tree-shakes away; `[PLUGIN_TIMINGS]` is Rolldown's informational timing report
- The `a11y_consider_explicit_label` compiler warning is suppressed in `svelte.config.js`
