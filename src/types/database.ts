export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boost_history: {
        Row: {
          boost_count: number | null
          community_points_earned: number | null
          curator_points_earned: number | null
          first_boost_at: string
          id: string
          last_boost_at: string
          made_playlist: boolean | null
          submission_id: string
          user_id: string
          was_early_booster: boolean | null
        }
        Insert: {
          boost_count?: number | null
          community_points_earned?: number | null
          curator_points_earned?: number | null
          first_boost_at?: string
          id?: string
          last_boost_at?: string
          made_playlist?: boolean | null
          submission_id: string
          user_id: string
          was_early_booster?: boolean | null
        }
        Update: {
          boost_count?: number | null
          community_points_earned?: number | null
          curator_points_earned?: number | null
          first_boost_at?: string
          id?: string
          last_boost_at?: string
          made_playlist?: boolean | null
          submission_id?: string
          user_id?: string
          was_early_booster?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "boost_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boost_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boosts: {
        Row: {
          created_at: string | null
          id: string
          season_id: string
          submission_id: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          season_id: string
          submission_id: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          season_id?: string
          submission_id?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boosts_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boosts_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_points: {
        Row: {
          boosts_given: number | null
          community_points: number | null
          curator_points: number | null
          date: string
          id: string
          total_points: number | null
          user_id: string
        }
        Insert: {
          boosts_given?: number | null
          community_points?: number | null
          curator_points?: number | null
          date: string
          id?: string
          total_points?: number | null
          user_id: string
        }
        Update: {
          boosts_given?: number | null
          community_points?: number | null
          curator_points?: number | null
          date?: string
          id?: string
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      play_events: {
        Row: {
          completed: boolean | null
          created_at: string | null
          duration_played_seconds: number | null
          id: string
          played_from: string | null
          submission_id: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          duration_played_seconds?: number | null
          id?: string
          played_from?: string | null
          submission_id: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          duration_played_seconds?: number | null
          id?: string
          played_from?: string | null
          submission_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "play_events_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "play_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string | null
          added_by: string | null
          id: string
          playlist_id: string
          position: number
          season_id: string | null
          submission_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          id?: string
          playlist_id: string
          position: number
          season_id?: string | null
          submission_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          id?: string
          playlist_id?: string
          position?: number
          season_id?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string | null
          curated_by: string | null
          description: string | null
          id: string
          is_featured: boolean | null
          room_id: string
          title: string
          total_duration_seconds: number | null
          track_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          curated_by?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          room_id: string
          title: string
          total_duration_seconds?: number | null
          track_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          curated_by?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          room_id?: string
          title?: string
          total_duration_seconds?: number | null
          track_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_curated_by_fkey"
            columns: ["curated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlists_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          audius_handle: string | null
          audius_id: string | null
          audius_jwt: string | null
          avatar_url: string | null
          bio: string | null
          community_points: number | null
          created_at: string | null
          curator_points: number | null
          current_streak: number | null
          daily_boost_count: number | null
          discord_notifications: boolean | null
          display_name: string | null
          email_notifications: boolean | null
          id: string
          is_admin: boolean | null
          last_boost_date: string | null
          longest_streak: number | null
          platform_points: number | null
          soundcloud_id: string | null
          total_boosts: number | null
          total_submissions: number | null
          updated_at: string | null
          username: string
          youtube_id: string | null
        }
        Insert: {
          audius_handle?: string | null
          audius_id?: string | null
          audius_jwt?: string | null
          avatar_url?: string | null
          bio?: string | null
          community_points?: number | null
          created_at?: string | null
          curator_points?: number | null
          current_streak?: number | null
          daily_boost_count?: number | null
          discord_notifications?: boolean | null
          display_name?: string | null
          email_notifications?: boolean | null
          id: string
          is_admin?: boolean | null
          last_boost_date?: string | null
          longest_streak?: number | null
          platform_points?: number | null
          soundcloud_id?: string | null
          total_boosts?: number | null
          total_submissions?: number | null
          updated_at?: string | null
          username: string
          youtube_id?: string | null
        }
        Update: {
          audius_handle?: string | null
          audius_id?: string | null
          audius_jwt?: string | null
          avatar_url?: string | null
          bio?: string | null
          community_points?: number | null
          created_at?: string | null
          curator_points?: number | null
          current_streak?: number | null
          daily_boost_count?: number | null
          discord_notifications?: boolean | null
          display_name?: string | null
          email_notifications?: boolean | null
          id?: string
          is_admin?: boolean | null
          last_boost_date?: string | null
          longest_streak?: number | null
          platform_points?: number | null
          soundcloud_id?: string | null
          total_boosts?: number | null
          total_submissions?: number | null
          updated_at?: string | null
          username?: string
          youtube_id?: string | null
        }
        Relationships: []
      }
      room_admins: {
        Row: {
          added_at: string | null
          added_by: string | null
          can_manage_seasons: boolean | null
          can_manage_settings: boolean | null
          can_manage_submissions: boolean | null
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          can_manage_seasons?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_submissions?: boolean | null
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          can_manage_seasons?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_submissions?: boolean | null
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_admins_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_admins_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_memberships: {
        Row: {
          id: string
          is_moderator: boolean | null
          joined_at: string | null
          receive_notifications: boolean | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_moderator?: boolean | null
          joined_at?: string | null
          receive_notifications?: boolean | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_moderator?: boolean | null
          joined_at?: string | null
          receive_notifications?: boolean | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          allow_submissions: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          discord_channel_id: string | null
          discord_guild_id: string | null
          featured_submission_id: string | null
          genre: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          moderator_ids: string[] | null
          slug: string
          tags: string[] | null
          title: string
          total_members: number | null
          total_seasons: number | null
          total_submissions: number | null
          updated_at: string | null
        }
        Insert: {
          allow_submissions?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discord_channel_id?: string | null
          discord_guild_id?: string | null
          featured_submission_id?: string | null
          genre?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          moderator_ids?: string[] | null
          slug: string
          tags?: string[] | null
          title: string
          total_members?: number | null
          total_seasons?: number | null
          total_submissions?: number | null
          updated_at?: string | null
        }
        Update: {
          allow_submissions?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discord_channel_id?: string | null
          discord_guild_id?: string | null
          featured_submission_id?: string | null
          genre?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          moderator_ids?: string[] | null
          slug?: string
          tags?: string[] | null
          title?: string
          total_members?: number | null
          total_seasons?: number | null
          total_submissions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_featured_submission"
            columns: ["featured_submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          max_duration_seconds: number | null
          max_file_size_mb: number | null
          max_submissions_per_user: number | null
          media_type: Database["public"]["Enums"]["media_type"] | null
          min_duration_seconds: number | null
          participant_count: number | null
          room_id: string
          start_date: string
          status: Database["public"]["Enums"]["season_status"] | null
          submission_count: number | null
          title: string
          total_boosts: number | null
          updated_at: string | null
          voting_end_date: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          max_duration_seconds?: number | null
          max_file_size_mb?: number | null
          max_submissions_per_user?: number | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          min_duration_seconds?: number | null
          participant_count?: number | null
          room_id: string
          start_date: string
          status?: Database["public"]["Enums"]["season_status"] | null
          submission_count?: number | null
          title: string
          total_boosts?: number | null
          updated_at?: string | null
          voting_end_date?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          max_duration_seconds?: number | null
          max_file_size_mb?: number | null
          max_submissions_per_user?: number | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          min_duration_seconds?: number | null
          participant_count?: number | null
          room_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["season_status"] | null
          submission_count?: number | null
          title?: string
          total_boosts?: number | null
          updated_at?: string | null
          voting_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          artist_handle: string | null
          artist_name: string | null
          boost_count: number | null
          boost_velocity: number | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          external_url: string | null
          file_size_bytes: number | null
          height: number | null
          id: string
          is_approved: boolean | null
          is_trending: boolean | null
          is_visible: boolean | null
          last_velocity_update: string | null
          media_type: Database["public"]["Enums"]["media_type"]
          moderation_notes: string | null
          play_count: number | null
          provider: Database["public"]["Enums"]["provider_type"]
          provider_track_id: string | null
          room_id: string
          season_id: string
          storage_path: string | null
          thumbnail_path: string | null
          title: string
          trending_score: number | null
          unique_boosters: number | null
          updated_at: string | null
          user_id: string
          weighted_boost_count: number | null
          width: number | null
        }
        Insert: {
          artist_handle?: string | null
          artist_name?: string | null
          boost_count?: number | null
          boost_velocity?: number | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          external_url?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          is_approved?: boolean | null
          is_trending?: boolean | null
          is_visible?: boolean | null
          last_velocity_update?: string | null
          media_type: Database["public"]["Enums"]["media_type"]
          moderation_notes?: string | null
          play_count?: number | null
          provider: Database["public"]["Enums"]["provider_type"]
          provider_track_id?: string | null
          room_id: string
          season_id: string
          storage_path?: string | null
          thumbnail_path?: string | null
          title: string
          trending_score?: number | null
          unique_boosters?: number | null
          updated_at?: string | null
          user_id: string
          weighted_boost_count?: number | null
          width?: number | null
        }
        Update: {
          artist_handle?: string | null
          artist_name?: string | null
          boost_count?: number | null
          boost_velocity?: number | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          external_url?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          is_approved?: boolean | null
          is_trending?: boolean | null
          is_visible?: boolean | null
          last_velocity_update?: string | null
          media_type?: Database["public"]["Enums"]["media_type"]
          moderation_notes?: string | null
          play_count?: number | null
          provider?: Database["public"]["Enums"]["provider_type"]
          provider_track_id?: string | null
          room_id?: string
          season_id?: string
          storage_path?: string | null
          thumbnail_path?: string | null
          title?: string
          trending_score?: number | null
          unique_boosters?: number | null
          updated_at?: string | null
          user_id?: string
          weighted_boost_count?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_room_scores: {
        Row: {
          community_points: number | null
          curator_accuracy: number | null
          curator_hits: number | null
          curator_misses: number | null
          curator_points: number | null
          current_streak: number | null
          early_boost_count: number | null
          id: string
          is_top_supporter: boolean | null
          room_id: string
          season_boosts: number | null
          seasons_participated: number | null
          total_boosts: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          community_points?: number | null
          curator_accuracy?: number | null
          curator_hits?: number | null
          curator_misses?: number | null
          curator_points?: number | null
          current_streak?: number | null
          early_boost_count?: number | null
          id?: string
          is_top_supporter?: boolean | null
          room_id: string
          season_boosts?: number | null
          seasons_participated?: number | null
          total_boosts?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          community_points?: number | null
          curator_accuracy?: number | null
          curator_hits?: number | null
          curator_misses?: number | null
          curator_points?: number | null
          current_streak?: number | null
          early_boost_count?: number | null
          id?: string
          is_top_supporter?: boolean | null
          room_id?: string
          season_boosts?: number | null
          seasons_participated?: number | null
          total_boosts?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_room_scores_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_room_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_boost_velocity: {
        Args: { p_submission_id: string }
        Returns: number
      }
      can_manage_seasons: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      is_room_admin: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      reset_daily_boost_counts: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_trending_submissions: { Args: never; Returns: undefined }
      update_user_curator_stats: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      media_type: "audio" | "video" | "image" | "mixed"
      provider_type: "audius" | "soundcloud" | "youtube" | "upload"
      season_status:
        | "upcoming"
        | "active"
        | "voting"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      media_type: ["audio", "video", "image", "mixed"],
      provider_type: ["audius", "soundcloud", "youtube", "upload"],
      season_status: ["upcoming", "active", "voting", "completed", "cancelled"],
    },
  },
} as const
