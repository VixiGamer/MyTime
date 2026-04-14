import { useState, useEffect } from "react";
import "./RatingModal.css"
import { getRatingColor } from "../../utils/ratingHelper"

interface RatingModalProps {
    isOpen: boolean;
    targetName: string;
    initialVal?: number;
    onClose: () => void;
    onSubmit: (rating: number | null) => void;
}

export default function RatingModal({ isOpen, targetName, initialVal = 0, onClose, onSubmit }: RatingModalProps) {
    const [rating, setRating] = useState<number>(initialVal);

    useEffect(() => {
        if (isOpen) setRating(initialVal);
    }, [initialVal, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal show d-block p-3" style={{ 
            backgroundColor: 'rgba(0,0,0,0.4)', 
            backdropFilter: 'blur(8px)',
            zIndex: 1060 
        }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content glass-card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                    
                    <div className="modal-header border-0 pb-0 pe-4 pt-4">
                        <div className="w-100 text-center">
                            <h5 className="modal-title fw-bold text-secondary text-uppercase small ls-wide">Rate</h5>
                            <h4 className="fw-bolder mb-0">{targetName}</h4>
                        </div>
                        <button type="button" className="btn-close position-absolute end-0 top-0 m-3" onClick={onClose}></button>
                    </div>
                    
                    <div className="modal-body text-center px-4 pt-2">
                        <div style={{color: getRatingColor(rating)}} className={`display-3 fw-bold mb-2 transition-all`}>
                            {rating % 1 === 0 ? rating : rating.toFixed(1)}
                            <small className="fs-4 ms-1 text-muted">/10</small>
                        </div>

                        <div className="d-flex flex-wrap justify-content-center gap-2 mb-4 mt-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <button 
                                    key={num} 
                                    className={`rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center transition-all ${
                                        Math.floor(rating) === num 
                                            ? (rating < 3 ? 'pink-glass-card' : 
                                               rating < 5 ? 'red-glass-card' : 
                                               rating < 7 ? 'yellow-glass-card' : 
                                               rating < 8 ? 'lightgreen-glass-card' : 
                                               rating < 10 ? 'green-glass-card' : 
                                               'lightblue-glass-card') + ' scale-110 fw-bold'
                                            : 'lightgray-glass-card shadow-none'
                                    }`}
                                    style={{ width: "38px", height: "38px", fontSize: "0.9rem" }}
                                    onClick={() => setRating(num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            {/* Pulsante per diminuire di 0.1 */}
                            <button 
                                className="lightgray-glass-card rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px", flexShrink: 0 }}
                                onClick={() => setRating(prev => Math.max(0, parseFloat((prev - 0.1).toFixed(1))))}
                            >
                                -
                            </button>

                            {/* Lo slider originale */}
                            <input 
                                type="range" 
                                className="form-range custom-slider custom-range flex-grow-1" 
                                min="0" max="10" step="0.1"
                                value={rating}
                                onChange={(e) => setRating(parseFloat(e.target.value))}
                            />

                            {/* Pulsante per aumentare di 0.1 */}
                            <button 
                                className="lightgray-glass-card rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px", flexShrink: 0 }}
                                onClick={() => setRating(prev => Math.min(10, parseFloat((prev + 0.1).toFixed(1))))}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="modal-footer border-0 p-4 pt-0">
                        <div className="row w-100 g-2">
                            <div className="col-6">
                                <button className="lightgray-button-glass w-100 py-2 fw-semibold" onClick={onClose}>Cancel</button>
                            </div>
                            <div className="col-6">
                                <button className="red-button-glass w-100 py-2 fw-bold shadow-sm" onClick={() => onSubmit(null)}>Remove Rating</button>
                            </div>
                            <div className="col-12">
                                <button className="lightgreen-button-glass w-100 py-2 fw-bold shadow-sm" onClick={() => onSubmit(rating)}>Save Rating</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}