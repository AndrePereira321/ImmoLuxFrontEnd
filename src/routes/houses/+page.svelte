<script lang="ts">
	import axios from 'axios';

	let count = $state(0);

	console.log(import.meta.env.VITE_SERVER_URL);

	const ping = async () => {
		const result = await axios.get<{ status: number }>(import.meta.env.VITE_SERVER_URL + '/ping');
		console.log('status: ', result.data.status);
	};
</script>

<h1>Houses</h1>

<button onclick={() => count++}>
	clicks: {count}
</button>

<button onclick={ping}> Ping </button>
