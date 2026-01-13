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
      courses: {
        Row: {
          category: string
          created_at: string
          description: string | null
          difficulty: string
          estimated_duration: number | null
          id: string
          instructor_id: string | null
          is_published: boolean | null
          price: number | null
          thumbnail_url: string | null
          title: string
          total_lessons: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          difficulty?: string
          estimated_duration?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          price?: number | null
          thumbnail_url?: string | null
          title: string
          total_lessons?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: string
          estimated_duration?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          price?: number | null
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
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
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
          id: string
          is_edited: boolean | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
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
        Relationships: []
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          created_at: string
          current_streak: number
          email: string
          full_name: string
          id: string
          last_login_date: string | null
          longest_streak: number
          phone: string | null
          sponsor_id: string | null
          subscription_ends_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
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
          full_name: string
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          phone?: string | null
          sponsor_id?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
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
          full_name?: string
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          phone?: string | null
          sponsor_id?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          xp_points?: number
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
    }
    Enums: {
      app_role: "student" | "teacher" | "support" | "admin" | "ceo"
      channel_type: "text" | "announcement" | "voice"
      friendship_status: "pending" | "accepted" | "blocked"
      group_role: "owner" | "admin" | "member"
      report_reason:
        | "inappropriate_content"
        | "harassment"
        | "spam"
        | "underage_violation"
        | "other"
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
      app_role: ["student", "teacher", "support", "admin", "ceo"],
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
      study_room_type: ["public", "private", "kids"],
    },
  },
} as const
