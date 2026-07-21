<script lang="ts">
	import { authStore } from '$lib/core/auth.svelte';
	import { supabase } from '$lib/supabase/client';
	import { EnvelopeSimple, LockKey, CircleNotch } from 'phosphor-svelte';
	import { goto } from '$app/navigation';
	import { flushOfflineQueue } from '$lib/offline/sync';
	import { readFromLocalCache, getOfflineQueueItems } from '$lib/offline/storage';

	let isLogin = $state(true);
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMessage = $state('');

	async function migrateAnonymousData(userId: string) {
		try {
			// Migrate offline sync queue
			const queueItems = await getOfflineQueueItems();
			if (queueItems.length > 0) {
				for (const item of queueItems) {
					item.user_id = userId; // Override anonymous user ID
				}
				// Save back and flush
				await flushOfflineQueue();
			}
		} catch (err) {
			console.error('[Auth] Failed to migrate anonymous data:', err);
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		loading = true;
		errorMessage = '';

		try {
			if (isLogin) {
				const { data, error } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				if (error) throw error;
				
				if (data.user) {
					await migrateAnonymousData(data.user.id);
					goto('/');
				}
			} else {
				const { data, error } = await supabase.auth.signUp({
					email,
					password
				});
				if (error) throw error;
				
				if (data.user) {
					await migrateAnonymousData(data.user.id);
					goto('/');
				}
			}
		} catch (error: any) {
			errorMessage = error.message || 'Une erreur est survenue lors de l\'authentification.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-container">
	<div class="auth-card">
		<div class="auth-header">
			<h2 class="auth-title">{isLogin ? 'Bon retour' : 'Créer un compte'}</h2>
			<p class="auth-subtitle">
				{isLogin
					? 'Connectez-vous pour reprendre votre apprentissage.'
					: 'Rejoignez-nous pour sauvegarder votre progression.'}
			</p>
		</div>

		{#if errorMessage}
			<div class="error-banner">
				{errorMessage}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="auth-form">
			<div class="input-group">
				<label for="email">Adresse Email</label>
				<div class="input-wrapper">
					<EnvelopeSimple size={20} class="input-icon" />
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="nom@exemple.com"
						required
						disabled={loading}
					/>
				</div>
			</div>

			<div class="input-group">
				<label for="password">Mot de passe</label>
				<div class="input-wrapper">
					<LockKey size={20} class="input-icon" />
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder="••••••••"
						required
						disabled={loading}
						minlength="6"
					/>
				</div>
			</div>

			<button type="submit" class="submit-btn" disabled={loading}>
				{#if loading}
					<CircleNotch size={20} class="spinner" weight="bold" />
					<span>Chargement...</span>
				{:else}
					<span>{isLogin ? 'Se connecter' : 'S\'inscrire'}</span>
				{/if}
			</button>
		</form>

		<div class="auth-footer">
			<p>
				{isLogin ? "Vous n'avez pas de compte ?" : 'Vous avez déjà un compte ?'}
				<button
					type="button"
					class="toggle-btn"
					onclick={() => {
						isLogin = !isLogin;
						errorMessage = '';
					}}
					disabled={loading}
				>
					{isLogin ? "S'inscrire" : 'Se connecter'}
				</button>
			</p>
		</div>
	</div>
</div>

<style>
	.auth-container {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem 1rem;
		min-height: calc(100vh - 140px);
	}

	.auth-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		padding: 2rem;
		width: 100%;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.auth-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.auth-title {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--color-text-primary);
	}

	.auth-subtitle {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
	}

	.error-banner {
		background: var(--color-error-bg);
		color: var(--color-error);
		padding: 0.75rem;
		border-radius: var(--radius-md);
		font-size: 0.85rem;
		text-align: center;
		border: 1px solid var(--color-error);
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.input-group label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-icon {
		position: absolute;
		left: 1rem;
		color: var(--color-text-muted);
	}

	.input-wrapper input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.75rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text-primary);
		font-size: 1rem;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.input-wrapper input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-light);
	}

	.input-wrapper input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.submit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: var(--color-primary);
		color: oklch(0.99 0 0);
		padding: 0.85rem;
		border-radius: var(--radius-md);
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		transition: transform 0.15s ease, opacity 0.15s ease;
		margin-top: 0.5rem;
		border: none;
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.auth-footer {
		text-align: center;
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		border-top: 1px solid var(--color-border-subtle);
		padding-top: 1.25rem;
	}

	.toggle-btn {
		background: none;
		border: none;
		color: var(--color-primary);
		font-weight: 700;
		cursor: pointer;
		padding: 0;
		margin-left: 0.25rem;
	}

	.toggle-btn:hover {
		text-decoration: underline;
	}
</style>
