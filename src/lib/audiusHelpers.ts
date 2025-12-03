import { Genre, Mood } from '@audius/sdk';
import { AudiusGenre, AudiusMood } from '@/types/audius';

/**
 * Helper functions for working with Audius API
 */

// Map string genre names to Audius SDK Genre enum
export const mapGenreToAudius = (genreString: string): Genre => {
  const genreMap: Record<string, Genre> = {
    'Electronic': Genre.ELECTRONIC,
    'Rock': Genre.ROCK,
    'Metal': Genre.METAL,
    'Alternative': Genre.ALTERNATIVE,
    'Hip-Hop/Rap': Genre.HIP_HOP_RAP,
    'Experimental': Genre.EXPERIMENTAL,
    'Punk': Genre.PUNK,
    'Folk': Genre.FOLK,
    'Pop': Genre.POP,
    'Ambient': Genre.AMBIENT,
    'Soundtrack': Genre.SOUNDTRACK,
    'World': Genre.WORLD,
    'Jazz': Genre.JAZZ,
    'Acoustic': Genre.ACOUSTIC,
    'Funk': Genre.FUNK,
    'R&B/Soul': Genre.R_AND_B_SOUL,
    'Devotional': Genre.DEVOTIONAL,
    'Classical': Genre.CLASSICAL,
    'Reggae': Genre.REGGAE,
    'Podcasts': Genre.PODCASTS,
    'Country': Genre.COUNTRY,
    'Spoken Word': Genre.SPOKEN_WORD,
    'Comedy': Genre.COMEDY,
    'Blues': Genre.BLUES,
    'Kids': Genre.KIDS,
    'Audiobooks': Genre.AUDIOBOOKS,
    'Latin': Genre.LATIN,
    'Lo-Fi': Genre.LOFI,
    'Hyperpop': Genre.HYPERPOP,
    'Dancehall': Genre.DANCEHALL,
    'Afrobeats': Genre.AFROBEATS,
    'Drill': Genre.DRILL,
    'Techno': Genre.TECHNO,
    'Trap': Genre.TRAP,
    'House': Genre.HOUSE,
    'Dubstep': Genre.DUBSTEP,
    'Jersey Club': Genre.JERSEY_CLUB,
  };

  return genreMap[genreString] || Genre.ELECTRONIC;
};

// Map string mood names to Audius SDK Mood enum
export const mapMoodToAudius = (moodString: string): Mood | undefined => {
  if (!moodString) return undefined;

  const moodMap: Record<string, Mood> = {
    'Peaceful': Mood.PEACEFUL,
    'Romantic': Mood.ROMANTIC,
    'Sentimental': Mood.SENTIMENTAL,
    'Tender': Mood.TENDER,
    'Easygoing': Mood.EASYGOING,
    'Yearning': Mood.YEARNING,
    'Sophisticated': Mood.SOPHISTICATED,
    'Sensual': Mood.SENSUAL,
    'Cool': Mood.COOL,
    'Gritty': Mood.GRITTY,
    'Melancholy': Mood.MELANCHOLY,
    'Serious': Mood.SERIOUS,
    'Brooding': Mood.BROODING,
    'Fiery': Mood.FIERY,
    'Defiant': Mood.DEFIANT,
    'Aggressive': Mood.AGGRESSIVE,
    'Rowdy': Mood.ROWDY,
    'Excited': Mood.EXCITED,
    'Energizing': Mood.ENERGIZING,
    'Empowering': Mood.EMPOWERING,
    'Stirring': Mood.STIRRING,
    'Upbeat': Mood.UPBEAT,
    'Other': Mood.OTHER,
  };

  return moodMap[moodString];
};

// Get all available genres for dropdown/select
export const getAllGenres = (): string[] => {
  return Object.values(AudiusGenre);
};

// Get all available moods for dropdown/select
export const getAllMoods = (): string[] => {
  return Object.values(AudiusMood);
};

// Format duration from seconds to MM:SS
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format play count with K/M suffix
export const formatPlayCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

// Get best quality artwork URL
export const getBestArtwork = (artwork?: {
  _150x150?: string;
  _480x480?: string;
  _1000x1000?: string;
}): string | undefined => {
  if (!artwork) return undefined;
  return artwork._1000x1000 || artwork._480x480 || artwork._150x150;
};

// Get thumbnail artwork URL (for lists/cards)
export const getThumbnailArtwork = (artwork?: {
  _150x150?: string;
  _480x480?: string;
  _1000x1000?: string;
}): string | undefined => {
  if (!artwork) return undefined;
  return artwork._480x480 || artwork._150x150 || artwork._1000x1000;
};

// Get best quality profile picture
export const getBestProfilePicture = (profilePicture?: {
  _150x150?: string;
  _480x480?: string;
  _1000x1000?: string;
}): string | undefined => {
  if (!profilePicture) return undefined;
  return (
    profilePicture._1000x1000 ||
    profilePicture._480x480 ||
    profilePicture._150x150
  );
};

// Validate track file
export const validateTrackFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const validTypes = ['audio/mpeg', 'audio/mp3'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Only MP3 files are allowed' };
  }

  // Check file size (100MB limit)
  const maxSize = 100 * 1024 * 1024; // 100MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 100MB' };
  }

  return { valid: true };
};

// Validate artwork file
export const validateArtworkFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG and PNG images are allowed' };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 10MB' };
  }

  return { valid: true };
};

// Convert File to Buffer (for upload)
export const fileToBuffer = async (file: File): Promise<Buffer> => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// Build Audius track URL
export const buildAudiusTrackUrl = (handle: string, trackTitle: string): string => {
  const slugifiedTitle = trackTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `https://audius.co/${handle}/${slugifiedTitle}`;
};

// Build Audius user profile URL
export const buildAudiusProfileUrl = (handle: string): string => {
  return `https://audius.co/${handle}`;
};
