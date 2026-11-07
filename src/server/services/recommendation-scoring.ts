import { StandardizedMovie } from './tmdb.service';

export interface RecommendationScoringInput {
  preferredGenres?: string[];
  rejectedGenres?: string[];
  mood?: string;
  activeStreamings?: string[];
  preferredYearRange?: string;
  maxDurationMinutes?: number;
}

export function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function getYearRange(range?: string): { min: number; max: number } | undefined {
  if (!range) return undefined;
  const match = range.match(/\b(19|20)\d{2}\b/g);
  if (!match || match.length === 0 || match.length > 2) return undefined;
  const years = match.map(Number).sort((a, b) => a - b);
  return { min: years[0], max: years[years.length - 1] };
}

export function scoreCompatibility(movie: StandardizedMovie, request: RecommendationScoringInput): number {
  const wantedGenres = request.preferredGenres || [];
  const rejectedGenres = (request.rejectedGenres || []).map(normalize);
  if (movie.genres.some((genre) => rejectedGenres.some((rejected) => normalize(genre).includes(rejected)))) {
    return 0;
  }

  const matchingGenres = movie.genres.filter((genre) =>
    wantedGenres.some((wanted) => normalize(genre).includes(normalize(wanted)) ||
      normalize(wanted).includes(normalize(genre))),
  ).length;
  const genreScore = wantedGenres.length
    ? Math.min(25, Math.round((matchingGenres / wantedGenres.length) * 25))
    : 12;

  const mood = normalize(request.mood || '');
  const moodGroups: Array<{ terms: string[]; genres: string[] }> = [
    { terms: ['rir', 'risada', 'divert', 'comedia', 'leve'], genres: ['comedia', 'romance'] },
    { terms: ['acao', 'adrenalina', 'intenso', 'luta'], genres: ['acao', 'aventura', 'suspense'] },
    { terms: ['suspense', 'misterio', 'tenso', 'investigacao'], genres: ['suspense', 'misterio', 'crime'] },
    { terms: ['emocion', 'drama', 'chorar', 'profundo'], genres: ['drama', 'romance'] },
    { terms: ['pensar', 'reflex', 'cerebral', 'surpreend'], genres: ['ficcao cientifica', 'misterio', 'drama'] },
    { terms: ['relax', 'tranquil', 'esquecer', 'reconfort'], genres: ['comedia', 'familia', 'romance'] },
    { terms: ['inspir', 'esperanca', 'motivar'], genres: ['drama', 'aventura', 'familia'] },
  ];
  const moodGroup = moodGroups.find((group) => group.terms.some((term) => mood.includes(term)));
  const movieGenres = movie.genres.map(normalize);
  const moodScore = !mood
    ? 8
    : moodGroup
      ? moodGroup.genres.some((genre) => movieGenres.some((item) => item.includes(genre))) ? 15 : 0
      : movieGenres.some((genre) => mood.includes(genre)) ? 15 : 5;

  const selectedProviders = request.activeStreamings || [];
  const subscriptionProviders = movie.streamings.filter((option) => option.type === 'included');
  const providerScore = selectedProviders.length
    ? subscriptionProviders.some((option) =>
        selectedProviders.some((provider) => normalize(option.provider).includes(normalize(provider)) ||
          normalize(provider).includes(normalize(option.provider))),
      ) ? 25 : 0
    : subscriptionProviders.length ? 20 : movie.streamings.length ? 10 : 0;

  const maxDuration = request.maxDurationMinutes;
  const durationScore = !maxDuration || !movie.durationMinutes
    ? 10
    : movie.durationMinutes <= maxDuration
      ? 15
      : Math.max(0, 15 - Math.ceil((movie.durationMinutes - maxDuration) / 15) * 3);

  const yearRange = getYearRange(request.preferredYearRange);
  const yearScore = !yearRange
    ? 5
    : movie.releaseYear >= yearRange.min && movie.releaseYear <= yearRange.max ? 10 : 0;

  const ratingScore = movie.metrics.tmdb > 0
    ? Math.round((Math.min(movie.metrics.tmdb, 10) / 10) * 10)
    : 0;
  return Math.min(100, genreScore + moodScore + providerScore + durationScore + yearScore + ratingScore);
}

export function containsRestrictedContent(movie: StandardizedMovie, restrictions: string[]): boolean {
  const genres = movie.genres.map(normalize);
  const metadata = normalize(`${movie.title} ${movie.synopsis}`);
  const certification = movie.ageRating.trim().toLowerCase();
  return restrictions.some((restriction) => {
    const key = normalize(restriction);
    if (key === 'terror') return genres.some((genre) => genre.includes('terror'));
    if (key === 'violencia') {
      return ['violencia', 'violento', 'assassinato', 'assassino', 'massacre', 'sangue', 'gore']
        .some((term) => metadata.includes(term));
    }
    if (key === 'conteudo adulto') {
      const age = Number(certification.match(/\d+/)?.[0]);
      return (Number.isFinite(age) && age >= 16) ||
        ['sexual', 'nudity', 'nudez', 'erotico', 'pornograf'].some((term) => metadata.includes(term));
    }
    return false;
  });
}

export function isFamilyFriendly(movie: StandardizedMovie): boolean {
  const certification = movie.ageRating.trim().toLowerCase();
  const age = Number(certification.match(/\d+/)?.[0]);
  return certification === 'l' || certification === 'livre' || certification === '0' ||
    (Number.isFinite(age) && age <= 10);
}
