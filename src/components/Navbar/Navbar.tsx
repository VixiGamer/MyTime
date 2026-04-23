import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import MyTimeLogo from "../../images/MyTime_logo.webp";
import "./Navbar.css"

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    useEffect(() => {
        document.documentElement.setAttribute("data-bs-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
    };

    const getButtonClass = (path: string) => {
        const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);
        return `navbar-item glass-card ${isActive ? 'bg-primary-emphasis' : ''}`;
    };

    return (
        <div className="fixed-bottom d-flex justify-content-center w-100 pe-none">
            <nav className="glass-navbar shadow-lg py-2 px-3 m-2 rounded-pill transition-all d-inline-flex pe-auto" style={{ width: "fit-content" }}>
                <div className="container d-flex flex-row gap-3">
                    <Link className="d-flex align-items-center fw-bolder fs-4 text-decoration-none" to="/">
                        <img src={MyTimeLogo} alt="Logo" width="32" height="32" className="me-2" />
                        <span className="d-none d-sm-block" style={{ color: `var(--text-main)` }}>MyTime</span>
                    </Link>

                    <div className="d-flex flex-row gap-3">
                        <button className={getButtonClass('/')} onClick={() => navigate(`/`)}>
                            <i className="bi bi-house"></i>
                        </button>
                        <button className={getButtonClass('/search')} onClick={() => navigate(`/search`)}>
                            <i className="bi bi-search"></i>
                        </button>
                        <button className={getButtonClass('/watching')} onClick={() => navigate(`/watching`)}>
                            <i className="bi bi-view-list"></i>
                        </button>
                        <button className={getButtonClass('/list')} onClick={() => navigate(`/list`)}>
                            <i className="bi bi-list"></i>
                        </button>

                        <button onClick={toggleTheme} className="navbar-item glass-card" >
                            {theme === "light" ? <i className="bi bi-moon-fill" /> : <i className="bi bi-brightness-high-fill" />}
                        </button>

                    </div>
                </div>
            </nav>
        </div>
    );
}