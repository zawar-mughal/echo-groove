export interface Room {
  id: string;
  title: string;
  description: string;
  slug: string;
  playlist: any[]; // Replace with actual Playlist type
  discordChannelId?: string | null;
  discordGuildId?: string | null;
  activeSeasonId: string;
  createdBy: string;
  moderators: string[];
  isActive: boolean;
  isPublic: boolean;
  allowSubmissions: boolean;
  createdAt: Date;
  currentSeason: Season | null;
  seasons: Season[];
  stats: {
    totalSubmissions: number;
    totalSeasons: number;
    totalMembers: number;
  };
}

export interface Season {
  id: string;
  roomId: string;
  title: string;
  description: string;
  mediaType: 'audio' | 'video' | 'image' | 'mixed';
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'voting' | 'completed' | 'cancelled';
  submissions: string[]; // submission IDs
  createdAt: Date;
  maxSubmissionsPerUser: number;
  boostMultiplier?: number;
}

export interface AdminStats {
  totalRooms: number;
  totalSeasons: number;
  totalSubmissions: number;
  activeRooms: number;
  activeSeasons: number;
}
