import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import type { Database } from '../types/database';

if (typeof window === 'undefined' && typeof (globalThis as Record<string, unknown>).WebSocket === 'undefined') {
	(globalThis as Record<string, unknown>).WebSocket = function () {} as unknown as typeof WebSocket;
}

const supabaseUrl = env['PUBLIC_SUPABASE_URL'] || 'https://placeholder.supabase.co';
const supabaseKey = env['PUBLIC_SUPABASE_ANON_KEY'] || 'placeholder-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

