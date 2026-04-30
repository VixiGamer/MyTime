import axios from "axios";
import { useEffect, useState } from "react";
import type { SingleShowDetails } from "../../Types/SingleShowDetails";
import { useNavigate, useParams } from "react-router-dom";
import type { AllEpisodes, SingleEpisode } from "../../Types/ShowEpisodes";
import { useList } from "../../context/List/useList";
import type { Season } from "../../Types/Seasons";
import { useWatching } from "../../context/Watching/useWatching";
import type { SingleCast } from "../../Types/Cast";
import RatingModal from "../../components/RatingModal/RatingModal";
import defaultPoster from "../../images/poster_default.png";
import defaultEpisodePoster from "../../images/episode_default.png";
import Error500 from "../../components/Error500/Error500";
import { Vibrant } from "node-vibrant/browser";
import type { Palette, Swatch } from "@vibrant/color";
import DateTimeModal from "../../components/DateTimeModal/DateTimeModal";



export default function SingleShowPage() {
    const { showId } = useParams();
    const [singleShowData, setSingleShowData] = useState<SingleShowDetails>();
    const [episodesData, setEpisodesData] = useState<AllEpisodes>([]);
    const [numberOfSeasons, setNumberOfSeasons] = useState<number>(0);      //* Il numero di stagioni presenti nella serie
    const [seasonsDetails, setSeasonDetails] = useState<Season[]>([]);
    const [numberOfEpisodes, setNumberOfEpisodes] = useState<number>(0);    //* Il numero di episodi totali della serie
    const [cast, setCast] = useState<SingleCast[]>([]);
    const [isEpisodesLoading, setIsEpisodesLoading] = useState(true);

    const [error404, setError404] = useState(false);    //^ Per gestire l'errore 404
    const [error500, setError500] = useState(false);    //^ Per gestire l'errore 500

    const [posterImgLoaded, setPosterImgLoaded] = useState(false);

    const [bgGradient, setBgGradient] = useState("");

    const imgOriginalMedium = singleShowData?.image?.original || singleShowData?.image?.medium;

    //^ Stato per la modale di valutazione
    const [ratingModal, setRatingModal] = useState<{
        isOpen: boolean;
        type: 'episode' | 'season' | 'show';
        targetId: number; // Id episodio, numero stagione o id show
        targetName: string;
        currentVal: number;
    }>({ isOpen: false, type: 'episode', targetId: 0, targetName: "", currentVal: 0 });

    const [dateTimeModal, setDateTimeModal] = useState<{
        isOpen: boolean;
        episode: SingleEpisode | null;
        actionType: 'toggle' | 'rewatch' | 'markShow';
    }>({
        isOpen: false,
        episode: null,
        actionType: 'toggle'
    });

    //§ ----- CONTEXT -----
    const { lists, addShowToList } = useList();
    const {
        startWatching,
        getShowProgress,
        archiveShow,
        toggleEpisodeStatus,
        markShowAsWatched,
        markSeasonAsWatched,
        unmarkShowAsWatched,
        unmarkSeasonAsWatched,
        startSeasonRewatch,
        startRewatch,
        rewatchEpisode,
        rateShow,
        rateEpisode,
        rateSeason,
        deleteShowData
    } = useWatching();

    const isBeingWatched = getShowProgress(Number(showId));

    const totalShowWatchedCount = isBeingWatched?.allTimeCount || 0;        //^ Conteggio Serie Totale
    const isShowFullyWatched = isBeingWatched?.episodes.length && isBeingWatched?.episodes.every(ep => ep.sessionWatched);

    const initialSeason = (() => {
        if (!isBeingWatched || isBeingWatched.episodes.length === 0) return 1;

        // Cerchiamo il primo episodio non visto nella sessione attuale
        const firstUnwatchedEpisode = isBeingWatched.episodes.find(ep => !ep.sessionWatched);

        // Se esiste, restituiamo la sua stagione, altrimenti l'ultima stagione disponibile
        return firstUnwatchedEpisode
            ? firstUnwatchedEpisode.episodeData.season
            : Math.max(...isBeingWatched.episodes.map(ep => ep.episodeData.season));
    })();

    const [selectedSeasonState, setSelectedSeasonState] = useState<{
        showId: number;
        season: number | null;
    }>({
        showId: Number(showId),
        season: null
    });

    const selectedSeason = selectedSeasonState.showId === Number(showId) && selectedSeasonState.season !== null
        ? selectedSeasonState.season
        : initialSeason;

    const setSelectedSeason = (season: number) => {
        setSelectedSeasonState({
            showId: Number(showId),
            season
        });
    };

    const currentSeasonEpisodes = isBeingWatched?.episodes.filter(ep => ep.episodeData.season === selectedSeason);
    const seasonProg = isBeingWatched?.seasons?.find(s => s.seasonNumber === selectedSeason);
    const isSeasonFullyWatched = currentSeasonEpisodes?.length && currentSeasonEpisodes.every(ep => ep.sessionWatched);
    const seasonWatchedCount = seasonProg?.sessionCount || 0;               //^ Conteggio Stagione Selezionata
    const selectedSeasonDetails = seasonsDetails.find((season) => season.number === selectedSeason);
    const selectedSeasonPoster = selectedSeasonDetails?.image?.original || selectedSeasonDetails?.image?.medium;

    //* Fech dei dettagli della serie, senza gli episodi
    useEffect(() => {
        if (!showId) return;

        //§ Qui controlliamo se l'id ha solo numeri
        const isNumeric = /^\d+$/.test(showId);

        //§ Se ci sono lettere o altri caratteri cambia lo stato di 'error404'
        if (!isNumeric) {
            console.error("ID Serie non valido (contiene lettere)");
            setTimeout(() => {
                setError404(true);
            }, 0);
            return;
        }

        const url = `https://api.tvmaze.com/shows/${showId}`;
        axios.get(url)
            .then((response) => setSingleShowData(response.data))
            .catch((error) => {
                if (error.response && error.response.status === 404) {
                    setError404(true);
                }
                if (error.response.status === 500) {
                    setError500(true);
                }
                console.error(error)
            });
    }, [showId]);

    //* Fetch degli episodi, mi stabilisco gli episodi totali
    useEffect(() => {
        const url = `https://api.tvmaze.com/shows/${showId}/episodes`;
        axios.get(url)
            .then((response) => {
                setEpisodesData(response.data);
                setNumberOfEpisodes(response.data.length);
            })
            .catch((error) => console.error(error))
            .finally(() => setIsEpisodesLoading(false)); // Finisce SEMPRE qui
    }, [showId]);

    //* Fetch del numero di stagioni
    useEffect(() => {
        const url = `https://api.tvmaze.com/shows/${showId}/seasons`
        axios.get(url)
            .then((responce) => {
                setNumberOfSeasons(responce.data.length);
                setSeasonDetails(responce.data);
            })
            .catch((error) => console.error(error));
    }, [showId]);

    //* Fetch per il cast della serie
    useEffect(() => {
        const url = `https://api.tvmaze.com/shows/${showId}/cast`
        axios.get(url)
            .then((responce) => {
                setCast(responce.data)
            })
            .catch((error) => console.error(error))
    }, [showId])

    //* Per estrarre i colori dal poster e usarli come sfondo dinamico della pagina
    useEffect(() => {
        if (!imgOriginalMedium) return;

        Vibrant.from(imgOriginalMedium)
            .getPalette()
            .then((palette: Palette) => {

                const colors = Object.values(palette)
                    .filter((swatch): swatch is Swatch => Boolean(swatch))
                    .map((swatch) => swatch.rgb);

                if (colors.length === 0) return;

                const selected = colors.slice(0, 5);

                const colorStrings = selected.map(
                    (c: number[]) => `rgb(${c.join(",")})`
                );

                const gradient = `linear-gradient(135deg, ${colorStrings.join(",")})`;

                setBgGradient(gradient);
            })
            .catch((err) => {
                console.error("Errore Vibrant:", err);
            });

    }, [imgOriginalMedium]);

    function formatDate(date?: string | null): string {
        if (!date) return "N/A"
        const [year, month, day] = date.split("-")
        return `${day}-${month}-${year}`
    }


    const navigate = useNavigate()

    //& Per tenere tracia di quale stagione stai guardando
    const currentSeasonProgress = isBeingWatched?.seasons?.find(
        (s) => s.seasonNumber === selectedSeason
    );

    //& Funzione per getsire il pulsante di quando cominci a guardare una seire
    const handleStartWatching = () => {
        if (singleShowData && episodesData) {
            startWatching(singleShowData, episodesData);
        }
    };

    //& Funzione per gestire quando segni un episodio come visto spunta la modal per la valutazione
    const handleToggleEpisode = (episode: SingleEpisode, customDate?: string, customTime?: string) => {
        const watchedStatus = isBeingWatched?.episodes.find(e => e.episodeId === episode.id)?.sessionWatched;
        const currentRating = isBeingWatched?.episodes.find(e => e.episodeId === episode.id)?.userRating;
        toggleEpisodeStatus(Number(showId), episode.id, customDate, customTime);

        // Se segnamo l'episodio come visto allora apriamo la modale per la valutazione (solo se non ha già un voto)
        if (!watchedStatus && !currentRating) {
            setRatingModal({ isOpen: true, type: 'episode', targetId: episode.id, targetName: episode.name, currentVal: 0 })
        }
    }

    //& Funzione per getsire quando vuoi valutare una stagione
    const handleMarkSeason = (seasonNum: number, customDate?: string, customTime?: string) => {
        if (isSeasonFullyWatched) {
            if (window.confirm(`Do you want to mark Season ${seasonNum} as UNWATCHED?`)) unmarkSeasonAsWatched(Number(showId), seasonNum);
        } else {
            if (window.confirm(`Do you want to mark Season ${seasonNum} as WATCHED?`)) {
                markSeasonAsWatched(Number(showId), seasonNum, customDate, customTime);
                const seasonRating = isBeingWatched?.seasons?.find(s => s.seasonNumber === seasonNum)?.userRating;
                if (!seasonRating) {
                    setRatingModal({ isOpen: true, type: 'season', targetId: seasonNum, targetName: `Stagione ${seasonNum}`, currentVal: 0 });
                }
            }
        }
    };

    //& Funzione per getsire quando vuoi valutare una serie
    const handleMarkShow = (customDate?: string, customTime?: string) => {
        if (isShowFullyWatched) {
            if (window.confirm(`Do you want to mark the entire series as UNWATCHED?`)) unmarkShowAsWatched(Number(showId));
        } else {
            if (window.confirm(`Do you want to mark the entire series as WATCHED?`)) {
                markShowAsWatched(Number(showId), customDate, customTime);
                if (!isBeingWatched?.userRating) {
                    setRatingModal({ isOpen: true, type: 'show', targetId: Number(showId), targetName: singleShowData?.name || "Serie", currentVal: 0 });
                }
            }
        }
    };

    // Consideriamo la pagina caricata se abbiamo almeno i dati base dello show
    const isPageLoading = !singleShowData;

    // Se vogliamo essere più sicuri, verifichiamo che i parametri siano pronti
    if (!showId) return null;

    if (error404) {
        return (
            <div className="p-4">
                <button className="btn btn-outline-dark mb-4" onClick={() => navigate(-1)}>Back</button>
                <div className="p-4 text-center alert alert-danger mx-auto" style={{ maxWidth: "500px" }}>
                    <h4 className="alert-heading">Show non found!</h4>
                    <p>The Id <strong>{showId}</strong> does not correspond to any shows.</p>
                </div>
            </div>
        );
    }

    if (error500) {
        return (
            <div className="p-4">
                <button className="btn btn-outline-dark mb-4" onClick={() => navigate(-1)}>Back</button>
                <Error500 />
            </div>

        );
    }

    if (isPageLoading) return (
        <div className="p-4 position-relative">
            <button className="btn btn-outline-dark mb-3" onClick={() => navigate(-1)}>Back</button>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100vh" }}>
                <div className="spinner-border text-dark" role="status">
                    <span className="visually-hidden"></span>
                </div>
            </div>
        </div>
    );

    //? Gli 'episodeSkeletons' sono dei rettangoli grigi animati che imitano la forma della lista degli episodi che sta per caricarsi
    const episodeSkeletons = Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="d-flex align-items-center border p-2 mb-2 bg-light opacity-50" style={{ borderRadius: "5px", height: "5.6rem" }}>
            <div className="bg-secondary bg-opacity-25 mr-3" style={{ width: "8rem", height: "4.5rem", borderRadius: "5px" }}></div>
            <div className="flex-grow-1 ms-3">
                <div className="bg-secondary bg-opacity-25 mb-2" style={{ width: "40%", height: "1rem", borderRadius: "4px" }}></div>
                <div className="bg-secondary bg-opacity-25" style={{ width: "70%", height: "1rem", borderRadius: "4px" }}></div>
            </div>
        </div>
    ));

    return (
        <>
            {/* Background sfocato */}
            <div className="min-vh-100" style={{ backgroundImage: bgGradient, paddingBottom: "3rem" }}>
                <div className="p-4 container position-relative">
                    <button className="glass-card mb-4 px-3 py-2 shadow-sm" style={{ color: "var(--text-main)" }} onClick={() => navigate(-1)}>
                        ← Back
                    </button>

                    <div className="glass-card p-4 mb-5 shadow-lg border-0 position-relative" style={{ zIndex: 10 }}>
                        <div className="row g-4">
                            {/* Poster Column */}
                            <div className="col-md-4 col-lg-3">
                                <div className="position-relative shadow-lg rounded-4 overflow-hidden">
                                    {!posterImgLoaded && (
                                        <div className="d-flex align-items-center justify-content-center bg-dark text-light" style={{ height: "400px" }}>
                                            <div className="spinner-border spinner-border-sm" role="status"></div>
                                        </div>
                                    )}
                                    <img
                                        src={imgOriginalMedium || defaultPoster}
                                        alt={singleShowData?.name}
                                        className="img-fluid w-100"
                                        onLoad={() => setPosterImgLoaded(true)}
                                        style={{
                                            display: posterImgLoaded ? "block" : "none",
                                            objectFit: "cover",
                                            minHeight: "400px"
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Content Column */}
                            <div className="col-md-8 col-lg-9 d-flex flex-column">
                                <h1 className="display-4 fw-bold">{singleShowData?.name || "Show name unavalible"}</h1>
                                <p className="fw-bold text-uppercase mb-3" style={{ color: "#2FA4D7", letterSpacing: "1.5px" }}>
                                    {singleShowData?.genres?.join(" • ") || "No genres available"}
                                </p>

                                {/* Action Buttons */}
                                <div className="d-flex gap-3 mb-4 flex-wrap">
                                    {isBeingWatched && (
                                        Number(isBeingWatched.userRating) ? (
                                            <button
                                                className={`${Number(isBeingWatched.userRating) < 3 ? 'pink-button-glass' :
                                                    Number(isBeingWatched.userRating) < 5 ? 'red-button-glass' :
                                                        Number(isBeingWatched.userRating) < 7 ? 'yellow-button-glass' :
                                                            Number(isBeingWatched.userRating) < 8 ? 'lightgreen-button-glass' :
                                                                Number(isBeingWatched.userRating) < 10 ? 'green-button-glass' :
                                                                    'lightblue-button-glass'
                                                    } fw-bold shadow-sm transition-all px-3 py-2`}
                                                style={{
                                                    color: 'var(--text-main)',
                                                }}
                                                onClick={() => setRatingModal({ isOpen: true, type: 'show', targetId: Number(showId), targetName: isBeingWatched.showName || singleShowData?.name || "", currentVal: isBeingWatched.userRating || 0 })}
                                            >
                                                <i className="bi bi-heart-fill" style={{ color: "#dc3545" }} /> {isBeingWatched.userRating}/10
                                            </button>
                                        ) : (
                                            <button
                                                className="lightgray-button-glass fw-bold shadow-sm transition-all px-3 py-2"
                                                onClick={() => setRatingModal({ isOpen: true, type: 'show', targetId: Number(showId), targetName: isBeingWatched.showName || singleShowData?.name || "", currentVal: 0 })}
                                            >
                                                <i className="bi bi-heart-fill" style={{ color: "#dc3545" }} /> Rate Show
                                            </button>
                                        )
                                    )}

                                    {totalShowWatchedCount > 0 && (
                                        <div className="dropdown flex-shrink-0">
                                            <button className="gray-button-glass d-flex align-items-center px-3" type="button" data-bs-toggle="dropdown">
                                                <i className="bi bi-eye-fill me-1" /> {totalShowWatchedCount}
                                            </button>

                                            <ul className="dropdown-menu glass-card shadow">
                                                {isBeingWatched?.watchDates?.map((date, index) => (
                                                    <li key={index}>
                                                        <span className="dropdown-item">{index + 1}. {date[0]} -  {date[1]}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Info Grid */}
                                <div className="row row-cols-2 row-cols-lg-5 g-3 mb-4">
                                    <div className="col">
                                        <small className="text-muted d-block">Premiere</small>
                                        <strong>{formatDate(singleShowData?.premiered) || "N/A"}</strong>
                                    </div>
                                    <div className="col">
                                        <small className="text-muted d-block">End</small>
                                        <strong>{formatDate(singleShowData?.ended) === "N/A" ? "Still running" : formatDate(singleShowData?.ended)}</strong>
                                    </div>
                                    <div className="col">
                                        <small className="text-muted d-block">Seasons</small>
                                        <strong>{numberOfSeasons}</strong>
                                    </div>
                                    <div className="col">
                                        <small className="text-muted d-block">Episodes</small>
                                        <strong>{numberOfEpisodes}</strong>
                                    </div>
                                    <div className="col">
                                        <small className="text-muted d-block">TVMaze Rating</small>
                                        <i className="bi bi-star-fill" style={{ color: "#ffc107" }} /> <strong>{singleShowData?.rating?.average === null ? "N/A" : singleShowData?.rating?.average}</strong>
                                    </div>
                                    <div className="col">
                                        <small className="text-muted d-block">Network</small>
                                        <strong>{singleShowData?.network?.name || singleShowData?.webChannel?.name || "N/A"}</strong>
                                    </div>
                                    <div className="col">
                                        <small className="text-muted d-block">Country</small>
                                        <strong>{singleShowData?.network?.country?.name || "N/A"}</strong>
                                    </div>
                                    <div className="col">
                                        <small className="text-muted d-block">Show ID</small>
                                        <strong>#{singleShowData?.id}</strong>
                                    </div>
                                    <div className="col">
                                        <small className="text-muted d-block">IMDB ID</small>
                                        <strong>{singleShowData?.externals.imdb || "N/A"}</strong>
                                    </div>
                                    <div className="col">
                                        <small className="text-muted d-block">Official Site</small>
                                        {!singleShowData?.officialSite ? (
                                            <span>Not available</span>
                                        ) : (
                                            <a href={singleShowData.officialSite} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                                Visit Site
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {singleShowData?.summary && (
                                    <div>
                                        <h5 className="fw-bold">Summary</h5>
                                        <p className="opacity-75 lead" style={{ fontSize: "1rem" }}>
                                            {singleShowData.summary.replace(/<[^>]+>/g, '')}
                                        </p>
                                    </div>
                                )}

                                <div className="d-flex gap-3 mb-4 flex-wrap">
                                    {!isBeingWatched ? (
                                        <button className="lightblue-button-glass" onClick={handleStartWatching}>Start Watching</button>
                                    ) : (
                                        <div className="dropdown">
                                            <button className="lightblue-button-glass dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                {isBeingWatched.isArchived ? "Archived" : "Currently Watching"}
                                            </button>
                                            <ul className="dropdown-menu glass-card">
                                                <li><button className="dropdown-item" onClick={() => navigate(`/watching`)}>Go to Watching</button></li>
                                                <li>
                                                    <button className="dropdown-item" onClick={() => archiveShow(Number(showId))}>
                                                        {isBeingWatched.isArchived ? "Restore from Archive" : "Archive"}
                                                    </button>
                                                </li>
                                                <li>
                                                    {!isShowFullyWatched && (
                                                        <div>
                                                            <button
                                                                className="dropdown-item py-2 d-flex justify-content-between align-items-center"
                                                                type="button"
                                                                data-bs-toggle="collapse"
                                                                data-bs-target={`#collapseDate-${showId}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                Mark Entire Show as Watched <i className="bi bi-chevron-down ms-3" style={{ fontSize: "0.8rem" }}></i>
                                                            </button>
                                                            <div className="collapse" id={`collapseDate-${showId}`}>

                                                                <button className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={() => {
                                                                    const d = new Date();
                                                                    markShowAsWatched(Number(showId), d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                                                                    if (!isBeingWatched?.userRating) setRatingModal({ isOpen: true, type: 'show', targetId: Number(showId), targetName: singleShowData?.name || "Serie", currentVal: 0 });
                                                                }}>Today</button>

                                                                <button className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={() => {
                                                                    const d = new Date();
                                                                    d.setDate(d.getDate() - 1);
                                                                    markShowAsWatched(Number(showId), d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                                                                    if (!isBeingWatched?.userRating) setRatingModal({ isOpen: true, type: 'show', targetId: Number(showId), targetName: singleShowData?.name || "Serie", currentVal: 0 });
                                                                }}>Yesterday</button>

                                                                <button className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={() => {
                                                                    const d = new Date();
                                                                    d.setDate(d.getDate() - 2);
                                                                    markShowAsWatched(Number(showId), d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                                                                    if (!isBeingWatched?.userRating) setRatingModal({ isOpen: true, type: 'show', targetId: Number(showId), targetName: singleShowData?.name || "Serie", currentVal: 0 });
                                                                }}>2 days ago</button>

                                                                <button type="button" className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setDateTimeModal({
                                                                        isOpen: true,
                                                                        episode: null,
                                                                        actionType: 'markShow'
                                                                    });
                                                                }}>Custom date</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </li>
                                                <li>
                                                    {isShowFullyWatched && (
                                                        <button
                                                            className="dropdown-item"
                                                            onClick={() => {
                                                                const confirmRewatch = window.confirm(
                                                                    `Start a new Rewatch for "${singleShowData?.name}"? Your current progress will be reset but your all time history will remain saved.`
                                                                );
                                                                if (confirmRewatch) {
                                                                    startRewatch(Number(showId));
                                                                }
                                                            }}
                                                        >
                                                            <i className="bi bi-arrow-clockwise" /> Start Full Rewatch
                                                        </button>
                                                    )}
                                                </li>
                                                <li><hr className="dropdown-divider" /></li>
                                                <li>
                                                    <button
                                                        className="dropdown-item py-2 text-danger fw-bold d-flex align-items-center gap-2"
                                                        onClick={() => deleteShowData(Number(showId))}
                                                    >
                                                        <i className="bi bi-trash3" />Total Data Reset
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    )
                                    }

                                    {/* --- PULSANTE LISTE --- */}
                                    <div className="dropdown">
                                        <button
                                            className="gray-button-glass dropdown-toggle"
                                            type="button"
                                            data-bs-toggle="dropdown"
                                            disabled={!singleShowData}
                                        >
                                            {singleShowData ? "Add to list" : "Loading..."}
                                        </button>
                                        <ul className="dropdown-menu glass-card">
                                            {lists.length === 0 ? (
                                                <li className="dropdown-item disabled">No lists available</li>
                                            ) : (
                                                lists.map((list) => {
                                                    const isAlreadyInThisList = list.shows?.some((show) => show.id === Number(showId));
                                                    return (
                                                        <li key={list.listId}>
                                                            <button
                                                                type="button"
                                                                className={`dropdown-item ${isAlreadyInThisList ? 'disabled' : ''}`}
                                                                disabled={isAlreadyInThisList}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    if (!isAlreadyInThisList && singleShowData) {
                                                                        addShowToList(list.listId, singleShowData);
                                                                    }
                                                                }}
                                                                style={isAlreadyInThisList ? { opacity: 0.6 } : {}}
                                                            >
                                                                {list.listName} {isAlreadyInThisList && " (In list)"}
                                                            </button>
                                                        </li>
                                                    );
                                                })
                                            )}
                                        </ul>
                                    </div>

                                    {/* Pulsante per le immaggini della serie */}
                                    <button type="button" className="lightgreen-button-glass" onClick={() => navigate(`/show/${showId}/images`)}>Show images</button>
                                </div>


                            </div>
                        </div>
                    </div>

                    <div>
                        {/* --- LISTA EPISODI --- */}
                        <div className="glass-card" style={{ marginTop: "9rem" }}>
                            <div className="d-flex align-items-end m-3">
                                <img
                                    src={selectedSeasonPoster || defaultPoster} alt={`Season ${selectedSeason}`}
                                    className="shadow-lg"
                                    style={{ height: "10rem", width: "6.8rem", borderRadius: "15px", position: "absolute", cursor: "pointer", objectFit: "cover" }}
                                    onClick={() => {
                                        const season = seasonsDetails.find(s => s.number === selectedSeason);
                                        if (season) {
                                            navigate(`/show/${singleShowData?.id}/season/${season.id}`);
                                        }
                                    }}
                                    title={`Get Season ${selectedSeason} info`}
                                />


                                <div className="d-flex flex-wrap align-items-end gap-3" style={{ marginLeft: "9rem" }}>
                                    {/* Dropdown per selezionare la stazione */}
                                    <div className="dropdown">
                                        <button className="gray-button-glass dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                            Season {selectedSeason}
                                        </button>
                                        <ul className="dropdown-menu glass-card">
                                            {seasonsDetails.map((season) => (
                                                <li key={season.id}>
                                                    <button
                                                        className={`dropdown-item ${selectedSeason === season.number ? 'active' : ''}`}
                                                        onClick={() => setSelectedSeason(season.number)}
                                                    >
                                                        Season {season.number}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Badge se abbiamo visto la stagione se si quante volte */}
                                    {seasonWatchedCount > 0 && (
                                        <div className="d-flex align-items-center">
                                            <span className="lightgreen-button-glass">
                                                {seasonWatchedCount > 1 ? `Rewatched ${seasonWatchedCount}x` : 'Compleated'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Solo se stiamo guardando la serie */}
                                    {isBeingWatched && (
                                        <div className="dropdown">
                                            <button className="lightgreen-button-glass dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                Mark
                                            </button>
                                            <ul className="dropdown-menu glass-card">
                                                <li><button className="dropdown-item" onClick={() => handleMarkSeason(selectedSeason)}>
                                                    {isSeasonFullyWatched ? `Unmark Season ${selectedSeason}` : `Mark Season ${selectedSeason} as watched`}
                                                </button></li>
                                                {isShowFullyWatched ? (
                                                    <li><button className="dropdown-item" onClick={() => handleMarkShow()}>Unmark entire show</button></li>
                                                ) : (
                                                    <li>
                                                        <div>
                                                            <button
                                                                className="dropdown-item py-2 d-flex justify-content-between align-items-center"
                                                                type="button"
                                                                data-bs-toggle="collapse"
                                                                data-bs-target={`#collapseDate-${showId}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                Mark Entire Show as Watched <i className="bi bi-chevron-down ms-3" style={{ fontSize: "0.8rem" }}></i>
                                                            </button>
                                                            <div className="collapse" id={`collapseDate-${showId}`}>

                                                                <button className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={() => {
                                                                    const d = new Date();
                                                                    markShowAsWatched(Number(showId), d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                                                                    if (!isBeingWatched?.userRating) setRatingModal({ isOpen: true, type: 'show', targetId: Number(showId), targetName: singleShowData?.name || "Serie", currentVal: 0 });
                                                                }}>Today</button>

                                                                <button className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={() => {
                                                                    const d = new Date();
                                                                    d.setDate(d.getDate() - 1);
                                                                    markShowAsWatched(Number(showId), d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                                                                    if (!isBeingWatched?.userRating) setRatingModal({ isOpen: true, type: 'show', targetId: Number(showId), targetName: singleShowData?.name || "Serie", currentVal: 0 });
                                                                }}>Yesterday</button>

                                                                <button className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={() => {
                                                                    const d = new Date();
                                                                    d.setDate(d.getDate() - 2);
                                                                    markShowAsWatched(Number(showId), d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                                                                    if (!isBeingWatched?.userRating) setRatingModal({ isOpen: true, type: 'show', targetId: Number(showId), targetName: singleShowData?.name || "Serie", currentVal: 0 });
                                                                }}>2 days ago</button>

                                                                <button type="button" className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setDateTimeModal({
                                                                        isOpen: true,
                                                                        episode: null,
                                                                        actionType: 'markShow'
                                                                    });
                                                                }}>Custom date</button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                )}
                                                {isSeasonFullyWatched && (
                                                    <li><button className="dropdown-item" onClick={() => {
                                                        if (window.confirm(`Vuoi resettare il progresso della Stagione ${selectedSeason} per rivederla?`)) {
                                                            startSeasonRewatch(Number(showId), selectedSeason);
                                                        }
                                                    }}>
                                                        <i className="bi bi-arrow-clockwise" /> Rewatch Season {selectedSeason}
                                                    </button></li>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Rating della stagione */}
                                    {isBeingWatched && (
                                        <button
                                            type="button"
                                            className="pink-button-glass flex-shrink-0"
                                            onClick={() =>
                                                setRatingModal({
                                                    isOpen: true,
                                                    type: 'season',
                                                    targetId: selectedSeason,
                                                    targetName: `Season ${selectedSeason}`,
                                                    currentVal: seasonProg?.userRating || 0
                                                })
                                            }
                                        >
                                            {currentSeasonProgress?.userRating ? (
                                                <><i className="bi bi-heart-fill" style={{ color: "#dc3545" }}></i> <strong>{currentSeasonProgress.userRating}/10</strong></>
                                            ) : (
                                                <>Rate Season {selectedSeason}</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 1. Stato: Caricamento in corso */}
                            {isEpisodesLoading && episodeSkeletons}

                            {/* 2. Stato: Caricamento finito MA l'array è vuoto */}
                            {!episodesData.filter((ep) => ep.season === selectedSeason).length ? (
                                <div className="alert alert-info text-center mt-3">
                                    <i className="bi bi-info-circle me-2"></i>
                                    No episodes available for this season at the moment.
                                </div>
                            ) : (null)}

                            {episodesData.filter((ep) => ep.season === selectedSeason).map((episode, index, arr) => {
                                const epProg = isBeingWatched?.episodes.find(e => e.episodeId === episode.id);
                                const watchedStatus = epProg?.sessionWatched;
                                const userRating = epProg?.userRating;
                                const totalViews = Number(epProg?.sessionCount || 0);

                                const today = new Date();
                                const episodeAirDate = new Date(episode.airdate || "");
                                // Lo faccio cosi oggi non risulta passato solo perche è un orario diverso
                                today.setHours(0, 0, 0, 0)
                                episodeAirDate.setHours(0, 0, 0, 0)

                                // Ora converto il milli secondi e poi in giorni
                                const diffTime = episodeAirDate.getTime() - today.getTime()
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                                //Ora determio lo stato, se l'episodio uscira in futuro, se esce oggi oppure se e gia uscito in passato
                                // const isFuture = diffDays > 0;
                                const isToday = diffDays === 0;
                                // const isPast = diffDays < 0;

                                return (
                                    <>
                                        <div key={episode.id} className="d-flex align-items-center p-2 m-2 transition-all" style={{ borderRadius: "12px" }}>
                                            <img
                                                src={episode.image?.medium || episode.image?.original || defaultEpisodePoster}
                                                alt={episode?.name}
                                                onClick={() => navigate(`/show/${singleShowData?.id}/episode/${episode.id}`)}
                                                style={{ borderRadius: "15px", objectFit: "cover", width: "8rem", height: "4.5rem", cursor: "pointer", flexShrink: 0 }}
                                                title={`Get info about '${episode.name}' - (S${episode.season}E${episode.number})`}
                                            />

                                            <div className="mx-3 flex-grow-1" style={{ minWidth: 0 }}>
                                                <div className="d-flex align-items-center flex-wrap gap-2">
                                                    <p className="mb-0"><strong>{episode.season}X{episode.number}</strong></p>

                                                    <div className="d-flex flex-nowrap align-items-center overflow-x-auto scrollbar-no gap-2" style={{ flex: 1 }}>
                                                        {/* Badge se l'episodio e uscito oggi */}
                                                        {isToday && (
                                                            <span className="badge rounded-pill red-glass-card" style={{ fontSize: "0.7rem" }}>
                                                                NEW
                                                            </span>
                                                        )}

                                                        {/* Badge se abbiamo visto l'episodio */}
                                                        {totalViews > 0 && (
                                                            <span className="badge rounded-pill green-glass-card d-none d-md-block" style={{ fontSize: '0.7rem' }}>
                                                                ✓ Watched
                                                            </span>
                                                        )}

                                                        {/* Rating del episodio */}
                                                        {userRating ? (
                                                            <small className={`badge rounded-pill ${userRating
                                                                ? (userRating < 3 ? 'pink-glass-card' :
                                                                    userRating < 5 ? 'red-glass-card' :
                                                                        userRating < 7 ? 'yellow-glass-card' :
                                                                            userRating < 8 ? 'lightgreen-glass-card' :
                                                                                userRating < 10 ? 'green-glass-card' :
                                                                                    'lightblue-glass-card')
                                                                : 'lightgray-glass-card shadow-none'}`}>
                                                                <i className="bi bi-heart-fill" style={{ color: "#dc3545" }} /> {userRating}/10
                                                            </small>
                                                        ) : null}
                                                    </div>

                                                </div>
                                                <p className="mb-0 text-truncate" style={{ maxWidth: "250px" }}>{episode.name}</p>
                                                <p className="mb-0 text-truncate" style={{ maxWidth: "250px", color: "#6c757d" }}>{formatDate(episode.airdate)}</p>
                                            </div>

                                            {isBeingWatched && episodeAirDate < today && (
                                                <div className="dropdown flex-shrink-0">

                                                    <button className={`rounded-circle d-flex align-items-center justify-content-center ${watchedStatus ? 'lightgreen-glass-card' : 'gray-glass-card'}`} type="button" data-bs-toggle="dropdown" style={{ width: "32px", height: "32px", padding: 0 }}>
                                                        {watchedStatus ? '✓' : <i className="bi bi-plus-lg"></i>}
                                                    </button>
                                                    <ul className="dropdown-menu dropdown-menu-end glass-card shadow">
                                                        <li>
                                                            <button className="dropdown-item py-2" onClick={() => handleToggleEpisode(episode)}>
                                                                {watchedStatus ? 'Mark as unwatched' : 'Mark as watched'}
                                                            </button>
                                                        </li>
                                                        <li>
                                                            {!watchedStatus && (
                                                                <div>
                                                                    <button
                                                                        className="dropdown-item py-2 d-flex justify-content-between align-items-center"
                                                                        type="button"
                                                                        data-bs-toggle="collapse"
                                                                        data-bs-target={`#collapseDate-${episode.id}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        Select another date <i className="bi bi-chevron-down ms-3" style={{ fontSize: "0.8rem" }}></i>
                                                                    </button>
                                                                    <div className="collapse" id={`collapseDate-${episode.id}`}>

                                                                        <button className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={() => {
                                                                            const d = new Date();
                                                                            d.setDate(d.getDate() - 1);
                                                                            handleToggleEpisode(episode, d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                                                                        }}>Yesterday</button>

                                                                        <button className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={() => {
                                                                            const d = new Date();
                                                                            d.setDate(d.getDate() - 2);
                                                                            handleToggleEpisode(episode, d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                                                                        }}>2 days ago</button>

                                                                        <button type="button" className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setDateTimeModal({
                                                                                isOpen: true,
                                                                                episode,
                                                                                actionType: 'toggle'
                                                                            });
                                                                        }}>Custom date</button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </li>
                                                        <li>
                                                            {watchedStatus && (
                                                                <div>
                                                                    <button
                                                                        className="dropdown-item py-2 d-flex justify-content-between align-items-center"
                                                                        type="button"
                                                                        data-bs-toggle="collapse"
                                                                        data-bs-target={`#collapseDate-${episode.id}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        Rewatch episode <i className="bi bi-chevron-down ms-3" style={{ fontSize: "0.8rem" }}></i>
                                                                    </button>
                                                                    <div className="collapse" id={`collapseDate-${episode.id}`}>

                                                                        <button className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={() => {
                                                                            const d = new Date();
                                                                            rewatchEpisode(Number(showId), episode.id, d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                                                                        }}>Today</button>

                                                                        <button className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={() => {
                                                                            const d = new Date();
                                                                            d.setDate(d.getDate() - 1);
                                                                            rewatchEpisode(Number(showId), episode.id, d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                                                                        }}>Yesterday</button>

                                                                        <button className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={() => {
                                                                            const d = new Date();
                                                                            d.setDate(d.getDate() - 2);
                                                                            rewatchEpisode(Number(showId), episode.id, d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                                                                        }}>2 days ago</button>

                                                                        <button type="button" className="dropdown-item py-2 text-muted" style={{ paddingLeft: "2rem" }} onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setDateTimeModal({
                                                                                isOpen: true,
                                                                                episode,
                                                                                actionType: 'rewatch'
                                                                            });
                                                                        }}>Custom date</button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        </li>
                                                        {watchedStatus && (
                                                            <li>
                                                                <button className="dropdown-item py-2" onClick={() => setRatingModal({ isOpen: true, type: 'episode', targetId: episode.id, targetName: episode.name, currentVal: userRating || 0 })}>
                                                                    Rate episode
                                                                </button>
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Questo serve per far vedere quati giorni mancano a quando esce l'episodio */}
                                            {diffDays === 1 && (
                                                <div className="rounded-pill gray-button-glass flex-shrink-0">
                                                    <i className="bi bi-calendar-fill" /> {diffDays} day
                                                </div>
                                            )}

                                            {diffDays > 1 && (
                                                <div className="rounded-pill gray-button-glass flex-shrink-0">
                                                    <i className="bi bi-calendar-fill" /> {diffDays} days
                                                </div>
                                            )}

                                        </div>

                                        {/* La linea che separa ogni episodio */}
                                        {index < arr.length - 1 && <hr className="my-0" style={{ marginLeft: 'calc(8rem + 2rem)', width: 'auto' }} />}
                                    </>
                                );
                            })}
                        </div>

                    </div>

                    <div className="glass-card p-3" style={{ marginTop: "4rem" }}>
                        <h2 className="display-5 fw-bold mb-3">Cast</h2>
                        <div className="d-flex flex-nowrap gap-2 overflow-x-auto scrollbar-no" style={{ scrollBehavior: "smooth" }}>
                            {cast.map((cast) => {
                                return (
                                    <div key={cast.person.id} className="card border p-0 overflow-hidden h-100 d-flex flex-column" style={{ textAlign: "center", cursor: "pointer", flex: "0 0 auto", width: "10rem", borderRadius: "15px" }} onClick={() => navigate(`/actor/${cast.person.id}`)}>
                                        <img
                                            src={cast.person.image?.original || cast.person.image?.medium || defaultPoster}
                                            alt={cast.person.name}
                                            className="w-100 flex-shrink-0"
                                            style={{ height: "14rem", objectFit: "cover" }}
                                        />
                                        <div className="p-2 d-flex flex-column justify-content-center flex-grow-1">
                                            <strong className="text-truncate">{cast.person.name}</strong>
                                            <p className="mt-1 mb-0 text-truncate">{cast.character.name}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* --- MODALE DI VALUTAZIONE ESTERNA --- */}
                    <RatingModal
                        isOpen={ratingModal.isOpen}
                        targetName={ratingModal.targetName}
                        initialVal={ratingModal.currentVal}
                        onClose={() => setRatingModal({ ...ratingModal, isOpen: false })}
                        onSubmit={(votoFinale) => {
                            // Applichiamo il voto usando la funzione giusta dal context
                            if (ratingModal.type === 'episode') rateEpisode(Number(showId), ratingModal.targetId, votoFinale ?? 0);
                            if (ratingModal.type === 'season') rateSeason(Number(showId), ratingModal.targetId, votoFinale ?? 0);
                            if (ratingModal.type === 'show') rateShow(Number(showId), votoFinale ?? 0);

                            // Chiudiamo la modale
                            setRatingModal({ ...ratingModal, isOpen: false });
                        }}
                    />

                    {/* --- MODALE PER SCEGLIERE UNA DATA E UN ORARIO PERSONALIZZATO --- */}
                    <DateTimeModal
                        isOpen={dateTimeModal.isOpen}
                        onClose={() => setDateTimeModal({ ...dateTimeModal, isOpen: false })}
                        onConfirm={(date, time) => {
                            // Formattiamo la data da YYYY-MM-DD a DD/MM/YYYY per coerenza
                            const [year, month, day] = date.split('-');
                            const formattedDate = `${day}/${month}/${year}`;

                            if (dateTimeModal.actionType === 'markShow') {
                                markShowAsWatched(Number(showId), formattedDate, time);
                                if (!isBeingWatched?.userRating) setRatingModal({ isOpen: true, type: 'show', targetId: Number(showId), targetName: singleShowData?.name || "Serie", currentVal: 0 });
                            } else if (dateTimeModal.episode) {
                                if (dateTimeModal.actionType === 'rewatch') {
                                    rewatchEpisode(Number(showId), dateTimeModal.episode.id, formattedDate, time);
                                } else if (dateTimeModal.actionType === 'toggle') {
                                    handleToggleEpisode(dateTimeModal.episode, formattedDate, time);
                                }
                            }
                            setDateTimeModal({ ...dateTimeModal, isOpen: false });
                        }}
                    />
                </div>
            </div>
        </>
    );
}
