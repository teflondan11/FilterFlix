import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StreamingSearch from './components/StreamingSearch';
import Login from './components/Login';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAuthenticated');
    const user = sessionStorage.getItem('currentUser');
    if (authStatus && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('currentUser');
  };

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated && (
          <nav className="navbar">
            <a href="/" className="logo">
              <span className="logo-icon">🎬</span>
              <span>FilterFlix</span>
            </a>
            <div className="user-controls">
              {currentUser && (
                <span className="username">Welcome, {currentUser.username}</span>
              )}
              <button onClick={handleLogout} className="logout-button">
                <span className="logout-icon">⎋</span>
                <span>Logout</span>
              </button>
            </div>
          </nav>
        )}
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <StreamingSearch />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;