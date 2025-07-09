// src/data/csvProcessor.js
import Papa from 'papaparse';

// Updated CSV file paths to match your actual structure
const CSV_PATHS = {
  netflix: '/csvs/netflix.csv',
  hulu: '/csvs/hulu.csv',
  prime: '/csvs/prime.csv',
  disney: '/csvs/disney.csv'
};

/**
 * Load and parse a CSV file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} Parsed CSV data
 */
const loadCsvFile = async (filePath) => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
    }
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: (result) => {
          if (result.errors.length > 0) {
            console.warn('CSV parsing warnings:', result.errors);
          }
          resolve(result.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Failed to load CSV file ${filePath}:`, error);
    return [];
  }
};

/**
 * Search for movies in a specific CSV dataset
 * @param {Array} csvData - Parsed CSV data
 * @param {string[]} genres - Array of genres to search for
 * @param {string} service - Service name for result labeling
 * @returns {Array} Matching movies
 */
const searchInCsvData = (csvData, genres, service) => {
  const results = [];
  
  csvData.forEach(row => {
    // Handle different possible column names for genres
    const genreColumn = row.genre || row.genres || row.category || row.categories || '';
    const titleColumn = row.title || row.name || row.movie || row.show || '';
    
    if (!genreColumn || !titleColumn) return;
    
    const movieGenres = genreColumn.toString().toLowerCase().split(',').map(g => g.trim());
    
    // Check if any search genre matches any movie genre
    const hasMatchingGenre = genres.some(searchGenre => 
      movieGenres.some(movieGenre => 
        movieGenre.includes(searchGenre.toLowerCase()) || 
        searchGenre.toLowerCase().includes(movieGenre)
      )
    );
    
    if (hasMatchingGenre) {
      results.push({
        title: titleColumn,
        genre: genreColumn,
        year: row.year || row.release_year || row.date || '',
        rating: row.rating || row.mpaa_rating || row.content_rating || '',
        service: service,
        // Include any additional columns that might be useful
        director: row.director || '',
        cast: row.cast || row.actors || '',
        description: row.description || row.summary || '',
        duration: row.duration || row.runtime || ''
      });
    }
  });
  
  return results;
};

/**
 * Process CSV data for multiple streaming services
 * @param {string} genreString - Comma-separated genres
 * @param {string[]} services - Array of service IDs
 * @returns {Promise<Array>} Combined search results
 */
export const processCsvData = async (genreString, services) => {
  const genres = genreString.split(',').map(g => g.trim()).filter(g => g);
  const allResults = [];
  
  console.log(`Processing CSV data for genres: ${genres.join(', ')} in services: ${services.join(', ')}`);
  
  // Process each selected service
  for (const service of services) {
    const csvPath = CSV_PATHS[service];
    
    if (!csvPath) {
      console.warn(`No CSV path configured for service: ${service}`);
      continue;
    }
    
    try {
      console.log(`Loading CSV file: ${csvPath}`);
      const csvData = await loadCsvFile(csvPath);
      console.log(`Loaded ${csvData.length} rows from ${service}`);
      
      const serviceResults = searchInCsvData(csvData, genres, service);
      console.log(`Found ${serviceResults.length} matches in ${service}`);
      
      allResults.push(...serviceResults);
    } catch (error) {
      console.error(`Error processing ${service} CSV:`, error);
    }
  }
  
  // Remove duplicates based on title and service
  const uniqueResults = allResults.filter((movie, index, self) => 
    index === self.findIndex(m => m.title === movie.title && m.service === movie.service)
  );
  
  console.log(`Total unique results: ${uniqueResults.length}`);
  
  // Sort by title for consistent ordering
  return uniqueResults.sort((a, b) => a.title.localeCompare(b.title));
};

/**
 * Get sample data structure for CSV files
 * @returns {Object} Expected CSV structure
 */
export const getCsvStructure = () => {
  return {
    requiredColumns: ['title', 'genre'],
    optionalColumns: ['year', 'rating', 'director', 'cast', 'description', 'duration'],
    exampleRow: {
      title: 'The Conjuring',
      genre: 'Horror, Thriller',
      year: 2013,
      rating: 'R',
      director: 'James Wan',
      cast: 'Patrick Wilson, Vera Farmiga',
      description: 'Paranormal investigators help a family...',
      duration: '112 min'
    }
  };
};