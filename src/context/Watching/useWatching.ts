import { useContext } from "react";
import { WatchingContext } from "./WatchingContext";

export const useWatching = () => {
    const context = useContext(WatchingContext);
    if (!context) throw new Error("useWatching deve essere usato dentro WatchingProvider");
    return context;
};