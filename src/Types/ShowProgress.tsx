import type { SingleEpisode } from "./ShowEpisodes"

// Interfaccia Principale Globale
export interface ShowProgress {
    showId: number;
    showName: string;
    showImage?: string;
    lastUpdated: Date;
    isArchived: boolean;
    userRating?: number; 
    sessionCount: number;      // Quante volte completata in questo giro (0 o 1)
    allTimeCount: number;      // Quante volte completata in totale nella storia
    episodes: EpisodeWatched[];
    seasons: SeasonProgress[]; 
}

// Voto e progresso della singola Stagione
export interface SeasonProgress {
    seasonNumber: number;
    userRating?: number;
    sessionCount: number;      // 0 se non finita in questo giro, 1 se finita
    allTimeCount: number;      // Volte totali completata
}

// Voto e progresso del singolo Episodio
export interface EpisodeWatched {
    episodeId: number;
    episodeData: SingleEpisode;
    userRating?: number;
    sessionWatched: boolean;   // Sostituisce 'status': vero/falso per il giro attuale
    sessionCount: number;      // Di solito 0 o 1
    allTimeCount: number;      // Volte totali visto
}