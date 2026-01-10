<script lang="ts">
	import { apiClient } from '$lib/api/api-client';

	let count = $state(0);

	console.log(import.meta.env.VITE_SERVER_URL);

	const ping = async () => {
		const result = await apiClient.post('/login', {
			email: 'admin@localhost.com',
			password: 'admin'
		});

		// const result = await apiClient.get('/ping');

		console.log('Status: ', result.status);
		console.log('Data: ', result.data);
	};
</script>

<h1>Houses</h1>

<button onclick={() => count++}>
	clicks: {count}
</button>

<button onclick={ping}> Ping</button>
