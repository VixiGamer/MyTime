import { useContext } from "react";
import { ListContext } from "./ListContext";

export function useList() {
    const context = useContext(ListContext);
    if (!context) {
        throw new Error("useList must be used inside ListProvider");
    }
    return context;
}