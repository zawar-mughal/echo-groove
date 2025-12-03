export type Provider = 'youtube' | 'soundcloud' | 'audius';

export interface ProviderMetadata {
  id: string;
  url: string;
  title: string;
  duration?: number;
  artwork?: string;
  artist?: string;
}

export interface ProviderSubmission {
  provider: Provider;
  provider_track_id: string;
  url: string;
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
}

export interface AudiusUser {
  id: string;
  handle: string;
  name: string;
  profile_picture?: {
    '480x480': string;
  };
}

export interface AudiusTrack {
  id: string;
  title: string;
  user: AudiusUser;
  artwork?: {
    '480x480': string;
  };
  duration: number;
  permalink: string;
}