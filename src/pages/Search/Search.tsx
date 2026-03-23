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
        <div>
            <h1 className="text-center">Search page</h1>
            <input 
                type="text" 
                className="form-control" 
                placeholder="Search..." 
                style={{width: "25%", margin: "0 auto"}} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} 
            />

            <div className="d-flex flex-wrap justify-content-center mx-1 mt-4 gap-2" style={{cursor: "pointer"}}>
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