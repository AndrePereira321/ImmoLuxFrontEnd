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
		class="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/40 p-4 backdrop-blur-md"
		onclick={handleBackdropClick}
		role="presentation"
		style="animation: fadeIn 0.15s ease-out"
	>
		<!-- Modal -->
		<div
			class="relative w-full {sizeClasses[
				size
			]} overflow-hidden rounded-2xl border border-light-300/60 bg-white shadow-2xl dark:border-dark-700/60 dark:bg-dark-800"
			role="dialog"
			aria-modal="true"
			style="animation: fadeInUp 0.2s ease-out"
		>
			<!-- Close Button -->
			<button
				onclick={handleClose}
				class="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-dark-400 transition-all hover:bg-light-100 hover:text-dark-700 dark:text-light-500 dark:hover:bg-dark-700 dark:hover:text-light-200"
				aria-label="Close"
			>
				<FontAwesomeIcon icon={faTimes} class="text-sm" />
			</button>

			<!-- Content -->
			<div class="space-y-5 p-6">
				{#if title}
					<h3
						class="pr-10 text-xl font-normal text-dark-900 dark:text-light-50"
						style="font-family: 'Playfair Display', Georgia, serif"
					>
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
