import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'cozy' : 'dark');
  };

  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <header className="header">
            <h1>TBR Tracker</h1>
            <button onClick={toggleTheme} className="theme-toggle">
              {theme === 'dark' ? '🌙 Dark Mode' : '☕ Cozy Mode'}
            </button>
          </header>
          
          <main className="main-content">
            <Routes>
              <Route 
                path="/" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/scanner" 
                element={
                  <PrivateRoute>
                    <Scanner />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
