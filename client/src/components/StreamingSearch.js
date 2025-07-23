// src/components/StreamingSearch.js
import React, { useState } from 'react';
import { searchMovies } from '../services/movieService';

const StreamingSearch = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const streamingServices = [
    { id: 'netflix', name: 'Netflix', color: 'bg-red-600' },
    { id: 'hulu', name: 'Hulu', color: 'bg-green-600' },
    { id: 'prime', name: 'Prime Video', color: 'bg-blue-600' },
    { id: 'disney', name: 'Disney+', color: 'bg-indigo-600' }
  ];

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
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
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-blue-600 text-3xl">🎬</span>
            <h1 className="text-3xl font-bold text-gray-900">Streaming Movie Search</h1>
          </div>

          <div className="space-y-6">
            {/* Genre Input */}
            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                Search by Genre(s)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 text-lg">🔍</span>
                <input
                  id="genre"
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g., Horror, Comedy, Sci-Fi (separate multiple with commas)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Streaming Service Checkboxes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Streaming Services
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {streamingServices.map(service => (
                  <div
                    key={service.id}
                    className={`relative rounded-lg p-4 cursor-pointer transition-all ${
                      selectedServices.includes(service.id)
                        ? `${service.color} text-white`
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => handleServiceToggle(service.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{service.name}</span>
                      {selectedServices.includes(service.id) && (
                        <span className="text-lg">✅</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Searching...' : 'Search Movies'}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Search Results ({results.length} movies found)
              </h2>
              <div className="grid gap-4">
                {results.map((movie, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{movie.title}</h3>
                        <p className="text-gray-600 mt-1">
                          <span className="font-medium">Genre:</span> {movie.genre}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Year:</span> {movie.year}
                          {movie.rating && (
                            <>
                              <span className="font-medium"> • Rating:</span> {movie.rating}
                            </>
                          )}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                        streamingServices.find(s => s.id === movie.service)?.color || 'bg-gray-600'
                      }`}>
                        {streamingServices.find(s => s.id === movie.service)?.name || movie.service}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {results.length === 0 && searchText && !isLoading && !error && (
            <div className="mt-8 text-center py-8">
              <p className="text-gray-500 text-lg">No movies found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamingSearch;