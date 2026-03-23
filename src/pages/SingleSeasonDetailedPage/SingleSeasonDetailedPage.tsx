import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Season } from "../../Types/Seasons";
import type { SingleEpisode } from "../../Types/ShowEpisodes";
import defaultPoster from "../../images/poster_default.png";
import Error500 from "../../components/Error500/Error500";
import { useWatching } from "../../context/WatchingContext";
import { getRatingColor } from "../../utils/ratingHelper";
import RatingModal from "../../components/RatingModal/RatingModal";

export default function SingleSeasonDetailedPage() {
    const { showId, seasonId } = useParams();
    const navigate = useNavigate();

    const [singleSeasonData, setSingleSeasonData] = useState<Season | null>(null);
    const [seasonEpisodes, setSeasonEpisodes] = useState<SingleEpisode[]>([]);
    const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
    const [posterImgLoaded, setPosterImgLoaded] = useState(false);

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

    // Fetch Dati Stagione
    useEffect(() => {
        if (!showId || !seasonId) return;

        const isNumericShowId = /^\d+$/.test(showId);
        const isNumericSeasonId = /^\d+$/.test(seasonId);

        if (!isNumericShowId || !isNumericSeasonId) {
            setError404(true);
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

    const imgOriginalMedium = singleSeasonData?.image?.original || singleSeasonData?.image?.medium;

    return (
        <div className="container py-4">
            {/* Header / Back Button */}
            <button className="btn btn-outline-dark mb-4 rounded-pill px-4 shadow-sm" onClick={() => navigate(-1)}>
                ← Back to Show
            </button>

            <div className="glass-card p-4 mb-5 shadow-lg border-0" style={{ borderRadius: "30px" }}>
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
                    <div className="col-md-8 col-lg-9 d-flex flex-column">
                        <div className="mb-auto">
                            <h5 className="text-info fw-bold text-uppercase mb-1" style={{ letterSpacing: "1.5px" }}>
                                {seasonEpisodes[0]?._links?.show?.name}
                            </h5>
                            <h1 className="display-4 fw-bold mb-3">Season {singleSeasonData?.number}</h1>

                            {/* Action Buttons */}
                            <div className="d-flex gap-3 mb-4 flex-wrap">
                                <button
                                    className="btn rounded-pill px-4 py-2 fw-bold shadow-sm transition-all"
                                    style={{
                                        backgroundColor: userSeasonRating > 0 ? getRatingColor(userSeasonRating) : 'rgba(0,0,0,0.1)',
                                        color: userSeasonRating === 10 ? '#000' : (userSeasonRating > 0 ? '#fff' : 'var(--text-main)'),
                                        border: 'none'
                                    }}
                                    onClick={() => setRatingModal({
                                        isOpen: true,
                                        targetName: `Season ${singleSeasonData?.number}`,
                                        currentVal: userSeasonRating
                                    })}
                                >
                                    {userSeasonRating > 0 ? `Your Rating: ${userSeasonRating}/10 🍿` : "⭐ Rate Season"}
                                </button>

                                <span className="badge rounded-pill bg-dark d-flex align-items-center px-3">
                                    {singleSeasonData?.episodeOrder} Episodes
                                </span>

                                {totalSeasonViews > 0 && (
                                    <span className="badge rounded-pill bg-dark d-flex align-items-center px-3">
                                        Total Views: {totalSeasonViews}
                                    </span>
                                )}
                            </div>

                            {/* Info Grid */}
                            <div className="row row-cols-2 row-cols-lg-5 g-3 mb-4">
                                <div className="col">
                                    <small className="text-muted d-block">Premiere</small>
                                    <strong>{singleSeasonData?.premiereDate || "N/A"}</strong>
                                </div>
                                <div className="col">
                                    <small className="text-muted d-block">End</small>
                                    <strong>{singleSeasonData?.endDate || "N/A"}</strong>
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
            </div>

            {/* Episode List Section */}
            <div className="mt-5">
                <h3 className="fw-bold mb-4 px-2">Episodes List</h3>
                <div className="row g-3">
                    {seasonEpisodes.map((ep) => (
                        <div key={ep.id} className="col-12 shadow-sm rounded-4">
                            <div
                                className="glass-card p-3 d-flex align-items-center justify-content-between transition-all"
                                style={{ borderRadius: "15px", cursor: "pointer" }}
                                onClick={() => navigate(`/show/${showId}/episode/${ep.id}`)}
                            >
                                <div className="d-flex align-items-center gap-3">
                                    <span className="fw-bold text-info fs-5">#{ep.number}</span>
                                    <div>
                                        <h6 className="mb-0 fw-bold">{ep.name}</h6>
                                        <small className="text-muted">{ep.airdate}</small>
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
                    rateSeason(Number(showId), singleSeasonData!.number, voto);
                    setRatingModal({ ...ratingModal, isOpen: false });
                }}
            />
        </div>
    );
}