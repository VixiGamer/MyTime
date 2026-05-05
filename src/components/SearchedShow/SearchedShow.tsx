import { useState } from "react";
import { useNavigate } from "react-router"
import defaultPoster from "../../images/poster_default.png";
import "./SearchedShow.css"

type Props = {
    id: number,
    image: string,
    title: string
}

export default function SearchedShowCard({ id, image, title }: Props) {
    const navigate = useNavigate()

    const [posterImgLoaded, setPosterImgLoaded] = useState(false);


    const handleClick = () => {
        navigate(`/show/${id}`)
    }

    return (
        <div className="card h-100 bg-transparent border-0 transition-all hover-scale" style={{ cursor: "pointer" }} onClick={handleClick}>
            <div className="position-relative shadow-sm" style={{ borderRadius: "15px", overflow: "hidden" }}>
                {!posterImgLoaded && (
                    <div className="d-flex align-items-center justify-content-center bg-secondary text-light w-100 actor-show-image">
                        <div className="spinner-border text-light" role="status">
                            <span className="visually-hidden"></span>
                        </div>
                    </div>
                )}
                <img
                    src={image || defaultPoster}
                    alt={title + " poster"}
                    onLoad={() => setPosterImgLoaded(true)}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultPoster;
                        setPosterImgLoaded(true);
                    }}
                    className="w-100 show-image"
                    style={{
                        display: posterImgLoaded ? "block" : "none" // Usa none invece di rimuoverla dal DOM
                    }}
                />
            </div>
            <div className="card-body p-2 px-0 text-center d-flex flex-column">
                <h6 className="card-title text-truncate fw-bold mb-0 px-2" title={title} style={{ fontSize: "1rem" }}>{title}</h6>
            </div>
        </div>
    )
}