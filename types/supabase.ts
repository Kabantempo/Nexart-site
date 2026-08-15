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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read_at: string | null
          recipient_id: string | null
          sender_id: string | null
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_waitlist: {
        Row: {
          created_at: string
          creator_id: string
          event_id: string
          id: string
          message: string | null
          position: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          event_id: string
          id?: string
          message?: string | null
          position?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          event_id?: string
          id?: string
          message?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "application_waitlist_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          created_at: string
          creator_id: string
          event_id: string
          id: string
          message: string | null
          portfolio_images: string[] | null
          status: Database["public"]["Enums"]["application_status"]
          stripe_payment_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          event_id: string
          id?: string
          message?: string | null
          portfolio_images?: string[] | null
          status?: Database["public"]["Enums"]["application_status"]
          stripe_payment_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          event_id?: string
          id?: string
          message?: string | null
          portfolio_images?: string[] | null
          status?: Database["public"]["Enums"]["application_status"]
          stripe_payment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          accessed_sensitive_data: boolean | null
          action: string
          changes: Json | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          sensitive_fields: string[] | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_sensitive_data?: boolean | null
          action: string
          changes?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          sensitive_fields?: string[] | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_sensitive_data?: boolean | null
          action?: string
          changes?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          sensitive_fields?: string[] | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      changelog: {
        Row: {
          audience: string[]
          created_at: string | null
          date: string
          entries: Json
          id: string
          published: boolean
          title: string | null
          version: string
        }
        Insert: {
          audience?: string[]
          created_at?: string | null
          date?: string
          entries?: Json
          id?: string
          published?: boolean
          title?: string | null
          version: string
        }
        Update: {
          audience?: string[]
          created_at?: string | null
          date?: string
          entries?: Json
          id?: string
          published?: boolean
          title?: string | null
          version?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          read: boolean | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          read?: boolean | null
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean | null
          subject?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          application_id: string | null
          created_at: string | null
          creator_id: string | null
          document_hash: string | null
          event_id: string | null
          id: string
          organizer_id: string | null
          pdf_url: string
          signed_at: string | null
          signer_ip: string | null
          status: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          document_hash?: string | null
          event_id?: string | null
          id?: string
          organizer_id?: string | null
          pdf_url: string
          signed_at?: string | null
          signer_ip?: string | null
          status?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          document_hash?: string | null
          event_id?: string | null
          id?: string
          organizer_id?: string | null
          pdf_url?: string
          signed_at?: string | null
          signer_ip?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          creator_id: string
          event_id: string | null
          id: string
          organizer_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          event_id?: string | null
          id?: string
          organizer_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          event_id?: string | null
          id?: string
          organizer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_analytics: {
        Row: {
          accepted_applications: number | null
          creator_id: string
          id: string
          profile_views_30d: number | null
          total_applications: number | null
          updated_at: string | null
        }
        Insert: {
          accepted_applications?: number | null
          creator_id: string
          id?: string
          profile_views_30d?: number | null
          total_applications?: number | null
          updated_at?: string | null
        }
        Update: {
          accepted_applications?: number | null
          creator_id?: string
          id?: string
          profile_views_30d?: number | null
          total_applications?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_analytics_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_followers: {
        Row: {
          created_at: string | null
          creator_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_followers_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_posts: {
        Row: {
          content: string
          created_at: string
          creator_id: string
          id: string
          image_url: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string
          creator_id: string
          id?: string
          image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          creator_id?: string
          id?: string
          image_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          active_creator_until: string | null
          availability: Json
          city: string | null
          department: string | null
          disciplines: string[]
          etsy: string | null
          id: string
          instagram: string | null
          insurance_doc_url: string | null
          insurance_verified: boolean
          is_active_creator: boolean
          lat: number | null
          lng: number | null
          open_to_collab: boolean
          page_settings: Json | null
          portfolio_grid: Json | null
          portfolio_images: string[]
          postal_code: string | null
          region: string | null
          siret: string | null
          siret_number: string | null
          siret_verified: boolean
          travel_radius: Database["public"]["Enums"]["travel_radius"]
          user_id: string
          website: string | null
        }
        Insert: {
          active_creator_until?: string | null
          availability?: Json
          city?: string | null
          department?: string | null
          disciplines?: string[]
          etsy?: string | null
          id?: string
          instagram?: string | null
          insurance_doc_url?: string | null
          insurance_verified?: boolean
          is_active_creator?: boolean
          lat?: number | null
          lng?: number | null
          open_to_collab?: boolean
          page_settings?: Json | null
          portfolio_grid?: Json | null
          portfolio_images?: string[]
          postal_code?: string | null
          region?: string | null
          siret?: string | null
          siret_number?: string | null
          siret_verified?: boolean
          travel_radius?: Database["public"]["Enums"]["travel_radius"]
          user_id: string
          website?: string | null
        }
        Update: {
          active_creator_until?: string | null
          availability?: Json
          city?: string | null
          department?: string | null
          disciplines?: string[]
          etsy?: string | null
          id?: string
          instagram?: string | null
          insurance_doc_url?: string | null
          insurance_verified?: boolean
          is_active_creator?: boolean
          lat?: number | null
          lng?: number | null
          open_to_collab?: boolean
          page_settings?: Json | null
          portfolio_grid?: Json | null
          portfolio_images?: string[]
          postal_code?: string | null
          region?: string | null
          siret?: string | null
          siret_number?: string | null
          siret_verified?: boolean
          travel_radius?: Database["public"]["Enums"]["travel_radius"]
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          ref_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          ref_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          ref_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      deleted_user_backups: {
        Row: {
          backup_data: Json
          created_at: string | null
          deletion_requested_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          backup_data: Json
          created_at?: string | null
          deletion_requested_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          backup_data?: Json
          created_at?: string | null
          deletion_requested_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      discipline_proposals: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipline_proposals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_proposals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_analytics: {
        Row: {
          accepted_count: number | null
          event_id: string | null
          event_title: string
          fill_rate: number | null
          id: string
          organizer_id: string
          start_date: string | null
          total_applications: number | null
          updated_at: string | null
        }
        Insert: {
          accepted_count?: number | null
          event_id?: string | null
          event_title: string
          fill_rate?: number | null
          id?: string
          organizer_id: string
          start_date?: string | null
          total_applications?: number | null
          updated_at?: string | null
        }
        Update: {
          accepted_count?: number | null
          event_id?: string | null
          event_title?: string
          fill_rate?: number | null
          id?: string
          organizer_id?: string
          start_date?: string | null
          total_applications?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_analytics_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_campaigns: {
        Row: {
          click_rate: number | null
          created_at: string | null
          event_id: string
          id: string
          message: string
          open_rate: number | null
          sent_at: string | null
          status: string
          subject: string
          title: string
          updated_at: string | null
        }
        Insert: {
          click_rate?: number | null
          created_at?: string | null
          event_id: string
          id?: string
          message?: string
          open_rate?: number | null
          sent_at?: string | null
          status?: string
          subject?: string
          title?: string
          updated_at?: string | null
        }
        Update: {
          click_rate?: number | null
          created_at?: string | null
          event_id?: string
          id?: string
          message?: string
          open_rate?: number | null
          sent_at?: string | null
          status?: string
          subject?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_campaigns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checklists: {
        Row: {
          checklist_type: string
          created_at: string
          event_id: string
          id: string
          items: Json
          updated_at: string
        }
        Insert: {
          checklist_type: string
          created_at?: string
          event_id: string
          id?: string
          items?: Json
          updated_at?: string
        }
        Update: {
          checklist_type?: string
          created_at?: string
          event_id?: string
          id?: string
          items?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checklists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_exhibitor_fields: {
        Row: {
          created_at: string
          event_id: string
          field_label: string
          field_name: string
          field_order: number
          field_type: string
          id: string
          options: string[] | null
          required: boolean
        }
        Insert: {
          created_at?: string
          event_id: string
          field_label: string
          field_name: string
          field_order?: number
          field_type: string
          id?: string
          options?: string[] | null
          required?: boolean
        }
        Update: {
          created_at?: string
          event_id?: string
          field_label?: string
          field_name?: string
          field_order?: number
          field_type?: string
          id?: string
          options?: string[] | null
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "event_exhibitor_fields_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_exhibitor_reminders: {
        Row: {
          event_id: string
          exhibitor_id: string
          id: string
          reminder_number: number
          sent_at: string
        }
        Insert: {
          event_id: string
          exhibitor_id: string
          id?: string
          reminder_number: number
          sent_at?: string
        }
        Update: {
          event_id?: string
          exhibitor_id?: string
          id?: string
          reminder_number?: number
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_exhibitor_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_exhibitor_reminders_exhibitor_id_fkey"
            columns: ["exhibitor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_exhibitor_responses: {
        Row: {
          event_id: string
          exhibitor_id: string
          id: string
          rejection_reason: string | null
          response_data: Json
          status: string
          submitted_at: string
          tables_count: number
          updated_at: string
        }
        Insert: {
          event_id: string
          exhibitor_id: string
          id?: string
          rejection_reason?: string | null
          response_data?: Json
          status?: string
          submitted_at?: string
          tables_count?: number
          updated_at?: string
        }
        Update: {
          event_id?: string
          exhibitor_id?: string
          id?: string
          rejection_reason?: string | null
          response_data?: Json
          status?: string
          submitted_at?: string
          tables_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_exhibitor_responses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_exhibitor_responses_exhibitor_id_fkey"
            columns: ["exhibitor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_exhibitor_waitlist: {
        Row: {
          created_at: string
          event_id: string
          exhibitor_id: string
          id: string
          notified_at: string | null
          position: number
          reason: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          exhibitor_id: string
          id?: string
          notified_at?: string | null
          position: number
          reason?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          exhibitor_id?: string
          id?: string
          notified_at?: string | null
          position?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_exhibitor_waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_exhibitor_waitlist_exhibitor_id_fkey"
            columns: ["exhibitor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_faqs: {
        Row: {
          answer: string
          created_at: string
          event_id: string
          faq_order: number
          id: string
          keywords: string[] | null
          question: string
        }
        Insert: {
          answer: string
          created_at?: string
          event_id: string
          faq_order?: number
          id?: string
          keywords?: string[] | null
          question: string
        }
        Update: {
          answer?: string
          created_at?: string
          event_id?: string
          faq_order?: number
          id?: string
          keywords?: string[] | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_faqs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_generated_documents: {
        Row: {
          content: string
          doc_type: string
          event_id: string
          generated_at: string
          id: string
          storage_path: string | null
        }
        Insert: {
          content: string
          doc_type: string
          event_id: string
          generated_at?: string
          id?: string
          storage_path?: string | null
        }
        Update: {
          content?: string
          doc_type?: string
          event_id?: string
          generated_at?: string
          id?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_generated_documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_marketing_plan: {
        Row: {
          created_at: string
          deadlines_calendar: Json | null
          event_id: string
          export_pdf_path: string | null
          id: string
          media_contacts: Json | null
          press_release: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadlines_calendar?: Json | null
          event_id: string
          export_pdf_path?: string | null
          id?: string
          media_contacts?: Json | null
          press_release?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadlines_calendar?: Json | null
          event_id?: string
          export_pdf_path?: string | null
          id?: string
          media_contacts?: Json | null
          press_release?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_marketing_plan_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminder_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          event_id: string
          first_reminder_days: number | null
          id: string
          second_reminder_days: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          event_id: string
          first_reminder_days?: number | null
          id?: string
          second_reminder_days?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          event_id?: string
          first_reminder_days?: number | null
          id?: string
          second_reminder_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reminder_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_shifts: {
        Row: {
          assigned: number | null
          capacity: number | null
          created_at: string | null
          date: string | null
          description: string | null
          end_time: string | null
          event_id: string | null
          id: string
          max_volunteers: number | null
          role: string | null
          start_time: string | null
          time: string | null
        }
        Insert: {
          assigned?: number | null
          capacity?: number | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          end_time?: string | null
          event_id?: string | null
          id?: string
          max_volunteers?: number | null
          role?: string | null
          start_time?: string | null
          time?: string | null
        }
        Update: {
          assigned?: number | null
          capacity?: number | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          end_time?: string | null
          event_id?: string | null
          id?: string
          max_volunteers?: number | null
          role?: string | null
          start_time?: string | null
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_shifts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_stands: {
        Row: {
          created_at: string
          creator_id: string | null
          dimensions: string | null
          event_id: string
          id: string
          notes: string | null
          stand_number: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          dimensions?: string | null
          event_id: string
          id?: string
          notes?: string | null
          stand_number: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          dimensions?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          stand_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_stands_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_stands_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          creator_id: string
          deadline: string | null
          description: string | null
          event_id: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          creator_id: string
          deadline?: string | null
          description?: string | null
          event_id: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          creator_id?: string
          deadline?: string | null
          description?: string | null
          event_id?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tasks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_team: {
        Row: {
          created_at: string | null
          email: string | null
          event_id: string
          id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          event_id: string
          id?: string
          joined_at?: string
          role: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          event_id?: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_team_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_volunteers: {
        Row: {
          created_at: string | null
          email: string
          event_id: string
          id: string
          name: string
          shifts: string[] | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string
          event_id: string
          id?: string
          name?: string
          shifts?: string[] | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          event_id?: string
          id?: string
          name?: string
          shifts?: string[] | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_volunteers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          city: string | null
          cover_image: string | null
          created_at: string
          department: string | null
          description: string | null
          discipline_tags: string[]
          end_date: string
          end_time: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          faq: Json | null
          gallery_images: string[] | null
          id: string
          lat: number | null
          lng: number | null
          location: string | null
          media: string[]
          organizer_id: string
          pricing_model: string | null
          pricing_percent: number | null
          pricing_variable_max: number | null
          pricing_variable_min: number | null
          recurrence_dates: string[] | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          region: string | null
          rules: string | null
          stand_count: number
          stand_dimensions: string | null
          stand_price: number | null
          start_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["event_status"]
          stripe_enabled: boolean
          theme: string[]
          title: string
        }
        Insert: {
          city?: string | null
          cover_image?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          discipline_tags?: string[]
          end_date: string
          end_time?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          faq?: Json | null
          gallery_images?: string[] | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          media?: string[]
          organizer_id: string
          pricing_model?: string | null
          pricing_percent?: number | null
          pricing_variable_max?: number | null
          pricing_variable_min?: number | null
          recurrence_dates?: string[] | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          region?: string | null
          rules?: string | null
          stand_count?: number
          stand_dimensions?: string | null
          stand_price?: number | null
          start_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          stripe_enabled?: boolean
          theme?: string[]
          title: string
        }
        Update: {
          city?: string | null
          cover_image?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          discipline_tags?: string[]
          end_date?: string
          end_time?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          faq?: Json | null
          gallery_images?: string[] | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          media?: string[]
          organizer_id?: string
          pricing_model?: string | null
          pricing_percent?: number | null
          pricing_variable_max?: number | null
          pricing_variable_min?: number | null
          recurrence_dates?: string[] | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          region?: string | null
          rules?: string | null
          stand_count?: number
          stand_dimensions?: string | null
          stand_price?: number | null
          start_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          stripe_enabled?: boolean
          theme?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibitor_fields: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          field_name: string
          field_order: number | null
          field_type: string
          id: string
          is_required: boolean | null
          label: string
          max_length: number | null
          min_length: number | null
          options: string[] | null
          placeholder: string | null
          updated_at: string | null
          validation_pattern: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          field_name: string
          field_order?: number | null
          field_type: string
          id?: string
          is_required?: boolean | null
          label: string
          max_length?: number | null
          min_length?: number | null
          options?: string[] | null
          placeholder?: string | null
          updated_at?: string | null
          validation_pattern?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          field_name?: string
          field_order?: number | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          label?: string
          max_length?: number | null
          min_length?: number | null
          options?: string[] | null
          placeholder?: string | null
          updated_at?: string | null
          validation_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibitor_fields_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibitor_responses: {
        Row: {
          created_at: string | null
          event_id: string
          exhibitor_email: string
          exhibitor_name: string | null
          form_data: Json
          id: string
          organizer_notes: string | null
          reviewed_at: string | null
          status: string
          submitted_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          exhibitor_email: string
          exhibitor_name?: string | null
          form_data: Json
          id?: string
          organizer_notes?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          exhibitor_email?: string
          exhibitor_name?: string | null
          form_data?: Json
          id?: string
          organizer_notes?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibitor_responses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibitor_waitlist: {
        Row: {
          added_at: string | null
          event_id: string
          exhibitor_response_id: string
          id: string
          notified_at: string | null
          position: number
        }
        Insert: {
          added_at?: string | null
          event_id: string
          exhibitor_response_id: string
          id?: string
          notified_at?: string | null
          position: number
        }
        Update: {
          added_at?: string | null
          event_id?: string
          exhibitor_response_id?: string
          id?: string
          notified_at?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "exhibitor_waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibitor_waitlist_exhibitor_response_id_fkey"
            columns: ["exhibitor_response_id"]
            isOneToOne: false
            referencedRelation: "exhibitor_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_creators: {
        Row: {
          created_at: string | null
          creator_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_creators_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_creators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_events: {
        Row: {
          created_at: string | null
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string | null
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string | null
          followed_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary: {
        Row: {
          city: string | null
          created_at: string | null
          creator_id: string
          department: string | null
          end_date: string
          id: string
          is_public: boolean | null
          label: string
          lat: number | null
          lng: number | null
          region: string | null
          start_date: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          creator_id: string
          department?: string | null
          end_date: string
          id?: string
          is_public?: boolean | null
          label: string
          lat?: number | null
          lng?: number | null
          region?: string | null
          start_date: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          creator_id?: string
          department?: string | null
          end_date?: string
          id?: string
          is_public?: boolean | null
          label?: string
          lat?: number | null
          lng?: number | null
          region?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizer_profiles: {
        Row: {
          cover_image: string | null
          id: string
          instagram: string | null
          organization_name: string
          siret_number: string | null
          siret_verified: boolean
          user_id: string
          verification_doc_url: string | null
          verification_doc_verified: boolean
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          cover_image?: string | null
          id?: string
          instagram?: string | null
          organization_name: string
          siret_number?: string | null
          siret_verified?: boolean
          user_id: string
          verification_doc_url?: string | null
          verification_doc_verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          cover_image?: string | null
          id?: string
          instagram?: string | null
          organization_name?: string
          siret_number?: string | null
          siret_verified?: boolean
          user_id?: string
          verification_doc_url?: string | null
          verification_doc_verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_profiles_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          creator_id: string
          event_ref: string | null
          hashtags: string[]
          id: string
          images: string[]
          lat: number | null
          likes_count: number
          lng: number | null
          location_name: string | null
          post_type: string
        }
        Insert: {
          content: string
          created_at?: string
          creator_id: string
          event_ref?: string | null
          hashtags?: string[]
          id?: string
          images?: string[]
          lat?: number | null
          likes_count?: number
          lng?: number | null
          location_name?: string | null
          post_type?: string
        }
        Update: {
          content?: string
          created_at?: string
          creator_id?: string
          event_ref?: string | null
          hashtags?: string[]
          id?: string
          images?: string[]
          lat?: number | null
          likes_count?: number
          lng?: number | null
          location_name?: string | null
          post_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          external_link: string | null
          featured_event_id: string | null
          featured_until: string | null
          id: string
          images: string[] | null
          is_available: boolean | null
          price: number
          stock: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          external_link?: string | null
          featured_event_id?: string | null
          featured_until?: string | null
          id?: string
          images?: string[] | null
          is_available?: boolean | null
          price: number
          stock?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          external_link?: string | null
          featured_event_id?: string | null
          featured_until?: string | null
          id?: string
          images?: string[] | null
          is_available?: boolean | null
          price?: number
          stock?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_featured_event_id_fkey"
            columns: ["featured_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          id: string
          is_admin: boolean | null
          is_banned: boolean
          is_creator: boolean
          is_organizer: boolean
          onboarding_done: boolean
          push_token: string | null
          role: Database["public"]["Enums"]["user_role"]
          show_real_name: boolean
          subscription_tier: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          full_name: string
          id: string
          is_admin?: boolean | null
          is_banned?: boolean
          is_creator?: boolean
          is_organizer?: boolean
          onboarding_done?: boolean
          push_token?: string | null
          role: Database["public"]["Enums"]["user_role"]
          show_real_name?: boolean
          subscription_tier?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_admin?: boolean | null
          is_banned?: boolean
          is_creator?: boolean
          is_organizer?: boolean
          onboarding_done?: boolean
          push_token?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          show_real_name?: boolean
          subscription_tier?: string
          username?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_taken: string | null
          created_at: string
          description: string | null
          id: string
          ip_address: unknown
          reason: string
          reported_event_id: string | null
          reported_post_id: string | null
          reported_user_id: string | null
          reporter_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          reason: string
          reported_event_id?: string | null
          reported_post_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          reason?: string
          reported_event_id?: string | null
          reported_post_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_event_id_fkey"
            columns: ["reported_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string
          id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          reviewer_role: Database["public"]["Enums"]["reviewer_role"]
          tags: string[]
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id: string
          id?: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          reviewer_role: Database["public"]["Enums"]["reviewer_role"]
          tags?: string[]
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string
          id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
          reviewer_role?: Database["public"]["Enums"]["reviewer_role"]
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "event_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_inquiries: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          message: string
          replied_at: string | null
          reply: string | null
          updated_at: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          message: string
          replied_at?: string | null
          reply?: string | null
          updated_at?: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          message?: string
          replied_at?: string | null
          reply?: string | null
          updated_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_inquiries_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_inquiries_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_assignments: {
        Row: {
          activity: string
          checked_in: boolean
          created_at: string
          end_time: string
          event_id: string
          id: string
          start_time: string
          volunteer_id: string
        }
        Insert: {
          activity: string
          checked_in?: boolean
          created_at?: string
          end_time: string
          event_id: string
          id?: string
          start_time: string
          volunteer_id: string
        }
        Update: {
          activity?: string
          checked_in?: boolean
          created_at?: string
          end_time?: string
          event_id?: string
          id?: string
          start_time?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_availability: {
        Row: {
          available_slots: Json
          event_id: string
          id: string
          preferred_activities: string[] | null
          submitted_at: string
          volunteer_id: string
        }
        Insert: {
          available_slots?: Json
          event_id: string
          id?: string
          preferred_activities?: string[] | null
          submitted_at?: string
          volunteer_id: string
        }
        Update: {
          available_slots?: Json
          event_id?: string
          id?: string
          preferred_activities?: string[] | null
          submitted_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_availability_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_availability_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_shifts: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          event_id: string | null
          id: string
          max_volunteers: number | null
          role: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_id?: string | null
          id?: string
          max_volunteers?: number | null
          role?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_id?: string | null
          id?: string
          max_volunteers?: number | null
          role?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_shifts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      delete_user: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      log_audit_action: {
        Args: {
          p_accessed_sensitive?: boolean
          p_action: string
          p_changes?: Json
          p_description?: string
          p_ip_address?: unknown
          p_resource_id?: string
          p_resource_type: string
          p_sensitive_fields?: string[]
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      application_status: "pending" | "accepted" | "refused"
      event_status: "draft" | "published" | "closed"
      event_type:
        | "permanent"
        | "seasonal"
        | "popup"
        | "salon"
        | "fair"
        | "marche"
      reviewer_role: "creator" | "organizer"
      travel_radius: "5" | "10" | "25" | "national"
      user_role: "creator" | "organizer" | "visitor" | "admin"
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
      application_status: ["pending", "accepted", "refused"],
      event_status: ["draft", "published", "closed"],
      event_type: ["permanent", "seasonal", "popup", "salon", "fair", "marche"],
      reviewer_role: ["creator", "organizer"],
      travel_radius: ["5", "10", "25", "national"],
      user_role: ["creator", "organizer", "visitor", "admin"],
    },
  },
} as const

