import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api/api"
import { removeToken } from "../utils/utils"

export default function Navbar() {
    const navigate = useNavigate()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    async function handleLogout() {
        api.post('/auth/logout').then(res => {
            removeToken()
            navigate('/login')
        }).catch(error => {
            removeToken()
            navigate('/login')
        })
    }

    return (
        <>
            <nav className={`navbar ${isMenuOpen ? "is-menu-open" : ""}`}>
                <div className="container container--wide">
                    <div onClick={() => navigate('/dashboard')} className="navbar-brand cursor-pointer" style={{cursor: "pointer"}}>
                        <div className="navbar-brand-icon">F</div>
                        <span>FormKraft</span>
                    </div>

                    <button 
                        className="navbar-toggler" 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle navigation"
                        style={{display: "none"}}
                    >
                        <div className={`burger ${isMenuOpen ? "active" : ""}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </button>

                    <div className={`navbar-menu ${isMenuOpen ? "is-active" : ""}`}>
                        <div className="navbar-actions">
                            <button onClick={() => navigate('/dashboard')} className="btn btn-ghost">Dashboard</button>
                            <button onClick={() => handleLogout()} className="btn btn-secondary">Logout</button>
                        </div>
                    </div>
                </div>
            </nav>
            {isMenuOpen && <div className="navbar-backdrop" onClick={() => setIsMenuOpen(false)}></div>}
        </>
    )
}