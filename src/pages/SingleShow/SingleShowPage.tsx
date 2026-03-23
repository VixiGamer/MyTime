import axios from "axios";
import { useEffect, useState } from "react";
import type { SingleShowDetails } from "../../Types/SingleShowDetails";
import { useNavigate, useParams } from "react-router-dom";
import type { AllEpisodes, SingleEpisode } from "../../Types/ShowEpisodes";
import { useList } from "../../context/ListContext";
import type { Season } from "../../Types/Seasons";
import { useWatching } from "../../context/WatchingContext";
import type { SingleCast } from "../../Types/Cast";
import RatingModal from "../../components/RatingModal/RatingModal";
import defaultPoster from "../../images/poster_default.png";
import defaultEpisodePoster from "../../images/episode_default.png";
import Error500 from "../../components/Error500/Error500";
import { getRatingColor } from "../../utils/ratingHelper"


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
    const imgOriginalMedium = singleShowData?.image?.original || singleShowData?.image?.medium;

    //^ Stato per la modale di valutazione
    const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
        type: 'episode' | 'season' | 'show';
        targetId: number; // Id episodio, numero stagione o id show
        targetName: string;
        currentVal: number;
    }>({ isOpen: false, type: 'episode', targetId: 0, targetName: "", currentVal: 0 });

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
    const handleToggleEpisode = (episode: SingleEpisode) => {
        const watchedStatus = isBeingWatched?.episodes.find(e => e.episodeId === episode.id)?.sessionWatched;
        toggleEpisodeStatus(Number(showId), episode.id)

        // Se segnamo l'episodio come visto allora apriamo la modale per la valutazione
        if (!watchedStatus) {
            setRatingModal({ isOpen: true, type: 'episode', targetId: episode.id, targetName: episode.name, currentVal: 0})
        }
    }

    //& Funzione per getsire quando vuoi valutare una stagione
    const handleMarkSeason = (seasonNum: number) => {
        if (isSeasonFullyWatched) {
            if (window.confirm(`Do you want to mark Season ${seasonNum} as UNWATCHED?`)) unmarkSeasonAsWatched(Number(showId), seasonNum);
        } else {
            if (window.confirm(`Do you want to mark Season ${seasonNum} as WATCHED?`)) {
                markSeasonAsWatched(Number(showId), seasonNum);
                setRatingModal({ isOpen: true, type: 'season', targetId: seasonNum, targetName: `Stagione ${seasonNum}`, currentVal: 0 });
            }
        }
    };

    //& Funzione per getsire quando vuoi valutare una serie
    const handleMarkShow = () => {
        if (isShowFullyWatched) {
            if (window.confirm(`Do you want to mark the entire series as UNWATCHED?`)) unmarkShowAsWatched(Number(showId));
        } else {
            if (window.confirm(`Do you want to mark the entire series as WATCHED?`)) {
                markShowAsWatched(Number(showId));
                setRatingModal({ isOpen: true, type: 'show', targetId: Number(showId), targetName: singleShowData?.name || "Serie", currentVal: 0 });
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
                <div className="p-4 text-center alert alert-danger mx-auto" style={{maxWidth: "500px"}}>
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
        <div className="p-4 position-relative">
            <button className="btn btn-outline-dark mb-4 rounded-pill px-4 shadow-sm" onClick={() => navigate(-1)}>← Back</button>
            <h1>{singleShowData?.name}</h1>
            
            <div className="d-flex gap-4 mb-4 flex-wrap">
                {!posterImgLoaded && (
                    <div className="d-flex align-items-center justify-content-center bg-secondary text-light" style={{borderRadius: "5px", height: "25rem", width: "17rem"}}>
                        <div className="spinner-border text-light" role="status">
                            <span className="visually-hidden"></span>
                        </div>
                    </div>
                )}
                
                <img 
                    src={imgOriginalMedium || defaultPoster} 
                    alt={singleShowData?.name} 
                    onLoad={() => setPosterImgLoaded(true)}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultPoster;
                        setPosterImgLoaded(true)
                    }}
                    style={{
                        borderRadius: "5px", 
                        objectFit: "cover", 
                        height: "25rem", 
                        width: "17rem",
                        display: posterImgLoaded ? "block" : "none" // Usa none invece di rimuoverla dal DOM
                    }}
                />
                <div>
                    {!singleShowData?.premiered ? (
                        <p>Dates unavalible</p>
                    ) : (
                        <p>{singleShowData?.premiered} | {singleShowData?.ended || "Still running"}</p>
                    )}
                    <p><strong>Rating:</strong> {singleShowData?.rating?.average || "No rating available"}</p>
                    <p><strong>Status:</strong> {singleShowData?.status}</p>
                    <p><strong>Genere:</strong> {singleShowData?.genres?.join(", ") || "No genres available"}</p>
                    <p><strong>Number of Seasons:</strong> {numberOfSeasons}</p>
                    <p><strong>Total episodes:</strong> {numberOfEpisodes}</p>
                    {singleShowData?.officialSite && (
                        <a href={singleShowData?.officialSite} target="_blank" rel="noopener noreferrer">Official Site</a>
                    )}

                    <div className="d-flex gap-2 align-items-center mt-3">
                        {/* --- PULSANTE WATCHING --- */}
                        {!isBeingWatched ? (
                            <button className="btn btn-primary" onClick={handleStartWatching}>Start Watching</button>
                        ) : (
                            <div className="dropdown">
                                <button className="btn btn-info dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    {isBeingWatched.isArchived ? "Archived" : "Currently Watching"}
                                </button>
                                <ul className="dropdown-menu">
                                    <li><button className="dropdown-item" onClick={() => navigate(`/watching`)}>Go to Watching</button></li>
                                    <li>
                                        <button className="dropdown-item" onClick={() => archiveShow(Number(showId))}>
                                            {isBeingWatched.isArchived ? "Restore from Archive" : "Archive"}
                                        </button>
                                    </li>
                                    <li>
                                        <button 
                                            className="dropdown-item text-success"
                                            onClick={() => markShowAsWatched(Number(showId))}
                                        >
                                            ✓ Mark Entire Show as Watched
                                        </button>
                                    </li>
                                    <li>
                                        {isShowFullyWatched && (
                                            <button 
                                                className="dropdown-item text-primary"
                                                onClick={() => {
                                                    const confirmRewatch = window.confirm(
                                                        `Start a new Rewatch for "${singleShowData?.name}"? Your current progress will be reset but your all time history will remain saved.`
                                                    );
                                                    if (confirmRewatch) {
                                                        startRewatch(Number(showId));
                                                    }
                                                }}
                                            >
                                                🔄 Start Full Rewatch
                                            </button>
                                        )}
                                                                        </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <button 
                                            className="dropdown-item py-2 text-danger fw-bold d-flex align-items-center gap-2" 
                                            onClick={() => deleteShowData(Number(showId))}
                                        >
                                            🗑️ Total Data Reset
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}

                        {/* --- PULSANTE LISTE --- */}
                        <div className="dropdown">
                            <button
                                className="btn btn-secondary dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                                disabled={!singleShowData} 
                            >
                                {singleShowData ? "Add to list" : "Loading..."}
                            </button>
                            <ul className="dropdown-menu">
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
                        <button type="button" className="btn btn-outline-warning" onClick={() => navigate(`/show/${showId}/images`)}>Show images</button>
                        
                        <button type="button" className="alert alert-success p-2 my-0" onClick={() => setRatingModal({ isOpen: true, type: 'show', targetId: Number(showId), targetName: isBeingWatched?.showName || singleShowData?.name || "", currentVal: isBeingWatched?.userRating || 0 })}>
                            {isBeingWatched?.userRating ? (
                                <>Your rating: <strong>{isBeingWatched?.userRating}/10 🍿</strong></>
                            ) : (
                                <>Rate this show</>
                            )}
                        </button>


                        {totalShowWatchedCount > 0 && (
                            <span className="badge rounded-pill bg-info text-dark px-3 py-2 shadow-sm">
                                🔄 Show seen {totalShowWatchedCount} {totalShowWatchedCount === 1 ? 'time' : 'times'}
                            </span>
                        )}

                    </div>
                </div>
            </div>

            <div className="mt-4">
                <p>{singleShowData?.summary?.replace(/<[^>]+>/g, '')}</p>

                <h2 className="mt-5">Episodes</h2>
                
                {/* --- SELETTORE STAGIONE --- */}
                <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="dropdown">
                        <button className="btn btn-dark dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            Season {selectedSeason}
                        </button>
                        <ul className="dropdown-menu dropdown-menu-dark">
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

                    <div className="d-flex align-items-center gap-2 my-3">
                        {seasonWatchedCount > 0 && (
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill">
                                {seasonWatchedCount > 1 ? `Rewatched ${seasonWatchedCount}x` : 'Compleated'}
                            </span>
                        )}
                    </div>

                    <button 
                        className="btn btn-outline-info btn-sm" 
                        disabled={seasonsDetails.length === 0} // Disabilita se i dati non sono pronti
                        onClick={() => {
                            const season = seasonsDetails.find(s => s.number === selectedSeason);
                            if (season) {
                                navigate(`/show/${singleShowData?.id}/season/${season.id}`);
                            }
                        }}
                    >
                        Season {selectedSeason} info
                    </button>


                    {/* Solo se stiamo guardando la serie */}
                    {isBeingWatched && (
                        <>
                            <button className={`btn btn-sm ${isSeasonFullyWatched ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => handleMarkSeason(selectedSeason)}>
                                {isSeasonFullyWatched ? `Unmark Season ${selectedSeason}` : `Mark Season ${selectedSeason} as watched`}
                            </button>
                            <button className={`btn btn-sm ${isShowFullyWatched ? 'btn-danger' : 'btn-success'}`} onClick={handleMarkShow}>
                                {isShowFullyWatched ? 'Unmark entire show' : 'Mark entire show as watched'}
                            </button>
                            
                            {/* Tasto Rewatch Stagione */}
                            {isSeasonFullyWatched && (
                                <button 
                                    className="btn btn-sm btn-outline-primary px-3"
                                    onClick={() => {
                                        if (window.confirm(`Vuoi resettare il progresso della Stagione ${selectedSeason} per rivederla?`)) {
                                            startSeasonRewatch(Number(showId), selectedSeason);
                                        }
                                    }}
                                >
                                    🔄 Rewatch Season {selectedSeason}
                                </button>
                            )}
                        </>
                    )}

                    <button type="button" className="alert alert-success p-2 my-0" onClick={() => setRatingModal({ isOpen: true, type: 'season', targetId: selectedSeason, targetName: `Season ${selectedSeason}`, currentVal: seasonProg?.userRating || 0 })}>
                        {currentSeasonProgress?.userRating ? (
                            <>Season {selectedSeason}: <strong>{currentSeasonProgress.userRating}/10 🍿</strong></>
                        ) : (
                            <>Rate Season {selectedSeason}</>
                        )}
                    </button>

                </div>

                {/* --- LISTA EPISODI --- */}

                {/* 1. Stato: Caricamento in corso */}
                {isEpisodesLoading && episodeSkeletons}

                {/* 2. Stato: Caricamento finito MA l'array è vuoto */}
                {!episodesData.filter((ep) => ep.season === selectedSeason).length ? (
                    <div className="alert alert-info text-center mt-3">
                        <i className="bi bi-info-circle me-2"></i>
                        No episodes available for this season at the moment.
                    </div>
                ) : (null)}
                
                {episodesData.filter((ep) => ep.season === selectedSeason).map((episode) => {
                    const epProg = isBeingWatched?.episodes.find(e => e.episodeId === episode.id);
                    const watchedStatus = epProg?.sessionWatched;
                    const userRating = epProg?.userRating;
                    const totalViews = Number(epProg?.sessionCount || 0);

                    return (
                        <div key={episode.id} className="glass-card d-flex align-items-center p-2 mb-2 shadow-sm transition-all" style={{ borderRadius: "12px" }}>
                            
                            <img 
                                src={episode.image?.medium || episode.image?.original || defaultEpisodePoster} 
                                alt={episode?.name} 
                                style={{ borderRadius: "8px", objectFit: "cover", width: "8rem", height: "4.5rem" }}
                            />
                            
                            <div className="mx-3 flex-grow-1">
                                <div className="d-flex align-items-center gap-2">
                                    <p className="mb-0"><strong>{episode.season}X{episode.number}</strong></p>
                                    
                                    {/* Badge Unificato Visioni */}
                                    {/* Badge Unificato Visioni - Versione Refactored */}
                                {totalViews > 0 && (
                                    <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.7rem' }}>
                                        ✓ Watched {totalViews > 1 ? `${totalViews} times` : ''}
                                    </span>
                                )}
                            </div>
                                <p className="mb-0 text-truncate" style={{maxWidth: "250px"}}>{episode.name}</p>
                                {userRating ? (
                                    <small className="fw-bold" style={{color: getRatingColor(userRating)}}>
                                        Rating: {userRating}/10
                                    </small>
                                ) : null}
                            </div>
                            
                            <button className="btn btn-sm btn-outline-info rounded-pill px-3 me-2" onClick={() => navigate(`/show/${singleShowData?.id}/episode/${episode.id}`)}>info</button>

                            {isBeingWatched && (
                                <div className="dropdown">
                                    <button className={`btn btn-sm rounded-circle ${watchedStatus ? 'btn-success' : 'btn-outline-secondary'}`} type="button" data-bs-toggle="dropdown" style={{width: "32px", height: "32px", padding: 0}}>
                                        {watchedStatus ? '✓' : '+'}
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{borderRadius: "12px"}}>
                                        <li>
                                            <button className="dropdown-item py-2" onClick={() => handleToggleEpisode(episode)}>
                                                {watchedStatus ? 'Mark as unwatched' : 'Mark as watched'}
                                            </button>
                                        </li>
                                        <li>
                                            <button className="dropdown-item py-2" onClick={() => rewatchEpisode(Number(showId), episode.id)}>
                                                🔄 Rewatch Episode
                                            </button>
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
                        </div>
                    );
                })}
            </div>

            <div>
                <h2>Cast</h2>
                <div className="d-flex flex-row flex-wrap">
                    {cast.map((cast) => {
                        return(
                            <div className="p-2 m-2 border" style={{ textAlign: "center", cursor: "pointer" }} onClick={() => navigate(`/actor/${cast.person.id}`)}>
                                <img 
                                    src={cast.person.image?.medium || cast.person.image?.original}
                                    style={{ height: "50px", borderRadius: "100%" }} 
                                />
                                <p>{cast.person.name}</p>
                                <p>{cast.character.name}</p>
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
        </div>
    );
}
