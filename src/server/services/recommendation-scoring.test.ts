import assert from 'node:assert/strict';
import test from 'node:test';
import { StandardizedMovie } from './tmdb.service';
import {
  containsRestrictedContent,
  isFamilyFriendly,
  scoreCompatibility,
} from './recommendation-scoring';

function movie(overrides: Partial<StandardizedMovie> = {}): StandardizedMovie {
  return {
    id: 'tmdb-1',
    tmdbId: 1,
    mediaType: 'movie',
    title: 'Filme de teste',
    tagline: '',
    director: '',
    releaseYear: 2020,
    durationMinutes: 100,
    ageRating: '10',
    qualityBadge: '',
    matchScore: 0,
    genres: ['Comédia'],
    posterUrl: '',
    backdropUrl: '',
    synopsis: 'Uma história divertida.',
    aiMatchReason: '',
    matchHighlights: [],
    metrics: { tmdb: 8, voteCount: 100 },
    streamings: [{
      provider: 'Netflix',
      logoText: 'N',
      badgeColor: '#000',
      quality: '',
      type: 'included',
      audioInfo: '',
    }],
    cast: [],
    similarMovieIds: [],
    voteCount: 100,
    ...overrides,
  };
}

test('scores genre, mood, provider, duration, year, and rating compatibility', () => {
  const score = scoreCompatibility(movie(), {
    preferredGenres: ['Comédia'],
    mood: 'leve e divertido',
    activeStreamings: ['Netflix'],
    maxDurationMinutes: 110,
    preferredYearRange: '2019-2021',
  });

  assert.equal(score, 98);
});

test('rejects a title matching an excluded genre', () => {
  assert.equal(scoreCompatibility(movie(), { rejectedGenres: ['comedia'] }), 0);
});

test('content restrictions use available genre, synopsis, and rating metadata', () => {
  assert.equal(containsRestrictedContent(movie({ genres: ['Terror'] }), ['Terror']), true);
  assert.equal(containsRestrictedContent(movie({ synopsis: 'Contém violência intensa.' }), ['Violência']), true);
  assert.equal(containsRestrictedContent(movie({ ageRating: '18' }), ['Conteúdo adulto']), true);
  assert.equal(containsRestrictedContent(movie(), ['Conteúdo adulto']), false);
});

test('family-friendly filter requires a confirmed rating no higher than 10', () => {
  assert.equal(isFamilyFriendly(movie({ ageRating: 'L' })), true);
  assert.equal(isFamilyFriendly(movie({ ageRating: '10' })), true);
  assert.equal(isFamilyFriendly(movie({ ageRating: '12' })), false);
  assert.equal(isFamilyFriendly(movie({ ageRating: '' })), false);
});
