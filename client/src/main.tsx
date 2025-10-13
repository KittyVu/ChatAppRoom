import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Login from './components/Login.tsx'
import Register from './components/Register.tsx'
import Chat from './components/Chat.tsx'
import Room from './components/Room.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat/:id" element={<Chat room={parseInt(window.location.pathname.split('/').pop() || '0', 10)} />}/>
      <Route path="/room" element={<Room onSelectRoom={(roomId: number) => {window.location.href = `/chat/${roomId}`;}}/>}/>
    </Routes>
  </BrowserRouter>
)
