import React, { useState, useEffect } from 'react';
import { searchMovies } from '../services/movieService';
import { updateFavorites, getUserFavorites } from '../services/authService';
import './StreamingSearch.css';

const StreamingSearch = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const streamingServices = [
    { id: 'netflix', name: 'Netflix' },
    { id: 'hulu', name: 'Hulu' },
    { id: 'prime', name: 'Prime Video' },
    { id: 'disney', name: 'Disney+' }
  ];

  useEffect(() => {
    const user = sessionStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
      loadFavorites(JSON.parse(user).username);
    }
  }, []);

  const loadFavorites = async (username) => {
    try {
      const { favorites: userFavorites } = await getUserFavorites(username);
      setFavorites(userFavorites || []);
    } catch (err) {
      console.error('Failed to load favorites:', err);
      setError('Failed to load favorites');
    }
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const toggleFavorite = async (movie) => {
    if (!currentUser) {
      setError('Please login to save favorites');
      return;
    }

    try {
      const movieId = movie.id || `${movie.title}-${movie.year}-${movie.service}`;
      const isFavorite = favorites.some(fav => fav.id === movieId);
      const action = isFavorite ? 'remove' : 'add';
      
      await updateFavorites(currentUser.username, movie, action);
      await loadFavorites(currentUser.username);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async () => {
    if (!searchText.trim()) {
      setError('Please enter a genre to search for');
      return;
    }

    if (selectedServices.length === 0) {
      setError('Please select at least one streaming service');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const searchResults = await searchMovies(searchText, selectedServices);
      setResults(searchResults);
      setShowFavorites(false);
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const MovieCard = ({ movie, isFavorite, onToggleFavorite }) => {
    const service = streamingServices.find(s => s.id === movie.service);
    return (
      <div className="movie-card">
        <div className="movie-card-content">
          <div className="movie-info">
            <h3 className="movie-title">{movie.title}</h3>
            <p className="movie-genre">Genre: {movie.genre}</p>
            <p className="movie-year">Year: {movie.year}</p>
            {movie.rating && (
              <p className="movie-rating">Rating: {movie.rating}</p>
            )}
          </div>
          <div className="movie-actions">
            <div className={`service-tag ${service?.id || 'default'}`}>
              {service?.name || movie.service}
            </div>
            <button 
              onClick={() => onToggleFavorite(movie)}
              className="favorite-button"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="streaming-search-container">
      <div className="search-content">
        <div className="search-header">
          <span className="header-icon">🎬</span>
          <h1 className="header-title">Streaming Movie Search</h1>
        </div>

        {!showFavorites && (
          <div className="search-form">
            <div className="form-group">
              <label htmlFor="genre" className="form-label">
                Search by Genre(s)
              </label>
              <div className="input-wrapper">
                <span className="input-icon">🔍</span>
                <input
                  id="genre"
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g., Horror, Comedy, Sci-Fi"
                  className="search-input"
                />
              </div>
            </div>

            <div className="services-group">
              <label className="form-label">
                Select Streaming Services
              </label>
              <div className="services-grid">
                {streamingServices.map(service => (
                  <div
                    key={service.id}
                    className={`service-option ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                    onClick={() => handleServiceToggle(service.id)}
                  >
                    <div className="service-option-content">
                      <span className="service-name">{service.name}</span>
                      {selectedServices.includes(service.id) && (
                        <span className="checkmark">✅</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="search-button"
            >
              {isLoading ? 'Searching...' : 'Search Movies'}
            </button>
          </div>
        )}

        <button
          onClick={() => setShowFavorites(!showFavorites)}
          className="favorites-toggle-button"
        >
          {showFavorites ? 'Back to Search' : 'View My Favorites'}
        </button>

        {showFavorites ? (
          <div className="favorites-view">
            <h2 className="section-title">
              My Favorites ({favorites.length})
            </h2>
            {favorites.length > 0 ? (
              <div className="results-grid">
                {favorites.map((movie, index) => (
                  <MovieCard 
                    key={index} 
                    movie={movie} 
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p className="empty-message">You haven't saved any favorites yet.</p>
              </div>
            )}
          </div>
        ) : (
          results.length > 0 && (
            <div className="results-view">
              <h2 className="section-title">
                Search Results ({results.length})
              </h2>
              <div className="results-grid">
                {results.map((movie, index) => {
                  const movieId = movie.id || `${movie.title}-${movie.year}-${movie.service}`;
                  return (
                    <MovieCard 
                      key={index} 
                      movie={movie} 
                      isFavorite={favorites.some(fav => fav.id === movieId)}
                      onToggleFavorite={toggleFavorite}
                    />
                  );
                })}
              </div>
            </div>
          )
        )}

        {results.length === 0 && searchText && !isLoading && !error && !showFavorites && (
          <div className="empty-state">
            <p className="empty-message">No movies found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamingSearch;