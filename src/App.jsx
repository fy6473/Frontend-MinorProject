import React, { useContext } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import Main from './components/Main/Main'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './Auth';
import { Context } from './context/Context';

const App = () => {
  const { user } = useContext(Context);

  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH ROUTE */}
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />

        {/* MAIN APP - Requires login */}
        <Route path="/" element={
          user ? (
            <div className="flex animate-fadeIn w-full h-screen bg-slate-50 dark:bg-slate-950">
              <Sidebar />
              <Main />
            </div>
          ) : (
            <Navigate to="/auth" />
          )
        } />

        {/* Handle 404s */}
        <Route path="*" element={user ? <Navigate to="/" /> : <Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
