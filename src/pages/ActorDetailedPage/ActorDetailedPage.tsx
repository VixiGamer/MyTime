import axios from "axios";
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom";
import type { Actor } from "../../Types/Actor";
import defaultPoster from "../../images/poster_default.png";
import type { SingleShowDetails } from "../../Types/SingleShowDetails";
import type { CastCredits } from "../../Types/CastCredits";
import Error500 from "../../components/Error500/Error500";



export default function ActorDetailedPage() {
    const { actorId } = useParams();
    const navigate = useNavigate();

    const [actorData, setActorData] = useState<Actor | null>(null)
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [actorShows, setActorShows] = useState<SingleShowDetails[]>([]);
    const [showsLoading, setShowsLoading] = useState(true);

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


    //  Se l'Id è sbagliato (404)
    if (error404) {
        return (
            <div className="p-4">
                <button className="btn btn-outline-dark mb-4" onClick={() => navigate(-1)}>Back</button>
                <div className="p-4 text-center alert alert-danger mx-auto" style={{maxWidth: "500px"}}>
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
        <div className="p-4">
            <button className="btn btn-outline-dark mb-3" onClick={() => navigate(-1)}>Back</button>
            <div>
                <div className="p-2">
                    {/* Info del'attore */}
                    <h1>{actorData?.name || "Name Unavalible"}</h1>
                    <div className="d-flex gap-4 mb-4 flex-wrap">
                        {!actorImgLoaded && (
                            <div className="d-flex align-items-center justify-content-center bg-secondary text-light" style={{borderRadius: "5px", height: "19rem", width: "13.2rem"}}>
                                <div className="spinner-border text-light" role="status">
                                    <span className="visually-hidden"></span>
                                </div>
                            </div>
                        )}
                        
                        <img 
                            src={imgOriginalMedium || defaultPoster} 
                            alt={actorData?.name} 
                            onLoad={() => setActorImgLoaded(true)}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = defaultPoster;
                                setActorImgLoaded(true)
                            }}
                            style={{
                                borderRadius: "5px", 
                                objectFit: "cover", 
                                height: "19rem", 
                                width: "13.2rem",
                                display: actorImgLoaded ? "block" : "none" // Usa none invece di rimuoverla dal DOM
                            }}
                        />

                        <div>
                            <p><strong>Birthday: </strong>{actorData?.birthday || "Unavalible"}</p>
                            {actorData?.deathday !== null ? (
                                <p><strong>Died: </strong>{actorData?.deathday || "Unavalible"}</p>
                            ) : (null)}
                            <p><strong>Gender: </strong>{actorData?.gender || "Unavalible"}</p>
                            <p><strong>Country: </strong>{actorData?.country?.name || "Unavalible"}</p>
                        </div>
                    </div>

                    {/* Gli show in cui a partecipato l'attore */}
                    <div className="mt-5">
                        <h2>Shows</h2>
                        {showsLoading ? (
                            <p>Loading shows...</p>
                        ) : (
                            <div className="d-flex gap-3 flex-wrap">
                                {actorShows.map((show) => (
                                    <div key={show.id} className="card shadow-sm overflow-hidden" style={{ width: "10rem", cursor: "pointer" }} onClick={() => navigate(`/show/${show.id}`)}>
                                        <img 
                                            src={show.image?.medium || show.image?.original || defaultPoster} 
                                            alt={show.name} 
                                            className="w-100"
                                            style={{ height: "14rem", objectFit: "cover" }}
                                        />
                                        <div className="card-body p-2 text-center">
                                            <h6 className="card-title text-truncate mb-0" style={{fontSize: "0.9rem"}}>{show.name}</h6>
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
    )
}