export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          denomination: string | null;
          streak_count: number;
          last_active: string | null;
          subscription_tier: "free" | "pro" | "church";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          denomination?: string | null;
          streak_count?: number;
          last_active?: string | null;
          subscription_tier?: "free" | "pro" | "church";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          denomination?: string | null;
          streak_count?: number;
          last_active?: string | null;
          subscription_tier?: "free" | "pro" | "church";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
        };
      };
      verse_collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_shared: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_shared?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_shared?: boolean;
          created_at?: string;
        };
      };
      verses: {
        Row: {
          id: string;
          collection_id: string;
          user_id: string;
          reference: string;
          text: string;
          translation: string;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          user_id: string;
          reference: string;
          text: string;
          translation: string;
          tags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          user_id?: string;
          reference?: string;
          text?: string;
          translation?: string;
          tags?: string[];
          created_at?: string;
        };
      };
      user_verses: {
        Row: {
          id: string;
          user_id: string;
          verse_id: string;
          interval: number;
          ease_factor: number;
          due_date: string;
          repetitions: number;
          mastered: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          verse_id: string;
          interval?: number;
          ease_factor?: number;
          due_date?: string;
          repetitions?: number;
          mastered?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          verse_id?: string;
          interval?: number;
          ease_factor?: number;
          due_date?: string;
          repetitions?: number;
          mastered?: boolean;
          created_at?: string;
        };
      };
      drill_sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          completed_at: string | null;
          mode: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          completed_at?: string | null;
          mode: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          started_at?: string;
          completed_at?: string | null;
          mode?: string;
        };
      };
      drill_results: {
        Row: {
          id: string;
          session_id: string;
          verse_id: string;
          score: number;
          time_taken: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          verse_id: string;
          score: number;
          time_taken: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          verse_id?: string;
          score?: number;
          time_taken?: number;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
