<script lang="ts">
	import { _ } from 'svelte-i18n';
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
		class="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-dark-900/40 p-4 backdrop-blur-md"
		onclick={handleBackdropClick}
		role="presentation"
		style="animation-duration: 0.15s"
	>
		<!-- Modal -->
		<div
			class="relative w-full {sizeClasses[
				size
			]} anim-fade-in-up azulejo-cell azulejo-rule max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain border shadow-2xl"
			role="dialog"
			aria-modal="true"
			style="animation-duration: 0.2s"
		>
			<!-- Close Button -->
			<button
				onclick={handleClose}
				class="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center text-dark-400 transition-colors hover:bg-light-300 hover:text-dark-700 dark:text-light-500 dark:hover:bg-dark-700 dark:hover:text-light-200"
				aria-label={$_('common.close')}
			>
				<FontAwesomeIcon icon={faTimes} class="text-sm" />
			</button>

			<!-- Content -->
			<div class="space-y-5 p-6">
				{#if title}
					<h3 class="pr-10 font-display text-xl font-normal text-dark-900 dark:text-light-50">
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
