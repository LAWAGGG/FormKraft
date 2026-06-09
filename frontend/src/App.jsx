import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import FormBuilder from './pages/FormBuilder'
import FormFill from './pages/FormFill'
import FormResponses from './pages/FormResponses'
import FormResult from './pages/FormResult'
import ResponseDetail from './pages/ResponseDetail'

function App() {
  return (
    <>
    <Routes>
      <Route element={<Login></Login>} path='/'></Route>
      <Route element={<Register></Register>} path='/register'></Route>
      <Route element={<Dashboard></Dashboard>} path='/dashboard'></Route>
      <Route element={<FormBuilder></FormBuilder>} path='/:slug'></Route>
      <Route element={<FormFill></FormFill>} path='/:slug/fill'></Route>
      <Route element={<FormResponses></FormResponses>} path='/:slug/responses'></Route>
      <Route element={<FormResult></FormResult>} path='/:slug/result/:id'></Route>
      <Route element={<ResponseDetail></ResponseDetail>} path='/result/:id'></Route>
    </Routes>
    </>
  )
}

export default App
