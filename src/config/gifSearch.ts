/**
 * GIF search configuration (Tenor API)
 */

export const GIF_API = {
  BASE_URL: 'https://g.tenor.com/v1/search',
  DEFAULT_LIMIT: '20',
  MEDIA_FILTER: 'minimal',
  AR_RANGE: 'standard',
} as const;

export type TrendingGif = {
  url: string;
  preview: string;
  local: boolean;
};

export const TRENDING_GIFS: TrendingGif[] = [
  { url: 'https://media.tenor.com/6JpZb3wQqPkAAAAC/wave-hello.gif', preview: 'https://media.tenor.com/6JpZb3wQqPkAAAAC/wave-hello.gif', local: true },
  { url: 'https://media.tenor.com/uxJX0xL9eRsAAAAC/laughing-lol.gif', preview: 'https://media.tenor.com/uxJX0xL9eRsAAAAC/laughing-lol.gif', local: true },
  { url: 'https://media.tenor.com/51VqJdMf4i4AAAAC/clap-applause.gif', preview: 'https://media.tenor.com/51VqJdMf4i4AAAAC/clap-applause.gif', local: true },
  { url: 'https://media.tenor.com/mSgZsPwKJggAAAAC/dancing-dance.gif', preview: 'https://media.tenor.com/mSgZsPwKJggAAAAC/dancing-dance.gif', local: true },
  { url: 'https://media.tenor.com/GfS4l7Z7fqIAAAAC/party-confetti.gif', preview: 'https://media.tenor.com/GfS4l7Z7fqIAAAAC/party-confetti.gif', local: true },
  { url: 'https://media.tenor.com/7YQ8Kn3qDkEAAAAC/ok-thumbs-up.gif', preview: 'https://media.tenor.com/7YQ8Kn3qDkEAAAAC/ok-thumbs-up.gif', local: true },
  { url: 'https://media.tenor.com/G8pJfX0YAN4AAAAC/sad-cry.gif', preview: 'https://media.tenor.com/G8pJfX0YAN4AAAAC/sad-cry.gif', local: true },
  { url: 'https://media.tenor.com/rUGjX6PtVQsAAAAC/heart-love.gif', preview: 'https://media.tenor.com/rUGjX6PtVQsAAAAC/heart-love.gif', local: true },
];
