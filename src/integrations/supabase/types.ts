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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "support" | "admin" | "ceo"
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
    },
  },
} as const
