import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			devOptions: {
				enabled: false
			},
			workbox: {
				// Cache external images (Wikimedia, Wikipedia, Supabase Storage, etc.)
				// Strategy: CacheFirst — serve from cache if URL is unchanged, fetch once on first access
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.destination === 'image',
						handler: 'CacheFirst',
						options: {
							cacheName: 'artwork-images-cache',
							expiration: {
								maxEntries: 1000,       // Max 1000 images stored
								maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200]      // Cache opaque (cross-origin) + normal responses
							}
						}
					}
				]
			},
			manifest: {
				name: 'Artichaut',
				short_name: 'Artichaut',
				description: 'Your Art Companion',
				theme_color: '#faf8f5',
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			}
		})
	]
});


