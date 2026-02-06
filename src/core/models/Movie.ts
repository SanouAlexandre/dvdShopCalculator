/**
 * Represents a movie in the DVD shop
 */
export interface Movie {
  readonly title: string;
  readonly price: number;
  readonly isBackToTheFuture: boolean;
  readonly bttfEpisode?: number; // 1, 2, or 3 for Back to the Future movies
}

/**
 * Creates a Movie object from a title
 */
export function createMovie(title: string, standardPrice: number, bttfPrice: number): Movie {
  const normalizedTitle = title.trim();
  
  // More flexible pattern matching for Back to the Future
  // Accepts: "Back to the Future 1", "Back to future 2", "BTTF 1", "Retour vers le futur 1", etc.
  const bttfPatterns = [
    /^Back to the Future\s*(\d)$/i,
    /^Back to Future\s*(\d)$/i,
    /^BTTF\s*(\d)$/i,
    /^Retour vers le futur\s*(\d)$/i,
  ];

  for (const pattern of bttfPatterns) {
    const match = pattern.exec(normalizedTitle);
    if (match) {
      const episode = Number.parseInt(match[1], 10);
      if (episode >= 1 && episode <= 3) {
        return {
          title: normalizedTitle,
          price: bttfPrice,
          isBackToTheFuture: true,
          bttfEpisode: episode,
        };
      }
    }
  }

  return {
    title: normalizedTitle,
    price: standardPrice,
    isBackToTheFuture: false,
  };
}

/**
 * Type guard to check if a movie is a Back to the Future movie
 */
export function isBackToTheFutureMovie(movie: Movie): movie is Movie & { bttfEpisode: number } {
  return movie.isBackToTheFuture && movie.bttfEpisode !== undefined;
}
