<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTimes } from '@fortawesome/free-solid-svg-icons';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title?: string;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		closeOnBackdrop?: boolean;
		onClose?: () => void;
		children?: Snippet;
	}

	let { open = $bindable(false), title, size = 'md', closeOnBackdrop = true, onClose, children }: Props = $props();

	const handleClose = () => {
		open = false;
		if (onClose) {
			onClose();
		}
	};

	const handleBackdropClick = (e: MouseEvent) => {
		if (closeOnBackdrop && e.target === e.currentTarget) {
			handleClose();
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			handleClose();
		}
	};

	$effect(() => {
		if (open) {
			document.addEventListener('keydown', handleKeyDown);
		} else {
			document.removeEventListener('keydown', handleKeyDown);
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	});

	const sizeClasses = {
		xs: 'max-w-xs',
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl'
	};
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/50 p-4 backdrop-blur-sm"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<!-- Modal -->
		<div
			class="relative w-full {sizeClasses[size]} rounded-lg bg-light-50 shadow-xl dark:bg-dark-800"
			role="dialog"
			aria-modal="true"
		>
			<!-- Close Button -->
			<button
				onclick={handleClose}
				class="absolute top-4 right-4 text-dark-400 transition-colors hover:text-dark-900 dark:text-light-400 dark:hover:text-light-50"
				aria-label="Close"
			>
				<FontAwesomeIcon icon={faTimes} class="text-xl" />
			</button>

			<!-- Content -->
			<div class="space-y-6 p-6">
				{#if title}
					<h3 class="pr-8 text-2xl font-semibold text-dark-900 dark:text-light-50">
						{title}
					</h3>
				{/if}

				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>
	</div>
{/if}
