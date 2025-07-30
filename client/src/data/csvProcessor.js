// src/data/csvProcessor.js
import Papa from 'papaparse';

const CSV_PATHS = {
  netflix: '/csvs/netflix.csv',
  hulu: '/csvs/hulu.csv',
  prime: '/csvs/prime video.csv',
  disney: '/csvs/disney +.csv',
  paramount: '/csvs/paramount +.csv',
  max: '/csvs/max.csv'
};

export const processCsvData = async (genres, services) => {
  const genreList = genres.split(',').map(g => g.trim().toLowerCase()).filter(Boolean);
  const results = [];

  for (const service of services) {
    try {
      const response = await fetch(CSV_PATHS[service]);
      const text = await response.text();
      const { data } = Papa.parse(text, { header: true });

      data.forEach(movie => {
        if (!movie.Genre) return;

        // Parse genres from the CSV
        let movieGenres = [];
        try {
          movieGenres = JSON.parse(movie.Genre.replace(/'/g, '"'));
        } catch {
          movieGenres = movie.Genre.split(',').map(g => g.trim());
        }

        // Check genre match if genres were specified
        const genreMatch = genreList.length === 0 || 
          genreList.some(genre => 
            movieGenres.some(g => g.toLowerCase().includes(genre))
          );

        if (genreMatch) {
          results.push({
            id: `${movie.Title}-${movie.Year}-${service}`,
            title: movie.Title,
            genres: movieGenres,
            year: movie.Year,
            rating: movie['Rating (1-10)'],
            director: movie.Director,
            cast: movie.Cast ? movie.Cast.split(';').map(name => name.trim()) : [],
            duration: movie['Duration (min)'],
            description: movie.Description,
            service: service
          });
        }
      });
    } catch (error) {
      console.error(`Error loading ${service}:`, error);
    }
  }

  return results;
};

export const getAllGenres = async () => {
  const allGenres = new Set();
  const services = Object.keys(CSV_PATHS);

  for (const service of services) {
    try {
      const response = await fetch(CSV_PATHS[service]);
      const text = await response.text();
      const { data } = Papa.parse(text, { header: true });

      data.forEach(movie => {
        if (movie.Genre) {
          try {
            const genres = JSON.parse(movie.Genre.replace(/'/g, '"'));
            genres.forEach(genre => allGenres.add(genre.trim()));
          } catch {
            movie.Genre.split(',').forEach(genre => allGenres.add(genre.trim()));
          }
        }
      });
    } catch (error) {
      console.error(`Error loading ${service} genres:`, error);
    }
  }

  return Array.from(allGenres).sort();
};