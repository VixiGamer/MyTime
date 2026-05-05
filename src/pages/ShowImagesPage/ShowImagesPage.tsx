import { useNavigate, useParams } from "react-router-dom";
import type { ShowImage } from "../../Types/ShowImages";
import { useEffect, useState } from "react";
import axios from "axios";
import { Vibrant } from "node-vibrant/browser";
import type { Palette, Swatch } from "@vibrant/color";
import Error500 from "../../components/Error500/Error500";
import ShowImagesGallery from "../../components/ShowImageCard/ShowImageCard";


export default function ShowImagesPage() {
    const { showId } = useParams();

    const [showImages, setShowImages] = useState<ShowImage[]>([])

    const [error404, setError404] = useState(false);    //^ Per gestire l'errore 404
    const [error500, setError500] = useState(false);    //^ Per gestire l'errore 500
    const [isPageLoading, setIsPageLoading] = useState<boolean>(true)
    const navigate = useNavigate()

    const [bgGradient, setBgGradient] = useState("");
    const [randomImageUrl, setRandomImageUrl] = useState<string | null>(null);

    //* Questo useEffect sceglie un'immagine casuale tra quelle disponibili per la galleria, e crea il gradiente per lo sfondo.
    useEffect(() => {
        // Filtriamo le immagini per assicurarci che abbiano un URL valido
        const validImages = showImages.filter(img => img.resolutions?.original?.url || img.resolutions?.medium?.url);

        // Se non ci sono immagini, pulisce lo sfondo
        if (validImages.length === 0) {
            if (randomImageUrl !== null) {
                setTimeout(() => {
                    setRandomImageUrl(null);
                    setBgGradient("");
                }, 0);
            }
            return;
        }

        // Verifica se l'immagine attuale appartiene ancora all'array di immagini
        const isCurrentUrlStillValid = validImages.some(img =>
            img.resolutions?.original?.url === randomImageUrl || img.resolutions?.medium?.url === randomImageUrl
        );

        if (!randomImageUrl || !isCurrentUrlStillValid) {
            const randomIndex = Math.floor(Math.random() * validImages.length);
            const selectedImg = validImages[randomIndex];
            const newUrl = selectedImg.resolutions?.original?.url || selectedImg.resolutions?.medium?.url || null;

            if (newUrl !== randomImageUrl) {
                setTimeout(() => setRandomImageUrl(newUrl), 0);
            }
        }
    }, [showImages, randomImageUrl]);

    //* Per estrarre i colori dal poster e usarli come sfondo dinamico della pagina
    useEffect(() => {
        if (!randomImageUrl) return;

        Vibrant.from(randomImageUrl)
            .getPalette()
            .then((palette: Palette) => {
                const colors = Object.values(palette).filter((swatch): swatch is Swatch => Boolean(swatch)).map((swatch) => swatch.rgb);
                if (colors.length === 0) return;
                const selected = colors.slice(0, 5);
                const colorStrings = selected.map((c: number[]) => `rgb(${c.join(",")})`);
                const gradient = `linear-gradient(135deg, ${colorStrings.join(",")})`;
                setBgGradient(gradient);
            })
            .catch((err) => {
                console.error("Errore Vibrant:", err);
            });
    }, [randomImageUrl]);

    useEffect(() => {
        if (!showId) return;

        //§ Qui controlliamo se l'id ha solo numeri
        const isNumericShowId = /^\d+$/.test(showId);

        //§ Se ci sono lettere o altri caratteri cambia lo stato di 'error404'
        if (!isNumericShowId) {
            console.error("Show Id or Episode Id not valid or they dont correlate to each other.");
            setTimeout(() => {
                setError404(true);
            }, 0);
            return;
        }

        const url = `https://api.tvmaze.com/shows/${showId}/images`
        axios.get(url)
            .then((responce) => {
                setShowImages(responce.data)
                setIsPageLoading(false);
            })
            .catch((error) => {
                if (error.response && error.response.status === 404) {
                    setError404(true);
                }
                if (error.response.status === 500) {
                    setError500(true);
                }
                console.error(error)
            })
    }, [showId])

    if (!showId) return null;

    if (error404) {
        return (
            <div className="p-4">
                <button className="btn btn-outline-dark mb-4" onClick={() => navigate(-1)}>Back</button>
                <div className="p-4 text-center alert alert-danger mx-auto" style={{ maxWidth: "500px" }}>
                    <h4 className="alert-heading">Id not valid!</h4>
                    <p>Show Id not valid.</p>
                </div>
            </div>
        );
    }

    if (error500) {
        return (
            <div className="p-4">
                <button className="btn btn-outline-dark mb-4" onClick={() => navigate(-1)}>Back</button>
                <Error500 />
            </div>

        );
    }

    if (isPageLoading) return (
        <div className="p-4 position-relative">
            <button className="btn btn-outline-dark mb-3" onClick={() => navigate(-1)}>Back</button>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100vh" }}>
                <div className="spinner-border text-dark" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-vh-100 w-100 transition-all" style={{ paddingBottom: "3rem", backgroundImage: bgGradient }}>
            <div className="p-4 container position-relative">
                <ShowImagesGallery showImages={showImages} />
            </div>
        </div>
    )
}