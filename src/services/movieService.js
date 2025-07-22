// src/services/movieService.js
import { processCsvData } from '../data/csvProcessor';

/**
 * Search for movies across multiple streaming services
 * @param {string} genres - Comma-separated list of genres
 * @param {string[]} services - Array of streaming service IDs
 * @returns {Promise<Array>} Array of matching movies
 */
export const searchMovies = async (genres, services) => {
  try {
    console.log('Processing search locally with CSV data...');
    
    const results = await processCsvData(genres, services);
    console.log('CSV processing completed, found:', results.length, 'movies');
    return results;
  } catch (error) {
    console.error('CSV processing failed:', error);
    throw new Error('Movie search failed');
  }
};

/**
 * Get available streaming services
 * @returns {Promise<Array>} Array of streaming services
 */
export const getStreamingServices = async () => {
  // Return hardcoded streaming services - no API call needed
  return [
    { id: 'netflix', name: 'Netflix' },
    { id: 'hulu', name: 'Hulu' },
    { id: 'prime', name: 'Prime Video' },
    { id: 'disney', name: 'Disney+' },
    { id: 'hbo', name: 'HBO Max' },
    { id: 'paramount', name: 'Paramount+' },
    { id: 'apple', name: 'Apple TV+' },
    { id: 'peacock', name: 'Peacock' }
  ];
};

/**
 * Upload a new CSV file for a streaming service (local processing)
 * @param {string} service - Service ID
 * @param {File} file - CSV file to upload
 * @returns {Promise<Object>} Upload result
 */
export const uploadCsvFile = async (service, file) => {
  try {
    console.log(`Processing CSV file locally for ${service}...`);
    
    // Read the file content
    const text = await file.text();
    
    // You can add logic here to parse and store the CSV data locally
    // For now, just return a success message
    return {
      success: true,
      message: `CSV file for ${service} processed successfully`,
      service: service,
      filename: file.name,
      size: file.size
    };
  } catch (error) {
    console.error('Local CSV processing failed:', error);
    throw new Error('CSV file processing failed');
  }
};

/**
 * Get statistics about the movie database (from local data)
 * @returns {Promise<Object>} Database statistics
 */
export const getDatabaseStats = async () => {
  try {
    // You can implement this to analyze your local CSV data
    // For now, return mock statistics
    return {
      totalMovies: 0, // You can calculate this from your CSV data
      totalServices: 8,
      lastUpdated: new Date().toISOString(),
      genreBreakdown: {
        'Action': 0,
        'Comedy': 0,
        'Drama': 0,
        'Horror': 0,
        'Sci-Fi': 0
      }
    };
  } catch (error) {
    console.error('Failed to generate stats:', error);
    throw new Error('Statistics generation failed');
  }
};