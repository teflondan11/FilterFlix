// src/services/movieService.js
import { processCsvData } from '../data/csvProcessor';

const API_BASE_URL = 'http://localhost:3001'; // Your backend URL

/**
 * Search for movies across multiple streaming services
 * @param {string} genres - Comma-separated list of genres
 * @param {string[]} services - Array of streaming service IDs
 * @returns {Promise<Array>} Array of matching movies
 */
export const searchMovies = async (genres, services) => {
  try {
    console.log('Attempting to call backend API...');
    
    // Option 1: If you have a backend API
    const response = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        genres: genres.split(',').map(g => g.trim()),
        services: services
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Backend API response:', data);
    return data.movies || [];

  } catch (error) {
    console.log('API call failed, falling back to local CSV processing:', error.message);
    
    // Option 2: Fallback to local CSV processing
    try {
      const results = await processCsvData(genres, services);
      console.log('CSV processing completed, found:', results.length, 'movies');
      return results;
    } catch (csvError) {
      console.error('CSV processing also failed:', csvError);
      throw new Error('Both API and CSV processing failed');
    }
  }
};

/**
 * Get available streaming services
 * @returns {Promise<Array>} Array of streaming services
 */
export const getStreamingServices = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/services`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.services || [];

  } catch (error) {
    console.error('Failed to fetch services:', error);
    
    // Fallback to default services
    return [
      { id: 'netflix', name: 'Netflix' },
      { id: 'hulu', name: 'Hulu' },
      { id: 'prime', name: 'Prime Video' },
      { id: 'disney', name: 'Disney+' }
    ];
  }
};

/**
 * Upload a new CSV file for a streaming service
 * @param {string} service - Service ID
 * @param {File} file - CSV file to upload
 * @returns {Promise<Object>} Upload result
 */
export const uploadCsvFile = async (service, file) => {
  try {
    const formData = new FormData();
    formData.append('csv', file);
    formData.append('service', service);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

/**
 * Get statistics about the movie database
 * @returns {Promise<Object>} Database statistics
 */
export const getDatabaseStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Failed to fetch stats:', error);
    throw error;
  }
};