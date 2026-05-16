import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [bookData, setBookData] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [manualIsbn, setManualIsbn] = useState('');
  const [searchTitle, setSearchTitle] = useState('');

  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const scannerRef = useRef(null);

  useEffect(() => {
    // We only initialize the scanner if we are in the base "scan" state
    const shouldScan = !scanResult && !bookData && searchResults.length === 0 && !loading;
    
    if (shouldScan && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8]
        },
        false
      );

      scannerRef.current.render(onScanSuccess, () => {});
    } else if (!shouldScan && scannerRef.current) {
      stopScanner();
    }

    function onScanSuccess(decodedText) {
      stopScanner();
      setScanResult(decodedText);
      fetchByIsbn(decodedText);
    }

    // Cleanup on unmount
    return () => {
      stopScanner();
    };
  }, [scanResult, bookData, searchResults, loading]);

  function stopScanner() {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear().catch(() => {});
      } catch (e) {
        // Ignore synchronous throw if clear fails
      }
      scannerRef.current = null;
    }
  }

  function mapGoogleBook(vol, fallbackIsbn = '') {
    const info = vol?.volumeInfo || {};
    return {
      title: info.title || 'Unknown Title',
      authors: Array.isArray(info.authors) ? info.authors : ['Unknown Author'],
      cover: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
      isbn: info.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier || fallbackIsbn,
      description: info.description || '',
      pageCount: info.pageCount || 0
    };
  }

  async function fetchByIsbn(isbn) {
    setLoading(true);
    const cleanIsbn = isbn.replace(/[- ]/g, '');

    try {
      let res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
      if (res.ok) {
        let data = await res.json();
        if (data.items?.length > 0) {
          setBookData(mapGoogleBook(data.items[0], cleanIsbn));
          setLoading(false);
          return;
        }
      }

      res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&jscmd=data&format=json`);
      if (res.ok) {
        let data = await res.json();
        const olKey = `ISBN:${cleanIsbn}`;
        if (data[olKey]) {
          const book = data[olKey];
          setBookData({
            title: book.title || 'Unknown Title',
            authors: Array.isArray(book.authors) ? book.authors.map(a => a.name) : ['Unknown Author'],
            cover: book.cover?.large || book.cover?.medium || null,
            isbn: cleanIsbn,
            description: '',
            pageCount: book.number_of_pages || 0
          });
          setLoading(false);
          return;
        }
      }

      alert(`Could not find this specific edition. Try the Title Search below to find the closest match.`);
      setScanResult(null);
    } catch (err) {
      alert("Search failed.");
      setScanResult(null);
    }
    setLoading(false);
  }

  async function handleTitleSearch(e) {
    e.preventDefault();
    if (!searchTitle) return;
    
    stopScanner();
    setLoading(true);
    setSearchResults([]);

    try {
      let res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTitle)}&maxResults=8`
      );
      if (res.ok) {
        let data = await res.json();
        if (data.items?.length > 0) {
          setSearchResults(data.items.map(item => mapGoogleBook(item)));
          setLoading(false);
          return;
        }
      }

      res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchTitle)}&limit=8`);
      if (res.ok) {
        let data = await res.json();
        if (data.docs?.length > 0) {
          const mappedResults = data.docs.map(doc => ({
            title: doc.title || 'Unknown Title',
            authors: Array.isArray(doc.author_name) ? doc.author_name : ['Unknown Author'],
            cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
            isbn: Array.isArray(doc.isbn) ? doc.isbn[0] : (doc.isbn || ''),
            description: '',
            pageCount: doc.number_of_pages_median || 0
          }));
          setSearchResults(mappedResults);
          setLoading(false);
          return;
        }
      }

      alert('No books found. Try a different title or author.');
    } catch (err) {
      alert('Search failed. The databases might be temporarily down.');
    }
    setLoading(false);
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualIsbn) return;
    stopScanner();
    setScanResult(manualIsbn);
    fetchByIsbn(manualIsbn);
  }

  async function handleAddBook(category) {
    if (!bookData) return;
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'books'), {
        ...bookData,
        category,
        addedAt: new Date().toISOString()
      });
      setSuccessState(true);
    } catch (err) {
      alert("Failed to save book.");
    }
  }

  function reset() {
    stopScanner();
    setScanResult(null);
    setBookData(null);
    setSearchResults([]);
    setManualIsbn('');
    setSearchTitle('');
    setSuccessState(false);
  }

  const showScanner = !scanResult && !bookData && searchResults.length === 0 && !loading && !successState;

  return (
    <div className="scanner-container">
      {successState ? (
        <div className="success-container">
          <div className="success-icon">🎉</div>
          <h2 className="success-title">Book Added!</h2>
          <p>"{bookData?.title}" is now in your library.</p>
          
          <div className="success-actions">
            <button onClick={reset} className="primary-btn">
              Scan Another Book
            </button>
            <button onClick={() => navigate('/')} className="secondary-btn">
              Go to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="header-actions">
            <button className="link-btn" onClick={() => navigate('/')}>&larr; Back to Dashboard</button>
          </div>

          <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--primary-color)' }}>
            Add a Book
          </h2>
        </>
      )}

      {/* 
        CRITICAL FIX: We NEVER unmount the #reader div while the app is alive.
        We only hide it using CSS. This prevents html5-qrcode from crashing 
        when it tries to clean up a destroyed DOM node.
      */}
      <div className="scanner-box" style={{ display: showScanner ? 'block' : 'none' }}>
        <div id="reader" width="100%"></div>
        <div className="divider"><span>OR</span></div>
        <form onSubmit={handleManualSubmit} style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label>Lookup by ISBN</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="ISBN-10 or ISBN-13"
                value={manualIsbn}
                onChange={e => setManualIsbn(e.target.value)}
              />
              <button type="button" onClick={handleManualSubmit} className="primary-btn">Lookup</button>
            </div>
          </div>
        </form>
        <form onSubmit={handleTitleSearch}>
          <div className="form-group">
            <label>Search by Title / Author</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="e.g. Hunger Games Collins"
                value={searchTitle}
                onChange={e => setSearchTitle(e.target.value)}
              />
              <button type="submit" className="secondary-btn">Search</button>
            </div>
          </div>
        </form>
      </div>

      {loading && (
        <div className="scanner-box">
          <p style={{ textAlign: 'center', padding: '2rem' }}>Searching databases...</p>
        </div>
      )}

      {bookData && !successState && (
        <div className="result-card">
          <div className="book-preview">
            {bookData.cover
              ? <img src={bookData.cover} alt="Cover" className="book-cover-large" />
              : <div className="no-cover">No Cover</div>
            }
            <h3>{bookData.title}</h3>
            <p className="author-text">By {Array.isArray(bookData.authors) ? bookData.authors.join(', ') : 'Unknown Author'}</p>
            <div className="add-actions">
              <button onClick={() => handleAddBook('Owned')} className="primary-btn full-width">
                📚 Add to "Owned"
              </button>
              <button onClick={() => handleAddBook('TBR')} className="secondary-btn full-width" style={{ marginTop: '0.5rem' }}>
                🔖 Add to "To Be Read"
              </button>
              <button onClick={() => handleAddBook('To Buy')} className="primary-btn full-width" style={{ marginTop: '0.5rem', backgroundColor: '#ff9800' }}>
                🛒 Add to "To Buy"
              </button>
              <button onClick={reset} className="link-btn" style={{ marginTop: '1rem' }}>
                Not the right book? Go back
              </button>
            </div>
          </div>
        </div>
      )}

      {searchResults.length > 0 && !bookData && (
        <>
          <div className="header-actions">
            <button className="link-btn" onClick={reset}>&larr; New Search</button>
          </div>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--primary-color)' }}>
            Pick the Right Edition
          </h2>
          <div className="search-results-list">
            {searchResults.map((book, i) => (
              <div key={i} className="search-result-item" onClick={() => setBookData(book)}>
                {book.cover
                  ? <img src={book.cover} alt="cover" className="search-result-cover" />
                  : <div className="search-result-no-cover">No Cover</div>
                }
                <div className="search-result-info">
                  <strong>{book.title}</strong>
                  <span>{Array.isArray(book.authors) ? book.authors.join(', ') : 'Unknown Author'}</span>
                  {book.isbn && <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>ISBN: {book.isbn}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
