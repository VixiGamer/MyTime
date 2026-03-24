import { useState } from "react";
import { useList } from "../../context/ListContext";
import { useNavigate } from "react-router-dom";
import "./List.css"
import { useWatching } from "../../context/WatchingContext";

export default function List() {
    const { lists, addList, removeList, removeShowFromList } = useList();
    const { getShowProgress } = useWatching();
    const [listName, setListName] = useState("");
    const navigate = useNavigate();

    const handleAddList = () => {
        if (!listName.trim()) return;
        addList(listName);
        setListName("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleAddList();
    };

    return (
        <div className="container py-4" style={{ maxWidth: "900px" }}>
            <header className="mb-5 text-center text-md-start">
                <h1 className="fw-bolder display-5">My Collections</h1>
                <p className="text-muted">Organize your favorite shows into custom lists</p>
            </header>

            {/* Input Section - Glassmorphism Style */}
            <div className="card border-0 shadow-sm p-3 mb-5" style={{ 
                borderRadius: "20px", 
                backgroundColor: "rgba(255,255,255,0.6)", 
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.3)" 
            }}>
                <div className="input-group">
                    <input 
                        type="text" 
                        value={listName} 
                        onChange={(e) => setListName(e.target.value)} 
                        onKeyDown={handleKeyDown} 
                        className="form-control border-0 bg-light py-3 ps-4 shadow-none" 
                        placeholder="Create a new list (e.g., Must Watch)..." 
                        style={{ borderRadius: "15px 0 0 15px" }}
                    />
                    <button 
                        onClick={handleAddList} 
                        className="btn btn-dark px-4 fw-bold" 
                        type="button"
                        style={{ borderRadius: "0 15px 15px 0" }}
                    >
                        Add List
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
                        {/* List Header */}
                        <div className="d-flex justify-content-between align-items-end mb-3 px-2">
                            <div>
                                <small className="text-uppercase fw-bold text-muted ls-wide" style={{ fontSize: "0.7rem", letterSpacing: "1.5px" }}>Collection</small>
                                <h2 className="fw-bold m-0">{item.listName}</h2>
                                <small className="text-muted">ID: {item.listId}</small>
                            </div>
                            <button 
                                type="button" 
                                className="btn btn-link text-danger border-danger rounded-pill text-decoration-none px-2 py-1 small fw-semibold" 
                                onClick={() => { if(window.confirm("Are you sure you want to delete this entire list?")) removeList(item.listId) }}
                            >
                                Delete List
                            </button>
                        </div>

                        {/* Shows inside the list */}
                        <div className="d-flex flex-column gap-2">
                            {item.shows.length === 0 ? (
                                <div className="p-4 border border-dashed rounded-4 text-center text-muted bg-light bg-opacity-50">
                                    This collection is currently empty
                                </div>
                            ) : (
                                item.shows.map((show) => {
                                    const progress = getShowProgress(show.id);
                                    const isCompleted = progress?.episodes.length! > 0 && progress?.episodes.every(ep => ep.sessionWatched);
                                    const isWatching = progress && !isCompleted;
                                    const watchCount = progress?.allTimeCount || 0;

                                    return(
                                        <div 
                                            key={show.id} 
                                            className="card border-0 shadow-sm list-item-card transition-all"
                                            style={{ borderRadius: "15px", cursor: "pointer" }}
                                            onClick={() => navigate(`/show/${show.id}`)}
                                        >
                                            <div className="d-flex align-items-center p-2 p-md-3">
                                                <img 
                                                    src={show.image?.medium || show.image?.original} 
                                                    alt={show.name} 
                                                    className="rounded-3 shadow-sm"
                                                    style={{ width: "60px", height: "85px", objectFit: "cover" }} 
                                                />
                                                
                                                <div className="flex-grow-1 mx-3">
                                                    <h6 className="fw-bold mb-0 text-dark">{show.name}</h6>
                                                    <small className="text-muted d-none d-md-block">Tap to view details</small>
                                                </div>
                                                
                                                <div>
                                                    <div className="d-flex gap-2 align-items-center">
                                                        {isCompleted && (
                                                            <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.7rem' }}>
                                                                ✓ Watched
                                                            </span>
                                                        )}
                                                        {isWatching && (
                                                            <span className="badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle" style={{ fontSize: '0.7rem' }}>
                                                                ● Watching
                                                            </span>
                                                        )}
                                                        {watchCount > 0 && (
                                                            <span className="badge rounded-pill bg-dark-subtle text-dark border border-dark-subtle" style={{ fontSize: '0.7rem' }}>
                                                                {watchCount}x
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-danger btn-sm border-0 rounded-pill px-3 fw-bold" 
                                                    onClick={(e) => {
                                                        e.stopPropagation(); 
                                                        const confirmRemove = window.confirm(
                                                            `Are you sure you want to delete "${show.name}" form "${item.listName}"?`
                                                        );
                                                        if (confirmRemove) {
                                                            removeShowFromList(item.listId, show.id);
                                                        }
                                                    }}
                                                >
                                                    <span className="d-none d-md-inline">Remove</span>
                                                    <span className="d-md-none" style={{ fontSize: '1.2rem' }}>&times;</span>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}