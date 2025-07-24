import Papa from 'papaparse';

const CSV_PATHS = {
  netflix: '/csvs/netflix.csv',
  hulu: '/csvs/hulu.csv',
  prime: '/csvs/prime video.csv',
  disney: '/csvs/disney +.csv'
};

export const processCsvData = async (genreString, services) => {
  const genres = genreString
    .split(',')
    .map(g => g.trim())
    .filter(g => g);

  const results = [];

  for (const service of services) {
    try {
      const response = await fetch(CSV_PATHS[service]);
      const text = await response.text();
      const { data } = Papa.parse(text, { header: true });

      data.forEach(movie => {
        if (
          movie.Genre &&
          genres.some(genre =>
            movie.Genre.toLowerCase().includes(genre.toLowerCase())
          )
        ) {
          results.push({
            title: movie.Title,
            genre: movie.Genre,
            year: movie.Year,
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
