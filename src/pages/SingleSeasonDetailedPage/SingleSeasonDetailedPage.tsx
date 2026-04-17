import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Season } from "../../Types/Seasons";
import type { SingleEpisode } from "../../Types/ShowEpisodes";
import defaultPoster from "../../images/poster_default.png";
import Error500 from "../../components/Error500/Error500";
import { useWatching } from "../../context/Watching/useWatching";
import RatingModal from "../../components/RatingModal/RatingModal";
import { Vibrant } from "node-vibrant/browser";
import type { Palette, Swatch } from "@vibrant/color";


export default function SingleSeasonDetailedPage() {
    const { showId, seasonId } = useParams();
    const navigate = useNavigate();

    const accentColor = "#2FA4D7"

    const [singleSeasonData, setSingleSeasonData] = useState<Season | null>(null);
    const [seasonEpisodes, setSeasonEpisodes] = useState<SingleEpisode[]>([]);
    const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
    const [posterImgLoaded, setPosterImgLoaded] = useState(false);

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [bgGradient, setBgGradient] = useState("");

    // Gestione Errori
    const [error404, setError404] = useState(false);
    const [error500, setError500] = useState(false);

    // Context & Rating
    const { getShowProgress, rateSeason } = useWatching();
    const isBeingWatched = getShowProgress(Number(showId));
    const seasonProg = isBeingWatched?.seasons?.find(
        (s) => s.seasonNumber === singleSeasonData?.number
    );
    const userSeasonRating = seasonProg?.userRating || 0;

    const totalSeasonViews = seasonProg?.allTimeCount || 0;

    const [ratingModal, setRatingModal] = useState({
        isOpen: false,
        targetName: "",
        currentVal: 0
    });

    //Questa funzione serve per determinare se la stagione e uscita oggi
    function isToday(seasonPremierDateStr: string | undefined) {
        const seasonPremierDate = new Date(seasonPremierDateStr || "")
        seasonPremierDate.setHours(0, 0, 0, 0)
        const diffTime = seasonPremierDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
            return true
        } else {
            return false
        }
    }

    // Fetch Dati Stagione
    useEffect(() => {
        if (!showId || !seasonId) return;

        const isNumericShowId = /^\d+$/.test(showId);
        const isNumericSeasonId = /^\d+$/.test(seasonId);

        if (!isNumericShowId || !isNumericSeasonId) {
            setTimeout(() => {
                setError404(true);
            }, 0);
            return;
        }

        axios.get(`https://api.tvmaze.com/shows/${showId}/seasons`)
            .then((response) => {
                const foundSeason = response.data.find((s: Season) => s.id === Number(seasonId));
                if (!foundSeason) {
                    setError404(true);
                    setIsPageLoading(false);
                } else {
                    setSingleSeasonData(foundSeason);
                    setError404(false);
                }
            })
            .catch(() => setError500(true));
    }, [showId, seasonId]);

    // Fetch Episodi
    useEffect(() => {
        if (!singleSeasonData) return;
        axios.get(`https://api.tvmaze.com/seasons/${seasonId}/episodes`)
            .then((res) => {
                setSeasonEpisodes(res.data);
                setIsPageLoading(false);
            })
            .catch(() => setIsPageLoading(false));
    }, [seasonId, singleSeasonData]);

    const imgOriginalMedium = singleSeasonData?.image?.original || singleSeasonData?.image?.medium;


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

    if (error404) return (
        <div className="container p-5 text-center">
            <div className="glass-card p-5 shadow-lg">
                <h2 className="text-danger">404 - Season Not Found</h2>
                <button className="btn btn-outline-primary mt-3 rounded-pill" onClick={() => navigate(-1)}>Go Back</button>
            </div>
        </div>
    );

    if (error500) return <div className="container p-5"><Error500 /></div>;

    if (isPageLoading) return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-info" role="status"></div>
        </div>
    );

    return (
        <div style={{ backgroundImage: bgGradient }} className="min-vh-100 w-100">
            <div className="container py-4">
                {/* Header / Back Button */}
                <button className="glass-card mb-4 px-3 py-2 shadow-sm" onClick={() => navigate(-1)}>
                    ← Back to Show
                </button>

                {/* Main Season Card */}
                <div className="glass-card p-4 mb-5 shadow-lg border-0">
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
                                    alt={singleSeasonData?.name}
                                    className="img-fluid w-100"
                                    onLoad={() => setPosterImgLoaded(true)}
                                    style={{ display: posterImgLoaded ? "block" : "none", objectFit: "cover", minHeight: "400px" }}
                                />
                            </div>
                        </div>

                        {/* Content Column */}
                        <div className="col-md-8 col-lg-9 d-flex flex-column mb-auto">
                            <h5 className="fw-bold text-uppercase mb-1" style={{ color: accentColor, letterSpacing: "1.5px" }}>
                                {seasonEpisodes[0]?._links?.show?.name}
                            </h5>
                            <div className="d-flex align-items-center gap-3">
                                <h1 className="display-4 fw-bold mb-3">Season {singleSeasonData?.number}</h1>
                                {isToday(singleSeasonData?.premiereDate) && (
                                    <div className="red-button-glass fw-bold shadow-sm transition-all px-3 py-2 mb-3">
                                        NEW
                                    </div>
                                )}
                            </div>
                            

                            {/* Action Buttons */}
                            <div className="d-flex gap-3 mb-4 align-items-center flex-wrap">
                                {singleSeasonData?.premiereDate === undefined || new Date(singleSeasonData?.premiereDate) < today && (
                                    <>
                                        {isBeingWatched && (
                                            (userSeasonRating ? (
                                                <button
                                                    className={`${
                                                        userSeasonRating < 3 ? 'pink-button-glass' : 
                                                        userSeasonRating < 5 ? 'red-button-glass' : 
                                                        userSeasonRating < 7 ? 'yellow-button-glass' : 
                                                        userSeasonRating < 8 ? 'lightgreen-button-glass' : 
                                                        userSeasonRating < 10 ? 'green-button-glass' : 
                                                        'lightblue-button-glass'
                                                    } fw-bold shadow-sm transition-all px-3 py-2`}
                                                    style={{
                                                        color: 'var(--text-main)',
                                                    }}
                                                    onClick={() => setRatingModal({
                                                        isOpen: true,
                                                        targetName: `Season ${singleSeasonData?.number}`,
                                                        currentVal: userSeasonRating
                                                    })}   
                                                >
                                                    <i className="bi bi-heart-fill" style={{ color: "#dc3545" }} /> {userSeasonRating}/10
                                                </button>
                                            ) : (
                                                <button
                                                    className="lightgray-button-glass fw-bold shadow-sm transition-all px-3 py-2"
                                                    onClick={() => setRatingModal({
                                                        isOpen: true,
                                                        targetName: `Season ${singleSeasonData?.number}`,
                                                        currentVal: userSeasonRating
                                                    })}                                    >
                                                    <i className="bi bi-heart-fill" style={{ color: "#dc3545" }} /> Rate Season
                                                </button>
                                            ))
                                        )}
                                    </>
                                )}

                                {singleSeasonData?.episodeOrder && (
                                    <span className="badge rounded-pill gray-glass-card p-2 shadow-sm">
                                        {singleSeasonData?.episodeOrder} Episodes
                                    </span>
                                )}
                                

                                {totalSeasonViews > 0 && (
                                    <span className="badge rounded-pill gray-glass-card p-2 shadow-sm">
                                        Total Views: {totalSeasonViews}
                                    </span>
                                )}
                            </div>

                            {/* Info Grid */}
                            <div className="row row-cols-2 row-cols-lg-5 g-3 mb-4">
                                <div className="col">
                                    <small className="text-muted d-block">Premiere</small>
                                    <strong>{formatDate(singleSeasonData?.premiereDate) || "N/A"}</strong>
                                </div>
                                <div className="col">
                                    <small className="text-muted d-block">End</small>
                                    <strong>{formatDate(singleSeasonData?.endDate) === "N/A" ? "Still running" : formatDate(singleSeasonData?.endDate)}</strong>
                                </div>
                                <div className="col">
                                    <small className="text-muted d-block">Network</small>
                                    <strong>{singleSeasonData?.network?.name || singleSeasonData?.webChannel?.name || "N/A"}</strong>
                                </div>
                                <div className="col">
                                    <small className="text-muted d-block">Country</small>
                                    <strong>{singleSeasonData?.network?.country?.name || "N/A"}</strong>
                                </div>
                                <div className="col">
                                    <small className="text-muted d-block">Season ID</small>
                                    <strong>#{singleSeasonData?.id}</strong>
                                </div>
                            </div>

                            <h5 className="fw-bold">Summary</h5>
                            <p className="opacity-75 lead" style={{ fontSize: "1rem" }}>
                                {singleSeasonData?.summary
                                    ? singleSeasonData.summary.replace(/<[^>]+>/g, '')
                                    : "No summary available for this season."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Episode List Section */}
                <div className="mt-5">
                    <h3 className="fw-bold mb-4 px-2">Episodes List</h3>
                    {/* La riga con g-3 definisce lo spazio orizzontale e verticale */}
                    <div className="row g-3">
                        {seasonEpisodes.map((ep) => (
                            /* 1. La colonna ora gestisce solo lo spazio e la larghezza */
                            <div key={ep.id} className="col-md-6 col-sm-12 ">

                                {/* 2. Ho SPOSTATO qui il tuo stile senza cambiare una virgola */}
                                <div
                                    className="glass-card p-3 d-flex align-items-center justify-content-between transition-all shadow-sm"
                                    style={{
                                        borderRadius: "15px",
                                        cursor: "pointer",
                                        backgroundColor: "var(--bg-glass)",
                                        backdropFilter: "blur(12px)",
                                        borderBottom: "1px solid var(--border-glass)"
                                    }}
                                    onClick={() => navigate(`/show/${showId}/episode/${ep.id}`)}
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="fw-bold fs-5" style={{ color: accentColor }}>#{ep.number}</span>
                                        <div>
                                            <h6 className="mb-0 fw-bold">{ep.name}</h6>
                                            <small className="text-muted">{formatDate(ep.airdate)}</small>
                                        </div>
                                    </div>
                                    <div className="d-none d-md-block text-muted">
                                        {ep.runtime} min
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal */}
                <RatingModal
                    isOpen={ratingModal.isOpen}
                    targetName={ratingModal.targetName}
                    initialVal={ratingModal.currentVal}
                    onClose={() => setRatingModal({ ...ratingModal, isOpen: false })}
                    onSubmit={(voto) => {
                        rateSeason(Number(showId), singleSeasonData!.number, voto || 0);
                        setRatingModal({ ...ratingModal, isOpen: false });
                    }}
                />
            </div>
        </div>
    );
}