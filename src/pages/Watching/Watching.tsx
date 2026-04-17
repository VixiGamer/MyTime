import { useNavigate } from "react-router-dom";
import { useWatching } from "../../context/Watching/useWatching";
import type { SingleEpisode } from "../../Types/ShowEpisodes";
import { useEffect, useState } from "react";
import axios from "axios";
import RatingModal from "../../components/RatingModal/RatingModal";
import defaultPoster from "../../images/poster_default.png";
import defaultEpisodePoster from "../../images/episode_default.png";

export default function Watching() {
    const [episodeImgLoaded, setEpisodeImgLoaded] = useState(false);

    const {
        watchingList,
        toggleEpisodeStatus,
        archiveShow,
        deleteShowData,
        markShowAsWatched,
        startRewatch,
        rateShow,
        rateEpisode,
        rateSeason,
        syncShowEpisodes
    } = useWatching();

    const navigate = useNavigate();

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

    const handleMarkShowAsWatched = (showId: number, showName: string) => {
        markShowAsWatched(showId);

        setRatingModal({
            isOpen: true,
            showId: showId,
            type: 'show',
            targetId: showId,
            targetName: showName,
            currentVal: 0
        });
    };

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
        <div className="p-4">
            <h1 className="mb-4">Watching</h1>

            {activeShows.length === 0 && (
                <div className="card text-muted card-body glass-card border-0 shadow-sm" style={{cursor: "pointer"}} onClick={() => navigate(`/search`)}>
                    You're not currently watching any series. Click here to search for a series to get started!
                </div>
            )}

            <div className="d-flex flex-column gap-3">
                {activeShows.map((serie) => {
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
                        <div key={serie.showId} className="glass-card card p-3 d-flex flex-row position-relative shadow-sm" style={{ minHeight: "11rem", borderRadius: "10px" }}>

                            <div className="dropdown position-absolute top-0 end-0 m-3">
                                <button className="gray-button-glass dropdown-toggle border" type="button" data-bs-toggle="dropdown">
                                    <i className="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul className="dropdown-menu glass-card dropdown-menu-end shadow">
                                    <li><button className="dropdown-item" onClick={() => navigate(`/show/${serie.showId}`)}>Show Details</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleMarkShowAsWatched(serie.showId, serie.showName)}>Mark entire show as watched</button></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><button className="dropdown-item" onClick={() => archiveShow(serie.showId)}>Archive (Hide below)</button></li>
                                    <li><button className="dropdown-item text-danger fw-bold" onClick={() => deleteShowData(serie.showId)}>Delete ALL data & history</button></li>
                                </ul>
                            </div>

                            <div style={{ cursor: "pointer", width: "300px", flexShrink: 0, marginRight: "1.5rem" }} onClick={() => navigate(`/show/${serie.showId}`)}>
                                {!episodeImgLoaded && (
                                    <div className="d-flex align-items-center justify-content-center bg-secondary text-light" style={{ borderRadius: "5px", height: "100%", width: "100%" }}>
                                        <div className="spinner-border text-light" role="status"></div>
                                    </div>
                                )}
                                <img
                                    src={imgOriginalMedium || defaultEpisodePoster}
                                    alt={displayEpisode?.episodeData?.name}
                                    onLoad={() => setEpisodeImgLoaded(true)}
                                    style={{ borderRadius: "15px", objectFit: "cover", height: "100%", width: "100%", display: episodeImgLoaded ? "block" : "none" }}
                                />
                            </div>

                            <div className="flex-grow-1 d-flex flex-column justify-content-center pe-5">
                                <h4 className="mb-1" style={{ cursor: "pointer" }} onClick={() => navigate(`/show/${serie.showId}`)}>{serie.showName}</h4>
                                {/* {serie.userRating ? <span className="badge yellow-glass-card rounded-pill mb-2" style={{ width: "fit-content" }}>Show rating: {serie.userRating}/10</span> : null} */}

                                <div className="progress mb-2" style={{ maxWidth: "30rem", height: "10px" }}>
                                    <div className="progress-bar bg-success" style={{ width: `${percentage}%` }}></div>
                                </div>
                                <small className="text-muted mb-3">{percentage}% - {watchedCount}/{totalCount}</small>

                                {nextEpisode ? (
                                    <div className="glass-card p-2" style={{ maxWidth: "35rem" }}>
                                        <p className="mb-2">
                                            {!isSeasonPremiere && !isSeasonFinale && isToday(nextEpisode.episodeData.airdate) === false && <span className="badge gray-button-glass me-2">Next</span>}
                                            {isToday(nextEpisode.episodeData.airdate) && <span className="badge red-button-glass me-2">NEW</span>}
                                            {isSeasonFinale && <span className="badge red-button-glass me-2">Finale 🏁</span>}
                                            {isSeasonPremiere && <span className="badge lightblue-button-glass me-2">Premier 🍿</span>}
                                            <strong>S{nextEpisode.episodeData.season}E{nextEpisode.episodeData.number}</strong> - {nextEpisode.episodeData.name}
                                        </p>
                                        <button className="lightgreen-button-glass" onClick={() => handleToggleNextEpisode(serie.showId, nextEpisode.episodeData)}>Mark as watched ✓</button>
                                    </div>
                                ) : (
                                    <div className="p-2 bg-success text-white rounded bg-opacity-75" style={{ maxWidth: "35rem" }}>
                                        <p className="mb-0 fw-bold">🎉 You have completed this show!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- SEZIONE ARCHIVIO (Grafica Originale) --- */}
            <div className="mt-5 pt-4 border-top">
                <button className="lightblue-button-glass mb-3" type="button" data-bs-toggle="collapse" data-bs-target="#collapseArchive">Archive ({archivedShows.length})</button>
                <div className="collapse" id="collapseArchive">
                    <div className="card card-body glass-card border-0 shadow-sm">
                        {archivedShows.length > 0 ? (
                            <div>
                                <h3 className="mb-3">Archive</h3>
                                <div className="d-flex flex-wrap gap-3">
                                    {archivedShows.map((serie) => (
                                        <div key={serie.showId} className="card shadow-sm" style={{ width: "10rem", opacity: 0.85 }}>
                                            <img src={serie.showImage || defaultPoster} alt={serie.showName} onClick={() => navigate(`/show/${serie.showId}`)} style={{ borderTopLeftRadius: "5px", borderTopRightRadius: "5px", cursor: "pointer", objectFit: "cover", height: "15rem" }} />
                                            <div className="card-body p-2 text-center">
                                                <h6 className="card-title text-truncate" style={{ fontSize: "0.9rem" }}>{serie.showName}</h6>
                                                <button className="lightblue-button-glass w-100 mt-2" onClick={() => archiveShow(serie.showId)}>Restore</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-3">
                                <p className="text-muted text-center italic">You haven't any archived shows.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SEZIONE SERIE COMPLETATE --- */}
            <div className="mt-5 pt-4 border-top">
                <button
                    className="lightgreen-button-glass mb-3"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseCompleted"
                >
                    Compleated shows ({completedShows.length})
                </button>

                <div className="collapse show" id="collapseCompleted">
                    <div className="card card-body glass-card border-0 shadow-sm">
                        {completedShows.length > 0 ? (
                            <div>
                                <h3 className="mb-4">Completed shows</h3>
                                <div className="d-flex flex-wrap gap-3">
                                    {completedShows.map((serie) => (
                                        <div key={serie.showId} className="card shadow-sm" style={{ width: "12rem", borderRadius: "10px", overflow: "hidden" }}>
                                            <div className="position-relative" style={{ height: "18rem" }}>
                                                <img
                                                    src={serie.showImage || defaultPoster}
                                                    alt={serie.showName}
                                                    onClick={() => navigate(`/show/${serie.showId}`)}
                                                    style={{ cursor: "pointer", objectFit: "cover", height: "100%", width: "100%" }}
                                                />

                                                {/* Badge per il conteggio TOTALE delle visioni */}
                                                <div className="position-absolute top-0 end-0 m-2">
                                                    <span className="badge lightblue-button-glass text-light shadow-sm d-flex align-items-center gap-1" style={{ fontSize: '0.9rem' }}>                                                        {/* Mostra il totale storico accumulato */}
                                                        {serie.allTimeCount} {serie.allTimeCount === 1 ? 'time' : 'times'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="card-body p-3 text-center d-flex flex-column">
                                                <h6 className="card-title text-truncate fw-bold mb-3" title={serie.showName}>
                                                    {serie.showName}
                                                </h6>

                                                <button
                                                    className="btn lightgreen-button-glass fw-bold py-2"
                                                    onClick={() => {
                                                        if (window.confirm(`Start a new Rewatch for "${serie.showName}"? Your current progress will be reset but your all time history will remain saved.`)) {
                                                            startRewatch(serie.showId); // Aziona il reset di sessionWatched/sessionCount nel Context
                                                        }
                                                    }}
                                                >
                                                    <i className="bi bi-arrow-clockwise" /> Rewatch
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-3">
                                <p className="text-muted mb-0 italic">You haven't completed any shows yet.</p>
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
    );
}