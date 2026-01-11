---
apply: always
---

# ImmoLux Front-End Project Guidelines

## Project Overview

**ImmoLux** is a real estate website platform for listing and browsing houses for sale in Portugal.

### User Roles

- **Anonymous Users**: Can search, browse houses, and contact publishers
- **Authenticated Publishers**: Can login and publish house listings (access controlled by superusers)
- **Superusers**: Define and manage which users can publish listings

## Tech Stack

### Core Technologies

- **Language**: TypeScript (strict mode enabled)
- **Framework**: SvelteKit 2.x with Svelte 5.x
- **Styling**: TailwindCSS 4.x
  - @tailwindcss/forms
  - @tailwindcss/typography
- **Build Tool**: Vite 7.x
- **Adapter**: @sveltejs/adapter-static (SPA mode with fallback)

### Key Libraries

- **HTTP Client**: Axios 1.x for API communication
- **Internationalization**: svelte-i18n
- **Icons**: FontAwesome (@fortawesome/svelte-fontawesome)
  - Free Solid, Regular, and Brands icon sets
- **Code Quality**: ESLint, Prettier, svelte-check

### Backend Integration

- **Backend Server**: Golang API server built with Fiber v3 and Ent ORM
- **Backend Location**: `C:\Users\andre\Desktop\Development\immo-lux-back-end`
- **Backend Guidelines**: `C:\Users\andre\Desktop\Development\immo-lux-back-end\.aiassistant\rules\project-info.md`
- **API Communication**: RESTful API via Axios
- **Database**: PostgreSQL with Ent ORM for type-safe queries
- **Authentication**: Session-based with bcrypt password hashing

## TypeScript Standards

### Strict Typing Requirements

- **Everything must be typed** - No `any` types unless absolutely necessary
- Strict mode is enabled in `tsconfig.json`
- Use proper TypeScript interfaces and types for:
  - Component props
  - API responses and requests
  - Store data structures
  - Function parameters and return types

### Function Syntax - CRITICAL REQUIREMENT

**ALWAYS use arrow function syntax for all function declarations.**

#### Correct Usage

```typescript
// ✅ CORRECT - Arrow function syntax
const myFunction = () => {
	// function body
};

const greet = (name: string) => {
	console.log(`Hello, ${name}`);
};

const calculate = (a: number, b: number): number => {
	return a + b;
};
```

#### Incorrect Usage

```typescript
// ❌ WRONG - Traditional function syntax
function myFunction() {
	// function body
}

function greet(name: string) {
	console.log(`Hello, ${name}`);
}

function calculate(a: number, b: number): number {
	return a + b;
}
```

### Example Type Definitions

```typescript
// API Types
interface House {
	id: string;
	title: string;
	description: string;
	price: number;
	location: string;
	images: string[];
	publisherId: string;
	createdAt: Date;
	updatedAt: Date;
}

// Component Props
interface HouseCardProps {
	house: House;
	onContact?: (houseId: string) => void;
}
```

## Svelte 5 Guidelines

### Component Structure - CRITICAL REQUIREMENT

- **ALWAYS use Svelte 5 modern syntax** (runes: `$state`, `$derived`, `$effect`, `$props`)
- Prefer `<script lang="ts">` for all components
- **USE `{#snippet}` for reusable markup fragments within components**
- Snippets are type-safe, scoped, and more performant than slot-based patterns

### Svelte 5 Runes Overview

- **`$state`**: Reactive local state
- **`$derived`**: Computed values that automatically update
- **`$effect`**: Side effects that run when dependencies change
- **`$props`**: Component props with TypeScript support
- **`{#snippet}`**: Reusable markup fragments with parameters

### Component Best Practices

```svelte
<script lang="ts">
	import type { House } from '$lib/types';

	interface Props {
		house: House;
		featured?: boolean;
	}

	let { house, featured = false }: Props = $props();

	let isExpanded = $state(false);

	let displayPrice = $derived(house.price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }));

	const toggleExpanded = () => {
		isExpanded = !isExpanded;
	};
</script>
```

### Snippets - CRITICAL REQUIREMENT

**ALWAYS use `{#snippet}` for repeated markup patterns within a component instead of duplicating code.**

#### When to Use Snippets

Use snippets when you have:

- Repeated markup patterns within the same component
- Similar UI elements with slight variations (parameters)
- Conditional rendering of similar structures
- List items that share complex markup
- Modal/dialog content that appears in multiple places within the component

#### Snippet Syntax and Features

```svelte
<script lang="ts">
	import type { User } from '$lib/types';

	let users = $state<User[]>([]);
</script>

{#snippet userCard(user: User, highlighted: boolean)}
	<div class="card" class:highlighted>
		<h3>{user.firstName} {user.lastName}</h3>
		<p>{user.email}</p>
	</div>
{/snippet}

<!-- Use the snippet multiple times -->
<div class="grid">
	{#each users as user}
		{@render userCard(user, user.id === activeId)}
	{/each}
</div>

<!-- Snippets can also be passed as props -->
<AppModal>
	{#snippet header()}
		<h2>Custom Header</h2>
	{/snippet}

	{#snippet content()}
		<p>Modal content here</p>
	{/snippet}
</AppModal>
```

