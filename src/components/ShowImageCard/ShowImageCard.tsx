import { useState } from "react";
import type { ShowImage } from "../../Types/ShowImages";

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
            <div className="card shadow-sm border-0 bg-light overflow-hidden">
                <div 
                    className="position-relative w-100" 
                    style={{ 
                        aspectRatio: `${aspectRatio}`, 
                        backgroundColor: "#e9ecef" 
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
                    <div className="position-absolute top-0 start-0 m-2">
                        <span className="badge rounded-pill bg-dark opacity-75 text-capitalize" style={{fontSize: '0.7rem'}}>
                            {image.type}
                        </span>
                    </div>
                </div>
                
                {/* Info della card */}
                <div className="card-body p-2 text-center border-top bg-white">
                    <p className="card-text small text-muted mb-0" style={{fontSize: '0.75rem'}}>
                        {image.resolutions.original.width}x{image.resolutions.original.height}
                    </p>
                    {image.main && (
                        <span className="badge bg-primary mt-1" style={{fontSize: '0.6rem'}}>MAIN IMAGE</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- COMPONENTE PRINCIPALE GALLERIA ---
export default function ShowImagesGallery({ showImages }: { showImages: ShowImage[] }) {
    const [selectedType, setSelectedType] = useState<string>("all");

    // Estrazione tipi univoci per il dropdown (senza duplicati)
    const imageTypes: string[] = [...new Set(showImages.map((image) => image.type))];

    // Filtraggio dinamico
    const filteredImages = selectedType === "all" 
        ? showImages 
        : showImages.filter(img => img.type === selectedType);

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h2 className="mb-0">Official Gallery</h2>
                
                {/* Dropdown Filtro */}
                <div className="dropdown">
                    <button 
                        className="btn btn-dark dropdown-toggle text-capitalize shadow-sm" 
                        type="button" 
                        data-bs-toggle="dropdown" 
                        aria-expanded="false"
                    >
                        {selectedType === "all" ? "Filter by Type" : selectedType}
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow border-0">
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
            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-3 align-items-start">
                {filteredImages.map((image) => (
                    <ShowImageCard key={image.id} image={image} />
                ))}
            </div>

            {/* Gestione stato vuoto */}
            {filteredImages.length === 0 && (
                <div className="alert alert-light text-center py-5 shadow-sm mt-3 border">
                    <i className="bi bi-image text-muted display-4 d-block mb-2"></i>
                    No images available for this show.
                </div>
            )}
        </div>
    );
}