import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Riporta lo scroll all'inizio ogni volta che il percorso (URL) cambia
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // Questo componente non renderizza nulla graficamente
}