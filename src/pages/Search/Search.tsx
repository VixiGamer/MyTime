import { useEffect } from "react";
import axios from "axios";
import SearchedShowCard from "../../components/SearchedShow/SearchedShow";
import { useSearch } from "../../context/SearchContext";


export default function Search() {
    const { searchQuery, setSearchQuery, searchResults, setSearchResults } = useSearch();

    useEffect(() => {
        // Se non c'è testo, non resettiamo i risultati (così rimangono visibili i vecchi)
        if (!searchQuery) return;

        const handler = setTimeout(() => {
            const url = `https://api.tvmaze.com/search/shows?q=${searchQuery}`;
            axios.get(url)
                .then((response) => setSearchResults(response.data))
                .catch((error) => console.error(error));
        }, 500);

        return () => clearTimeout(handler);
    }, [searchQuery, setSearchResults]);


    return (
        <div className="container py-4">
            <div className="text-center mb-4">
                <h1 className="fw-bolder display-5 text-main mb-2">Search Shows</h1>
                <p className="text-muted mx-auto" style={{ maxWidth: "500px" }}>
                    Find your favorite TV series or discover something new.
                </p>
            </div>

            {/* Barra di Ricerca Stilizzata (Glassmorphism, più compatta) */}
            <div className="glass-card p-2 mb-4 shadow-sm" style={{ borderRadius: "50px" }}>
                <div className="input-group">
                    <span className="input-group-text bg-transparent border-0 text-muted ps-3 pe-2">
                        <i className="bi bi-search"></i>
                    </span>
                    <input
                        type="search"
                        className="form-control bg-transparent border-0 text-main"
                        placeholder="Type show title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ boxShadow: 'none' }}
                    />
                </div>
            </div>

            <div className="d-flex flex-wrap justify-content-center mx-1 mt-4 gap-2" style={{ cursor: "pointer" }}>
                {searchResults.map((item) => (
                    <SearchedShowCard
                        key={item.show.id}
                        id={item.show.id}
                        image={item.show.image?.original || item.show.image?.medium}
                        title={item.show.name}
                    />
                ))}
            </div>
        </div>
    );
}