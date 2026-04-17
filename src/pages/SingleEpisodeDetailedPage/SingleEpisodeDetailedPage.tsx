import { useEffect, useState } from "react";
import type { SingleEpisode } from "../../Types/ShowEpisodes";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import defaultEpisodePoster from "../../images/episode_default.png";
import Error500 from "../../components/Error500/Error500";
import { useWatching } from "../../context/Watching/useWatching";
import RatingModal from "../../components/RatingModal/RatingModal";
import { Vibrant } from "node-vibrant/browser";
import type { Palette, Swatch } from "@vibrant/color";


export default function SingleEpisodeDetailedPage() {
    const { showId, episodeId } = useParams();
    const navigate = useNavigate();
    const [bgGradient, setBgGradient] = useState("");

    // --- State ---
    const [singleEpisodeData, setSingleEpisodeData] = useState<SingleEpisode | null>(null);
    const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
    const [error404, setError404] = useState(false);
    const [error500, setError500] = useState(false);
    const [episodeImgLoaded, setEpisodeImgLoaded] = useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // --- Context Data ---
    // Aggiungiamo 'rewatchEpisode' per gestire l'incremento dello storico totale
    const { getShowProgress, rateEpisode, rewatchEpisode } = useWatching();
    const isBeingWatched = getShowProgress(Number(showId));

    // Trova il progresso specifico di questo episodio
    const episodeProgress = isBeingWatched?.episodes.find(
        (e) => e.episodeId === Number(episodeId)
    );

    const userEpisodeRating = episodeProgress?.userRating || 0;

    // Recuperiamo il conteggio totale storico e lo stato della sessione attuale
    const totalViews = episodeProgress?.allTimeCount || 0;
    const isCurrentlyWatched = episodeProgress?.sessionWatched || false;

    //Questa funzione serve per determinare se l'episodio e uscito oggi
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

    // --- Fetch Data ---
    useEffect(() => {
        if (!showId || !episodeId) return;

        const isNumericShowId = /^\d+$/.test(showId);
        const isNumericEpisodeId = /^\d+$/.test(episodeId);

        if (!isNumericShowId || !isNumericEpisodeId) {
            setTimeout(() => {
                setError404(true);
            }, 0);
            return;
        }

        const url = `https://api.tvmaze.com/shows/${showId}/episodes`;
        axios.get(url)
            .then((response) => {
                const allEpisodes = response.data;
                const singleEpisode = allEpisodes.find((ep: SingleEpisode) => ep.id === Number(episodeId));

                if (!singleEpisode) {
                    setError404(true);
                } else {
                    setSingleEpisodeData(singleEpisode);
                    setError404(false);
                }
                setIsPageLoading(false);
            })
            .catch((error) => {
                if (error.response?.status === 404) setError404(true);
                else if (error.response?.status === 500) setError500(true);
                console.error(error);
                setIsPageLoading(false);
            });
    }, [showId, episodeId]);

    const imgOriginalMedium = singleEpisodeData?.image?.original || singleEpisodeData?.image?.medium;


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

    }, [imgOriginalMedium]
    );

    function formatDate(date?: string | null): string {
        if (!date) return "N/A"
        const [year, month, day] = date.split("-")
        return `${day}-${month}-${year}`
    }

    // --- Render Logic ---
    if (error404) return (
        <div className="p-4 container text-center">
            <button className="btn btn-outline-dark mb-4 rounded-pill" onClick={() => navigate(-1)}>Back</button>
            <div className="alert alert-danger mx-auto" style={{ maxWidth: "500px" }}>
                <h4>Episode not found!</h4>
                <p>The requested episode doesn't belong to this show or doesn't exist.</p>
            </div>
        </div>
    );

    if (error500) return <div className="p-4 container"><Error500 /></div>;

    if (isPageLoading) return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-light" role="status"></div>
        </div>
    );

    return (
        <div style={{ backgroundImage: bgGradient }} className="min-vh-100 w-100">
            <div className="container py-4">
                <button className="glass-card mb-4 px-3 py-2 shadow-sm" onClick={() => navigate(-1)}>
                    ← Back
                </button>

                {singleEpisodeData && (
                    <div className="glass-card p-4 shadow border-0" style={{ borderRadius: "25px" }}>
                        <header className="mb-4">
                            <h5 className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
                                {singleEpisodeData._links.show.name} • Season {singleEpisodeData.season}
                            </h5>
                            <div className="d-flex align-items-center gap-3">
                                <h1 className="display-5 fw-bold mb-2">
                                    {singleEpisodeData.number}. {singleEpisodeData.name || "Untitled Episode"}
                                </h1>

                                {isToday(singleEpisodeData.airdate) && (
                                    <div className="red-button-glass fw-bold shadow-sm transition-all px-3 py-2">
                                        NEW
                                    </div>
                                )}
                            </div>
                        </header>

                        <div className="row g-4">
                            {/* Immagine Episodio */}
                            <div className="col-lg-6">
                                <div className="position-relative overflow-hidden rounded-4 shadow-sm">
                                    {!episodeImgLoaded && (
                                        <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: "300px" }}>
                                            <div className="spinner-border text-secondary opacity-25" role="status"></div>
                                        </div>
                                    )}
                                    <img
                                        src={imgOriginalMedium || defaultEpisodePoster}
                                        alt={singleEpisodeData.name}
                                        className="img-fluid w-100"
                                        onLoad={() => setEpisodeImgLoaded(true)}
                                        style={{ display: episodeImgLoaded ? "block" : "none", objectFit: "cover" }}
                                    />
                                </div>
                            </div>

                            {/* Info e Rating */}
                            <div className="col-lg-6">
                                <div className="d-flex flex-column h-100">
                                    <div className="mb-3">
                                        <h5 className="fw-bold">History & Rating</h5>
                                    </div>

                                    {isBeingWatched && (
                                        <div className={`mb-4 d-flex align-items-center ${new Date(singleEpisodeData.airdate) < today ? "" : "d-none"} gap-2 flex-wrap`}>
                                            {/* Pulsante Rating */}
                                            {userEpisodeRating ? (
                                                <button
                                                    className={`${userEpisodeRating < 3 ? 'pink-button-glass' :
                                                            userEpisodeRating < 5 ? 'red-button-glass' :
                                                                userEpisodeRating < 7 ? 'yellow-button-glass' :
                                                                    userEpisodeRating < 8 ? 'lightgreen-button-glass' :
                                                                        userEpisodeRating < 10 ? 'green-button-glass' :
                                                                            'lightblue-button-glass'
                                                        } fw-bold shadow-sm transition-all px-3 py-2`}
                                                    style={{
                                                        color: 'var(--text-main)',
                                                    }}
                                                    onClick={() => setIsRatingModalOpen(true)}
                                                >
                                                    <i className="bi bi-heart-fill" style={{ color: "#dc3545" }} /> {userEpisodeRating}/10
                                                </button>
                                            ) : (
                                                <button
                                                    className="lightgray-button-glass fw-bold shadow-sm transition-all px-3 py-2"
                                                    onClick={() => setIsRatingModalOpen(true)}                                   >
                                                    <i className="bi bi-heart-fill" style={{ color: "#dc3545" }} /> Rate Episode
                                                </button>
                                            )}

                                            {/* Badge Conteggio Totale Storico */}
                                            {totalViews > 0 && (
                                                <span className="badge rounded-pill gray-glass-card p-2 shadow-sm">
                                                    Total Views: {totalViews}
                                                </span>
                                            )}

                                            {/* Pulsante per aggiungere una visione allo storico */}
                                            <button
                                                className="badge rounded-pill lightblue-glass-card p-2 shadow-sm"
                                                onClick={() => {
                                                    if (window.confirm("Increase your total watch count for this episode?")) {
                                                        rewatchEpisode(Number(showId), Number(episodeId));
                                                    }
                                                }}
                                            >
                                                Watch count + 1
                                            </button>
                                        </div>
                                    )}

                                    {/* Stato Sessione Attuale */}
                                    <div className="mb-4">
                                        {isCurrentlyWatched ? (
                                            <span className="text-success fw-bold small text-uppercase d-flex align-items-center gap-2">
                                                <span className="rounded-circle bg-success" style={{ width: '8px', height: '8px' }}></span>
                                                Watched in current session
                                            </span>
                                        ) : (
                                            <span className="text-muted fw-bold small text-uppercase d-flex align-items-center gap-2">
                                                <span className="rounded-circle bg-secondary" style={{ width: '8px', height: '8px' }}></span>
                                                Not watched in current session
                                            </span>
                                        )}
                                    </div>

                                    <div className="row row-cols-2 g-3 mb-4">
                                        <div className="col"><small className="text-muted d-block">Airdate</small> <strong>{formatDate(singleEpisodeData.airdate)}</strong></div>
                                        <div className="col"><small className="text-muted d-block">Runtime</small> <strong>{singleEpisodeData.runtime} min</strong></div>
                                        <div className="col"><small className="text-muted d-block">TVMaze Rating</small> <i className="bi bi-star-fill" style={{ color: "#ffc107" }} /><strong> {singleEpisodeData.rating.average || "N/A"}</strong></div>
                                        <div className="col"><small className="text-muted d-block">Format</small> <strong>S{singleEpisodeData.season} E{singleEpisodeData.number}</strong></div>
                                    </div>

                                    <div className="mt-auto">
                                        <h5 className="fw-bold">Summary</h5>
                                        <p className="text-secondary" style={{ lineHeight: '1.6' }}>
                                            {singleEpisodeData.summary
                                                ? singleEpisodeData.summary.replace(/<[^>]+>/g, '')
                                                : "No summary available for this episode."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modale di Voto */}
                {singleEpisodeData && (
                    <RatingModal
                        isOpen={isRatingModalOpen}
                        targetName={`${singleEpisodeData.name} (S${singleEpisodeData.season}E${singleEpisodeData.number})`}
                        initialVal={userEpisodeRating}
                        onClose={() => setIsRatingModalOpen(false)}
                        onSubmit={(newRating) => {
                            rateEpisode(Number(showId), Number(episodeId), newRating || 0);
                            setIsRatingModalOpen(false);
                        }}
                    />
                )}
            </div>
        </div>
    );
}