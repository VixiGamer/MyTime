import { createContext } from "react";
// Assicurati che il percorso e il nome del file dei tipi siano corretti
import type { ShowProgress } from "../../Types/ShowProgress";
import type { SingleShowDetails } from "../../Types/SingleShowDetails";
import type { AllEpisodes } from "../../Types/ShowEpisodes";

interface WatchingContextType {
    watchingList: ShowProgress[];
    startWatching: (show: SingleShowDetails, episodes: AllEpisodes) => void;
    toggleEpisodeStatus: (showId: number, episodeId: number) => void;
    getShowProgress: (showId: number) => ShowProgress | undefined;
    archiveShow: (showId: number) => void;
    rateShow: (showId: number, rating: number) => void;
    rateEpisode: (showId: number, episodeId: number, rating: number) => void;
    rateSeason: (showId: number, seasonNumber: number, rating: number) => void;
    markShowAsWatched: (showId: number) => void;
    markSeasonAsWatched: (showId: number, seasonNumber: number) => void;
    unmarkShowAsWatched: (showId: number) => void;
    unmarkSeasonAsWatched: (showId: number, seasonNumber: number) => void;
    startRewatch: (showId: number) => void;
    rewatchEpisode: (showId: number, episodeId: number) => void;
    startSeasonRewatch: (showId: number, seasonNumber: number) => void;
    deleteShowData: (showId: number) => void;
    syncShowEpisodes: (showId: number, newEpisodes: AllEpisodes) => void;
}

export const WatchingContext = createContext<WatchingContextType | undefined>(undefined);