import { Link, useNavigate } from "react-router-dom"
import api from "../api/api"
import { removeToken } from "../utils/utils"

export default function Navbar() {
    const navigate = useNavigate()

    async function handleLogout() {
        api.post('/auth/logout').then(res=>{
            removeToken()
            navigate('/')
        }).catch(error=>alert(error.response.data.message))
    }

    return (
        <>
            <nav class="navbar">
                <div class="container container--wide">
                    <div onClick={()=>navigate('/dashboard')} class="navbar-brand">
                        <div class="navbar-brand-icon">F</div>
                        FormKraft
                    </div>
                    <div class="navbar-actions">
                        <button onClick={()=>handleLogout()} class="btn btn-secondary">Logout</button>
                    </div>
                </div>
            </nav>
        </>
    )
}