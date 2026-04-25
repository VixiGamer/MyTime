import { useNavigate } from "react-router-dom";
import { useWatching } from "../../context/Watching/useWatching";
import type { SingleEpisode } from "../../Types/ShowEpisodes";
import { useEffect, useState } from "react";
import axios from "axios";
import RatingModal from "../../components/RatingModal/RatingModal";
import defaultPoster from "../../images/poster_default.png";
import defaultEpisodePoster from "../../images/episode_default.png";
import { Vibrant } from "node-vibrant/browser";
import type { Palette, Swatch } from "@vibrant/color";
import "./Watching.css"

export default function Watching() {
    const [episodeImgLoaded, setEpisodeImgLoaded] = useState(false);

    const {
        watchingList,
        toggleEpisodeStatus,
        archiveShow,
        // deleteShowData,
        // markShowAsWatched,
        startRewatch,
        rateShow,
        rateEpisode,
        rateSeason,
        syncShowEpisodes
    } = useWatching();

    const navigate = useNavigate();

    const [bgEpisodeGradient, setBgEpisodeGradient] = useState("");


    //§ --- STATO DELLA MODALE DI VALUTAZIONE ---
    const [ratingModal, setRatingModal] = useState<{
        isOpen: boolean;
        showId: number;
        type: 'episode' | 'season' | 'show';
        targetId: number;
        targetName: string;
        currentVal: number;
    }>({ isOpen: false, showId: 0, type: 'episode', targetId: 0, targetName: "", currentVal: 0 });

    //§ --- FILTRI SERIE AGGIORNATI CON LA NUOVA LOGICA ---
    // Una serie è ATTIVA se non è archiviata e ha almeno un episodio NON visto nella sessione attuale
    const activeShows = watchingList.filter(serie =>
        !serie.isArchived && !serie.episodes.every(e => e.sessionWatched)
    ).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    //§ --- SINCRONIZZAZIONE AUTOMATICA AL MOUNT ---
    useEffect(() => {
        const syncData = async () => {
            // Sincronizziamo tutte le serie attive e completate (non archiviate)
            const showsToSync = watchingList.filter(s => !s.isArchived);
            for (const show of showsToSync) {
                try {
                    const response = await axios.get(`https://api.tvmaze.com/shows/${show.showId}/episodes`);
                    syncShowEpisodes(show.showId, response.data);
                } catch (error) {
                    console.error(`Error while syncing show ${show.showId}`, error);
                }
            }
        };
        syncData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Eseguito solo all'ingresso nella pagina

    // Una serie è COMPLETATA se tutti gli episodi della sessione attuale sono stati visti
    const completedShows = watchingList.filter(serie =>
        !serie.isArchived && serie.episodes.length > 0 && serie.episodes.every(e => e.sessionWatched)
    ).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    const archivedShows = watchingList.filter(serie => serie.isArchived)
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    //§ --- HANDLERS ---
    const handleToggleNextEpisode = (showId: number, episode: SingleEpisode) => {
        toggleEpisodeStatus(showId, episode.id);

        setRatingModal({
            isOpen: true,
            showId: showId,
            type: 'episode',
            targetId: episode.id,
            targetName: `${episode.season}x${episode.number} - ${episode.name}`,
            currentVal: 0
        });
    };

    //* Per segnare un intera serie come vista
    // const handleMarkShowAsWatched = (showId: number, showName: string) => {
    //     markShowAsWatched(showId);

    //     setRatingModal({
    //         isOpen: true,
    //         showId: showId,
    //         type: 'show',
    //         targetId: showId,
    //         targetName: showName,
    //         currentVal: 0
    //     });
    // };


    //* Estraggo un array contenente i link delle immagini dei "prossimi episodi" per tutte le serie attive
    const nextEpisodesImages = activeShows.map(serie => {
        const nextEpisode = serie.episodes.find(e => e.sessionWatched === false);        // Cerco il primo episodio non ancora visto di questa specifica serie
        const displayEpisode = nextEpisode || serie.episodes[serie.episodes.length - 1];        // Se esiste prendo quello, altrimenti per fallback prendo l'ultimo episodio della serie
        return displayEpisode?.episodeData.image?.original || displayEpisode?.episodeData.image?.medium;        // Ritorno il link dell'immagine (dando priorità alla qualità 'original', altrimenti 'medium')
    }).filter(Boolean) as string[]; // filter(Boolean) rimuove eventuali valori null o undefined

    const firstValidImage = nextEpisodesImages.length > 0 ? nextEpisodesImages[0] : null;    // Prendo solo la prima immagine valida trovata (che corrisponde alla serie attiva più recente)


    useEffect(() => {
        // Se non ho trovato nessuna immagine, resetto il gradiente a stringa vuota ed esco
        if (!firstValidImage) {
            setBgEpisodeGradient("");
            return;
        }

        Vibrant.from(firstValidImage)
            .getPalette()
            .then((palette: Palette) => {
                // Trasformo l'oggetto palette in un array, filtro via i colori non validi e prendo i valori RGB
                const colors = Object.values(palette)
                    .filter((swatch): swatch is Swatch => Boolean(swatch))
                    .map((swatch) => swatch.rgb);

                // Se la libreria non riesce a trovare colori validi, mi fermo qui
                if (colors.length === 0) return;

                // Prendo al massimo i primi 5 colori trovati
                const selected = colors.slice(0, 5);
                // Trasformo l'array di numeri RGB in stringhe CSS leggibili
                const colorStrings = selected.map((c: number[]) => `rgb(${c.join(",")})`);

                // Costruisco la stringa finale del CSS linear-gradient usando i colori calcolati
                const gradient = `linear-gradient(135deg, ${colorStrings.join(",")})`;
                // Salvo il risultato nello stato, che aggiornerà lo sfondo del container principale
                setBgEpisodeGradient(gradient);
            })
            .catch((err) => {
                console.error("Errore Vibrant:", err);
            });
    }, [firstValidImage]);


    const today = new Date();
    today.setHours(0, 0, 0, 0)

    function isToday(episodeAirDateStr: string) {
        const episodeAirDate = new Date(episodeAirDateStr || "")
        episodeAirDate.setHours(0, 0, 0, 0)
        const diffTime = episodeAirDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
            return true
        } else {
            return false
        }
    }


    return (
        <div style={{ paddingBottom: "4rem", backgroundImage: bgEpisodeGradient }}>
            <div className="p-4 container">
                <header className="mb-5 text-center text-md-start">
                    <h1 className="fw-bolder display-5">Next to watch</h1>
                </header>

                {activeShows.length === 0 && (
                    <div className="card text-muted card-body glass-card border-0 shadow-sm" style={{ cursor: "pointer" }} onClick={() => navigate(`/search`)}>
                        You're not currently watching any series. Click here to search for a series to get started!
                    </div>
                )}

                <div className="row g-3">
                    {activeShows.map((serie, index) => {
                        // Logica basata su sessionWatched
                        const watchedCount = serie.episodes.filter(e => e.sessionWatched).length;
                        const totalCount = serie.episodes.length;
                        const percentage = Math.round((watchedCount / totalCount) * 100);

                        // Cerca il prossimo episodio usando sessionWatched
                        const nextEpisode = serie.episodes.find(e => e.sessionWatched === false);

                        let isSeasonPremiere = false;
                        let isSeasonFinale = false;

                        if (nextEpisode) {
                            const currentIndex = serie.episodes.findIndex(e => e.episodeId === nextEpisode.episodeId);
                            const episodeBeforeNext = serie.episodes[currentIndex - 1];
                            if (!episodeBeforeNext || episodeBeforeNext.episodeData.season !== nextEpisode.episodeData.season) {
                                isSeasonPremiere = true;
                            }
                            const episodeAfterNext = serie.episodes[currentIndex + 1];
                            if (!episodeAfterNext || episodeAfterNext.episodeData.season !== nextEpisode.episodeData.season) {
                                isSeasonFinale = true;
                            }
                        }

                        const displayEpisode = nextEpisode || serie.episodes[serie.episodes.length - 1];
                        const imgOriginalMedium = displayEpisode?.episodeData.image?.original || displayEpisode?.episodeData.image?.medium;

                        return (
                            <div key={serie.showId} className="col-12 col-lg-6" style={{ zIndex: activeShows.length - index }}>
                                <div className="glass-card card p-3 gap-3 d-flex flex-row position-relative shadow-sm transition-all align-items-center h-100" style={{ borderRadius: "10px" }}>

                                    <div className="dropdown flex-shrink-0 position-absolute top-0 end-0 m-3" style={{ marginTop: "-2px" }}>
                                        <button className="btn p-0 text-muted border-0 moreinfo-button-responsive" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            <i className="bi bi-three-dots-vertical" />
                                        </button>
                                        <ul className="dropdown-menu glass-card dropdown-menu-end shadow">
                                            <li><button className="dropdown-item" onClick={() => navigate(`/show/${serie.showId}`)}>Show Details</button></li>
                                            <li><button className="dropdown-item" onClick={() => navigate(`/show/${serie.showId}/episode/${nextEpisode?.episodeId}`)}>Episode Details</button></li>
                                            {/* <li><button className="dropdown-item" onClick={() => handleMarkShowAsWatched(serie.showId, serie.showName)}>Mark entire show as watched</button></li> */}
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><button className="dropdown-item" onClick={() => archiveShow(serie.showId)}>Archive (Hide below)</button></li>
                                            {/* <li><button className="dropdown-item text-danger fw-bold" onClick={() => deleteShowData(serie.showId)}>Delete ALL data & history</button></li> */}
                                        </ul>
                                    </div>

                                    <div className="episode-img-responsive flex-shrink-0" style={{ cursor: "pointer" }} onClick={() => navigate(`/show/${serie.showId}`)}>
                                        {!episodeImgLoaded && (
                                            <div className="d-flex align-items-center justify-content-center bg-secondary text-light" style={{ borderRadius: "10px", height: "100%", width: "100%" }}>
                                                <div className="spinner-border spinner-border-sm text-light" role="status"></div>
                                            </div>
                                        )}
                                        <img
                                            src={imgOriginalMedium || defaultEpisodePoster}
                                            alt={displayEpisode?.episodeData?.name}
                                            onLoad={() => setEpisodeImgLoaded(true)}
                                            style={{ borderRadius: "15px", objectFit: "cover", height: "100%", width: "100%", display: episodeImgLoaded ? "block" : "none" }}
                                        />
                                    </div>
                                    <div className="d-flex flex-row align-items-center flex-grow-1" style={{ minWidth: 0 }}>
                                        <div className="d-flex flex-column flex-grow-1 justify-content-center pe-2" style={{ minWidth: 0 }}>
                                            {/* Visibile solo da tablet in su */}
                                            <h4 className="mb-2 d-none d-md-block text-truncate fw-bold px-1" style={{ cursor: "pointer" }} onClick={() => navigate(`/show/${serie.showId}`)}>
                                                {serie.showName}
                                            </h4>
                                            {/* Visibile solo da mobile */}
                                            <h6 className="mb-1 d-md-none text-truncate fw-bold px-1" style={{ cursor: "pointer", fontSize: "1rem" }} onClick={() => navigate(`/show/${serie.showId}`)}>
                                                {serie.showName}
                                            </h6>
                                            {nextEpisode ? (
                                                <div className="px-1 pb-1 d-flex align-items-center font-details-responsive" style={{ minWidth: 0 }}>
                                                    {!isSeasonPremiere && !isSeasonFinale && isToday(nextEpisode.episodeData.airdate) === false && <span className="badge gray-button-glass me-2 flex-shrink-0">Next</span>}
                                                    {isToday(nextEpisode.episodeData.airdate) && <span className="badge red-button-glass me-2 flex-shrink-0">NEW</span>}
                                                    {isSeasonFinale && <span className="badge red-button-glass me-2 flex-shrink-0">Finale</span>}
                                                    {isSeasonPremiere && <span className="badge lightblue-button-glass me-2 flex-shrink-0">Premier</span>}
                                                    <div className="text-truncate flex-grow-1" style={{ minWidth: 0 }}>
                                                        <strong className="me-1">S{nextEpisode.episodeData.season}E{nextEpisode.episodeData.number}</strong>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="px-1 pb-1">
                                                    <p className="text-danger mb-0" style={{ fontSize: "0.85rem" }}>Error on displaying the next episode. Try and reload the page!</p>
                                                </div>
                                            )}
                                            {nextEpisode && (
                                                <div className="px-1 pb-1 d-flex align-items-center font-details-responsive">
                                                    <p className="text-truncate flex-grow-1 mb-0">{nextEpisode.episodeData.name}</p>
                                                </div>
                                            )}
                                            <div className="d-flex align-items-center px-1 pt-1">
                                                <div className="progress flex-grow-1 me-2" style={{ height: "5px" }}>
                                                    <div className="progress-bar bg-success" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                                <small className="text-muted flex-shrink-0" style={{ fontSize: "0.75rem" }}>{watchedCount}/{totalCount}</small>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 ms-2 d-flex align-items-center">
                                            {nextEpisode && (
                                                <button className="rounded-circle lightgreen-button-glass d-flex align-items-center justify-content-center button-mark-responsive" style={{ cursor: "pointer" }} onClick={() => handleToggleNextEpisode(serie.showId, nextEpisode.episodeData)}>✓</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- SEZIONE ARCHIVIO --- */}
                <div className="mt-5 pt-4 border-top border-secondary border-opacity-25">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h3 className="mb-0 fw-bold">Archive</h3>
                        <button
                            className="gray-button-glass d-flex align-items-center gap-2"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseArchive"
                        >
                            View ({archivedShows.length}) <i className="bi bi-chevron-down" />
                        </button>
                    </div>

                    <div className="collapse" id="collapseArchive">
                        <div className="glass-card p-4 border-0 shadow-sm">
                            {archivedShows.length > 0 ? (
                                <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 g-4">
                                    {archivedShows.map((serie) => (
                                        <div key={serie.showId} className="col">
                                            <div className="card h-100 bg-transparent border-0 transition-all">
                                                <div className="position-relative shadow-sm" style={{ borderRadius: "15px", overflow: "hidden", aspectRatio: "2/3" }}>
                                                    {/* Sostituiamo "medium_portrait" con "original_untouched" per forzare l'alta risoluzione anche per le serie salvate in passato */}
                                                    <img
                                                        src={serie.showImage?.replace("medium_portrait", "original_untouched") || defaultPoster}
                                                        alt={serie.showName}
                                                        onClick={() => navigate(`/show/${serie.showId}`)}
                                                        style={{ cursor: "pointer", objectFit: "cover", width: "100%", height: "100%" }}
                                                    />
                                                </div>
                                                <div className="card-body p-2 px-0 text-center d-flex flex-column">
                                                    <h6 className="card-title text-truncate fw-bold mb-2" title={serie.showName} style={{ fontSize: "0.95rem" }}>
                                                        {serie.showName}
                                                    </h6>
                                                    <button className="lightblue-button-glass w-100 mt-auto py-1" onClick={() => archiveShow(serie.showId)}>
                                                        <i className="bi bi-arrow-counterclockwise" /> Restore
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted mb-0"><i className="bi bi-inbox fs-4 d-block mb-2"></i>No archived shows.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- SEZIONE SERIE COMPLETATE --- */}
                <div className="mt-5 pt-4 border-top border-secondary border-opacity-25">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h3 className="mb-0 fw-bold">Completed Shows</h3>
                        <button
                            className="lightgreen-button-glass d-flex align-items-center gap-2"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseCompleted"
                        >
                            View ({completedShows.length}) <i className="bi bi-chevron-down" />
                        </button>
                    </div>

                    <div className="collapse show" id="collapseCompleted">
                        <div className="glass-card p-4 border-0 shadow-sm">
                            {completedShows.length > 0 ? (
                                <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 g-4">
                                    {completedShows.map((serie) => (
                                        <div key={serie.showId} className="col">
                                            <div className="card h-100 bg-transparent border-0 transition-all hover-scale">
                                                <div className="position-relative shadow-sm" style={{ borderRadius: "15px", overflow: "hidden", aspectRatio: "2/3" }}>
                                                    {/* Sostituiamo "medium_portrait" con "original_untouched" per forzare l'alta risoluzione anche per le serie salvate in passato */}
                                                    <img
                                                        src={serie.showImage?.replace("medium_portrait", "original_untouched") || defaultPoster}
                                                        alt={serie.showName}
                                                        onClick={() => navigate(`/show/${serie.showId}`)}
                                                        style={{ cursor: "pointer", objectFit: "cover", width: "100%", height: "100%" }}
                                                    />

                                                    {/* Badge per il conteggio TOTALE delle visioni */}
                                                    <div className="position-absolute top-0 end-0 m-2">
                                                        <span className="badge rounded-pill lightblue-glass-card text-light shadow-sm d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', backdropFilter: "blur(4px)" }}>
                                                            <i className="bi bi-eye-fill" /> {serie.allTimeCount}
                                                        </span>
                                                    </div>

                                                    {/* Badge per la valutazione dellam serie */}
                                                    {serie.userRating && (
                                                        <div className="position-absolute top-0 start-0 m-2">
                                                            <span className={`badge rounded-pill ${Number(serie.userRating) < 3 ? 'pink-glass-card' :
                                                                Number(serie.userRating) < 5 ? 'red-glass-card' :
                                                                    Number(serie.userRating) < 7 ? 'yellow-glass-card' :
                                                                        Number(serie.userRating) < 8 ? 'lightgreen-glass-card' :
                                                                            Number(serie.userRating) < 10 ? 'green-glass-card' :
                                                                                'lightblue-glass-card'
                                                                } text-light shadow-sm d-flex align-items-center gap-1`} style={{ fontSize: '0.8rem', backdropFilter: "blur(4px)" }}>
                                                            <i className="bi bi-heart-fill" style={{ color: "#dc3545" }} /> {serie.userRating}/10
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="card-body p-2 px-0 text-center d-flex flex-column">
                                                    <h6 className="card-title text-truncate fw-bold mb-2" title={serie.showName} style={{ fontSize: "0.95rem" }}>
                                                        {serie.showName}
                                                    </h6>

                                                    <button
                                                        className="lightgreen-button-glass w-100 mt-auto py-1 fw-bold"
                                                        onClick={() => {
                                                            if (window.confirm(`Start a new Rewatch for "${serie.showName}"? Your current progress will be reset but your all time history will remain saved.`)) {
                                                                startRewatch(serie.showId);
                                                            }
                                                        }}
                                                    >
                                                        <i className="bi bi-arrow-clockwise" /> Rewatch
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted mb-0"><i className="bi bi-check2-circle fs-4 d-block mb-2"></i>You haven't completed any shows yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <RatingModal
                    isOpen={ratingModal.isOpen}
                    targetName={ratingModal.targetName}
                    initialVal={ratingModal.currentVal}
                    onClose={() => setRatingModal({ ...ratingModal, isOpen: false })}
                    onSubmit={(v) => {
                        if (ratingModal.type === 'episode') rateEpisode(ratingModal.showId, ratingModal.targetId, v || 0);
                        if (ratingModal.type === 'season') rateSeason(ratingModal.showId, ratingModal.targetId, v || 0);
                        if (ratingModal.type === 'show') rateShow(ratingModal.showId, v || 0);
                        setRatingModal({ ...ratingModal, isOpen: false });
                    }}
                />
            </div>
        </div>
    );
}