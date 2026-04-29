import axios from "axios";
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom";
import type { Actor } from "../../Types/Actor";
import defaultPoster from "../../images/poster_default.png";
import type { SingleShowDetails } from "../../Types/SingleShowDetails";
import type { CastCredits } from "../../Types/CastCredits";
import { Vibrant } from "node-vibrant/browser";
import type { Palette, Swatch } from "@vibrant/color";
import Error500 from "../../components/Error500/Error500";



export default function ActorDetailedPage() {
    const { actorId } = useParams();
    const navigate = useNavigate();

    const [actorData, setActorData] = useState<Actor | null>(null)
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [actorShows, setActorShows] = useState<SingleShowDetails[]>([]);
    const [showsLoading, setShowsLoading] = useState(true);
    const [bgGradient, setBgGradient] = useState("");

    const [error404, setError404] = useState(false);    //^ Per gestire l'errore 404
    const [error500, setError500] = useState(false);    //^ Per gestire l'errore 500

    const [actorImgLoaded, setActorImgLoaded] = useState(false);
    const imgOriginalMedium = actorData?.image?.original || actorData?.image?.medium;

    //* Fetch per prendere tutte le informazioni di un attore
    useEffect(() => {
        if (!actorId) return;

        //§ Qui controlliamo se l'id ha solo numeri
        const isNumeric = /^\d+$/.test(actorId);

        //§ Se ci sono lettere o altri caratteri cambia lo stato di 'error404'
        if (!isNumeric) {
            console.error("ID Serie non valido (contiene lettere)");
            setTimeout(() => {
                setError404(true);
            }, 0);
            return;
        }

        const url = `https://api.tvmaze.com/people/${actorId}?embed=castcredits`;
        axios.get(url)
            .then((responce) => {
                setActorData(responce.data);
                setIsInitialLoading(false);
            })
            .catch((error) => {
                setIsInitialLoading(false);
                if (error.response && error.response.status === 404) {
                    setError404(true);
                }
                if (error.response.status === 500) {
                    setError500(true);
                }
                console.error("Errore nel caricamento attore:", error);
            })
    }, [actorId])

    //* Fecth degli show a cui a recitato l'attore
    useEffect(() => {
        // Se non abbiamo ancora i dati dell'attore o i crediti, usciamo
        const credits = actorData?._embedded?.castcredits;
        if (!credits || credits.length === 0) return;

        // Estraiamo gli ID
        const ids = credits.map((credit: CastCredits) => credit._links.show.href.split("/").pop());

        // Creiamo un array di promesse (tutte le chiamate axios insieme)
        const requests = ids.map(id => axios.get(`https://api.tvmaze.com/shows/${id}`));

        // Aspettiamo che TUTTE finiscano
        Promise.all(requests)
            .then((responses) => {
                const showsData = responses.map(res => res.data);
                setActorShows(showsData); // Aggiorniamo lo stato una volta sola!
                setShowsLoading(false);
            })
            .catch(err => {
                console.error("Errore nel caricamento show:", err);
                setShowsLoading(false);
            });

    }, [actorData]); // Si attiva appena actorData è pronto

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


    //  Se l'Id è sbagliato (404)
    if (error404) {
        return (
            <div className="p-4">
                <button className="btn btn-outline-dark mb-4" onClick={() => navigate(-1)}>Back</button>
                <div className="p-4 text-center alert alert-danger mx-auto" style={{ maxWidth: "500px" }}>
                    <h4 className="alert-heading">Actor non found!</h4>
                    <p>The Id <strong>{actorId}</strong> does not correspond to any actor.</p>
                </div>
            </div>

        );
    }

    // Se ce un errore interno del server del API
    if (error500) {
        return (
            <div className="p-4">
                <button className="btn btn-outline-dark mb-4" onClick={() => navigate(-1)}>Back</button>
                <Error500 />
            </div>

        );
    }

    // Se sta caricando i dati
    if (isInitialLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-dark" role="status"></div>
            </div>
        );
    }

    // Se l'Id e corretto e fa vedere le info dell'attore
    return (
        <div style={{ backgroundImage: bgGradient, paddingBottom: "2.8rem" }}>
            <div className="p-4 container position-relative">
                <button className="glass-card mb-4 px-3 py-2 shadow-sm" style={{ color: "var(--text-main)" }} onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <div>
                    <div className="p-2">
                        {/* Info del'attore */}
                        <div className="glass-card p-4 mb-5 shadow-lg border-0 position-relative">
                            <div className="row g-4">
                                {/* Poster Column */}
                                <div className="col-md-4 col-lg-3">
                                    <div className="position-relative shadow-lg rounded-4 overflow-hidden">
                                        {!actorImgLoaded && (
                                            <div className="d-flex align-items-center justify-content-center bg-dark text-light" style={{ height: "400px" }}>
                                                <div className="spinner-border spinner-border-sm" role="status"></div>
                                            </div>
                                        )}

                                        <img
                                            src={imgOriginalMedium || defaultPoster}
                                            alt={actorData?.name}
                                            className="img-fluid w-100"
                                            onLoad={() => setActorImgLoaded(true)}
                                            style={{
                                                display: actorImgLoaded ? "block" : "none", // Usa none invece di rimuoverla dal DOM
                                                objectFit: "cover",
                                                minHeight: "400px"
                                            }}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = defaultPoster;
                                                setActorImgLoaded(true)
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Content Column */}
                                <div className="col-md-8 col-lg-9 d-flex flex-column">
                                    <h1 className="display-4 fw-bold">{actorData?.name || "Name Unavalible"}</h1>

                                    {/* Info Grid */}
                                    <div className="row row-cols-2 row-cols-lg-5 g-3 mb-4">
                                        <div className="col">
                                            <small className="text-muted d-block">Birthday</small>
                                            <strong>{formatDate(actorData?.birthday) || "N/A"}</strong>
                                        </div>
                                        {actorData?.deathday !== null ? (
                                            <div className="col">
                                                <small className="text-muted d-block">Died</small>
                                                <strong>{formatDate(actorData?.deathday) || "N/A"}</strong>
                                            </div>
                                        ) : (null)}
                                        <div className="col">
                                            <small className="text-muted d-block">Gender</small>
                                            <strong>{actorData?.gender || "N/A"}</strong>
                                        </div>
                                        <div className="col">
                                            <small className="text-muted d-block">Country</small>
                                            <strong>{actorData?.country?.name || "N/A"}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gli show in cui a partecipato l'attore */}
                        <div className="glass-card p-4 shadow-lg border-0 position-relative">
                            <h2 className="display-4 fw-bold mb-4">Shows</h2>
                            {showsLoading ? (
                                <p>Loading shows...</p>
                            ) : (
                                <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-3">
                                    {actorShows.map((show) => (
                                        <div className="col" key={show.id}>
                                            <div className="card shadow-sm overflow-hidden h-100" style={{ cursor: "pointer", borderRadius: "15px" }} onClick={() => navigate(`/show/${show.id}`)}>
                                                <img
                                                    src={show.image?.original || show.image?.medium || defaultPoster}
                                                    alt={show.name}
                                                    className="w-100"
                                                    style={{ objectFit: "cover" }}
                                                />
                                                <div className="card-body p-2 text-center">
                                                    <h6 className="card-title text-truncate mb-0" style={{ fontSize: "0.9rem" }}>{show.name}</h6>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {actorShows.length === 0 && !showsLoading && <p>No shows found for this actor.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}