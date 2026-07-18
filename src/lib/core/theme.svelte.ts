// Theme state management for AI Art Coach using Svelte 5 Runes

export type ThemeMode = 'light' | 'dark' | 'system';

class ThemeStore {
	current = $state<ThemeMode>('light');

	constructor() {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('theme') as ThemeMode | null;
			if (saved === 'light' || saved === 'dark' || saved === 'system') {
				this.current = saved;
			} else {
				// Default to light mode as required by product specifications
				this.current = 'light';
			}
			this.apply(this.current);

			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
				if (this.current === 'system') {
					this.apply('system');
				}
			});
		}
	}

	set(mode: ThemeMode) {
		this.current = mode;
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme', mode);
			this.apply(mode);
		}
	}

	private apply(mode: ThemeMode) {
		if (typeof document === 'undefined') return;
		document.documentElement.setAttribute('data-theme', mode);
		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) {
			if (mode === 'dark') {
				meta.setAttribute('content', '#0f1117');
			} else if (mode === 'light') {
				meta.setAttribute('content', '#faf8f5');
			} else {
				const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				meta.setAttribute('content', isDark ? '#0f1117' : '#faf8f5');
			}
		}
	}
}

export const themeStore = new ThemeStore();
