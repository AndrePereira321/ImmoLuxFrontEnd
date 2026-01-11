<script lang="ts">
	import { page } from '$app/stores';
	import AppPropertyForm from '$lib/components/AppPropertyForm.svelte';

	const propertyId = $derived($page.params.id);
</script>

<AppPropertyForm {propertyId} />
