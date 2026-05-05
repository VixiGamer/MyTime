import { useState } from "react";
import type { ShowImage } from "../../Types/ShowImages";
import { useNavigate } from "react-router-dom";

// --- SOTTO-COMPONENTE PER LA SINGOLA CARD ---
export function ShowImageCard({ image }: { image: ShowImage }) {
    const [isLoaded, setIsLoaded] = useState(false);

    // Preferiamo l'originale per la galleria, fallback su medium
    const imageUrl = image.resolutions.original.url || image.resolutions.medium?.url;

    // Calcoliamo il ratio originale per adattare la card alla forma dell'immagine
    const aspectRatio = image.resolutions.original.width / image.resolutions.original.height;

    return (
        <div className="col">
            {/* La card NON ha h-100 così si ridimensiona in base al contenuto */}
            <div className="card border-0 bg-transparent">
                <div
                    className="position-relative w-100 shadow-sm overflow-hidden"
                    style={{
                        aspectRatio: `${aspectRatio}`,
                        borderRadius: "15px"
                    }}
                >
                    {/* Spinner centrato */}
                    {!isLoaded && (
                        <div className="position-absolute top-50 start-50 translate-middle">
                            <div className="spinner-border spinner-border-sm text-secondary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    )}

                    <img
                        src={imageUrl}
                        alt={image.type}
                        onLoad={() => setIsLoaded(true)}
                        className="card-img-top img-fluid"
                        style={{
                            height: "100%",
                            width: "100%",
                            objectFit: "cover",
                            opacity: isLoaded ? 1 : 0,
                            transition: "opacity 0.3s ease-in-out",
                            cursor: "zoom-in"
                        }}
                        onClick={() => window.open(image.resolutions.original.url, "_blank")}
                    />

                    {/* Badge tipo immagine */}
                    <div className="position-absolute d-flex gap-2 top-0 start-0 m-2">
                        {/* <span className="badge rounded-pill gray-glass-card text-capitalize" style={{ fontSize: '0.7rem' }}>
                            {image.type}
                        </span> */}
                        {image.main && (
                            <span className="badge rounded-pill lightblue-glass-card" style={{ fontSize: '0.7rem' }}>Main image</span>
                        )}
                    </div>
                </div>

                {/* Info della card */}
                <div className="card-body p-2 px-0 text-center d-flex flex-column">
                    <p className="card-title text-truncate fw-bold mb-0 px-2" style={{ color: "#f8f9fa", fontSize: '0.75rem' }}>
                        {image.resolutions.original.height}x{image.resolutions.original.width}
                    </p>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENTE PRINCIPALE GALLERIA ---
export default function ShowImagesGallery({ showImages }: { showImages: ShowImage[] }) {
    const [selectedType, setSelectedType] = useState<string>("all");
    const navigate = useNavigate()

    // Estrazione tipi univoci per il dropdown (senza duplicati)
    const imageTypes: string[] = [...new Set(showImages.map((image) => image.type))];

    // Filtraggio dinamico
    const filteredImages = selectedType === "all"
        ? showImages
        : showImages.filter(img => img.type === selectedType);

    return (
        <div className="transition-all">
            <button className="glass-card mb-4 px-3 py-2 shadow-sm" style={{ color: "var(--text-main)" }} onClick={() => navigate(-1)}>
                ← Back
            </button>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <header className="mb-2 text-center text-md-start d-flex gap-3 align-items-center">
                    <h1 className="fw-bolder display-5" style={{ color: "#f8f9fa" }}>Image gallery</h1>
                    <p className="text-light opacity-75 m-0 d-none d-md-block">Browse a collection of official posters, backgrounds, and promotional images</p>
                </header>

                {/* Dropdown Filtro */}
                <div className="dropdown ms-auto">
                    <button
                        className="gray-button-glass dropdown-toggle text-capitalize shadow-sm"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        {selectedType === "all" ? "Filter by type" : selectedType}
                    </button>
                    <ul className="dropdown-menu glass-card dropdown-menu-end shadow border-0">
                        <li>
                            <button
                                className={`dropdown-item ${selectedType === "all" ? "active" : ""}`}
                                onClick={() => setSelectedType("all")}
                            >
                                All Images ({showImages.length})
                            </button>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        {imageTypes.map((type) => (
                            <li key={type}>
                                <button
                                    className={`dropdown-item text-capitalize ${selectedType === type ? "active" : ""}`}
                                    onClick={() => setSelectedType(type)}
                                >
                                    {type} ({showImages.filter(i => i.type === type).length})
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Griglia con align-items-start per evitare gli spazi vuoti tra card di altezze diverse */}
            {filteredImages.length !== 0 ? (
                <>
                    {selectedType === "all" ? (
                        imageTypes.map((type) => {
                            const imagesOfType = showImages.filter((img) => img.type === type);
                            return (
                                <div key={type} className="mb-4">
                                    <h3 className="text-capitalize mb-3 fw-bold" style={{ color: "#f8f9fa" }}>{type}s</h3>
                                    <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-3 align-items-start">
                                        {imagesOfType.map((image) => (
                                            <ShowImageCard key={image.id} image={image} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div>
                            <h3 className="text-capitalize mb-3 fw-bold">{selectedType}s</h3>
                            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-3 align-items-start">
                                {filteredImages.map((image) => (
                                    <ShowImageCard key={image.id} image={image} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="alert alert-light text-center py-5 shadow-sm mt-3 border">
                    <i className="bi bi-image text-muted display-4 d-block mb-2"></i>
                    No images available for this show.
                </div>
            )}
        </div>
    );
}