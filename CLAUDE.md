# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Dev server on port 8080 (backend expected on 8082)
npm run build         # Production SPA build → build/
npm run preview       # Serve production build locally
npm run check         # Svelte + TypeScript type checking
npm run check:watch   # Type checking in watch mode
npm run lint          # Prettier check + ESLint
npm run format        # Auto-format with Prettier
```

## Architecture

**Pure SPA.** SvelteKit with `@sveltejs/adapter-static` and `fallback: 'index.html'`. Every route file exports `export const ssr = false; export const prerender = false;`. There is no server-side rendering anywhere.

**Route map:**

```
src/routes/
├── +layout.svelte          # Global: menu, footer, auth + i18n init on mount
├── +page.svelte            # Homepage (featured properties)
├── houses/+page.svelte     # Public listing with filters + pagination
├── houses/[id]/+page.svelte # Public property detail + map + contacts
├── panel/properties/       # Admin area (auth-guarded)
│   ├── +page.svelte        # User's own properties
│   ├── new/+page.svelte    # Create property (thin wrapper over AppPropertyForm)
│   └── [id]/+page.svelte   # Edit property (thin wrapper over AppPropertyForm)
└── sitemap.xml/+server.ts  # Dynamic XML sitemap
```

**Key lib layout:**

```
src/lib/
├── api/api-client.ts       # Axios wrapper — single export `apiClient`
├── stores/                 # auth, notification, theme, locations
├── components/             # All reusable UI components
├── types/                  # TypeScript interfaces (DTOs match backend)
├── schemas/                # Zod validation schemas for forms
├── assets/labels/          # i18n JSON files (pt.json, en.json, fr.json)
└── i18n.ts                 # Registers + initializes svelte-i18n
```

## Svelte 5 Runes

The entire codebase uses Svelte 5 runes — never use Svelte 4 reactive syntax (`$:`, `export let`).

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

Backend URL comes from `VITE_SERVER_URL` (set in `env/.env.development`, not `.env`).

## Authentication

Auth state lives in `src/lib/stores/auth.ts`. It is **ephemeral** — relies entirely on the backend session cookie. On every page load the root layout calls `authStore.checkAuth()` which hits `GET /v1/api/isconnected`.

```typescript
// Guard pattern for panel pages
onMount(() => {
	const unsub = authStore.subscribe((state) => {
		if (!state.isLoading && !state.isAuthenticated) goto('/');
	});
	return unsub;
});
```

Never store auth state in localStorage; the cookie is HttpOnly and managed by the backend.

## Forms

Forms use **Superforms + Zod** in SPA mode. Always call `cancel()` in `onSubmit` to prevent the default form submission, then call the API manually:

```typescript
const { form, errors, enhance, submitting } = superForm(defaults, {
	validators: zodClient(mySchema),
	SPA: true,
	onSubmit: async ({ cancel }) => {
		cancel(); // required — no SvelteKit action to submit to
		const res = await apiClient.post('/endpoint', $form);
		if (res.data.success) notificationStore.success('Saved!');
		else notificationStore.error(res.data.error?.message);
	}
});
```

**Validation error messages are i18n keys** (e.g., `'properties.titleRequired'`). Translate before displaying:

```typescript
const t = (e: string | undefined) => (e ? $_(`${e}`) : '');
// Use: error={t($errors.title?.[0])}
```

## Internationalization

Three languages: `pt` (default), `en`, `fr`. Label files: `src/lib/assets/labels/{lang}.json`.

**Rule: never hardcode user-visible strings.** Every label, button, heading, error message, and placeholder must use `$_('key')`. When adding a new string, add the key to all three files — `pt.json`, `en.json`, and `fr.json` — before using it in a component.

```svelte
<script>
	import { _ } from 'svelte-i18n';
</script>

<h1>{$_('houses.title')}</h1>
```

To change language, use the utility — not `locale.set()` directly — so it also persists to `localStorage`:

```typescript
import { changeLanguage } from '$lib/utils/language';
changeLanguage('en');
```

i18n is initialized in `src/lib/i18n.ts` and the root layout waits for `waitLocale()` before rendering.

## Stores

| Store               | File                     | Purpose                                                                       |
| ------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| `authStore`         | `stores/auth.ts`         | `{ user, isAuthenticated, isLoading }` + `checkAuth()`, `login()`, `logout()` |
| `notificationStore` | `stores/notification.ts` | `.success()`, `.error()`, `.warning()`, `.info()` toasts                      |
| `locationsStore`    | `stores/locations.ts`    | Lazy-loads `/locations` once, caches districts/municipalities/parishes        |
| `themeStore`        | `stores/theme.ts`        | Dark/light/auto; writes `dark` class to `document.documentElement`            |

`locationsStore` deduplicates — call `locationsStore.loadLocations()` freely, it only fetches once.

## Components

Key non-obvious component behaviors:

- **`AppInput`** — floating label; requires `bind:value` (uses `$bindable()`); accepts `error` string (translated)
- **`AppPropertyForm`** — handles both create and edit; pass `propertyId` for edit mode; manages image upload lifecycle (new images batched and uploaded after property save; deleted image IDs queued and deleted after save)
- **`AppImageUpload`** — creates object URLs via `URL.createObjectURL()`; caller must ensure `URL.revokeObjectURL()` on removal (done internally); validates size/type before adding
- **`AppModal`** — rendered conditionally by parent; not a portal; `onClose` callback required

## Image Serving

Images are stored as BLOBs in the backend. Serve them via:

```
${VITE_SERVER_URL}/v1/api/images/{imageId}
```

or per-property:

```
${VITE_SERVER_URL}/v1/api/properties/{propertyId}/images
```

(returns `PropertyImageDTO[]` with IDs; then load each via `/images/{id}`)

## Leaflet Maps

Leaflet and `svelte-leafletjs` are excluded from SSR in `vite.config.ts`. Import them dynamically or inside `onMount` to avoid hydration issues (even though SSR is off, this pattern is already established in the codebase):

```typescript
// Already in ssr.external in vite.config.ts:
// external: ['leaflet', 'svelte-leafletjs']
```

Map only renders when `latitude` and `longitude` are present on the property.

## Build Notes

- **`console.log` is stripped in production** (`drop_console: true` in terser config) — do not rely on console output for production debugging
- **Environment files** are in `env/` directory, not the project root — Vite is configured with `envDir: './env'`
- **Vendor chunks** are split: `vendor-svelte`, `vendor-icons`, `vendor-i18n`, `vendor-leaflet` — avoid importing leaflet or fontawesome in code paths that don't need them
- **Tailwind v4** is used via `@tailwindcss/vite` plugin — no `tailwind.config.js`; all theme customization is in `src/lib/styles/app.css` using OKLCH color values
- **Playfair Display 600 weight is disabled** (corrupted font file) — only weight 400 is available for the serif heading font
