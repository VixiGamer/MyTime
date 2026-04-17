import { useState, useEffect, type ReactNode } from "react";
import type { ShowProgress } from "../../Types/ShowProgress";
import type { SingleShowDetails } from "../../Types/SingleShowDetails";
import type { AllEpisodes } from "../../Types/ShowEpisodes";
import { WatchingContext } from "./WatchingContext";


export const WatchingProvider = ({ children }: { children: ReactNode }) => {
    // 1. Caricamento iniziale dal LocalStorage
    const [watchingList, setWatchingList] = useState<ShowProgress[]>(() => {
        const saved = localStorage.getItem("watching_progress");
        return saved ? JSON.parse(saved) : [];
    });

    // 2. Salvataggio automatico sul LocalStorage ad ogni modifica
    useEffect(() => {
        localStorage.setItem("watching_progress", JSON.stringify(watchingList));
    }, [watchingList]);


    // --- FUNZIONI BASE ---

    // Inizia a guardare (Inizializzazione pulita)
    const startWatching = (show: SingleShowDetails, episodes: AllEpisodes) => {
        setWatchingList((prev) => {
            if (prev.find((item) => item.showId === show.id)) return prev;

            const newShow: ShowProgress = {
                showId: show.id,
                showName: show.name,
                showImage: show.image?.medium || show.image?.original,
                lastUpdated: new Date(),
                isArchived: false,
                seasons: [],
                sessionCount: 0,
                allTimeCount: 0,
                episodes: episodes.map((ep) => ({
                    episodeId: ep.id,
                    episodeData: ep,
                    sessionWatched: false, // Invece di status
                    sessionCount: 0,
                    allTimeCount: 0
                })),
            };
            return [newShow, ...prev];
        });
    };

    // Toggle Episodio (Incremento corretto)
    const toggleEpisodeStatus = (showId: number, episodeId: number) => {
        setWatchingList((prev) => prev.map((item) => {
            if (item.showId === showId) {
                // 1. Aggiorna l'episodio specifico
                const updatedEpisodes = item.episodes.map((ep) => {
                    if (ep.episodeId === episodeId) {
                        const isNowWatched = !ep.sessionWatched;
                        return {
                            ...ep,
                            sessionWatched: isNowWatched,
                            sessionCount: isNowWatched ? 1 : 0,
                            allTimeCount: isNowWatched
                                ? (Number(ep.allTimeCount || 0) + 1)
                                : Math.max(0, Number(ep.allTimeCount || 0) - 1)
                        };
                    }
                    return ep;
                });

                // 2. CONTROLLO COMPLETAMENTO STAGIONE
                const targetEpisode = item.episodes.find(e => e.episodeId === episodeId);
                const seasonNumber = targetEpisode?.episodeData.season;

                // Verifichiamo se tutti gli episodi di QUELLA stagione sono ora visti
                const seasonEpisodes = updatedEpisodes.filter(e => e.episodeData.season === seasonNumber);
                const isSeasonComplete = seasonEpisodes.every(e => e.sessionWatched);

                let updatedSeasons = item.seasons || [];
                if (isSeasonComplete && seasonNumber !== undefined) {
                    // Se la stagione è completa e non era già segnata come "sessione finita"
                    const seasonObj = updatedSeasons.find(s => s.seasonNumber === seasonNumber);
                    if (!seasonObj || seasonObj.sessionCount === 0) {
                        updatedSeasons = seasonObj
                            ? updatedSeasons.map(s => s.seasonNumber === seasonNumber
                                ? { ...s, sessionCount: 1, allTimeCount: (s.allTimeCount || 0) + 1 } : s)
                            : [...updatedSeasons, { seasonNumber, sessionCount: 1, allTimeCount: 1 }];
                    }
                } else if (!isSeasonComplete && seasonNumber !== undefined) {
                    // Se togliamo la spunta a un episodio, la stagione non è più "completata" in questa sessione
                    updatedSeasons = updatedSeasons.map(s => s.seasonNumber === seasonNumber
                        ? { ...s, sessionCount: 0 } : s);
                }

                // 3. CONTROLLO COMPLETAMENTO SERIE
                const isShowComplete = updatedEpisodes.every(e => e.sessionWatched);
                let newShowSessionCount = item.sessionCount || 0;
                let newShowAllTimeCount = item.allTimeCount || 0;

                if (isShowComplete && item.sessionCount === 0) {
                    newShowSessionCount = 1;
                    newShowAllTimeCount += 1;
                } else if (!isShowComplete) {
                    newShowSessionCount = 0;
                }

                return {
                    ...item,
                    lastUpdated: new Date(),
                    episodes: updatedEpisodes,
                    seasons: updatedSeasons,
                    sessionCount: newShowSessionCount,
                    allTimeCount: newShowAllTimeCount
                };
            }
            return item;
        }));
    };

    // Archivia o ripristina una serie
    const archiveShow = (showId: number) => {
        setWatchingList((prev) => prev.map((item) =>
            item.showId === showId ? { ...item, isArchived: !item.isArchived } : item
        ));
    };

    // Ritorna i dati di una singola serie
    const getShowProgress = (showId: number) => {
        return watchingList.find((item) => item.showId === showId);
    };

    // --- FUNZIONI DI AZIONE MASSIVA ---

    // Segna tutta la serie come vista
    const markShowAsWatched = (showId: number) => {
        setWatchingList((prev) => prev.map((item) => {
            if (item.showId === showId) {
                //^ Identifichiamo tutte le stagioni uniche presenti negli episodi
                const uniqueSeasonNumbers = Array.from(
                    new Set(item.episodes.map(ep => ep.episodeData.season))
                );

                //^ Aggiorniamo (o creiamo) il progresso per ogni stagione
                const updatedSeasons = uniqueSeasonNumbers.map(sNum => {
                    const existingSeason = item.seasons?.find(s => s.seasonNumber === sNum);

                    //^ Se la stagione era già stata completata in questa sessione, non aumentiamo l'allTimeCount
                    const wasAlreadyComplete = existingSeason?.sessionCount === 1;

                    return {
                        seasonNumber: sNum,
                        userRating: existingSeason?.userRating || 0,
                        sessionCount: 1,
                        allTimeCount: wasAlreadyComplete
                            ? (existingSeason?.allTimeCount || 0)
                            : (existingSeason?.allTimeCount || 0) + 1
                    };
                });

                return {
                    ...item,
                    lastUpdated: new Date(),
                    sessionCount: 1,
                    allTimeCount: (item.allTimeCount || 0) + 1,

                    episodes: item.episodes.map(ep => ({        //^ Aggiorniamo tutti gli episodi
                        ...ep,
                        sessionWatched: true,
                        sessionCount: 1,
                        allTimeCount: !ep.sessionWatched ? (ep.allTimeCount || 0) + 1 : ep.allTimeCount
                    })),

                    seasons: updatedSeasons
                };
            }
            return item;
        }));
    };

    // Segna l'intera stagione come vista (incrementando i contatori degli episodi)
    const markSeasonAsWatched = (showId: number, seasonNumber: number) => {
        setWatchingList((prev) => prev.map((item) => {
            if (item.showId === showId) {
                const isAlreadyComplete = item.seasons?.find(s => s.seasonNumber === seasonNumber)?.sessionCount === 1;

                const updatedEpisodes = item.episodes.map(ep => {
                    if (ep.episodeData.season === seasonNumber) {
                        return {
                            ...ep,
                            sessionWatched: true,
                            sessionCount: 1,
                            allTimeCount: !ep.sessionWatched ? (ep.allTimeCount || 0) + 1 : ep.allTimeCount
                        };
                    }
                    return ep;
                });

                const updatedSeasons = item.seasons?.find(s => s.seasonNumber === seasonNumber)
                    ? item.seasons.map(s => s.seasonNumber === seasonNumber
                        ? { ...s, sessionCount: 1, allTimeCount: isAlreadyComplete ? s.allTimeCount : (s.allTimeCount || 0) + 1 } : s)
                    : [...(item.seasons || []), { seasonNumber, sessionCount: 1, allTimeCount: 1 }];

                // CONTROLLO COMPLETAMENTO SERIE
                const isShowComplete = updatedEpisodes.every(e => e.sessionWatched);
                let newShowSessionCount = item.sessionCount || 0;
                let newShowAllTimeCount = item.allTimeCount || 0;

                if (isShowComplete && item.sessionCount === 0) {
                    newShowSessionCount = 1;
                    newShowAllTimeCount += 1;
                }

                return {
                    ...item,
                    lastUpdated: new Date(),
                    episodes: updatedEpisodes,
                    seasons: updatedSeasons,
                    sessionCount: newShowSessionCount,
                    allTimeCount: newShowAllTimeCount
                };
            }
            return item;
        }));
    };

    // --- Nel WatchingContext.tsx ---

    const unmarkShowAsWatched = (showId: number) => {
        setWatchingList((prev) => prev.map((item) => {
            if (item.showId === showId) {
                return {
                    ...item,
                    lastUpdated: new Date(),
                    sessionCount: 0,
                    // Decrementiamo allTimeCount solo se è maggiore di 0
                    allTimeCount: Math.max(0, (item.allTimeCount || 0) - 1),
                    episodes: item.episodes.map(ep => ({
                        ...ep,
                        sessionWatched: false,
                        sessionCount: 0,
                        allTimeCount: Math.max(0, (ep.allTimeCount || 0) - 1)
                    })),
                    seasons: item.seasons?.map(s => ({
                        ...s,
                        sessionCount: 0,
                        allTimeCount: Math.max(0, (s.allTimeCount || 0) - 1)
                    })) || []
                };
            }
            return item;
        }));
    };

    const unmarkSeasonAsWatched = (showId: number, seasonNumber: number) => {
        setWatchingList((prev) => prev.map((item) => {
            if (item.showId === showId) {
                const updatedEpisodes = item.episodes.map(ep => {
                    if (ep.episodeData.season === seasonNumber) {
                        return {
                            ...ep,
                            sessionWatched: false,
                            sessionCount: 0,
                            allTimeCount: Math.max(0, (ep.allTimeCount || 0) - 1)
                        };
                    }
                    return ep;
                });

                const updatedSeasons = item.seasons?.map(s =>
                    s.seasonNumber === seasonNumber
                        ? { ...s, sessionCount: 0, allTimeCount: Math.max(0, (s.allTimeCount || 0) - 1) }
                        : s
                ) || [];

                const isShowComplete = updatedEpisodes.every(e => e.sessionWatched);
                let newShowSessionCount = item.sessionCount || 0;

                if (!isShowComplete) {
                    newShowSessionCount = 0;
                }

                return {
                    ...item,
                    lastUpdated: new Date(),
                    episodes: updatedEpisodes,
                    seasons: updatedSeasons,
                    sessionCount: newShowSessionCount
                };
            }
            return item;
        }));
    };

    const startRewatch = (showId: number) => {
        setWatchingList(prev => prev.map(item => {
            if (item.showId === showId) {
                return {
                    ...item,
                    lastUpdated: new Date(),
                    // Reset della sessione globale dello show
                    sessionCount: 0,
                    // Portiamo tutti gli episodi a "non visto" per il nuovo giro
                    episodes: item.episodes.map(ep => ({
                        ...ep,
                        sessionWatched: false,
                        sessionCount: 0
                    })),
                    // Reset sessione stagioni
                    seasons: item.seasons?.map(s => ({
                        ...s,
                        sessionCount: 0
                    })) || []
                };
            }
            return item;
        }));
    };

    // Rivedere un episodio e aumenta il 'allTimeCount' di 1
    const rewatchEpisode = (showId: number, episodeId: number) => {
        setWatchingList(prev => prev.map(item => {
            if (item.showId === showId) {
                return {
                    ...item,
                    lastUpdated: new Date(),
                    episodes: item.episodes.map(ep =>
                        ep.episodeId === episodeId
                            ? {
                                ...ep,
                                sessionWatched: true, // Se lo stai rivedendo, è ovviamente visto
                                allTimeCount: (ep.allTimeCount || 0) + 1
                            }
                            : ep
                    )
                };
            }
            return item;
        }));
    };

    // Funzione Rewatch unificata per Stagione
    const startSeasonRewatch = (showId: number, seasonNumber: number) => {
        setWatchingList((prev) => prev.map((item) => {
            if (item.showId === showId) {
                return {
                    ...item,
                    lastUpdated: new Date(),
                    // Reset della sessione per gli episodi della stagione selezionata
                    episodes: item.episodes.map(ep => {
                        if (ep.episodeData.season === seasonNumber) {
                            return {
                                ...ep,
                                sessionWatched: false,
                                sessionCount: 0
                            };
                        }
                        return ep;
                    }),
                    // Reset del flag di sessione nella lista stagioni
                    seasons: item.seasons?.map(s =>
                        s.seasonNumber === seasonNumber
                            ? { ...s, sessionCount: 0 }
                            : s
                    ) || []
                };
            }
            return item;
        }));
    };
    // --- FUNZIONI DI VALUTAZIONE (RATING) ---

    // Dai un voto alla serie intera
    const rateShow = (showId: number, rating: number) => {
        setWatchingList((prev) => prev.map((item) =>
            item.showId === showId ? { ...item, userRating: rating } : item
        ));
    };

    // Dai un voto alla singola stagione
    const rateSeason = (showId: number, seasonNumber: number, rating: number) => {
        setWatchingList((prev) => prev.map((item) => {
            if (item.showId === showId) {
                // Cerchiamo se la stagione è già presente nell'elenco dei progressi/voti
                const existingSeason = item.seasons?.find(s => s.seasonNumber === seasonNumber);

                let updatedSeasons;

                if (existingSeason) {
                    // Se esiste, mappiamo l'array e cambiamo solo il rating della stagione target
                    updatedSeasons = item.seasons.map(s =>
                        s.seasonNumber === seasonNumber
                            ? { ...s, userRating: rating }
                            : s
                    );
                } else {
                    // Se non esiste, aggiungiamo un nuovo oggetto SeasonProgress con i nuovi nomi dei campi
                    updatedSeasons = [
                        ...(item.seasons || []),
                        {
                            seasonNumber,
                            userRating: rating,
                            sessionCount: 0,    // Inizializzato per la nuova struttura
                            allTimeCount: 0     // Inizializzato per la nuova struttura
                        }
                    ];
                }

                return {
                    ...item,
                    lastUpdated: new Date(),
                    seasons: updatedSeasons
                };
            }
            return item;
        }));
    };

    // Dai un voto al singolo episodio
    const rateEpisode = (showId: number, episodeId: number, rating: number) => {
        setWatchingList((prev) => prev.map((item) => {
            if (item.showId === showId) {
                return {
                    ...item,
                    episodes: item.episodes.map(ep =>
                        ep.episodeId === episodeId ? { ...ep, userRating: rating } : ep
                    )
                };
            }
            return item;
        }));
    };

    //Elimina tutti i dati di una serie
    const deleteShowData = (showId: number) => {
        // Messaggio di avviso per prevenire eliminazioni accidentali
        const confirmDelete = window.confirm(
            "Attenzione: questa azione eliminerà definitivamente TUTTI i tuoi progressi, i voti e le statistiche di questa serie. Vuoi procedere?"
        );

        if (confirmDelete) {
            setWatchingList((prev) => prev.filter((item) => item.showId !== showId));
            // Grazie all'useEffect, il localStorage si aggiornerà automaticamente
        }
    };

    // Sincronizza gli episodi di una serie con i dati aggiornati dall'API (es. nuove immagini, nuovi episodi)
    const syncShowEpisodes = (showId: number, newEpisodes: AllEpisodes) => {
        setWatchingList((prev) => prev.map((item) => {
            if (item.showId === showId) {
                // Troviamo eventuali nuovi episodi e aggiorniamo quelli vecchi
                const mergedEpisodes = newEpisodes.map(newEp => {
                    const existingEp = item.episodes.find(e => e.episodeId === newEp.id);
                    if (existingEp) {
                        return { ...existingEp, episodeData: newEp };
                    } else {
                        // Nuovo episodio annunciato/aggiunto da TVMaze!
                        return {
                            episodeId: newEp.id,
                            episodeData: newEp,
                            sessionWatched: false,
                            sessionCount: 0,
                            allTimeCount: 0
                        };
                    }
                });

                return {
                    ...item,
                    episodes: mergedEpisodes
                };
            }
            return item;
        }));
    };

    return (
        <WatchingContext.Provider value={{
            watchingList,
            startWatching,
            toggleEpisodeStatus,
            getShowProgress,
            archiveShow,
            rateShow,
            rateEpisode,
            rateSeason,
            markShowAsWatched,
            markSeasonAsWatched,
            unmarkShowAsWatched,
            unmarkSeasonAsWatched,
            startRewatch,
            rewatchEpisode,
            startSeasonRewatch,
            deleteShowData,
            syncShowEpisodes
        }}>
            {children}
        </WatchingContext.Provider>
    );
};