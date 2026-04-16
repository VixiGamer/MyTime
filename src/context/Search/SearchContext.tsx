import { createContext } from "react";
import type { ShowAndScrore } from "../../Types/SearchShow";

interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: ShowAndScrore[];
    setSearchResults: (results: ShowAndScrore[]) => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);