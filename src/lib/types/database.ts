interface MCQ {
	sourceQuote?: string;
	sourceField?: string;
	conceptTag?: string;
	difficulty?: 'easy' | 'medium' | 'hard';
	question: string;
	options: string[];
	correctIndex: number;
	explanation: string;
}

interface QCMSynthese {
	question: string;
	options: string[];
	correctIndex: number;
	explanation: string;
}

export interface Movement {
	id: number;
	slug: string;
	nom: string;
	siecle: string;
	oklch_token: string;
	ordre_chronologique: number;
	created_at: string;
}

interface ContentMovement {
	id_courant: number;
	description_courte: string;
	caracteristiques_cles: string[];
	contexte_historique: string;
	qcm_synthese: QCMSynthese;
	updated_at: string;
}

interface Artiste {
	id: number;
	slug: string;
	nom: string;
	created_at: string;
}

export interface Artwork {
	id: number;
	slug: string;
	id_courant: number;
	id_artiste: number;
	titre: string;
	artistes?: Artiste;
	date_creation: string;
	image_url_full: string;
	image_url_thumb: string;
	aspect_ratio: number;
	ordre_dans_courant: number;
	is_active: boolean;
	musee?: string | null;
	dimensions?: string | null;
	medium?: string | null;
	created_at: string;
	glossary?: {
		artiste_description: string | null;
		courant_description: string | null;
	};
}

type SupabaseRow = Record<string, unknown>;

export interface RawArtwork extends Artwork {
	oeuvre_translations?: { titre: string }[];
	artistes?: Artiste & {
		artiste_translations?: { nom: string }[];
	};
}

export interface RawCourant extends Movement {
	courant_translations?: { nom: string }[];
}

export interface ContentArtwork {
	id_oeuvre: number;
	article_principal: string;
	introduction?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	article_portions?: any[];
	qcm: MCQ;
	mots_cles: string[];
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
	id_oeuvre: number;
	last_presented_daily_at: string | null;
	times_presented_daily: number;
	box_level: number;
	next_review_at: string;
	last_score: number | null;
	consecutive_correct: number;
	updated_at: string;
}

export interface AnswerHistory {
	id: string;
	user_id: string;
	id_oeuvre: number | null;
	id_courant: number | null;
	is_correct: boolean;
	reponse_choisie: number;
	score: number | null;
	encounter_type: 'DAILY' | 'CATALOG' | 'REVIEW';
	answered_at: string;
}

export interface ActiveLessonView extends Artwork {
	nom_courant: string;
	oklch_token: string;
	article_principal: string;
	introduction?: string | null;
	article_portions?: { title?: string; text: string; type?: string }[];
	verification_status?: string | null;
	qcm: MCQ;
	mots_cles?: string[];
	glossary?: {
		artiste_description: string | null;
		courant_description: string | null;
	};
}

export interface Database {
	public: {
		Tables: {
			courants: {
				Row: Movement;
				Insert: Omit<Movement, 'id' | 'created_at'> & { id?: number; created_at?: string };
				Update: Partial<Movement>;
			};
			oeuvres: {
				Row: Artwork;
				Insert: Omit<Artwork, 'id' | 'created_at'> & { id?: number; created_at?: string };
				Update: Partial<Artwork>;
			};
			historique_reponses: {
				Row: AnswerHistory;
				Insert: Omit<AnswerHistory, 'id' | 'answered_at'> & { id?: string; answered_at?: string };
				Update: Partial<AnswerHistory>;
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
