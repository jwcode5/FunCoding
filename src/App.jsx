import { useState, useEffect } from 'react'

function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'cozy' : 'dark');
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>TBR Tracker</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'dark' ? '🌙 Dark Mode' : '☕ Cozy Mode'}
        </button>
      </header>
      
      <main className="main-content">
        <section className="welcome-section">
          <h2>Welcome to your Library</h2>
          <p>This app helps you track the books you own and the ones you want to read.</p>
          <div className="actions">
            <button className="primary-btn">Scan Barcode</button>
            <button className="secondary-btn">Search Books</button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
