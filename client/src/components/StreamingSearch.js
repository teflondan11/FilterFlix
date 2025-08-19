import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import movieService from '../services/movieService';
import { updateFavorites, getUserFavorites } from '../services/authService';
import AboutTab from './AboutTab';
import './StreamingSearch.css';

const StreamingSearch = () => {
  const [searchText, setSearchText] = useState('');
  const [titleSearch, setTitleSearch] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [allGenres, setAllGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [showGenreTooltip, setShowGenreTooltip] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [minDuration, setMinDuration] = useState('');
  const [showDim, setShowDim] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.style.setProperty('--dark', '#ffffff');
      document.documentElement.style.setProperty('--light', '#000000');
      document.documentElement.style.setProperty('--card-bg', '#1a1a1a');
      document.documentElement.style.setProperty('--text', '#ffffff');
      document.documentElement.style.setProperty('--border', '#333333');
      document.documentElement.style.setProperty('--background', '#000000');
      document.documentElement.style.setProperty('--content-bg', '#1a1a1a');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.style.setProperty('--dark', '#2d3436');
      document.documentElement.style.setProperty('--light', '#f5f6fa');
      document.documentElement.style.setProperty('--card-bg', '#ffffff');
      document.documentElement.style.setProperty('--text', '#2d3436');
      document.documentElement.style.setProperty('--border', '#dfe6e9');
      document.documentElement.style.setProperty('--background', '#f8f9fa');
      document.documentElement.style.setProperty('--content-bg', '#ffffff');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const user = sessionStorage.getItem('currentUser');
    if (user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      if (!parsedUser.isGuest) {
        loadFavorites(parsedUser.username);
      }
    }
    loadAllGenres();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const loadAllGenres = async () => {
    setLoadingGenres(true);
    try {
      const genres = await movieService.getAvailableGenres();
      if (genres && genres.length > 0) {
        setAllGenres(genres);
      } else {
        setAllGenres(['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi']);
      }
    } catch (error) {
      console.error('Failed to load genres:', error);
      setAllGenres(['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi']);
    } finally {
      setLoadingGenres(false);
    }
  };

  const handleFirstInteraction = () => {
    setShowDim(false);
  };

  const handleSelectAllServices = () => {
    setSelectedServices(prev => 
      prev.length === movieService.getAvailableServices().length 
        ? [] 
        : movieService.getAvailableServices().map(service => service.id)
    );
  };

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
    if (currentUser.isGuest) {
      setError('Guest users cannot save favorites. Please create an account.');
      return;
    }

    try {
      const isFavorite = favorites.some(fav => fav.id === movie.id);
      await updateFavorites(currentUser.username, movie, isFavorite ? 'remove' : 'add');
      await loadFavorites(currentUser.username);
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadFavorites = () => {
    if (favorites.length === 0) {
      setError('No favorites to download');
      return;
    }

    let fileContent = 'My Favorite Movies\n\n';
    
    favorites.forEach((movie, index) => {
      fileContent += `#${index + 1}\n`;
      fileContent += `Title: ${movie.title}\n`;
      fileContent += `Year: ${movie.year}\n`;
      fileContent += `Service: ${movieService.getAvailableServices().find(s => s.id === movie.service)?.name || movie.service}\n`;
      if (movie.rating) fileContent += `Rating: ${movie.rating}/10\n`;
      if (movie.duration) fileContent += `Duration: ${movie.duration} min\n`;
      if (movie.genres) fileContent += `Genres: ${movie.genres.join(', ')}\n`;
      if (movie.director) fileContent += `Director: ${movie.director}\n`;
      if (movie.cast) fileContent += `Cast: ${movie.cast.join(', ')}\n`;
      if (movie.description) fileContent += `Description: ${movie.description}\n`;
      fileContent += '\n';
    });

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_favorite_movies.txt';
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      setError('Please select at least one streaming service');
      return;
    }

    if (!searchText.trim() && !titleSearch.trim() && minRating === 0 && !minDuration) {
      setError('Please fill in at least one search filter');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const searchResults = await movieService.search({
        genres: searchText,
        title: titleSearch,
        services: selectedServices,
        minRating: minRating,
        minDuration: minDuration
      });
      setResults(searchResults);
      setShowFavorites(false);
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingSelect = (rating) => {
    setMinRating(rating === minRating ? 0 : rating);
  };

  const handleDurationChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setMinDuration(value);
    }
  };

  const renderRatingStars = () => {
    return (
      <div className="rating-filter">
        <label className="form-label" style={{ color: darkMode ? '#fff' : 'var(--dark)' }}>
          Maximum Rating
        </label>
        <div className="stars-container">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
            <span
              key={star}
              className={`star ${star <= minRating ? 'selected' : ''} ${
                star <= hoveredStar ? 'highlighted' : ''
              }`}
              onClick={() => handleRatingSelect(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              style={{ color: darkMode ? '#9c88ff' : '#ffd700' }}
            >
              ⭐
            </span>
          ))}
          {minRating > 0 && (
            <button 
              className="clear-rating"
              onClick={() => setMinRating(0)}
              style={{
                backgroundColor: darkMode ? 'transparent' : 'transparent',
                color: darkMode ? '#fff' : 'var(--dark)',
                border: darkMode ? '1px solid #fff' : 'none'
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderDurationFilter = () => (
    <div className="duration-filter">
      <label className="form-label" style={{ color: darkMode ? '#fff' : 'var(--dark)' }}>
        ⏱️ Minimum Duration (mins)
      </label>
      <input
        type="number"
        min="1"
        value={minDuration}
        onChange={handleDurationChange}
        placeholder="e.g., 80"
        className="duration-input"
        style={{
          backgroundColor: darkMode ? 'var(--card-bg)' : '#fff',
          color: darkMode ? '#fff' : '#000',
          border: darkMode ? '1px solid #333' : '1px solid #dfe6e9'
        }}
      />
    </div>
  );

  const renderFiltersRow = () => (
    <div className="filter-row">
      {renderDurationFilter()}
      {renderRatingStars()}
    </div>
  );

  const MovieCard = ({ movie, isFavorite, onToggleFavorite }) => {
    const service = movieService.getAvailableServices().find(s => s.id === movie.service);
    return (
      <div 
        className="movie-card"
        style={{
          backgroundColor: darkMode ? 'var(--card-bg)' : '#fff',
          color: darkMode ? '#fff' : '#000',
          border: darkMode ? '1px solid #333' : '1px solid #dfe6e9'
        }}
      >
        <div className="movie-card-content">
          <div className="movie-info">
            <h3 className="movie-title">{movie.title}</h3>
            <p className="movie-meta">
              <span className="movie-year">{movie.year}</span>
              {movie.rating && (
                <span className="movie-rating">⭐ {movie.rating}/10</span>
              )}
              {movie.duration && (
                <span className="movie-duration">⏱️ {movie.duration} min</span>
              )}
            </p>
            {movie.genres && (
              <div className="movie-genres">
                {movie.genres.map((genre, index) => (
                  <span 
                    key={index} 
                    className="genre-tag"
                    style={{
                      backgroundColor: darkMode ? '#333' : '#dfe6e9',
                      color: darkMode ? '#fff' : '#000'
                    }}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
            {movie.director && (
              <p className="movie-director">Director: {movie.director}</p>
            )}
            {movie.cast && movie.cast.length > 0 && (
              <p className="movie-cast">
                Cast: {movie.cast.slice(0, 3).join(', ')}
                {movie.cast.length > 3 ? '...' : ''}
              </p>
            )}
            {movie.description && (
              <p className="movie-description">{movie.description}</p>
            )}
          </div>
          <div className="movie-actions">
            <div className={`service-tag ${service?.id || 'default'}`}>
              {service?.name || movie.service}
            </div>
            {!currentUser?.isGuest && (
              <button 
                onClick={() => onToggleFavorite(movie)}
                className="favorite-button"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                style={{
                  color: isFavorite ? 'red' : (darkMode ? '#fff' : '#000')
                }}
              >
                {isFavorite ? '❤️' : '🤍'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="streaming-search-container"
      style={{ backgroundColor: darkMode ? '#000' : 'var(--light)' }}
    >
      {showDim && <div className="screen-dim" />}
      
      <div className="search-content">
        <div 
          className="search-header"
          style={{ backgroundColor: darkMode ? '#000' : 'var(--background)' }}
        >
          <AboutTab 
            username={currentUser?.username}
            onFirstInteraction={handleFirstInteraction}
            darkMode={darkMode}
          />
          
          <button 
            onClick={toggleDarkMode}
            className="dark-mode-toggle"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              backgroundColor: darkMode ? '#000' : 'transparent',
              color: darkMode ? '#fff' : '#000',
              border: darkMode ? '1px solid #fff' : '1px solid #000'
            }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          {currentUser?.isGuest && (
            <p className="guest-notice" style={{ color: darkMode ? '#fff' : 'var(--dark-light)' }}>
              You are browsing as a guest. Sign up to save favorites.
            </p>
          )}
          {currentUser && (
            <span className="username" style={{ color: darkMode ? '#fff' : 'var(--dark)' }}>
              Welcome, {currentUser.username}
            </span>
          )}
        </div>

        {!showFavorites && (
          <div 
            className="search-form"
            style={{
              backgroundColor: darkMode ? 'var(--content-bg)' : '#fff',
              color: darkMode ? '#fff' : '#000',
              border: darkMode ? '1px solid #333' : '1px solid #dfe6e9'
            }}
          >
            <div className="form-group">
              <div className="form-label-container">
                <label htmlFor="genre" className="form-label" style={{ color: darkMode ? '#fff' : 'var(--dark)' }}>
                  Search by Genre(s)
                </label>
                <div className="info-tooltip" 
                  style={{ position: 'relative', zIndex: 1000 }}
                  onMouseEnter={() => setShowGenreTooltip(true)}
                  onMouseLeave={() => setShowGenreTooltip(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGenreTooltip(!showGenreTooltip);
                  }}
                >
                  ℹ️
                  {showGenreTooltip && (
                    <div 
                      className="genre-tooltip"
                      style={{
                        backgroundColor: darkMode ? 'var(--card-bg)' : '#fff',
                        color: darkMode ? '#fff' : '#000',
                        border: darkMode ? '1px solid #333' : '1px solid #dfe6e9'
                      }}
                    >
                      <div className="tooltip-header">
                        {loadingGenres ? 'Loading genres...' : `Available Genres (${allGenres.length})`}
                      </div>
                      <div className="genre-list">
                        {allGenres.map((genre, index) => (
                          <React.Fragment key={genre}>
                            <span 
                              className="genre-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchText(prev => 
                                  prev ? `${prev}, ${genre}` : genre
                                );
                                setShowGenreTooltip(false);
                              }}
                              style={{ color: darkMode ? '#fff' : '#000' }}
                            >
                              {genre}
                            </span>
                            {index < allGenres.length - 1 && (
                              <span className="genre-separator">, </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="input-wrapper">
                <span className="input-icon">🔍</span>
                <input
                  id="genre"
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g., Horror, Comedy"
                  className="search-input"
                  style={{
                    backgroundColor: darkMode ? 'var(--card-bg)' : '#fff',
                    color: darkMode ? '#fff' : '#000',
                    border: darkMode ? '1px solid #333' : '1px solid #dfe6e9'
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="title-search-container">
                <label htmlFor="title" className="form-label" style={{ color: darkMode ? '#fff' : 'var(--dark)' }}>
                  Search by Movie Title
                </label>
                <div className="select-all-container">
                  <input
                    type="checkbox"
                    id="select-all-services"
                    checked={selectedServices.length === movieService.getAvailableServices().length}
                    onChange={handleSelectAllServices}
                  />
                  <label 
                    htmlFor="select-all-services"
                    style={{ color: darkMode ? '#fff' : 'var(--dark)' }}
                  >
                    All Services
                  </label>
                </div>
              </div>
              <div className="input-wrapper">
                <span className="input-icon">🎬</span>
                <input
                  id="title"
                  type="text"
                  value={titleSearch}
                  onChange={(e) => setTitleSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="ex: Ford v. Ferrari..."
                  className="search-input"
                  style={{
                    backgroundColor: darkMode ? 'var(--card-bg)' : '#fff',
                    color: darkMode ? '#fff' : '#000',
                    border: darkMode ? '1px solid #333' : '1px solid #dfe6e9'
                  }}
                />
              </div>
            </div>

            {renderFiltersRow()}

            <div className="services-group">
              <label className="form-label" style={{ color: darkMode ? '#fff' : 'var(--dark)' }}>
                Select Streaming Services
              </label>
              <div className="services-grid">
                {movieService.getAvailableServices().map(service => (
                  <div
                    key={service.id}
                    className={`service-option ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                    onClick={() => handleServiceToggle(service.id)}
                    style={{
                      backgroundColor: selectedServices.includes(service.id) 
                        ? service.color 
                        : darkMode ? 'var(--card-bg)' : '#fff',
                      color: selectedServices.includes(service.id) 
                        ? '#fff' 
                        : darkMode ? '#fff' : '#000',
                      border: darkMode ? '1px solid #333' : '1px solid #dfe6e9'
                    }}
                  >
                    <div className="service-option-content">
                      <span className="service-name">{service.name}</span>
                      {selectedServices.includes(service.id) && (
                        <span className="checkmark">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div 
                className="error-message"
                style={{ color: darkMode ? '#ff6b6b' : '#d63031' }}
              >
                {error}
              </div>
            )}

            <div className="search-button-container">
              <button
                onClick={handleSubmit}
                disabled={isLoading || selectedServices.length === 0}
                className="search-button"
                style={{
                  backgroundColor: isLoading || selectedServices.length === 0 
                    ? (darkMode ? '#333' : '#b2bec3') 
                    : darkMode ? '#000' : 'var(--primary)',
                  color: '#fff',
                  border: darkMode ? '1px solid #fff' : 'none'
                }}
              >
                {isLoading ? 'Searching...' : 'Search Movies'}
              </button>
            </div>
          </div>
        )}

        {!currentUser?.isGuest && (
          <div className="favorites-controls">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="favorites-toggle-button"
              style={{
                backgroundColor: darkMode ? '#000' : 'var(--accent)',
                color: '#fff',
                border: darkMode ? '1px solid #fff' : 'none'
              }}
            >
              {showFavorites ? 'Back to Search' : 'View My Favorites'}
            </button>
            {showFavorites && favorites.length > 0 && (
              <button
                onClick={downloadFavorites}
                className="download-favorites-button"
                style={{
                  backgroundColor: darkMode ? '#000' : '#4CAF50',
                  color: '#fff',
                  border: darkMode ? '1px solid #fff' : 'none'
                }}
              >
                Download Favorites
              </button>
            )}
          </div>
        )}

        {showFavorites ? (
          <div className="favorites-view">
            <h2 className="section-title" style={{ color: darkMode ? '#fff' : 'var(--dark)' }}>
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
              <div 
                className="empty-state"
                style={{
                  backgroundColor: darkMode ? 'var(--content-bg)' : '#fff',
                  color: darkMode ? '#fff' : '#000',
                  border: darkMode ? '1px solid #333' : '1px solid #dfe6e9'
                }}
              >
                <p className="empty-message">You haven't saved any favorites yet.</p>
              </div>
            )}
          </div>
        ) : (
          results.length > 0 && (
            <div className="results-view">
              <h2 className="section-title" style={{ color: darkMode ? '#fff' : 'var(--dark)' }}>
                Search Results ({results.length})
              </h2>
              <div className="results-grid">
                {results.map((movie, index) => (
                  <MovieCard 
                    key={index} 
                    movie={movie} 
                    isFavorite={favorites.some(fav => fav.id === movie.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </div>
          )
        )}

        {results.length === 0 && (searchText || titleSearch || minRating > 0 || minDuration) && !isLoading && !error && !showFavorites && (
          <div 
            className="empty-state"
            style={{
              backgroundColor: darkMode ? 'var(--content-bg)' : '#fff',
              color: darkMode ? '#fff' : '#000',
              border: darkMode ? '1px solid #333' : '1px solid #dfe6e9'
            }}
          >
            <p className="empty-message">No movies found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamingSearch;