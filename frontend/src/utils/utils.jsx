export const BASE_URL = "http://localhost:8000/api"

export function setToken(token){
    localStorage.setItem("token", token)
}

export function removeToken(){
    localStorage.removeItem("token")
}

export function getToken(){
    return localStorage.getItem("token")
}

export function setUsn(usn){
    localStorage.setItem("usn", usn)
}

export function getUsn(){
    return localStorage.getItem("usn")
}

export function removeUsn(){
    localStorage.removeItem("usn")
}