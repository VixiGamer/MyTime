import { createContext, useContext, useState, type ReactNode, } from "react";
import type { ShowAndScrore } from "../Types/SearchShow";

interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: ShowAndScrore[];
    setSearchResults: (results: ShowAndScrore[]) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<ShowAndScrore[]>([]);

    return (
        <SearchContext.Provider value={{ searchQuery, setSearchQuery, searchResults, setSearchResults }}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) throw new Error("useSearch deve essere usato dentro SearchProvider");
    return context;
};