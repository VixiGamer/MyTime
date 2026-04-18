import { useState } from "react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (date: string, time: string) => void;
};

export default function DateTimeModal({ isOpen, onClose, onConfirm }: Props) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

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
                            <h4 className="fw-bolder mb-0">Select date & time</h4>
                        </div>
                        <button type="button" className="btn-close position-absolute end-0 top-0 m-3" onClick={onClose}></button>
                    </div>

                    <div className="modal-body text-center px-4 pt-4 pb-3">
                        <div className="row g-3 justify-content-center">
                            <div className="col-6 col-sm-4">
                                <input
                                    type="date"
                                    className="form-control text-center"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="col-6 col-sm-4">
                                <input
                                    type="time"
                                    className="form-control text-center"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer border-0 p-4 pt-0">
                        <div className="row w-100 g-2">
                            <div className="col-6">
                                <button className="lightgray-button-glass w-100 py-2 fw-semibold" onClick={onClose}>Cancel</button>
                            </div>
                            <div className="col-6">
                                <button className="lightgreen-button-glass w-100 py-2 fw-bold shadow-sm" onClick={() => {
                                    onConfirm(date, time);
                                    onClose();
                                }}
                                    disabled={!date || !time}>
                                    Save Rating
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}