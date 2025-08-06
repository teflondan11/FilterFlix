// src/services/movieService.js
import { processCsvData, getAllGenres } from '../data/csvProcessor';

class MovieService {
  constructor() {
    this.cache = {
      movies: null,
      lastUpdated: null,
      genres: null
    };
    this.services = {
      netflix: { id: 'netflix', name: 'Netflix' },
      hulu: { id: 'hulu', name: 'Hulu' },
      prime: { id: 'prime', name: 'Prime Video' },
      disney: { id: 'disney', name: 'Disney+' },
      paramount: { id: 'paramount', name: 'Paramount+' },
      max: { id: 'max', name: 'Max' }
    };
  }

  async initialize() {
    try {
      await this.refreshCache();
    } catch (error) {
      console.error('Initial cache load failed:', error);
    }
  }

  async refreshCache() {
    const allMovies = [];
    const services = Object.keys(this.services);
    
    for (const service of services) {
      try {
        const serviceMovies = await processCsvData('', [service]);
        allMovies.push(...serviceMovies);
      } catch (error) {
        console.error(`Failed to load ${service} movies:`, error);
      }
    }

    this.cache = {
      movies: allMovies,
      lastUpdated: new Date(),
      genres: await getAllGenres()
    };
  }

  async search({ genres = '', title = '', services = [], minRating = 0, minDuration = '' }) {
    if (!this.cache.movies) {
      await this.initialize();
    }

    const genreList = genres.split(',').map(g => g.trim().toLowerCase()).filter(Boolean);
    const titleQuery = title.trim().toLowerCase();
    const serviceIds = services.length ? services : Object.keys(this.services);
    const durationFilter = minDuration ? parseInt(minDuration) : null;

    return this.cache.movies.filter(movie => {
      // Filter by service (required)
      if (!serviceIds.includes(movie.service)) {
        return false;
      }

      // Filter by genre if genres were specified
      if (genreList.length > 0 && !genreList.some(genre => 
        movie.genres.some(g => g.toLowerCase().includes(genre)))
      ) {
        return false;
      }

      // Filter by title if title was specified
      if (titleQuery && !movie.title.toLowerCase().includes(titleQuery)) {
        return false;
      }

      // Filter by maximum rating (shows movies with rating <= selected)
      if (minRating > 0 && (!movie.rating || movie.rating > minRating)) {
        return false;
      }

      // Filter by minimum duration
      if (durationFilter && (!movie.duration || movie.duration < durationFilter)) {
        return false;
      }

      return true;
    });
  }

  getAvailableServices() {
    return Object.values(this.services);
  }

  getAvailableGenres() {
    return this.cache.genres || [];
  }

  async getStatistics() {
    if (!this.cache.movies) {
      await this.initialize();
    }

    const stats = {
      totalMovies: this.cache.movies.length,
      totalServices: Object.keys(this.services).length,
      lastUpdated: this.cache.lastUpdated.toISOString(),
      genreBreakdown: this.cache.genres.reduce((acc, genre) => {
        acc[genre] = this.cache.movies.filter(m => 
          m.genres.includes(genre)).length;
        return acc;
      }, {})
    };

    return stats;
  }

  // Singleton pattern
  static instance = null;
  static getInstance() {
    if (!MovieService.instance) {
      MovieService.instance = new MovieService();
      MovieService.instance.initialize(); // Initialize on first access
    }
    return MovieService.instance;
  }
}

// Export singleton instance
const movieService = MovieService.getInstance();
export default movieService;