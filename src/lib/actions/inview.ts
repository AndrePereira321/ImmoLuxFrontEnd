/**
 * Svelte action that adds the 'in-view' class to an element when it enters the viewport.
 * Used for scroll-triggered reveal animations.
 *
 * Usage:
 *   <div use:inview class="reveal reveal-up">...</div>
 *   <div use:inview={{ threshold: 0.3, onEnter: () => doSomething() }}>...</div>
 */
export function inview(node: HTMLElement, options?: { threshold?: number; once?: boolean; onEnter?: () => void }) {
	const { threshold = 0.12, once = true, onEnter } = options ?? {};

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add('in-view');
					onEnter?.();
					if (once) observer.unobserve(node);
				} else if (!once) {
					node.classList.remove('in-view');
				}
			}
		},
		{ threshold }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
