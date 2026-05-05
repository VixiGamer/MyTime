import { useEffect } from "react";
import axios from "axios";
import SearchedShowCard from "../../components/SearchedShow/SearchedShow";
import { useSearch } from "../../context/Search/useSearch";

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
        <div className="min-vh-100 w-100" style={{ paddingBottom: "3rem", backgroundImage: "linear-gradient(135deg, rgb(240, 25, 20), rgb(142, 50, 50), rgb(238, 89, 70), rgb(84, 132, 156), rgb(69, 76, 67))"}}>
            <div className="container p-4">
                <header className="mb-5 text-center text-md-start d-flex gap-3 align-items-center">
                    <h1 className="fw-bolder display-5">Search Shows</h1>
                    <p className="text-muted m-0 d-none d-md-block">Find your favorite TV series or discover something new.</p>
                </header>

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

                <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 gap-sm-3 mt-4 justify-content-center">
                    {searchResults.map((item) => (
                        <div className="col" key={item.show.id}>
                            <SearchedShowCard
                                id={item.show.id}
                                image={item.show.image?.original || item.show.image?.medium}
                                title={item.show.name}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}