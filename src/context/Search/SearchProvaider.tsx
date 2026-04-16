import { useState, type ReactNode } from "react";
import type { ShowAndScrore } from "../../Types/SearchShow";
import { SearchContext } from "./SearchContext";

export const SearchProvider = ({ children }: { children: ReactNode }) => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<ShowAndScrore[]>([]);

    return (
        <SearchContext.Provider value={{ searchQuery, setSearchQuery, searchResults, setSearchResults }}>
            {children}
        </SearchContext.Provider>
    );
};