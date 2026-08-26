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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          summary: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          summary?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      initial_super_admin_setup: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      media_albums: {
        Row: {
          album_date: string | null
          category: Database["public"]["Enums"]["media_category"]
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          title: string
        }
        Insert: {
          album_date?: string | null
          category: Database["public"]["Enums"]["media_category"]
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          title: string
        }
        Update: {
          album_date?: string | null
          category?: Database["public"]["Enums"]["media_category"]
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      media_items: {
        Row: {
          album_id: string | null
          author_id: string | null
          category: Database["public"]["Enums"]["media_category"]
          created_at: string | null
          description: string | null
          duration: string | null
          event_date: string | null
          featured: boolean | null
          file_size: string | null
          file_type: string | null
          file_url: string
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          related_resource_id: string | null
          related_service_id: string | null
          related_song_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          visibility: Database["public"]["Enums"]["visibility_level"]
        }
        Insert: {
          album_id?: string | null
          author_id?: string | null
          category: Database["public"]["Enums"]["media_category"]
          created_at?: string | null
          description?: string | null
          duration?: string | null
          event_date?: string | null
          featured?: boolean | null
          file_size?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          media_type: Database["public"]["Enums"]["media_type"]
          related_resource_id?: string | null
          related_service_id?: string | null
          related_song_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          visibility?: Database["public"]["Enums"]["visibility_level"]
        }
        Update: {
          album_id?: string | null
          author_id?: string | null
          category?: Database["public"]["Enums"]["media_category"]
          created_at?: string | null
          description?: string | null
          duration?: string | null
          event_date?: string | null
          featured?: boolean | null
          file_size?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          related_resource_id?: string | null
          related_service_id?: string | null
          related_song_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          visibility?: Database["public"]["Enums"]["visibility_level"]
        }
        Relationships: [
          {
            foreignKeyName: "media_items_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "media_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_items_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profile_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_items_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_items_related_resource_id_fkey"
            columns: ["related_resource_id"]
            isOneToOne: false
            referencedRelation: "worship_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_items_related_service_id_fkey"
            columns: ["related_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_items_related_song_id_fkey"
            columns: ["related_song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_provider: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_joined: string | null
          display_order: number | null
          email: string
          emergency_contact: string | null
          featured: boolean | null
          full_name: string
          groups: string[] | null
          id: string
          instrument: string | null
          internal_notes: string | null
          is_public: boolean | null
          phone: string | null
          primary_role: string | null
          public_name: string | null
          show_public_contact: boolean
          skills: string[] | null
          status: Database["public"]["Enums"]["member_status"] | null
          team_member_id: string | null
          updated_at: string | null
          vocal_range: string | null
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_joined?: string | null
          display_order?: number | null
          email: string
          emergency_contact?: string | null
          featured?: boolean | null
          full_name: string
          groups?: string[] | null
          id: string
          instrument?: string | null
          internal_notes?: string | null
          is_public?: boolean | null
          phone?: string | null
          primary_role?: string | null
          public_name?: string | null
          show_public_contact?: boolean
          skills?: string[] | null
          status?: Database["public"]["Enums"]["member_status"] | null
          team_member_id?: string | null
          updated_at?: string | null
          vocal_range?: string | null
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_joined?: string | null
          display_order?: number | null
          email?: string
          emergency_contact?: string | null
          featured?: boolean | null
          full_name?: string
          groups?: string[] | null
          id?: string
          instrument?: string | null
          internal_notes?: string | null
          is_public?: boolean | null
          phone?: string | null
          primary_role?: string | null
          public_name?: string | null
          show_public_contact?: boolean
          skills?: string[] | null
          status?: Database["public"]["Enums"]["member_status"] | null
          team_member_id?: string | null
          updated_at?: string | null
          vocal_range?: string | null
        }
        Relationships: []
      }
      service_assignments: {
        Row: {
          call_time: string | null
          created_at: string | null
          id: string
          notes: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          service_id: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          user_id: string | null
        }
        Insert: {
          call_time?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          user_id?: string | null
        }
        Update: {
          call_time?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_assignments_member_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_assignments_member_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_assignments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_items: {
        Row: {
          assigned_person: string | null
          category: string | null
          created_at: string | null
          duration: number | null
          id: string
          item_type: string
          leader_note: string | null
          musician_notes: string | null
          notes: string | null
          selected_key: string | null
          service_id: string | null
          song_id: string | null
          sort_order: number
          title: string
          transition_note: string | null
        }
        Insert: {
          assigned_person?: string | null
          category?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          item_type: string
          leader_note?: string | null
          musician_notes?: string | null
          notes?: string | null
          selected_key?: string | null
          service_id?: string | null
          song_id?: string | null
          sort_order: number
          title: string
          transition_note?: string | null
        }
        Update: {
          assigned_person?: string | null
          category?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          item_type?: string
          leader_note?: string | null
          musician_notes?: string | null
          notes?: string | null
          selected_key?: string | null
          service_id?: string | null
          song_id?: string | null
          sort_order?: number
          title?: string
          transition_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_items_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          allow_public_duplicate: boolean
          created_at: string | null
          estimated_duration: number | null
          id: string
          is_official: boolean
          is_public: boolean | null
          notes: string | null
          owner_id: string | null
          rehearsal_date: string | null
          rehearsal_location: string | null
          rehearsal_notes: string | null
          rehearsal_time: string | null
          scripture_reference: string | null
          service_date: string
          service_time: string
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["setlist_status"]
          theme: string | null
          title: string
          updated_at: string | null
          worship_leader_id: string | null
        }
        Insert: {
          allow_public_duplicate?: boolean
          created_at?: string | null
          estimated_duration?: number | null
          id?: string
          is_official?: boolean
          is_public?: boolean | null
          notes?: string | null
          owner_id?: string | null
          rehearsal_date?: string | null
          rehearsal_location?: string | null
          rehearsal_notes?: string | null
          rehearsal_time?: string | null
          scripture_reference?: string | null
          service_date: string
          service_time: string
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["setlist_status"]
          theme?: string | null
          title: string
          updated_at?: string | null
          worship_leader_id?: string | null
        }
        Update: {
          allow_public_duplicate?: boolean
          created_at?: string | null
          estimated_duration?: number | null
          id?: string
          is_official?: boolean
          is_public?: boolean | null
          notes?: string | null
          owner_id?: string | null
          rehearsal_date?: string | null
          rehearsal_location?: string | null
          rehearsal_notes?: string | null
          rehearsal_time?: string | null
          scripture_reference?: string | null
          service_date?: string
          service_time?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["setlist_status"]
          theme?: string | null
          title?: string
          updated_at?: string | null
          worship_leader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_worship_leader_id_fkey"
            columns: ["worship_leader_id"]
            isOneToOne: false
            referencedRelation: "profile_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_worship_leader_id_fkey"
            columns: ["worship_leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      song_change_events: {
        Row: {
          changed_at: string
          id: number
          is_public: boolean
          operation: string
          song_id: string
          status: Database["public"]["Enums"]["song_status"] | null
        }
        Insert: {
          changed_at?: string
          id?: never
          is_public?: boolean
          operation: string
          song_id: string
          status?: Database["public"]["Enums"]["song_status"] | null
        }
        Update: {
          changed_at?: string
          id?: never
          is_public?: boolean
          operation?: string
          song_id?: string
          status?: Database["public"]["Enums"]["song_status"] | null
        }
        Relationships: []
      }
      song_versions: {
        Row: {
          chords: string | null
          created_at: string
          created_by: string | null
          id: string
          lyrics: string | null
          metadata: Json | null
          song_id: string
          title: string
          version_number: number
        }
        Insert: {
          chords?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lyrics?: string | null
          metadata?: Json | null
          song_id: string
          title: string
          version_number: number
        }
        Update: {
          chords?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lyrics?: string | null
          metadata?: Json | null
          song_id?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "song_versions_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          artist: string
          artwork_url: string | null
          audio_url: string | null
          bpm: number | null
          ccli_number: string | null
          chords: string | null
          copyright_owner: string | null
          copyright_year: number | null
          created_at: string | null
          default_key: string
          external_resources: Json | null
          featured: boolean | null
          flow: string[] | null
          id: string
          is_public: boolean | null
          language: Database["public"]["Enums"]["song_language"]
          lyrics: string | null
          public_domain: boolean | null
          scripture_references: Json | null
          sections: Json | null
          sheet_music_url: string | null
          song_type: Database["public"]["Enums"]["song_type"]
          songwriter: string | null
          status: Database["public"]["Enums"]["song_status"]
          themes: string[] | null
          time_signature: string | null
          title: string
          updated_at: string | null
          worship_leader_notes: string[] | null
        }
        Insert: {
          artist: string
          artwork_url?: string | null
          audio_url?: string | null
          bpm?: number | null
          ccli_number?: string | null
          chords?: string | null
          copyright_owner?: string | null
          copyright_year?: number | null
          created_at?: string | null
          default_key: string
          external_resources?: Json | null
          featured?: boolean | null
          flow?: string[] | null
          id?: string
          is_public?: boolean | null
          language?: Database["public"]["Enums"]["song_language"]
          lyrics?: string | null
          public_domain?: boolean | null
          scripture_references?: Json | null
          sections?: Json | null
          sheet_music_url?: string | null
          song_type?: Database["public"]["Enums"]["song_type"]
          songwriter?: string | null
          status?: Database["public"]["Enums"]["song_status"]
          themes?: string[] | null
          time_signature?: string | null
          title: string
          updated_at?: string | null
          worship_leader_notes?: string[] | null
        }
        Update: {
          artist?: string
          artwork_url?: string | null
          audio_url?: string | null
          bpm?: number | null
          ccli_number?: string | null
          chords?: string | null
          copyright_owner?: string | null
          copyright_year?: number | null
          created_at?: string | null
          default_key?: string
          external_resources?: Json | null
          featured?: boolean | null
          flow?: string[] | null
          id?: string
          is_public?: boolean | null
          language?: Database["public"]["Enums"]["song_language"]
          lyrics?: string | null
          public_domain?: boolean | null
          scripture_references?: Json | null
          sections?: Json | null
          sheet_music_url?: string | null
          song_type?: Database["public"]["Enums"]["song_type"]
          songwriter?: string | null
          status?: Database["public"]["Enums"]["song_status"]
          themes?: string[] | null
          time_signature?: string | null
          title?: string
          updated_at?: string | null
          worship_leader_notes?: string[] | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worship_resources: {
        Row: {
          author_id: string | null
          category: Database["public"]["Enums"]["resource_category"]
          content: string
          cover_image: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          is_public: boolean | null
          ministry_roles: string[] | null
          published_at: string | null
          reading_time: number | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          scripture_references: Json | null
          slug: string
          status: Database["public"]["Enums"]["resource_status"]
          tags: string[] | null
          title: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["visibility_level"] | null
        }
        Insert: {
          author_id?: string | null
          category: Database["public"]["Enums"]["resource_category"]
          content: string
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          is_public?: boolean | null
          ministry_roles?: string[] | null
          published_at?: string | null
          reading_time?: number | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          scripture_references?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["resource_status"]
          tags?: string[] | null
          title: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility_level"] | null
        }
        Update: {
          author_id?: string | null
          category?: Database["public"]["Enums"]["resource_category"]
          content?: string
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          is_public?: boolean | null
          ministry_roles?: string[] | null
          published_at?: string | null
          reading_time?: number | null
          resource_type?: Database["public"]["Enums"]["resource_type"]
          scripture_references?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["resource_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility_level"] | null
        }
        Relationships: [
          {
            foreignKeyName: "worship_resources_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profile_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worship_resources_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profile_directory: {
        Row: {
          avatar_url: string | null
          date_joined: string | null
          email: string | null
          full_name: string | null
          groups: string[] | null
          id: string | null
          instrument: string | null
          primary_role: string | null
          skills: string[] | null
          status: Database["public"]["Enums"]["member_status"] | null
          vocal_range: string | null
        }
        Insert: {
          avatar_url?: string | null
          date_joined?: string | null
          email?: string | null
          full_name?: string | null
          groups?: string[] | null
          id?: string | null
          instrument?: string | null
          primary_role?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["member_status"] | null
          vocal_range?: string | null
        }
        Update: {
          avatar_url?: string | null
          date_joined?: string | null
          email?: string | null
          full_name?: string | null
          groups?: string[] | null
          id?: string | null
          instrument?: string | null
          primary_role?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["member_status"] | null
          vocal_range?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_worship_planner: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "ministry_admin"
        | "worship_pastor"
        | "worship_leader"
        | "team_member"
        | "media_tech"
        | "viewer"
        | "worship_director"
      assignment_status:
        | "Pending"
        | "Confirmed"
        | "Declined"
        | "Needs Replacement"
      media_category:
        | "Worship Service"
        | "Rehearsal"
        | "Special Event"
        | "Team Activity"
        | "Training"
        | "Ministry File"
        | "Worship Night"
        | "Testimony"
      media_type: "Photo" | "Video" | "Audio" | "Document"
      member_status:
        | "Active"
        | "Available"
        | "Limited Availability"
        | "On Break"
        | "Inactive"
        | "Pending"
        | "Suspended"
        | "Archived"
      resource_category:
        | "Worship Devotionals"
        | "Biblical Worship"
        | "Worship Leadership"
        | "Musicianship"
        | "Vocal Training"
        | "Band Development"
        | "Sound & Technical"
        | "Multimedia"
        | "Rehearsal Preparation"
        | "Spiritual Formation"
        | "Team Culture"
        | "Songwriting"
        | "Prayer"
      resource_status: "Draft" | "Published" | "Archived"
      resource_type:
        | "Article"
        | "Devotional"
        | "Guide"
        | "Training"
        | "Video"
        | "PDF"
        | "Checklist"
        | "Lesson"
      service_type:
        | "Sunday Worship"
        | "Prayer Meeting"
        | "Youth Worship"
        | "Midweek Service"
        | "Communion"
        | "Special Event"
        | "Conference"
        | "Fellowship"
      setlist_status: "Draft" | "Preparing" | "Ready" | "Completed" | "Archived"
      song_language: "English" | "Filipino/Tagalog" | "Cebuano/Bisaya" | "Other"
      song_status: "Active" | "Learning" | "Archived"
      song_type:
        | "Opening"
        | "Praise"
        | "Worship"
        | "Response"
        | "Communion"
        | "Offering"
        | "Closing"
      visibility_level: "Public" | "Worship Team" | "Leaders Only" | "Private"
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
      app_role: [
        "super_admin",
        "ministry_admin",
        "worship_pastor",
        "worship_leader",
        "team_member",
        "media_tech",
        "viewer",
        "worship_director",
      ],
      assignment_status: [
        "Pending",
        "Confirmed",
        "Declined",
        "Needs Replacement",
      ],
      media_category: [
        "Worship Service",
        "Rehearsal",
        "Special Event",
        "Team Activity",
        "Training",
        "Ministry File",
        "Worship Night",
        "Testimony",
      ],
      media_type: ["Photo", "Video", "Audio", "Document"],
      member_status: [
        "Active",
        "Available",
        "Limited Availability",
        "On Break",
        "Inactive",
        "Pending",
        "Suspended",
        "Archived",
      ],
      resource_category: [
        "Worship Devotionals",
        "Biblical Worship",
        "Worship Leadership",
        "Musicianship",
        "Vocal Training",
        "Band Development",
        "Sound & Technical",
        "Multimedia",
        "Rehearsal Preparation",
        "Spiritual Formation",
        "Team Culture",
        "Songwriting",
        "Prayer",
      ],
      resource_status: ["Draft", "Published", "Archived"],
      resource_type: [
        "Article",
        "Devotional",
        "Guide",
        "Training",
        "Video",
        "PDF",
        "Checklist",
        "Lesson",
      ],
      service_type: [
        "Sunday Worship",
        "Prayer Meeting",
        "Youth Worship",
        "Midweek Service",
        "Communion",
        "Special Event",
        "Conference",
        "Fellowship",
      ],
      setlist_status: ["Draft", "Preparing", "Ready", "Completed", "Archived"],
      song_language: ["English", "Filipino/Tagalog", "Cebuano/Bisaya", "Other"],
      song_status: ["Active", "Learning", "Archived"],
      song_type: [
        "Opening",
        "Praise",
        "Worship",
        "Response",
        "Communion",
        "Offering",
        "Closing",
      ],
      visibility_level: ["Public", "Worship Team", "Leaders Only", "Private"],
    },
  },
} as const
