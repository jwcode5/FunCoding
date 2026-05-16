import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'users', currentUser.uid, 'books'),
      orderBy('addedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBooks(booksData);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Failed to log out", err);
    }
  }

  async function handleDeleteBook(bookId) {
    if (!window.confirm("Are you sure you want to remove this book from your library?")) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'books', bookId));
    } catch (err) {
      console.error("Failed to delete book", err);
      alert("Failed to delete book.");
    }
  }

  const filteredBooks = filter === 'All' 
    ? books 
    : books.filter(b => b.category === filter);

  return (
    <section className="dashboard-section">
      <div className="dashboard-header">
        <div>
          <h2>My Library</h2>
          <p>Welcome back, {currentUser?.email}</p>
        </div>
        <div className="dashboard-actions">
          <button className="primary-btn" onClick={() => navigate('/scanner')}>
            📷 Scan Barcode
          </button>
          <button onClick={handleLogout} className="link-btn logout-btn">
            Log Out
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        {['All', 'Owned', 'TBR', 'To Buy'].map(cat => (
          <button 
            key={cat} 
            className={`tab-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">Loading your library...</div>
      ) : filteredBooks.length === 0 ? (
        <div className="empty-state">
          <p>No books found in this category.</p>
          {filter === 'All' && (
            <button className="secondary-btn" onClick={() => navigate('/scanner')} style={{ marginTop: '1rem' }}>
              Add Your First Book
            </button>
          )}
        </div>
      ) : (
        <div className="book-grid">
          {filteredBooks.map(book => (
            <div key={book.id} className="book-card">
              {book.cover ? (
                <img src={book.cover} alt={book.title} className="book-card-cover" />
              ) : (
                <div className="book-card-no-cover">No Cover</div>
              )}
              <div className="book-card-info">
                <h4>{book.title}</h4>
                <p className="book-author">{book.authors?.join(', ')}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span className={`category-badge ${book.category.toLowerCase().replace(' ', '-')}`}>
                    {book.category}
                  </span>
                  <button onClick={() => handleDeleteBook(book.id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