#### Examples: Bad vs Good

```svelte
<!-- ❌ BAD - Duplicated markup -->
<script lang="ts">
  let items = $state(['Item 1', 'Item 2', 'Item 3']);
</script>

<div class="desktop">
  {#each items as item}
    <div class="card bg-light-50 dark:bg-dark-800 p-4 rounded-lg">
      <h3 class="text-lg font-semibold text-dark-900 dark:text-light-50">{item}</h3>
      <p class="text-sm text-dark-300 dark:text-light-300">Description</p>
      <button class="btn-primary">Action</button>
    </div>
  {/each}
</div>

<div class="mobile">
  {#each items as item}
    <div class="card bg-light-50 dark:bg-dark-800 p-4 rounded-lg">
      <h3 class="text-lg font-semibold text-dark-900 dark:text-light-50">{item}</h3>
      <p class="text-sm text-dark-300 dark:text-light-300">Description</p>
      <button class="btn-primary">Action</button>
    </div>
  {/each}
</div>

<!-- ✅ GOOD - Using snippet -->
<script lang="ts">
  let items = $state(['Item 1', 'Item 2', 'Item 3']);
</script>

{#snippet itemCard(item: string)}
  <div class="card bg-light-50 dark:bg-dark-800 p-4 rounded-lg">
    <h3 class="text-lg font-semibold text-dark-900 dark:text-light-50">{item}</h3>
    <p class="text-sm text-dark-300 dark:text-light-300">Description</p>
    <button class="btn-primary">Action</button>
  </div>
{/snippet}

<div class="desktop">
  {#each items as item}
    {@render itemCard(item)}
  {/each}
</div>

<div class="mobile">
  {#each items as item}
    {@render itemCard(item)}
  {/each}
</div>
```

#### Advanced Snippet Patterns

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		// Snippets can be passed as props for flexible composition
		header?: Snippet;
		footer?: Snippet<[closeModal: () => void]>; // With parameters
	}

	let { title, header, footer }: Props = $props();

	const closeModal = () => {
		// close logic
	};
</script>

