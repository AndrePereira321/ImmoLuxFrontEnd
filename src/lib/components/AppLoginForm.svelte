<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth';
	import { notificationStore } from '$lib/stores/notification';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSpinner } from '@fortawesome/free-solid-svg-icons';
	import AppInput from '$lib/components/AppInput.svelte';
	import AppLoadingSpinner from '$lib/components/AppLoadingSpinner.svelte';

	interface Props {
		onSuccess?: () => void;
	}

	let { onSuccess }: Props = $props();

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		error = null;
		isLoading = true;

		const result = await authStore.login(email, password, rememberMe);

		isLoading = false;

		if (result.success) {
			notificationStore.success($_('auth.loginSuccess'));
			if (onSuccess) {
				onSuccess();
			}
		} else {
			// Map error codes to translated messages
			const errorMessage = result.error || '';
			let errorMsg = '';

			if (errorMessage === 'INVALID_CREDENTIALS') {
				errorMsg = $_('auth.invalidCredentials');
			} else if (errorMessage === 'RATE_LIMIT_EXCEEDED') {
				errorMsg = $_('auth.accountLocked');
			} else {
				errorMsg = $_('auth.loginError');
			}

			error = errorMsg;
			notificationStore.error(errorMsg);
		}
	};
</script>

<div class="w-full">
	<form onsubmit={handleSubmit} class="space-y-6">
		<AppInput
			id="email"
			type="email"
			label={$_('auth.email')}
			bind:value={email}
			required
			disabled={isLoading}
			autocomplete="email"
		/>

		<AppInput
			id="password"
			type="password"
			label={$_('auth.password')}
			bind:value={password}
			required
			disabled={isLoading}
			autocomplete="current-password"
		/>

		<div class="flex items-center">
			<input
				id="rememberMe"
				type="checkbox"
				bind:checked={rememberMe}
				disabled={isLoading}
				class="h-4 w-4 rounded border-light-600 text-primary-600 focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:focus:ring-primary-600"
			/>
			<label for="rememberMe" class="ml-2 text-sm text-dark-900 dark:text-light-50">
				{$_('auth.rememberMe')}
			</label>
		</div>

		{#if error}
			<div class="rounded-lg bg-error-50 p-4 text-sm text-error-700 dark:bg-error-950 dark:text-error-300">
				{error}
			</div>
		{/if}

		<button
			type="submit"
			disabled={isLoading}
			class="w-full rounded-lg bg-primary-600 px-6 py-4 text-base font-medium text-light-50 shadow-lg transition-all duration-200 hover:bg-primary-700 hover:shadow-xl focus:ring-4 focus:ring-primary-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-700 dark:hover:bg-primary-800 dark:focus:ring-primary-800"
		>
			{#if isLoading}
				<span class="inline-flex items-center justify-center gap-2">
					<FontAwesomeIcon icon={faSpinner} class="animate-spin" />
					{$_('auth.loggingIn')}
				</span>
			{:else}
				{$_('auth.loginButton')}
			{/if}
		</button>
	</form>

	{#if isLoading}
		<AppLoadingSpinner message={$_('auth.loggingIn')} overlay={true} />
	{/if}
</div>
