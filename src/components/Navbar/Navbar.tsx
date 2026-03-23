import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import MyTimeLogo from "../../images/MyTime_logo.webp";

export default function Navbar() {
    const location = useLocation();
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    useEffect(() => {
        document.documentElement.setAttribute("data-bs-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="navbar navbar-expand-lg sticky-top shadow-sm py-2 px-3 transition-all" 
             style={{ 
                 backgroundColor: "var(--bg-glass)", // Usa la variabile globale
                 backdropFilter: "blur(12px)", 
                 borderBottom: "1px solid var(--border-glass)",
                 zIndex: 1070
             }}>
            <div className="container">
                <Link className="navbar-brand d-flex align-items-center fw-bolder fs-4" to="/">
                    <img src={MyTimeLogo} alt="Logo" width="32" height="32" className="me-2" />
                    <span className="text-emphasis">MyTime</span>
                </Link>

                <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                    <ul className="navbar-nav gap-2 mt-3 mt-lg-0 align-items-center list-unstyled">
                        {[
                            { path: "/", label: "Home" },
                            { path: "/search", label: "Search" },
                            { path: "/watching", label: "Watching" },
                            { path: "/list", label: "Lists" }
                        ].map((link) => (
                            <li className="nav-item w-100 text-center text-lg-start" key={link.path}>
                                <Link 
                                    className={`nav-link px-3 py-2 rounded-pill transition-all fw-semibold ${
                                        isActive(link.path) 
                                        ? "bg-primary-emphasis" 
                                        : ""
                                    }`} 
                                    to={link.path}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}

                        <li className="nav-item ms-lg-2 d-flex justify-content-center">
                            <button 
                                onClick={toggleTheme}
                                className="btn border-0 p-2 d-flex align-items-center justify-content-center rounded-circle transition-all theme-toggle-btn"
                                style={{ 
                                    width: "40px", 
                                    height: "40px",
                                    backgroundColor: theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)",
                                    fontSize: "1.2rem",
                                    lineHeight: "0"
                                }}
                            >
                                {theme === "light" ? "🌙" : "☀️"}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}