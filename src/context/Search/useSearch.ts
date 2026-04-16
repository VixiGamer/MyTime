import { useContext } from "react";
import { SearchContext } from "./SearchContext";

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) throw new Error("useSearch deve essere usato dentro SearchProvider");
    return context;
};