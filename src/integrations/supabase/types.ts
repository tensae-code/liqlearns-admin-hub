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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_privileges: {
        Row: {
          admin_user_id: string
          created_at: string
          granted: boolean | null
          granted_by: string | null
          id: string
          privilege_type: string
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          granted?: boolean | null
          granted_by?: string | null
          id?: string
          privilege_type: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          granted?: boolean | null
          granted_by?: string | null
          id?: string
          privilege_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          xp_required: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          name: string
          xp_required?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          xp_required?: number
        }
        Relationships: []
      }
      brain_bank: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          id: string
          is_favorite: boolean | null
          last_reviewed_at: string | null
          mastery_level: number | null
          pronunciation: string | null
          review_count: number | null
          tags: string[] | null
          title: string
          translation: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          last_reviewed_at?: string | null
          mastery_level?: number | null
          pronunciation?: string | null
          review_count?: number | null
          tags?: string[] | null
          title: string
          translation?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          last_reviewed_at?: string | null
          mastery_level?: number | null
          pronunciation?: string | null
          review_count?: number | null
          tags?: string[] | null
          title?: string
          translation?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_bank_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_bank_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_bank_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          call_type: string
          caller_id: string
          duration_seconds: number | null
          ended_at: string | null
          group_id: string | null
          id: string
          receiver_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          call_type: string
          caller_id: string
          duration_seconds?: number | null
          ended_at?: string | null
          group_id?: string | null
          id?: string
          receiver_id?: string | null
          started_at?: string
          status: string
        }
        Update: {
          call_type?: string
          caller_id?: string
          duration_seconds?: number | null
          ended_at?: string | null
          group_id?: string | null
          id?: string
          receiver_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_members: {
        Row: {
          clan_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          clan_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          owner_type: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          owner_type: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          owner_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_question: boolean | null
          likes_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_question?: boolean | null
          likes_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_question?: boolean | null
          likes_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_badge_suggestions: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_selected: boolean | null
          source: string
          suggested_by: string
          suggested_name: string
          votes_count: number
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_selected?: boolean | null
          source: string
          suggested_by: string
          suggested_name: string
          votes_count?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_selected?: boolean | null
          source?: string
          suggested_by?: string
          suggested_name?: string
          votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_badge_suggestions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_resources: {
        Row: {
          content: Json | null
          course_id: string
          created_at: string
          created_by: string
          description: string | null
          duration_seconds: number | null
          file_path: string | null
          file_url: string | null
          id: string
          module_id: string
          order_index: number | null
          presentation_id: string | null
          show_after_slide: number
          show_before_slide: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          course_id: string
          created_at?: string
          created_by: string
          description?: string | null
          duration_seconds?: number | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          module_id: string
          order_index?: number | null
          presentation_id?: string | null
          show_after_slide?: number
          show_before_slide?: number
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          course_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          duration_seconds?: number | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          module_id?: string
          order_index?: number | null
          presentation_id?: string | null
          show_after_slide?: number
          show_before_slide?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_resources_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "module_presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_review_comments: {
        Row: {
          comment: string
          course_id: string
          created_at: string
          id: string
          reviewer_id: string
        }
        Insert: {
          comment: string
          course_id: string
          created_at?: string
          id?: string
          reviewer_id: string
        }
        Update: {
          comment?: string
          course_id?: string
          created_at?: string
          id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_review_comments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_review_comments_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_review_comments_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_review_comments_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          badge_name: string | null
          category: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          description: string | null
          difficulty: string
          estimated_duration: number | null
          gallery_images: string[] | null
          id: string
          instructor_id: string | null
          is_published: boolean | null
          price: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          submission_status: string | null
          submitted_at: string | null
          thumbnail_url: string | null
          title: string
          total_lessons: number | null
          updated_at: string
        }
        Insert: {
          badge_name?: string | null
          category: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          estimated_duration?: number | null
          gallery_images?: string[] | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          price?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submission_status?: string | null
          submitted_at?: string | null
          thumbnail_url?: string | null
          title: string
          total_lessons?: number | null
          updated_at?: string
        }
        Update: {
          badge_name?: string | null
          category?: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          estimated_duration?: number | null
          gallery_images?: string[] | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          price?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submission_status?: string | null
          submitted_at?: string | null
          thumbnail_url?: string | null
          title?: string
          total_lessons?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_study_stats: {
        Row: {
          created_at: string
          id: string
          sessions_count: number
          streak_eligible: boolean | null
          study_date: string
          total_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sessions_count?: number
          streak_eligible?: boolean | null
          study_date?: string
          total_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sessions_count?: number
          streak_eligible?: boolean | null
          study_date?: string
          total_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          duration_seconds: number | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_read: boolean | null
          media_options: Json | null
          message_type: string | null
          receiver_id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          media_options?: Json | null
          message_type?: string | null
          receiver_id: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          media_options?: Json | null
          message_type?: string | null
          receiver_id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          last_accessed_at: string | null
          progress_percentage: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_analytics_events: {
        Row: {
          course_id: string | null
          created_at: string
          enterprise_id: string
          event_type: string
          id: string
          learning_path_id: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          enterprise_id: string
          event_type: string
          id?: string
          learning_path_id?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          enterprise_id?: string
          event_type?: string
          id?: string
          learning_path_id?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_analytics_events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_analytics_events_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_analytics_events_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_analytics_events_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_analytics_events_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          parent_approved: boolean | null
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          parent_approved?: boolean | null
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          parent_approved?: boolean | null
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Relationships: []
      }
      group_channels: {
        Row: {
          channel_type: Database["public"]["Enums"]["channel_type"]
          created_at: string
          description: string | null
          group_id: string
          id: string
          is_default: boolean | null
          name: string
          order_index: number | null
          pinned_message_ids: string[] | null
        }
        Insert: {
          channel_type?: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          description?: string | null
          group_id: string
          id?: string
          is_default?: boolean | null
          name: string
          order_index?: number | null
          pinned_message_ids?: string[] | null
        }
        Update: {
          channel_type?: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          description?: string | null
          group_id?: string
          id?: string
          is_default?: boolean | null
          name?: string
          order_index?: number | null
          pinned_message_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "group_channels_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          admin_title: string | null
          group_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Insert: {
          admin_title?: string | null
          group_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Update: {
          admin_title?: string | null
          group_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          duration_seconds: number | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_edited: boolean | null
          media_options: Json | null
          message_type: string | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          media_options?: Json | null
          message_type?: string | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          media_options?: Json | null
          message_type?: string | null
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "group_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          clan_id: string | null
          created_at: string
          description: string | null
          id: string
          invite_link: string | null
          is_public: boolean | null
          member_count: number | null
          name: string
          owner_id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          clan_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_link?: string | null
          is_public?: boolean | null
          member_count?: number | null
          name: string
          owner_id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          clan_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_link?: string | null
          is_public?: boolean | null
          member_count?: number | null
          name?: string
          owner_id?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_required: boolean | null
          learning_path_id: string
          order_index: number
          prerequisite_course_ids: string[] | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          learning_path_id: string
          order_index?: number
          prerequisite_course_ids?: string[] | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          learning_path_id?: string
          order_index?: number
          prerequisite_course_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_courses_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_milestones: {
        Row: {
          badge_id: string | null
          created_at: string
          description: string | null
          id: string
          learning_path_id: string
          order_index: number
          title: string
          trigger_after_course_id: string | null
          trigger_at_progress_percent: number | null
          xp_reward: number | null
        }
        Insert: {
          badge_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          learning_path_id: string
          order_index?: number
          title: string
          trigger_after_course_id?: string | null
          trigger_at_progress_percent?: number | null
          xp_reward?: number | null
        }
        Update: {
          badge_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          learning_path_id?: string
          order_index?: number
          title?: string
          trigger_after_course_id?: string | null
          trigger_at_progress_percent?: number | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_milestones_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_milestones_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_milestones_trigger_after_course_id_fkey"
            columns: ["trigger_after_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_progress: {
        Row: {
          completed_at: string | null
          completed_course_ids: string[] | null
          completed_milestone_ids: string[] | null
          current_course_index: number | null
          id: string
          learning_path_id: string
          progress_percent: number | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_course_ids?: string[] | null
          completed_milestone_ids?: string[] | null
          current_course_index?: number | null
          id?: string
          learning_path_id: string
          progress_percent?: number | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_course_ids?: string[] | null
          completed_milestone_ids?: string[] | null
          current_course_index?: number | null
          id?: string
          learning_path_id?: string
          progress_percent?: number | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_progress_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          enterprise_id: string
          estimated_duration: number | null
          id: string
          is_published: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          enterprise_id: string
          estimated_duration?: number | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          enterprise_id?: string
          estimated_duration?: number | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
          xp_reward: number | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          title: string
          updated_at?: string
          video_url?: string | null
          xp_reward?: number | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      livekit_session_invites: {
        Row: {
          call_type: string | null
          context_id: string | null
          context_type: string | null
          created_at: string
          id: string
          invitee_id: string
          inviter_avatar: string | null
          inviter_id: string
          inviter_name: string | null
          responded_at: string | null
          room_name: string | null
          session_id: string | null
          status: string
        }
        Insert: {
          call_type?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          invitee_id: string
          inviter_avatar?: string | null
          inviter_id: string
          inviter_name?: string | null
          responded_at?: string | null
          room_name?: string | null
          session_id?: string | null
          status?: string
        }
        Update: {
          call_type?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          invitee_id?: string
          inviter_avatar?: string | null
          inviter_id?: string
          inviter_name?: string | null
          responded_at?: string | null
          room_name?: string | null
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      livekit_session_participants: {
        Row: {
          id: string
          is_hand_raised: boolean
          is_muted: boolean
          is_video_on: boolean
          joined_at: string
          left_at: string | null
          role: Database["public"]["Enums"]["session_role"]
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_hand_raised?: boolean
          is_muted?: boolean
          is_video_on?: boolean
          joined_at?: string
          left_at?: string | null
          role?: Database["public"]["Enums"]["session_role"]
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_hand_raised?: boolean
          is_muted?: boolean
          is_video_on?: boolean
          joined_at?: string
          left_at?: string | null
          role?: Database["public"]["Enums"]["session_role"]
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "livekit_session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "livekit_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      livekit_sessions: {
        Row: {
          active_screenshare_user_id: string | null
          context_id: string
          context_type: Database["public"]["Enums"]["session_context"]
          created_at: string
          ended_at: string | null
          host_id: string
          id: string
          max_speakers: number
          metadata: Json | null
          room_name: string
          status: string
        }
        Insert: {
          active_screenshare_user_id?: string | null
          context_id: string
          context_type: Database["public"]["Enums"]["session_context"]
          created_at?: string
          ended_at?: string | null
          host_id: string
          id?: string
          max_speakers?: number
          metadata?: Json | null
          room_name: string
          status?: string
        }
        Update: {
          active_screenshare_user_id?: string | null
          context_id?: string
          context_type?: Database["public"]["Enums"]["session_context"]
          created_at?: string
          ended_at?: string | null
          host_id?: string
          id?: string
          max_speakers?: number
          metadata?: Json | null
          room_name?: string
          status?: string
        }
        Relationships: []
      }
      message_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_presentations: {
        Row: {
          course_id: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          lesson_breaks: Json | null
          module_id: string
          module_title: string | null
          resources: Json | null
          slide_data: Json | null
          total_slides: number
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          course_id: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          lesson_breaks?: Json | null
          module_id: string
          module_title?: string | null
          resources?: Json | null
          slide_data?: Json | null
          total_slides?: number
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          course_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          lesson_breaks?: Json | null
          module_id?: string
          module_title?: string | null
          resources?: Json | null
          slide_data?: Json | null
          total_slides?: number
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_presentations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_children: {
        Row: {
          child_id: string
          created_at: string
          id: string
          nickname: string | null
          parent_id: string
          relationship: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          nickname?: string | null
          parent_id: string
          relationship?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          nickname?: string | null
          parent_id?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_messages: {
        Row: {
          channel_id: string | null
          conversation_id: string | null
          id: string
          message_id: string
          pinned_at: string
          pinned_by: string
        }
        Insert: {
          channel_id?: string | null
          conversation_id?: string | null
          id?: string
          message_id: string
          pinned_at?: string
          pinned_by: string
        }
        Update: {
          channel_id?: string | null
          conversation_id?: string | null
          id?: string
          message_id?: string
          pinned_at?: string
          pinned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "group_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_stats: {
        Row: {
          id: string
          total_certificates_issued: number | null
          total_courses: number | null
          total_lessons_completed: number | null
          total_students: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          total_certificates_issued?: number | null
          total_courses?: number | null
          total_lessons_completed?: number | null
          total_students?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          total_certificates_issued?: number | null
          total_courses?: number | null
          total_lessons_completed?: number | null
          total_students?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      presentation_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          course_id: string
          created_at: string
          current_slide: number
          id: string
          last_viewed_at: string | null
          presentation_id: string
          resources_completed: string[] | null
          slides_viewed: number[] | null
          total_time_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          current_slide?: number
          id?: string
          last_viewed_at?: string | null
          presentation_id: string
          resources_completed?: string[] | null
          slides_viewed?: number[] | null
          total_time_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          current_slide?: number
          id?: string
          last_viewed_at?: string | null
          presentation_id?: string
          resources_completed?: string[] | null
          slides_viewed?: number[] | null
          total_time_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_progress_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "module_presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          created_at: string
          current_streak: number
          email: string
          enterprise_docs_url: string | null
          enterprise_org_name: string | null
          enterprise_status: string | null
          full_name: string
          held_at: string | null
          held_by: string | null
          hold_reason: string | null
          id: string
          is_on_hold: boolean | null
          last_login_date: string | null
          longest_streak: number
          phone: string | null
          sponsor_id: string | null
          subscription_ends_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          teacher_type: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          username: string
          xp_points: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string
          current_streak?: number
          email: string
          enterprise_docs_url?: string | null
          enterprise_org_name?: string | null
          enterprise_status?: string | null
          full_name: string
          held_at?: string | null
          held_by?: string | null
          hold_reason?: string | null
          id?: string
          is_on_hold?: boolean | null
          last_login_date?: string | null
          longest_streak?: number
          phone?: string | null
          sponsor_id?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          teacher_type?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          username: string
          xp_points?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string
          current_streak?: number
          email?: string
          enterprise_docs_url?: string | null
          enterprise_org_name?: string | null
          enterprise_status?: string | null
          full_name?: string
          held_at?: string | null
          held_by?: string | null
          hold_reason?: string | null
          id?: string
          is_on_hold?: boolean | null
          last_login_date?: string | null
          longest_streak?: number
          phone?: string | null
          sponsor_id?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          teacher_type?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          xp_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_held_by_fkey"
            columns: ["held_by"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_held_by_fkey"
            columns: ["held_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_held_by_fkey"
            columns: ["held_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_board_answers: {
        Row: {
          content: string
          created_at: string
          downvotes: number | null
          id: string
          is_accepted: boolean | null
          link_url: string | null
          question_id: string
          updated_at: string
          upvotes: number | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string
          downvotes?: number | null
          id?: string
          is_accepted?: boolean | null
          link_url?: string | null
          question_id: string
          updated_at?: string
          upvotes?: number | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          downvotes?: number | null
          id?: string
          is_accepted?: boolean | null
          link_url?: string | null
          question_id?: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_board_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quest_board_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_board_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_board_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_board_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_board_questions: {
        Row: {
          answers_count: number | null
          approved_at: string | null
          approved_by: string | null
          content: string | null
          created_at: string
          hashtags: string[] | null
          id: string
          link_url: string | null
          rejection_reason: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          answers_count?: number | null
          approved_at?: string | null
          approved_by?: string | null
          content?: string | null
          created_at?: string
          hashtags?: string[] | null
          id?: string
          link_url?: string | null
          rejection_reason?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          answers_count?: number | null
          approved_at?: string | null
          approved_by?: string | null
          content?: string | null
          created_at?: string
          hashtags?: string[] | null
          id?: string
          link_url?: string | null
          rejection_reason?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_board_questions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_board_questions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_board_questions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_board_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_board_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_board_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: number
          explanation: string | null
          id: string
          options: Json
          order_index: number
          question: string
          quiz_id: string
        }
        Insert: {
          correct_answer: number
          explanation?: string | null
          id?: string
          options: Json
          order_index?: number
          question: string
          quiz_id: string
        }
        Update: {
          correct_answer?: number
          explanation?: string | null
          id?: string
          options?: Json
          order_index?: number
          question?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          passing_score: number | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          passing_score?: number | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          passing_score?: number | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          group_id: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string
          reporter_id: string
          resolved_at: string | null
          reviewed_by: string | null
          room_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_id?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string
          reporter_id: string
          resolved_at?: string | null
          reviewed_by?: string | null
          room_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          group_id?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_user_id?: string
          reporter_id?: string
          resolved_at?: string | null
          reviewed_by?: string | null
          room_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_quiz_attempts: {
        Row: {
          answers: Json | null
          attempt_number: number | null
          completed_at: string
          id: string
          passed: boolean
          resource_id: string
          score: number
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          attempt_number?: number | null
          completed_at?: string
          id?: string
          passed?: boolean
          resource_id: string
          score: number
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          attempt_number?: number | null
          completed_at?: string
          id?: string
          passed?: boolean
          resource_id?: string
          score?: number
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_quiz_attempts_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "course_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_suggestion_votes: {
        Row: {
          created_at: string
          id: string
          suggestion_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          suggestion_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          suggestion_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_suggestion_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "skill_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_suggestion_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_suggestion_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_suggestion_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_suggestions: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          id: string
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          votes_down: number
          votes_up: number
          voting_ends_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          votes_down?: number
          votes_up?: number
          voting_ends_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          votes_down?: number
          votes_up?: number
          voting_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enterprise_memberships: {
        Row: {
          created_at: string
          enterprise_id: string
          id: string
          invited_at: string
          joined_at: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enterprise_id: string
          id?: string
          invited_at?: string
          joined_at?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enterprise_id?: string
          id?: string
          invited_at?: string
          joined_at?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enterprise_memberships_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enterprise_memberships_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enterprise_memberships_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enterprise_memberships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enterprise_memberships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enterprise_memberships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_participants: {
        Row: {
          id: string
          is_mic_on: boolean | null
          joined_at: string
          room_id: string
          study_title: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_mic_on?: boolean | null
          joined_at?: string
          room_id: string
          study_title?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_mic_on?: boolean | null
          joined_at?: string
          room_id?: string
          study_title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_pins: {
        Row: {
          created_at: string
          id: string
          pinned_user_id: string
          pinner_id: string
          room_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pinned_user_id: string
          pinner_id: string
          room_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pinned_user_id?: string
          pinner_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_pins_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_rooms: {
        Row: {
          country: string | null
          created_at: string
          current_streak: number | null
          description: string | null
          education_level: string | null
          host_id: string
          id: string
          is_active: boolean | null
          is_always_muted: boolean | null
          is_system_room: boolean | null
          last_active_date: string | null
          longest_streak: number | null
          max_participants: number | null
          name: string
          room_type: Database["public"]["Enums"]["study_room_type"]
          study_topic: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          current_streak?: number | null
          description?: string | null
          education_level?: string | null
          host_id: string
          id?: string
          is_active?: boolean | null
          is_always_muted?: boolean | null
          is_system_room?: boolean | null
          last_active_date?: string | null
          longest_streak?: number | null
          max_participants?: number | null
          name: string
          room_type?: Database["public"]["Enums"]["study_room_type"]
          study_topic?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          current_streak?: number | null
          description?: string | null
          education_level?: string | null
          host_id?: string
          id?: string
          is_active?: boolean | null
          is_always_muted?: boolean | null
          is_system_room?: boolean | null
          last_active_date?: string | null
          longest_streak?: number | null
          max_participants?: number | null
          name?: string
          room_type?: Database["public"]["Enums"]["study_room_type"]
          study_topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          room_id: string | null
          session_date: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          room_id?: string | null
          session_date?: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          room_id?: string | null
          session_date?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          ban_end: string | null
          ban_start: string
          banned_by: string
          banned_from_id: string | null
          banned_from_type: string
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          ban_end?: string | null
          ban_start?: string
          banned_by: string
          banned_from_id?: string | null
          banned_from_type: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          ban_end?: string | null
          ban_start?: string
          banned_by?: string
          banned_from_id?: string | null
          banned_from_type?: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_hashtag_preferences: {
        Row: {
          created_at: string
          enabled: boolean | null
          hashtag: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          hashtag: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          hashtag?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_hashtag_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hashtag_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hashtag_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profile_with_age: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          created_at: string | null
          current_streak: number | null
          email: string | null
          full_name: string | null
          id: string | null
          is_underage: boolean | null
          last_login_date: string | null
          longest_streak: number | null
          phone: string | null
          sponsor_id: string | null
          subscription_ends_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          xp_points: number | null
        }
        Insert: {
          age?: never
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string | null
          current_streak?: number | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_underage?: never
          last_login_date?: string | null
          longest_streak?: number | null
          phone?: string | null
          sponsor_id?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          xp_points?: number | null
        }
        Update: {
          age?: never
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string | null
          current_streak?: number | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_underage?: never
          last_login_date?: string | null
          longest_streak?: number | null
          phone?: string | null
          sponsor_id?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          xp_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profile_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          current_streak: number | null
          full_name: string | null
          id: string | null
          user_id: string | null
          username: string | null
          xp_points: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          current_streak?: number | null
          full_name?: string | null
          id?: string | null
          user_id?: string | null
          username?: string | null
          xp_points?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          current_streak?: number | null
          full_name?: string | null
          id?: string | null
          user_id?: string | null
          username?: string | null
          xp_points?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_message: {
        Args: { receiver_profile_id: string; sender_profile_id: string }
        Returns: boolean
      }
      get_follower_count: { Args: { profile_id: string }; Returns: number }
      get_following_count: { Args: { profile_id: string }; Returns: number }
      get_my_profile_id: { Args: never; Returns: string }
      get_pending_request_count: {
        Args: { receiver: string; sender: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_following: {
        Args: { follower: string; following: string }
        Returns: boolean
      }
      is_group_admin: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_parent_of_profile: { Args: { profile_id: string }; Returns: boolean }
      is_session_host: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: boolean
      }
      is_session_participant: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "student"
        | "teacher"
        | "support"
        | "admin"
        | "ceo"
        | "parent"
        | "enterprise"
      channel_type: "text" | "announcement" | "voice"
      friendship_status: "pending" | "accepted" | "blocked"
      group_role: "owner" | "admin" | "member"
      report_reason:
        | "inappropriate_content"
        | "harassment"
        | "spam"
        | "underage_violation"
        | "other"
      session_context: "dm" | "group" | "study_room"
      session_role: "host" | "moderator" | "speaker" | "listener"
      study_room_type: "public" | "private" | "kids"
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
        "student",
        "teacher",
        "support",
        "admin",
        "ceo",
        "parent",
        "enterprise",
      ],
      channel_type: ["text", "announcement", "voice"],
      friendship_status: ["pending", "accepted", "blocked"],
      group_role: ["owner", "admin", "member"],
      report_reason: [
        "inappropriate_content",
        "harassment",
        "spam",
        "underage_violation",
        "other",
      ],
      session_context: ["dm", "group", "study_room"],
      session_role: ["host", "moderator", "speaker", "listener"],
      study_room_type: ["public", "private", "kids"],
    },
  },
} as const
