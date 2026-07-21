import { supabase } from '$lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

class AuthState {
	session = $state<Session | null>(null);
	user = $state<User | null>(null);
	isInitialized = $state(false);

	constructor() {
		if (typeof window !== 'undefined') {
			this.initialize();
		}
	}

	private async initialize() {
		// Get initial session
		const {
			data: { session }
		} = await supabase.auth.getSession();
		
		this.session = session;
		this.user = session?.user ?? null;
		this.isInitialized = true;

		// Listen for auth changes
		supabase.auth.onAuthStateChange((_event, newSession) => {
			this.session = newSession;
			this.user = newSession?.user ?? null;
		});
	}

	async signOut() {
		await supabase.auth.signOut();
	}
}

export const authStore = new AuthState();
