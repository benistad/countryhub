// SEO utility functions for programmatic SEO

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate artist slug from artist name
 */
export function generateArtistSlug(artistName: string): string {
  return generateSlug(artistName);
}

/**
 * Generate video slug from video title and artist
 */
export function generateVideoSlug(title: string, artist: string): string {
  const combined = `${artist}-${title}`;
  return generateSlug(combined).slice(0, 80); // Limit length for URLs
}

/**
 * Parse artist slug back to search term
 */
export function parseArtistSlug(slug: string): string {
  return slug.replace(/-/g, ' ');
}

/**
 * Generate meta title with proper length (50-60 chars ideal)
 */
export function generateMetaTitle(title: string, suffix: string = 'CountryMusic-Hub.com'): string {
  const maxLength = 60;
  const fullTitle = `${title} | ${suffix}`;
  
  if (fullTitle.length <= maxLength) {
    return fullTitle;
  }
  
  // Truncate title to fit
  const availableLength = maxLength - suffix.length - 5; // 5 for " | " and "..."
  return `${title.slice(0, availableLength)}... | ${suffix}`;
}

/**
 * Generate meta description with proper length (150-160 chars ideal)
 */
export function generateMetaDescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) {
    return description;
  }
  
  // Truncate at word boundary
  const truncated = description.slice(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace) + '...';
}

/**
 * Generate structured data for a music artist
 */
export function generateArtistSchema(artist: {
  name: string;
  description?: string;
  image?: string;
  genres?: string[];
  url?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artist.name,
    description: artist.description || `${artist.name} - Country music artist`,
    image: artist.image,
    genre: artist.genres || ['Country'],
    url: artist.url || `https://countrymusic-hub.com/artist/${generateArtistSlug(artist.name)}`,
  };
}

/**
 * Generate structured data for a music video
 */
export function generateVideoSchema(video: {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate: string;
  duration?: string;
  artist: string;
  videoId: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description || `${video.title} by ${video.artist} - Official country music video`,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    duration: video.duration,
    embedUrl: `https://www.youtube.com/embed/${video.videoId}`,
    contentUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
    author: {
      '@type': 'MusicGroup',
      name: video.artist,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CountryMusic-Hub.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://countrymusic-hub.com/logo.png',
      },
    },
  };
}

/**
 * Generate structured data for a music chart/playlist
 */
export function generateChartSchema(chart: {
  name: string;
  description: string;
  tracks: Array<{ title: string; artist: string; position: number }>;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: chart.name,
    description: chart.description,
    numTracks: chart.tracks.length,
    dateModified: chart.dateModified || new Date().toISOString(),
    track: chart.tracks.map((track) => ({
      '@type': 'MusicRecording',
      name: track.title,
      byArtist: {
        '@type': 'MusicGroup',
        name: track.artist,
      },
      position: track.position,
    })),
  };
}

/**
 * Generate FAQ structured data
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate internal links for related content
 */
export function generateRelatedLinks(
  currentArtist: string,
  allArtists: string[],
  limit: number = 5
): Array<{ name: string; url: string }> {
  // Filter out current artist and get random related artists
  const otherArtists = allArtists.filter(
    (a) => a.toLowerCase() !== currentArtist.toLowerCase()
  );
  
  // Shuffle and take limit
  const shuffled = otherArtists.sort(() => Math.random() - 0.5);
  
  return shuffled.slice(0, limit).map((artist) => ({
    name: artist,
    url: `/artist/${generateArtistSlug(artist)}`,
  }));
}

/**
 * Generate breadcrumb data
 */
export function generateBreadcrumbs(
  path: Array<{ name: string; url: string }>
): Array<{ name: string; url: string }> {
  return [{ name: 'Home', url: '/' }, ...path];
}

/**
 * Format date for SEO (ISO 8601)
 */
export function formatDateISO(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  const baseUrl = 'https://countrymusic-hub.com';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
