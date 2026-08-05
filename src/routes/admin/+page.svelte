<script lang="ts">
	import { goto } from '$app/navigation';

	$effect(() => {
		goto('/admin/artworks', { replaceState: true });
	});
</script>

<div class="admin-redirecting">
	<p>Redirection vers l'administration des œuvres...</p>
</div>

<style>
	.admin-redirecting {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 50vh;
		color: var(--color-text-secondary);
	}
</style>
