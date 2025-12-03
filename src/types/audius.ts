// Audius SDK Type Definitions
// Based on @audius/sdk documentation

export interface AudiusUserProfile {
  id: string;
  handle: string;
  name: string;
  email?: string;
  bio?: string;
  location?: string;
  isVerified: boolean;
  isAvailable: boolean;
  isDeactivated: boolean;
  profilePicture?: {
    _150x150?: string;
    _480x480?: string;
    _1000x1000?: string;
  };
  coverPhoto?: {
    _640?: string;
    _2000?: string;
  };
  albumCount: number;
  playlistCount: number;
  trackCount: number;
  repostCount: number;
  followerCount: number;
  followeeCount: number;
  supporterCount: number;
  supportingCount: number;
  doesFollowCurrentUser?: boolean;
  ercWallet: string;
  splWallet: string;
  totalAudioBalance: number;
  artistPickTrackId?: string;
}

export interface AudiusTrack {
  id: string;
  title: string;
  description?: string;
  genre: string;
  mood?: string;
  tags?: string;
  trackCid: string;
  artwork?: {
    _150x150?: string;
    _480x480?: string;
    _1000x1000?: string;
  };
  playCount: number;
  favoriteCount: number;
  repostCount: number;
  duration: number; // in seconds
  user: AudiusUserProfile;
  releaseDate?: string;
  remixOf?: {
    tracks: Array<{ parentTrackId: string }>;
  };
  streamConditions?: any;
  downloadConditions?: any;
  permalink: string;
  isUnlisted?: boolean;
}

export interface AudiusTrackUploadMetadata {
  title: string;
  genre: string;
  description?: string;
  mood?: string;
  tags?: string;
  releaseDate?: Date;
  isrc?: string;
  iswc?: string;
  license?: string;
  remixOf?: {
    tracks: Array<{ parentTrackId: string }>;
  };
  aiAttributionUserId?: string;
  streamConditions?: any;
  downloadConditions?: any;
  fieldVisibility?: {
    mood?: boolean;
    tags?: boolean;
    genre?: boolean;
    playCount?: boolean;
  };
}

export interface AudiusTrackUploadParams {
  userId: string;
  coverArtFile?: {
    buffer: Buffer;
    name: string;
  };
  metadata: AudiusTrackUploadMetadata;
  trackFile: {
    buffer: Buffer;
    name: string;
  };
  onProgress?: (progress: number) => void;
}

export interface AudiusTrackUploadResponse {
  trackId: string;
  blockHash: string | null;  // Not available from Edge Function (HTTP API)
  blockNumber: number | null; // Not available from Edge Function (HTTP API)
}

export interface AudiusOAuthCallbackUser {
  userId: string;
  email: string;
  name: string;
  handle: string;
  verified: boolean;
  profilePicture?: {
    _150x150?: string;
    _480x480?: string;
    _1000x1000?: string;
  };
}

export interface AudiusSearchParams {
  query: string;
  limit?: number;
  offset?: number;
}

export interface AudiusTrendingParams {
  genre?: string;
  time?: 'week' | 'month' | 'year' | 'allTime';
  limit?: number;
  offset?: number;
}

// Enums (should match @audius/sdk enums)
export enum AudiusGenre {
  ELECTRONIC = 'Electronic',
  ROCK = 'Rock',
  METAL = 'Metal',
  ALTERNATIVE = 'Alternative',
  HIP_HOP_RAP = 'Hip-Hop/Rap',
  EXPERIMENTAL = 'Experimental',
  PUNK = 'Punk',
  FOLK = 'Folk',
  POP = 'Pop',
  AMBIENT = 'Ambient',
  SOUNDTRACK = 'Soundtrack',
  WORLD = 'World',
  JAZZ = 'Jazz',
  ACOUSTIC = 'Acoustic',
  FUNK = 'Funk',
  R_AND_B_SOUL = 'R&B/Soul',
  DEVOTIONAL = 'Devotional',
  CLASSICAL = 'Classical',
  REGGAE = 'Reggae',
  PODCASTS = 'Podcasts',
  COUNTRY = 'Country',
  SPOKEN_WORD = 'Spoken Word',
  COMEDY = 'Comedy',
  BLUES = 'Blues',
  KIDS = 'Kids',
  AUDIOBOOKS = 'Audiobooks',
  LATIN = 'Latin',
  LOFI = 'Lo-Fi',
  HYPERPOP = 'Hyperpop',
  DANCEHALL = 'Dancehall',
  AFROBEATS = 'Afrobeats',
  DRILL = 'Drill',
  TECHNO = 'Techno',
  TRAP = 'Trap',
  HOUSE = 'House',
  DUBSTEP = 'Dubstep',
  JERSEY_CLUB = 'Jersey Club',
}

export enum AudiusMood {
  PEACEFUL = 'Peaceful',
  ROMANTIC = 'Romantic',
  SENTIMENTAL = 'Sentimental',
  TENDER = 'Tender',
  EASYGOING = 'Easygoing',
  YEARNING = 'Yearning',
  SOPHISTICATED = 'Sophisticated',
  SENSUAL = 'Sensual',
  COOL = 'Cool',
  GRITTY = 'Gritty',
  MELANCHOLY = 'Melancholy',
  SERIOUS = 'Serious',
  BROODING = 'Brooding',
  FIERY = 'Fiery',
  DEFIANT = 'Defiant',
  AGGRESSIVE = 'Aggressive',
  ROWDY = 'Rowdy',
  EXCITED = 'Excited',
  ENERGIZING = 'Energizing',
  EMPOWERING = 'Empowering',
  STIRRING = 'Stirring',
  UPBEAT = 'Upbeat',
  OTHER = 'Other',
}

export enum GetTracksByUserSortMethod {
  DATE = 'date',
  PLAYS = 'plays',
  TITLE = 'title',
}

// Helper type for track selection in UI
export interface SelectableAudiusTrack extends AudiusTrack {
  isAlreadySubmitted?: boolean;
  canSubmit?: boolean;
}
