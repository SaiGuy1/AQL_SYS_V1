export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          first_name: string | null
          last_name: string | null
          role: 'admin' | 'manager' | 'supervisor' | 'inspector' | 'hr' | 'customer' | null
          location_id: string | null
          active_sessions: number
          created_at: string
          updated_at: string
          isAvailable: boolean
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          first_name?: string | null
          last_name?: string | null
          role?: 'admin' | 'manager' | 'supervisor' | 'inspector' | 'hr' | 'customer' | null
          location_id?: string | null
          active_sessions?: number
          created_at?: string
          updated_at?: string
          isAvailable?: boolean
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          first_name?: string | null
          last_name?: string | null
          role?: 'admin' | 'manager' | 'supervisor' | 'inspector' | 'hr' | 'customer' | null
          location_id?: string | null
          active_sessions?: number
          created_at?: string
          updated_at?: string
          isAvailable?: boolean
        }
      }
      locations: {
        Row: {
          id: string
          created_at: string
          name: string
          location_number: number
          address: string | null
          city: string | null
          state: string | null
          country: string
          region: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          location_number: number
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string
          region?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          location_number?: number
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string
          region?: string | null
        }
      }
      inspector_locations: {
        Row: {
          id: string
          inspector_id: string
          location_id: string
          created_at: string
        }
        Insert: {
          id?: string
          inspector_id: string
          location_id: string
          created_at?: string
        }
        Update: {
          id?: string
          inspector_id?: string
          location_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 