<div class="modal">
	<!-- Render snippet if provided, otherwise use default -->
	{#if header}
		{@render header()}
	{:else}
		<h2>{title}</h2>
	{/if}

	<div class="content">
		<!-- Modal content -->
	</div>

	{#if footer}
		{@render footer(closeModal)}
	{/if}
</div>
```

#### Snippet vs Component Decision Guide

| Use Snippet When                         | Use Component When                            |
| ---------------------------------------- | --------------------------------------------- |
| Markup is only used within one component | UI pattern is used across multiple components |
| Simple parameter passing needed          | Complex props and state management needed     |
| No lifecycle logic required              | Needs `$effect`, stores, or complex logic     |
| Pattern is <30 lines                     | Pattern exceeds 30-40 lines                   |
| No external imports needed               | Requires external utilities/components        |

#### Snippet Best Practices

- **Always type snippet parameters** for type safety
- Use descriptive snippet names that indicate their purpose
- Keep snippets focused and single-purpose
- Place snippet definitions at the top of the template section
- Snippets can call other snippets for composition
- Snippets have access to component scope variables
- Use snippets for conditional rendering variations

### File Naming Conventions

- Components: PascalCase (e.g., `HouseCard.svelte`, `AppMenu.svelte`)
  - **App-level components MUST have "App" prefix** (e.g., `AppMenu.svelte`, `AppFooter.svelte`, `AppThemeToggler.svelte`)
  - App-level components are global UI components used across the application layout
- Routes: lowercase with hyphens (e.g., `+page.svelte`, `+layout.svelte`)
- TypeScript files: camelCase (e.g., `i18n.ts`, `apiClient.ts`)
- Types/Interfaces: **ALWAYS place in `src/lib/types/` folder** - Separate in individual files or use `app.d.ts` for globals

## Project Structure

```
src/
├── app.d.ts              # Global type definitions
├── app.html              # HTML template
├── lib/
│   ├── assets/           # Static assets, translations, fonts
│   │   ├── fonts/        # Local font files (.woff2)
│   │   │   ├── inter.woff2
│   │   │   ├── inter-300.woff2
│   │   │   ├── inter-600.woff2
│   │   │   ├── playfair.woff2
│   │   │   └── playfair-600.woff2
│   │   └── labels/       # i18n translation files (en.json, pt.json, fr.json)
│   ├── components/       # Reusable Svelte components (App* prefix for global components)
│   ├── constants/        # Application constants (languages, API endpoints, configuration)
│   ├── styles/           # Global styles and TailwindCSS imports
│   │   ├── app.css       # Main styles with theme colors and base layer
│   │   └── fonts.css     # Font-face declarations for local fonts
│   ├── types/            # TypeScript type definitions (REQUIRED for all types/interfaces)
│   ├── utils/            # Utility functions and helpers
│   └── i18n.ts           # Internationalization setup
└── routes/               # SvelteKit file-based routing
    ├── +layout.svelte    # Root layout
    ├── +layout.ts        # Root layout load function
    ├── +page.svelte      # Home page
    ├── houses/           # House listing routes
    └── panel/            # Admin/Publisher panel routes
```

### Folder Organization Rules

- **types/**: ALL TypeScript interfaces, types, and type definitions MUST go here
- **constants/**: Application-wide constants (e.g., languages, API endpoints, configuration)
- **utils/**: Reusable utility functions and helper methods
- **components/**: Reusable Svelte components only
- **assets/fonts/**: Local font files (Inter, Playfair Display) in .woff2 format
- **styles/**: Global CSS files including fonts.css and app.css

## Internationalization (i18n)

### Supported Languages

- **Portuguese (pt)**: Default/fallback language
- **English (en)**
- **French (fr)**

### Implementation

- All user-facing text must be internationalized
- Translation files located in: `src/lib/assets/labels/`
- Use `svelte-i18n` `$t` store for translations

### Usage Example

```svelte
<script lang="ts">
	import { t } from 'svelte-i18n';
</script>

<h1>{$t('houses.title')}</h1><p>{$t('houses.description', { values: { count: 5 } })}</p>
```

### Translation File Structure

```json
{
	"houses": {
		"title": "Available Houses",
		"search": "Search houses",
		"contact": "Contact Publisher"
	}
}
```

## Styling Guidelines

### Typography - CRITICAL REQUIREMENT

**ALWAYS use the locally-hosted custom fonts for the project.**

#### Font Configuration

The project uses two professional font families loaded from local `.woff2` files:

- **Inter**: Modern sans-serif font for body text and UI elements
  - Weights available: 300 (Light), 400 (Regular), 600 (Semi-Bold)
  - Applied to: `body`, all UI elements, paragraphs, labels
- **Playfair Display**: Elegant serif font for headings
  - Weights available: 400 (Regular), 600 (Semi-Bold)
  - Applied to: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`

#### Font Files Location

- Path: `src/lib/assets/fonts/`
- Files:
  - `inter.woff2` (Regular 400)
  - `inter-300.woff2` (Light 300)
  - `inter-600.woff2` (Semi-Bold 600)
  - `playfair.woff2` (Regular 400)
  - `playfair-600.woff2` (Semi-Bold 600)
- Font declarations: `src/lib/styles/fonts.css`
- Imported in: `src/lib/styles/app.css`

#### Font Usage Guidelines

```svelte
<!-- ✅ CORRECT - Headings automatically use Playfair Display -->
<h1 class="text-5xl font-normal">Luxury Properties</h1>
<h2 class="text-4xl font-semibold">About Us</h2>

<!-- ✅ CORRECT - Body text automatically uses Inter -->
<p class="text-lg font-light">Our exclusive collection of properties...</p>
<div class="text-base font-normal">Property details...</div>

<!-- Font weights available -->
<p class="font-light">Light text (300)</p>
<p class="font-normal">Normal text (400)</p>
<p class="font-medium">Medium text (500)</p>
<p class="font-semibold">Semi-bold text (600)</p>
```

#### Typography Best Practices

- Use `font-light` (300) for elegant, spacious text
- Use `font-normal` (400) for standard body text
- Use `font-medium` (500) for emphasis
- Use `font-semibold` (600) for strong emphasis
- Combine with tracking utilities for luxury feel: `tracking-tight`, `tracking-wide`, `tracking-widest`

### TailwindCSS Usage

- Use Tailwind utility classes for all styling
- Leverage Tailwind plugins:
  - `@tailwindcss/forms` for form elements
  - `@tailwindcss/typography` for rich text content
- Avoid custom CSS unless absolutely necessary
- Use responsive design utilities (`sm:`, `md:`, `lg:`, `xl:`)

### Theme Colors - CRITICAL REQUIREMENT

**ALWAYS use theme colors defined in `src/lib/styles/app.css` - NEVER use explicit colors like `blue-600`, `gray-800`, `purple-700`, etc.**

#### Available Theme Colors

The project defines the following color palettes (each with shades 50-950):

- **primary**: Main brand color (purple/blue)
- **secondary**: Accent color (yellow/lime)
- **tertiary**: Supporting neutral color
- **error**: Error states and destructive actions
- **warning**: Warning states
- **success**: Success states and positive actions
- **info**: Informational states
- **light**: Light backgrounds and text
- **dark**: Dark backgrounds and text

#### Correct Usage Examples

```svelte
<!-- ✅ CORRECT - Using theme colors -->
<nav class="bg-primary-600 text-light-50">
	<a href="/" class="hover:bg-primary-700">Home</a>
</nav>

<div class="bg-light-300 text-dark-900">
	<button class="bg-secondary-500 text-light-50 hover:bg-secondary-600">Click me</button>
</div>

<!-- ❌ WRONG - Using explicit Tailwind colors -->
<nav class="bg-blue-600 text-white">
	<a href="/" class="hover:bg-blue-700">Home</a>
</nav>

<div class="bg-gray-50 text-gray-900">
	<button class="bg-yellow-500 text-white hover:bg-yellow-600">Click me</button>
</div>
```

#### Color Usage Guidelines

- **Backgrounds**: Use `primary-*`, `light-*`, `dark-*` for main backgrounds
- **Text**: Use `light-50` for light text, `dark-*` for dark text
- **Buttons/CTAs**: Use `primary-*`, `secondary-*`, or `success-*`
- **Borders**: Use lighter shades (100-300) of theme colors
- **Hover states**: Typically one shade darker (500 → 600, 600 → 700)
- **Icons**: Match the text color or use theme accent colors

### Component Styling Example

```svelte
<div class="container mx-auto px-4">
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		<article class="rounded-lg border border-light-600 bg-light-50 p-6 shadow-sm transition-shadow hover:shadow-md">
			<h3 class="font-bold text-dark-900">Title</h3>
			<p class="text-dark-300">Description</p>
			<button class="rounded bg-primary-500 px-4 py-2 text-light-50 hover:bg-primary-600"> Action </button>
		</article>
	</div>
</div>
```

### Consistent Design Patterns

- Use consistent spacing (p-4, p-6, gap-4, gap-6)
- Maintain color scheme consistency by using theme colors
- Apply hover states for interactive elements
- Ensure mobile-first responsive design

### Dark Theme Support - CRITICAL REQUIREMENT

**ALL components and pages MUST include dark theme support using Tailwind's `dark:` variant.**

#### Implementation

- Dark theme is managed via `src/lib/stores/theme.ts` using `svelte-use` library
- Theme state is persisted in localStorage and respects system preferences
- Dark mode is activated by adding `.dark` class to document root
- Configured in `src/lib/styles/app.css` with `@variant dark (&:is(.dark *))`

#### Dark Theme Rules

- **EVERY styled element must have dark mode variants**
- Use `dark:` prefix for all dark theme specific styles
- Backgrounds: Light backgrounds → dark backgrounds (e.g., `bg-light-300 dark:bg-dark-800`)
- Text: Dark text → light text (e.g., `text-dark-900 dark:text-light-50`)
- Borders: Adjust border colors for dark mode visibility
- Shadows: Consider reducing or adjusting shadows in dark mode

####Examples

```svelte
<!-- ✅ CORRECT - Dark theme support included -->
<div class="bg-light-300 text-dark-900 dark:bg-dark-800 dark:text-light-50">
	<h1 class="text-dark-900 dark:text-light-50">Title</h1>
	<p class="text-dark-300 dark:text-light-300">Description</p>
	<button class="bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800"> Action </button>
</div>

<Card class="bg-light-50 dark:bg-dark-700">
	<p class="text-dark-900 dark:text-light-50">Content</p>
</Card>

<!-- ❌ WRONG - No dark theme support -->
<div class="bg-light-300 text-dark-900">
	<h1 class="text-dark-900">Title</h1>
	<p class="text-dark-300">Description</p>
</div>
```

#### Common Dark Theme Patterns

- Layouts: `bg-light-300 dark:bg-dark-800`
- Cards: `bg-light-50 dark:bg-dark-700`
- Navigation: `bg-primary-600 dark:bg-dark-900`
- Footer: `bg-dark-800 dark:bg-dark-950`
- Headings: `text-dark-900 dark:text-light-50`
- Body text: `text-dark-300 dark:text-light-300`
- Borders: `border-light-600 dark:border-dark-600`
- Hover states: Adjust shades appropriately for dark backgrounds

## API Integration

### API Client (src/lib/api/api-client.ts)

- Centralized ApiClient class for all HTTP requests
- All server responses wrapped in `ServerAPIResponse<T>` structure
- Axios configured to return responses for all status codes
- Fallback to `window.location.origin` if `VITE_SERVER_URL` not set
- All API routes automatically prefixed with `/v1/api/`

### Server Response Type (src/lib/types/api.ts)

```typescript
export interface ServerAPIError {
	code?: string;
	message: string;
}

export interface ServerAPIResponse<T = unknown> {
	success: boolean;
	data: T;
	error: ServerAPIError | null;
}
```

### Using the API Client

```typescript
import { apiClient } from '$lib/api/api-client';
import type { ServerAPIResponse } from '$lib/types/api';

interface House {
	id: string;
	title: string;
	price: number;
}

// Routes are automatically prefixed with /v1/api/
// This call will request: /v1/api/houses
const response = await apiClient.get<House[]>('/houses');
const serverResponse: ServerAPIResponse<House[]> = response.data;

if (serverResponse.success) {
	const houses = serverResponse.data;
} else {
	console.error(serverResponse.error?.message);
}
```

## Authentication & Authorization

### Implementation

- **Authentication Store**: `src/lib/stores/auth.ts`
  - Manages authentication state (user, isAuthenticated, isLoading)
  - Methods: `checkAuth()`, `login()`, `logout()`
  - Integrated with backend session-based authentication
- **Session-based auth**: HTTP-only cookies with JWT tokens
- **Backend integration**: See `@rule:auth-flow.md` for complete backend implementation details

### Authentication Flow

1. **Login**: User submits credentials → Backend validates → JWT cookie set → Auth store updated
2. **Session check**: On app load, `checkAuth()` verifies session via `/isconnected` endpoint
3. **Logout**: User clicks logout → Backend invalidates session → Cookie cleared → Auth store reset

### Auth Store Usage

```typescript
import { authStore } from '$lib/stores/auth';

// Check authentication on app load
await authStore.checkAuth();

// Login
const result = await authStore.login(email, password, rememberMe);
if (result.success) {
	// Handle success
}

// Logout
await authStore.logout();

// Access auth state
const authState = $authStore; // { user, isAuthenticated, isLoading }
```

### Protected Routes Pattern

```typescript
// In +layout.ts or +page.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch }) => {
	const token = localStorage.getItem('authToken');

	if (!token) {
		throw redirect(307, '/login');
	}

	// Verify token with backend
	// Return user data
};
```

### Login Modal & Form

- **AppModal**: Reusable modal component with animations
- **AppLoginForm**: Login form with floating label inputs
  - Async loaded when modal opens (code splitting)
  - Shows loading overlay during authentication
  - Displays notifications for success/error states
- Located in AppMenu component with lazy loading

## Form Components

### AppInput Component

**Location**: `src/lib/components/AppInput.svelte`

Custom input component with floating labels for consistent form styling across the application.

#### Features

- **Floating labels**: Labels animate up when input is focused or has value
- **Theme support**: Full light/dark mode styling
- **Validation states**: Error state with red styling
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Required indicator**: Asterisk for required fields

#### Usage

```svelte
<script lang="ts">
	import AppInput from '$lib/components/AppInput.svelte';

	let email = $state('');
	let password = $state('');
</script>

<AppInput id="email" type="email" label="Email Address" bind:value={email} required autocomplete="email" />

<AppInput
	id="password"
	type="password"
	label="Password"
	bind:value={password}
	required
	error={errorMessage}
	autocomplete="current-password"
/>
```

#### Props

- `id` (required): Input element ID
- `type`: Input type (text, email, password, tel, url, number)
- `label` (required): Floating label text
- `value`: Bindable input value
- `placeholder`: Placeholder text (default: ' ')
- `required`: Mark field as required
- `disabled`: Disable input
- `error`: Error message to display
- `autocomplete`: Autocomplete attribute

#### Styling

- Uses theme colors (primary, error, light, dark)
- Supports dark mode with `dark:` variants
- Floating label positioned at `top-2` when active
- Input padding: `pt-7 pb-3` for proper spacing

### AppTextarea Component

**Location**: `src/lib/components/AppTextarea.svelte`

Custom textarea component with floating labels, matching the AppInput design.

#### Features

- **Floating labels**: Labels animate up when textarea is focused or has value
- **Theme support**: Full light/dark mode styling
- **Validation states**: Error state with red styling
- **Required indicator**: Asterisk for required fields

#### Usage

```svelte
<script lang="ts">
	import AppTextarea from '$lib/components/AppTextarea.svelte';

	let notes = $state('');
</script>

<AppTextarea id="notes" label="Notes" bind:value={notes} rows={3} error={errorMessage} />
```

#### Props

- `id` (required): Textarea element ID
- `label` (required): Floating label text
- `value`: Bindable textarea value
- `placeholder`: Placeholder text (default: ' ')
- `required`: Mark field as required
- `disabled`: Disable textarea
- `error`: Error message to display
- `rows`: Number of visible text lines (default: 3)

## Form Validation - CRITICAL REQUIREMENT

### Overview

**ALWAYS use sveltekit-superforms with Zod for form validation** - provides automatic type-safe validation with real-time feedback and minimal boilerplate.

### Form Validation Stack

- **Library**: sveltekit-superforms (https://superforms.rocks/)
- **Validator**: Zod with `zodClient` adapter
- **Location**: Schemas in `src/lib/schemas/`
- **Features**:
  - Automatic client-side and server-side validation
  - Type-safe form handling with TypeScript inference
  - Real-time field validation as user types
  - Built-in loading states and error handling
  - Minimal boilerplate code

### Installation

```bash
npm install sveltekit-superforms zod
```

### Creating Validation Schemas

**Location**: `src/lib/schemas/`

```typescript
// src/lib/schemas/contactSchema.ts
import { z } from 'zod';

export const contactSchema = z.object({
	name: z.string().min(1, 'Name is required').max(150, 'Name must be less than 150 characters').trim(),
	email: z
		.string()
		.min(1, 'Email is required')
		.email('Please enter a valid email address')
		.max(255, 'Email must be less than 255 characters')
		.trim(),
	phone: z.string().min(1, 'Phone is required').max(20, 'Phone must be less than 20 characters').trim(),
	notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional().default('')
});

// Export TypeScript type inferred from schema
export type ContactFormData = z.infer<typeof contactSchema>;
```

### Form Implementation with sveltekit-superforms

#### Complete Example

```svelte
<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import AppInput from '$lib/components/AppInput.svelte';
	import AppTextarea from '$lib/components/AppTextarea.svelte';
	import { contactSchema, type ContactFormData } from '$lib/schemas/contactSchema';
	import { apiClient } from '$lib/api/api-client';
	import { notificationStore } from '$lib/stores/notification';
	import type { ServerAPIResponse } from '$lib/types/api';
	import { _ } from 'svelte-i18n';

	interface Props {
		onSuccess?: (data: ContactFormData) => void;
		onCancel?: () => void;
	}

	let { onSuccess, onCancel }: Props = $props();

	// Initialize superForm with Zod schema
	const { form, errors, enhance, delayed, allErrors } = superForm(
		{ name: '', email: '', phone: '', notes: '' },
		{
			validators: zodClient(contactSchema),
			dataType: 'json',
			resetForm: false,
			invalidateAll: false,
			onUpdate: async ({ form }) => {
				if (!form.valid) {
					return;
				}

				try {
					const response = await apiClient.post<ContactFormData>('/contacts', {
						name: form.data.name.trim(),
						email: form.data.email.trim(),
						phone: form.data.phone.trim(),
						notes: form.data.notes?.trim() || undefined
					});

					const serverResponse: ServerAPIResponse<ContactFormData> = response.data;

					if (serverResponse.success) {
						notificationStore.success($_('contacts.createSuccess'));
						if (onSuccess) {
							onSuccess(serverResponse.data);
						}
					} else {
						notificationStore.error(serverResponse.error?.message || $_('contacts.createError'));
					}
				} catch (error) {
					notificationStore.error($_('contacts.createError'));
					console.error('Contact creation error:', error);
				}
			}
		}
	);

	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		}
	};
</script>

<form method="POST" use:enhance class="space-y-4">
	<AppInput
		id="contact-name"
		type="text"
		label={$_('contacts.name')}
		bind:value={$form.name}
		required
		error={$errors.name?.[0] || ''}
		disabled={$delayed}
	/>

	<AppInput
		id="contact-email"
		type="email"
		label={$_('contacts.email')}
		bind:value={$form.email}
		required
		error={$errors.email?.[0] || ''}
		disabled={$delayed}
		autocomplete="email"
	/>

	<AppInput
		id="contact-phone"
		type="tel"
		label={$_('contacts.phone')}
		bind:value={$form.phone}
		required
		error={$errors.phone?.[0] || ''}
		disabled={$delayed}
		autocomplete="tel"
	/>

	<AppTextarea
		id="contact-notes"
		label={$_('contacts.notes')}
		bind:value={$form.notes}
		error={$errors.notes?.[0] || ''}
		disabled={$delayed}
		rows={3}
	/>

	<div class="flex gap-3 pt-2">
		<button
			type="button"
			onclick={handleCancel}
			disabled={$delayed}
			class="flex-1 rounded-lg border-2 border-light-600 bg-light-50 px-4 py-2 font-medium text-dark-900 transition-colors hover:bg-light-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-light-50 dark:hover:bg-dark-600"
		>
			{$_('contacts.cancel')}
		</button>
		<button
			type="submit"
			disabled={$delayed || $allErrors.length > 0}
			class="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-light-50 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-700 dark:hover:bg-primary-800"
		>
			{$delayed ? $_('contacts.creating') : $_('contacts.create')}
		</button>
	</div>
</form>
```

### Key superForm Features

#### `superForm()` Hook

```typescript
const { form, errors, enhance, delayed, allErrors } = superForm(initialData, options);
```

**Returns:**

- `form`: Svelte store containing form data (use `$form.fieldName`)
- `errors`: Svelte store containing field-level errors (use `$errors.fieldName`)
- `enhance`: Form action for progressive enhancement (use `use:enhance`)
- `delayed`: Boolean store indicating loading state (use `$delayed`)
- `allErrors`: Array of all current validation errors (use `$allErrors.length > 0`)

**Options:**

- `validators`: Zod schema with `zodClient()` adapter for client-side validation
- `dataType`: Format for form submission ('json' or 'form-data')
- `resetForm`: Whether to reset form after successful submission
- `invalidateAll`: Whether to invalidate all data after submission
- `onUpdate`: Custom submission handler (receives validated data)

#### Real-time Validation

Validation happens automatically as the user types:

```svelte
<!-- Errors appear automatically when field is invalid -->
<AppInput bind:value={$form.email} error={$errors.email?.[0] || ''} />
```

#### Loading States

Use `$delayed` to show loading indicators and disable inputs:

```svelte
<AppInput disabled={$delayed} />

<button type="submit" disabled={$delayed}>
	{$delayed ? 'Submitting...' : 'Submit'}
</button>
```

#### Form Validity

Check if form has any errors:

```svelte
<button type="submit" disabled={$delayed || $allErrors.length > 0}> Submit </button>
```

### Validation Best Practices

1. **Always use zodClient adapter**: `validators: zodClient(schema)`
2. **Bind to $form stores**: Use `bind:value={$form.fieldName}`
3. **Display errors from $errors**: Show `$errors.fieldName?.[0]`
4. **Disable on loading**: Use `disabled={$delayed}` on all inputs
5. **Disable invalid submit**: Use `disabled={$delayed || $allErrors.length > 0}`
6. **Handle in onUpdate**: Process API calls in the `onUpdate` callback
7. **Type safety**: Use `z.infer<typeof schema>` for TypeScript types

### Common Validation Patterns

```typescript
// Required string
z.string().min(1, 'Field is required').trim();

// Email
z.string().email('Invalid email address').trim();

// Phone (permissive - any format)
z.string().min(1, 'Phone is required').max(20).trim();

// Number with range
z.number().min(0, 'Must be positive').max(100, 'Too large');

// Optional with default
z.string().optional().default('');

// Custom validation
z.string().refine((val) => val.length >= 8, {
	message: 'Password must be at least 8 characters'
});

// Conditional validation
z.object({
	hasAddress: z.boolean(),
	address: z.string().optional()
}).refine((data) => !data.hasAddress || data.address, { message: 'Address required', path: ['address'] });
```

### Form Best Practices

- **Always use AppInput** for text inputs instead of native inputs
- **Always use AppTextarea** for textarea elements
- **Always use Zod** for form validation
- Add proper `autocomplete` attributes for better UX
- Provide clear, user-friendly error messages
- Use `required` prop for mandatory fields
- Keep consistent spacing between form elements
- Disable submit button when form is invalid
- Show validation errors in real-time (as user types)

## Notification System

### Notification Store

**Location**: `src/lib/stores/notification.ts`

Centralized notification management for displaying user feedback messages.

#### Features

- **4 notification types**: success, error, warning, info
- **Auto-dismiss**: Configurable duration (default: 5 seconds)
- **Manual dismiss**: Close button on each notification
- **Queue management**: Multiple notifications stack vertically

#### Usage

```typescript
import { notificationStore } from '$lib/stores/notification';

// Show notifications
notificationStore.success('Login successful');
notificationStore.error('Invalid credentials');
notificationStore.warning('Session expiring soon');
notificationStore.info('New features available');

// Custom duration (in milliseconds)
notificationStore.success('Saved!', 3000);

// Manual removal
notificationStore.remove(notificationId);
```

### AppNotification Component

**Location**: `src/lib/components/AppNotification.svelte`

Visual notification display component integrated into the root layout.

#### Features

- **Position**: Bottom-left corner of screen
- **Animations**: Slide-in from left using Svelte transitions
- **Color-coded**: Different colors per notification type
- **Responsive**: Adjusts width on mobile devices
- **Theme-aware**: Full dark mode support

#### Styling

- Success: Green background with checkmark icon
- Error: Red background with exclamation icon
- Warning: Yellow background with warning triangle icon
- Info: Blue background with info icon

#### Integration

Already integrated in `src/routes/+layout.svelte`:

```svelte
<AppNotification />
```

### Notification Patterns

#### After Successful Actions

```typescript
const result = await authStore.login(email, password, rememberMe);
if (result.success) {
	notificationStore.success($_('auth.loginSuccess'));
} else {
	notificationStore.error(result.error || $_('auth.loginError'));
}
```

#### Form Validation

```typescript
if (!isValid) {
	notificationStore.error($_('validation.requiredFields'));
	return;
}
```

#### API Errors

```typescript
try {
	const response = await apiClient.post('/endpoint', data);
	if (!response.data.success) {
		notificationStore.error(response.data.error?.message);
	}
} catch (error) {
	notificationStore.error($_('errors.networkError'));
}
```

## Loading States

### AppLoadingSpinner Component

**Location**: `src/lib/components/AppLoadingSpinner.svelte`

Full-screen loading indicator for async operations.

#### Features

- **Two modes**: Page load (solid background) and overlay (transparent backdrop)
- **Customizable message**: Display operation-specific text
- **Theme support**: Works in light and dark modes

#### Usage

```svelte
<script lang="ts">
	import AppLoadingSpinner from '$lib/components/AppLoadingSpinner.svelte';

	let isLoading = $state(false);
</script>

{#if isLoading}
	<AppLoadingSpinner message="Loading..." overlay={false} />
{/if}

<!-- For overlay mode (on top of existing content) -->
{#if isProcessing}
	<AppLoadingSpinner message="Processing..." overlay={true} />
{/if}
```

#### Props

- `message`: Loading text (default: "Loading...")
- `overlay`: Use transparent overlay mode (default: false)

#### Use Cases

- Initial app load (in root layout)
- Form submissions (login, logout)
- Data fetching operations
- File uploads
- Long-running operations

## Development Workflow

### Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Run svelte-check for type checking
npm run check:watch  # Run svelte-check in watch mode
npm run format       # Format code with Prettier
npm run lint         # Lint code with ESLint and check formatting
```

### Code Quality Standards

- **Always run type checking**: `npm run check` before committing
- **Format code**: Use Prettier (`npm run format`)
- **Lint code**: Ensure ESLint passes (`npm run lint`)
- **No console logs**: Remove debug statements before committing
- **Meaningful commits**: Write clear, descriptive commit messages

### Pre-commit Checklist

1. Run `npm run check` - ensure no TypeScript errors
2. Run `npm run lint` - ensure code style compliance
3. Test functionality in browser
4. Verify i18n for all new user-facing text
5. Check responsive design on multiple screen sizes

## Best Practices

### Component Design - CRITICAL REQUIREMENT

**ALWAYS create custom reusable components (prefixed with `App*`) instead of repeating code.**

#### Component Reusability Rules

- **Extract repeated UI patterns** into custom components immediately
- **All global/app-level components MUST use `App*` prefix** (e.g., `AppUserDropdown`, `AppInput`, `AppModal`)
- Keep components small and focused (single responsibility)
- Use composition over inheritance
- Prefer props for configuration over hardcoded values
- Extract reusable logic into separate utilities/composables

#### When to Create a Custom Component

Create a new `App*` component when:

- The same UI pattern appears in multiple places
- A section of code exceeds ~30-40 lines and can be isolated
- The functionality can be reused across different pages/components
- You need consistent behavior across the application (modals, dropdowns, inputs, etc.)

#### Examples of Good Component Extraction

```svelte
<!-- ❌ BAD - Repeated dropdown code in AppMenu -->
<div class="relative">
	<button onclick={toggle}>
		<FontAwesomeIcon icon={faUser} />
	</button>
	{#if open}
		<div class="absolute ...">
			<!-- dropdown content -->
		</div>
	{/if}
</div>

<!-- ✅ GOOD - Extracted to AppUserDropdown component -->
<AppUserDropdown user={authState.user} onLogout={handleLogout} />
```

#### Existing Reusable Components

The project already includes these `App*` components - **ALWAYS use them instead of creating custom implementations**:

- **AppInput**: Form inputs with floating labels
- **AppModal**: Modal dialogs with animations
- **AppLoadingSpinner**: Loading indicators
- **AppNotification**: Toast notifications
- **AppTooltip**: Tooltips for UI elements
- **AppThemeToggler**: Theme switcher button
- **AppUserDropdown**: User menu dropdown
- **AppLoginForm**: Login form
- **AppMenu**: Main navigation menu
- **AppFooter**: Footer component

### State Management

- Use Svelte 5 runes (`$state`, `$derived`) for local state
- Consider context API for shared state between components
- Keep state as local as possible
- Use stores only when necessary for global state

### Performance

- Lazy load routes and components where appropriate
- Optimize images (use appropriate formats and sizes)
- Minimize bundle size - avoid unnecessary dependencies
- Use SvelteKit's built-in preloading and prefetching

### Accessibility

- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Test with screen readers

### Security

- Sanitize user input
- Validate data on both client and server
- Use HTTPS for production
- Protect sensitive data (tokens, user info)
- Implement CSRF protection for authenticated requests

## Documentation

### Code Comments

- **Do NOT over-comment code** - avoid excessive or obvious comments
- Only add comments when something is:
  - Abnormal or unexpected behavior
  - Complex logic that isn't immediately clear
  - Non-obvious workarounds or edge cases
  - Critical business logic that needs context
- Explain "why" not "what" - code should be self-documenting
- Avoid JSDoc comments for simple functions with clear type signatures
- Keep comments minimal and up-to-date with code changes

### Examples

```typescript
// ❌ BAD - Unnecessary comments
// Get all houses
const houses = await apiClient.get<House[]>('/houses');

// ❌ BAD - Obvious JSDoc
/**
 * Gets a house by ID
 * @param id - The house ID
 * @returns The house
 */
async getById(id: string): Promise<House> { ... }

// ✅ GOOD - No comment needed, code is clear
const houses = await apiClient.get<House[]>('/houses');

// ✅ GOOD - Comments only for non-obvious cases
// Using string concatenation instead of URL params due to backend API limitation
const url = `/houses?filter=${encodeURIComponent(filter)}`;

// ✅ GOOD - Explaining unexpected behavior
// Backend returns 200 even on validation errors, check success flag
if (!response.data.success) { ... }
```

## Testing (Future)

While not currently implemented, consider adding:

- Unit tests (Vitest)
- Component tests (@testing-library/svelte)
- E2E tests (Playwright)
- Visual regression tests

---

**Remember**: This is a TypeScript-strict, internationalized, modern Svelte application. Every line of code should reflect these core principles: type safety, i18n support, and clean component architecture.
