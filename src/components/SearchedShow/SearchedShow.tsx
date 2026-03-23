import { useState } from "react";
import { useNavigate } from "react-router"
import defaultPoster from "../../images/poster_default.png";

type Props = {
    id: number,
    image: string,
    title: string
}

export default function SearchedShowCard ({ id, image, title }: Props) {
    const navigate = useNavigate()

    const [posterImgLoaded, setPosterImgLoaded] = useState(false);

    
    const handleClick = () => {
        navigate(`/show/${id}`)
    }

    return(
        <div className="card" style={{width: "14rem"}} onClick={handleClick}>
            {/* <img src={image} className="card-img-top" /> */}
            {!posterImgLoaded && (
                <div className="card-img-top d-flex align-items-center justify-content-center bg-secondary text-light" style={{borderTopLeftRadius: "5px", borderTopRightRadius: "5px", height: "19.5rem", width: "100%"}}>
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
                    setPosterImgLoaded(true)
                }}
                className="card-img-top"
                style={{
                    borderTopLeftRadius: "5px", 
                    borderTopRightRadius: "5px",
                    height: "19.5rem",
                    objectFit: "cover", 
                    display: posterImgLoaded ? "block" : "none" // Usa none invece di rimuoverla dal DOM
                }}
            />
            <div className="card-body">
                <p className="card-text text-center">{title}</p>
            </div>
        </div>
    )
}