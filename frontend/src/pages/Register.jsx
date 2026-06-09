import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api/api"
import { getToken, setToken, setUsn } from "../utils/utils"

export default function Register() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [errMsg, setErrMsg] = useState("")
    const [errors, setErrors] = useState([])
    const navigate = useNavigate()

    async function handleRegister(e) {
        e.preventDefault()

        setErrMsg("")
        setErrors([])

        api.post('/auth/register', {
            name,
            email,
            password
        }).then(res => {
            setToken(res.data.token)
            setUsn(res.data.user.name)
            navigate('/dashboard')
        }).catch(error => {
            setErrMsg(error.response.data.message)
            if (error.response.status == 422) {
                setErrors(error.response.data.errors)
            }
        })
    }

    useEffect(() => {
        document.title = "Register | FormKraft"

        if(getToken()){
            navigate('/dashboard')
        }
    }, [])
    return (
        <>
            <div class="auth-page">
                <div class="auth-card">
                    <div class="auth-logo">
                        <div class="auth-logo-icon">F</div>
                        <div class="auth-logo-text">FormKraft</div>
                    </div>

                    <div class="auth-heading">
                        <h2>Create an account</h2>
                        <p>Get started with FormKraft today</p>
                        {errMsg && <p className="form-error">{errMsg}</p>}
                    </div>

                    <form class="auth-form" onSubmit={e => handleRegister(e)} method="POST">
                        <div class="form-group">
                            <label class="form-label" for="name">Full Name</label>
                            <input  onChange={(e) => setName(e.target.value)} type="text" id="name" class={`form-input ${errors["name"] && "is-error"}`} placeholder="John Doe" />
                            {errors["name"] && <p className="form-error">{errors["name"]}</p>}
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="email">Email</label>
                            <input type="email" onChange={e => setEmail(e.target.value)} id="email" class={`form-input ${errors["email"] && "is-error"}`} placeholder="name@example.com" />
                            {errors["email"] && <p className="form-error">{errors["email"]}</p>}
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="password">Password</label>
                            <input onChange={e => setPassword(e.target.value)} type="password" id="password" class={`form-input ${errors["password"] && "is-error"}`} placeholder="Min. 6 characters" />
                            {errors["password"] && <p className="form-error">{errors["password"]}</p>}
                        </div>

                        <button type="submit" class="btn btn-primary btn-full btn-lg mt-4">Sign Up</button>
                    </form>

                    <div class="auth-footer">
                        Already have an account? <Link to={'/'}>Sign in</Link>
                    </div>
                </div>
            </div>
        </>
    )
}