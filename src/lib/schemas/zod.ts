import { z } from 'zod';

// The CSP (svelte.config.js) has no 'unsafe-eval'. Without jitless, Zod probes
// `new Function('')` and the browser reports a CSP violation even though Zod
// catches the error and falls back. Schemas import `z` from here so this runs first.
z.config({ jitless: true });

export { z };
