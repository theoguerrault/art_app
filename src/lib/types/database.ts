
export interface MCQ {
	question: string;
	options: string[];
	correctIndex: number;
	explanation: string;
}

export type QCMSynthese = MCQ;

export interface Movement {
	id: number;
	slug: string;
	name: string;
	century: string;
	oklch_token: string;
	chronological_order: number;
	created_at: string;
}

interface ContentMovement {
	movement_id: number;
	short_description: string;
	updated_at: string;
}

interface Artist {
	id: number;
	slug: string;
	name: string;
	dates?: string | null;
	created_at: string;
}

export interface Artwork {
	id: number;
	slug: string;
	movement_id: number;
	artist_id: number;
	title: string;
	artists?: Artist;
	creation_date: string;
	image_url_full: string;
	image_url_thumb: string;
	aspect_ratio: number;
	is_active: boolean;
	musee?: string | null;
	dimensions?: string | null;
	medium?: string | null;
	created_at: string;
	glossary?: {
		artist_description: string | null;
		movement_description: string | null;
		artist_dates?: string | null;
		movement_century?: string | null;
	};
}

type SupabaseRow = Record<string, unknown>;

export interface RawArtwork extends Artwork {
	artwork_translations?: { title: string }[];
	artists?: Artist & {
		artist_translations?: { name: string }[];
		dates?: string | null;
	};
}

export interface RawCourant extends Movement {
	movement_translations?: { name: string }[];
}

export interface ContentArtwork {
	artwork_id: number;
	main_article: string;
	introduction?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	article_portions?: any[];
	generated_by_model: string;
	updated_at: string;
	verification_status?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	verification_report?: any;
}

export interface RawContentArtwork extends ContentArtwork {
	article_portions?: { title?: string; text: string; type?: string }[];
}

export interface UserProgress {
	user_id: string;
	artwork_id: number;
	last_presented_daily_at: string | null;
	times_presented_daily: number;
	box_level: number;
	next_review_at: string;
	last_score: number | null;
	consecutive_correct: number;
	updated_at: string;
}


export interface ActiveLessonView extends Artwork {
	movement_name: string;
	movement_century?: string | null;
	oklch_token: string;
	main_article: string;
	introduction?: string | null;
	article_portions?: { title?: string; text: string; type?: string }[];
	verification_status?: string | null;
	glossary?: {
		artist_description: string | null;
		movement_description: string | null;
		artist_dates?: string | null;
		movement_century?: string | null;
	};
}

export interface Database {
	public: {
		Tables: {
			movements: {
				Row: Movement;
				Insert: Omit<Movement, 'id' | 'created_at'> & { id?: number; created_at?: string };
				Update: Partial<Movement>;
			};
			artworks: {
				Row: Artwork;
				Insert: Omit<Artwork, 'id' | 'created_at'> & { id?: number; created_at?: string };
				Update: Partial<Artwork>;
			};

			user_artwork_progress: {
				Row: UserProgress;
				Insert: UserProgress;
				Update: Partial<UserProgress>;
			};
		};
		Views: {
			v_lecons_actives: {
				Row: ActiveLessonView;
			};
		};
	};
}
