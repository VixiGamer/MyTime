import { useEffect, useState } from "react";
import { useList } from "../../context/List/useList";
import { useNavigate } from "react-router-dom";
import "./List.css"
import { useWatching } from "../../context/Watching/useWatching";
import defaultPoster from "../../images/poster_default.png";
import { Vibrant } from "node-vibrant/browser";
import type { Palette, Swatch } from "@vibrant/color";
export default function List() {
    const { lists, addList, removeList, removeShowFromList } = useList();
    const { getShowProgress } = useWatching();
    const [listName, setListName] = useState("");
    const navigate = useNavigate();

    const [bgGradient, setBgGradient] = useState("");
    const [randomImageUrl, setRandomImageUrl] = useState<string | null>(null);

    const handleAddList = () => {
        if (!listName.trim()) return;
        addList(listName);
        setListName("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleAddList();
    };

    // Questo useEffect si occupa di scegliere un'immagine casuale tra tutte le serie salvate nelle liste, e poi fare la gradiante per lo sfondo della paggina.
    useEffect(() => {
        const allShows = lists.flatMap(list => list.shows);        // Estrae tutte le serie da tutte le liste unendole in un singolo array
        const showsWithImages = allShows.filter(show => show.image?.original || show.image?.medium);        // Filtra tenendo solo le serie che possiedono fisicamente un link per l'immagine

        // Se non ci sono serie con immagini (liste vuote), pulisce lo sfondo
        if (showsWithImages.length === 0) {
            if (randomImageUrl !== null) {
                // setTimeout aggira l'errore di React che vieta l'aggiornamento sincrono di stato durante il rendering
                setTimeout(() => {
                    setRandomImageUrl(null);
                    setBgGradient("");
                }, 0);
            }
            return;
        }

        // Verifica se l'immagine attuale appartiene ancora a una delle serie salvate
        // (Ad esempio: se l'utente elimina proprio la serie che faceva da sfondo, questo diventerà false)
        const isCurrentUrlStillValid = showsWithImages.some(show =>
            show.image?.original === randomImageUrl || show.image?.medium === randomImageUrl
        );

        // Se non abbiamo un'immagine impostata, o se quella attuale è diventata invalida, ne peschiamo una nuova
        if (!randomImageUrl || !isCurrentUrlStillValid) {
            const randomIndex = Math.floor(Math.random() * showsWithImages.length);
            const selectedShow = showsWithImages[randomIndex];
            const newUrl = selectedShow.image?.original || selectedShow.image?.medium || null;
            
            // Se l'URL è diverso, aggiorniamo lo stato asincronamente per evitare render a cascata o instabilità
            if (newUrl !== randomImageUrl) {
                setTimeout(() => setRandomImageUrl(newUrl), 0);
            }
        }
    }, [lists, randomImageUrl]);


    //* Per estrarre i colori dal poster e usarli come sfondo dinamico della pagina
    useEffect(() => {
        if (!randomImageUrl) return;

        Vibrant.from(randomImageUrl)
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

    }, [randomImageUrl]);

    return (
        <div className="min-vh-100" style={{ backgroundImage: bgGradient, paddingBottom: "3rem" }}>
            <div className="container p-4">
                <header className="mb-5 text-center text-md-start d-flex gap-3 align-items-center">
                    <h1 className="fw-bolder display-5">My collections</h1>
                    <p className="text-muted m-0 d-none d-md-block">Organize your favorite shows into custom lists</p>
                </header>

                {/* Input Section - Glassmorphism Style */}
                <div className="mb-5">
                    <div className="input-group gap-4">
                        <input
                            type="text"
                            value={listName}
                            onChange={(e) => setListName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="form-control glass-card py-3 ps-4 shadow-none"
                            placeholder="Create a new list (e.g., Must watch)..."
                        />
                        <button
                            onClick={handleAddList}
                            className="glass-card rounded-pill fw-bold px-3"
                            type="button"
                        >
                            Add list
                        </button>
                    </div>
                </div>

                {lists.length === 0 && (
                    <div className="text-center py-5 shadow-sm rounded-4 bg-white">
                        <p className="text-muted fs-5 mb-0">No collections found. Start by adding one above!</p>
                    </div>
                )}

                <div className="d-flex flex-column gap-5">
                    {lists.map((item) => (
                        <section key={item.listId} className="list-group-container">


                            {/* Shows inside the list */}
                            <div className="glass-card p-4">
                                {/* List Header */}
                                <div className="d-flex justify-content-between align-items-center px-2">
                                    <div>
                                        <small className="text-uppercase fw-bold text-muted ls-wide" style={{ fontSize: "0.7rem", letterSpacing: "1.5px" }}>Collection</small>
                                        <h2 className="fw-bold m-0">{item.listName}</h2>
                                        <small className="text-muted">ID: {item.listId}</small>
                                    </div>
                                    <div className="d-flex align-items-center gap-3">
                                        <button
                                            className="btn bg-transparent border-0 text-muted d-flex align-items-center gap-2 list-collapse-btn p-0"
                                            type="button"
                                            data-bs-toggle="collapse"
                                            data-bs-target={`#collapseList-${item.listId}`}
                                            aria-expanded="true"
                                        >
                                            <span className="text-when-closed">View</span>
                                            <span className="text-when-open">Hide</span>
                                            <i className="bi bi-chevron-down" />
                                        </button>
                                        <div className="dropdown flex-shrink-0" style={{ paddingTop: "0.5rem" }}>
                                            <button className="btn p-0 text-muted border-0 fs-5 moreinfo-button-responsive" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                <i className="bi bi-three-dots-vertical" />
                                            </button>
                                            <ul className="dropdown-menu glass-card dropdown-menu-end shadow">
                                                <li><button
                                                    className="dropdown-item text-danger"
                                                    onClick={() => { if (window.confirm("Are you sure you want to delete this entire list?")) removeList(item.listId) }}
                                                >
                                                    <i className="bi bi-trash3" /> Delete List
                                                </button></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="collapse show" id={`collapseList-${item.listId}`}>
                                    <div className="pt-4">
                                        {item.shows.length === 0 ? (
                                            <div className="text-center py-3">
                                                <p className="text-muted mb-0">This collection is currently empty</p>
                                            </div>
                                        ) : (
                                            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-4">
                                                {item.shows.map((show) => {
                                                    const progress = getShowProgress(show.id);
                                                    const isCompleted = (progress?.episodes?.length || 0) > 0 && progress?.episodes.every(ep => ep.sessionWatched);
                                                    const isWatching = progress && !isCompleted;
                                                    const watchCount = progress?.allTimeCount || 0;

                                                    return (
                                                        <div key={show.id} className="col">
                                                            <div className="card h-100 bg-transparent border-0 transition-all hover-scale">
                                                                <div className="position-relative shadow-sm" style={{ borderRadius: "15px", overflow: "hidden", aspectRatio: "2/3" }}>
                                                                    <img
                                                                        src={show.image?.original || show.image?.medium || defaultPoster}
                                                                        alt={show.name}
                                                                        onClick={() => navigate(`/show/${show.id}`)}
                                                                        style={{ cursor: "pointer", objectFit: "cover", width: "100%", height: "100%" }}
                                                                    />

                                                                    {isWatching && (
                                                                        <div className="position-absolute top-0 end-0 m-2">
                                                                            <span className="badge rounded-pill yellow-glass-card text-light shadow-sm d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', backdropFilter: "blur(4px)" }}>
                                                                                <i className="bi bi-play-btn-fill" />
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {/* Badge per il conteggio TOTALE delle visioni */}
                                                                    {watchCount > 0 && (
                                                                        <div className="position-absolute top-0 end-0 m-2">
                                                                            <span className="badge rounded-pill lightblue-glass-card text-light shadow-sm d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', backdropFilter: "blur(4px)" }}>
                                                                                <i className="bi bi-eye-fill" /> {watchCount}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {/* Badge per la valutazione della serie */}
                                                                    {progress?.userRating && (
                                                                        <div className="position-absolute top-0 start-0 m-2">
                                                                            <span className={`badge rounded-pill ${Number(progress.userRating) < 3 ? 'pink-glass-card' :
                                                                                Number(progress.userRating) < 5 ? 'red-glass-card' :
                                                                                    Number(progress.userRating) < 7 ? 'yellow-glass-card' :
                                                                                        Number(progress.userRating) < 8 ? 'lightgreen-glass-card' :
                                                                                            Number(progress.userRating) < 10 ? 'green-glass-card' :
                                                                                                'lightblue-glass-card'
                                                                                } text-light shadow-sm d-flex align-items-center gap-1`} style={{ fontSize: '0.8rem', backdropFilter: "blur(4px)" }}>
                                                                                <i className="bi bi-heart-fill" style={{ color: "#dc3545" }} /> {progress.userRating}/10
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="card-body p-2 px-0 text-center d-flex flex-column">
                                                                    <h6 className="card-title text-truncate fw-bold mb-2 px-2" title={show.name} style={{ fontSize: "1rem" }}>
                                                                        {show.name}
                                                                    </h6>

                                                                    <button
                                                                        className="pink-button-glass w-100 mt-auto py-1 fw-bold"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm(`Are you sure you want to remove "${show.name}" from "${item.listName}"?`)) {
                                                                                removeShowFromList(item.listId, show.id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-trash3" /> Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}