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
      ai_requests: {
        Row: {
          completion_tokens: number | null
          created_at: string
          error_message: string | null
          id: string
          latency_ms: number | null
          model: string
          prompt_tokens: number | null
          request_type: string
          status: string | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model: string
          prompt_tokens?: number | null
          request_type: string
          status?: string | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model?: string
          prompt_tokens?: number | null
          request_type?: string
          status?: string | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      answers: {
        Row: {
          ai_generated: boolean | null
          author_id: string
          body_detailed: string | null
          body_simple: string | null
          body_steps: Json | null
          created_at: string
          downvote_count: number | null
          id: string
          is_accepted: boolean | null
          is_verified: boolean | null
          moderation_status:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          post_id: string
          updated_at: string
          upvote_count: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          author_id: string
          body_detailed?: string | null
          body_simple?: string | null
          body_steps?: Json | null
          created_at?: string
          downvote_count?: number | null
          id?: string
          is_accepted?: boolean | null
          is_verified?: boolean | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          post_id: string
          updated_at?: string
          upvote_count?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          author_id?: string
          body_detailed?: string | null
          body_simple?: string | null
          body_steps?: Json | null
          created_at?: string
          downvote_count?: number | null
          id?: string
          is_accepted?: boolean | null
          is_verified?: boolean | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          post_id?: string
          updated_at?: string
          upvote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_providers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          phone: string | null
          provider: string
          provider_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          phone?: string | null
          provider: string
          provider_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          phone?: string | null
          provider?: string
          provider_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          color: string | null
          created_at: string
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
          points: number | null
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points?: number | null
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points?: number | null
          slug?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          collection_name: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          collection_name?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          collection_name?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_pinned: boolean | null
          like_count: number | null
          moderation_status:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_pinned?: boolean | null
          like_count?: number | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_pinned?: boolean | null
          like_count?: number | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          is_closed: boolean | null
          logo_url: string | null
          member_count: number | null
          name: string
          objective: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          is_closed?: boolean | null
          logo_url?: string | null
          member_count?: number | null
          name: string
          objective?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          is_closed?: boolean | null
          logo_url?: string | null
          member_count?: number | null
          name?: string
          objective?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_muted: boolean | null
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_group: boolean | null
          name: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_group?: boolean | null
          name?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_group?: boolean | null
          name?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      device_sessions: {
        Row: {
          created_at: string
          device_name: string | null
          device_type: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          last_active_at: string | null
          refresh_token_hash: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          last_active_at?: string | null
          refresh_token_hash?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          last_active_at?: string | null
          refresh_token_hash?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_otp_requests: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp_hash: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          otp_hash: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_data: Json | null
          event_name: string
          id: string
          ip_address: unknown
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_data?: Json | null
          event_name: string
          id?: string
          ip_address?: unknown
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_data?: Json | null
          event_name?: string
          id?: string
          ip_address?: unknown
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expert_profiles: {
        Row: {
          created_at: string
          credentials: string | null
          firm_name: string | null
          follower_count: number | null
          id: string
          license_id: string | null
          license_verified: boolean | null
          rating: number | null
          sebi_registered: boolean | null
          session_count: number | null
          specializations: string[] | null
          updated_at: string
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          credentials?: string | null
          firm_name?: string | null
          follower_count?: number | null
          id?: string
          license_id?: string | null
          license_verified?: boolean | null
          rating?: number | null
          sebi_registered?: boolean | null
          session_count?: number | null
          specializations?: string[] | null
          updated_at?: string
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          credentials?: string | null
          firm_name?: string | null
          follower_count?: number | null
          id?: string
          license_id?: string | null
          license_verified?: boolean | null
          rating?: number | null
          sebi_registered?: boolean | null
          session_count?: number | null
          specializations?: string[] | null
          updated_at?: string
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          years_experience?: number | null
        }
        Relationships: []
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
      live_sessions: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          expert_id: string
          id: string
          is_free: boolean | null
          max_participants: number | null
          participant_count: number | null
          price: number | null
          recording_url: string | null
          start_time: string
          status: Database["public"]["Enums"]["session_status"] | null
          title: string
          topics: string[] | null
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          expert_id: string
          id?: string
          is_free?: boolean | null
          max_participants?: number | null
          participant_count?: number | null
          price?: number | null
          recording_url?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["session_status"] | null
          title: string
          topics?: string[] | null
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          expert_id?: string
          id?: string
          is_free?: boolean | null
          max_participants?: number | null
          participant_count?: number | null
          price?: number | null
          recording_url?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["session_status"] | null
          title?: string
          topics?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      market_crypto: {
        Row: {
          change: number | null
          high_24h: number | null
          id: string
          low_24h: number | null
          market_cap: number | null
          percent_change: number | null
          price: number
          provider: string
          symbol: string
          timestamp: string
          updated_at: string
          volume_24h: number | null
        }
        Insert: {
          change?: number | null
          high_24h?: number | null
          id?: string
          low_24h?: number | null
          market_cap?: number | null
          percent_change?: number | null
          price: number
          provider: string
          symbol: string
          timestamp: string
          updated_at?: string
          volume_24h?: number | null
        }
        Update: {
          change?: number | null
          high_24h?: number | null
          id?: string
          low_24h?: number | null
          market_cap?: number | null
          percent_change?: number | null
          price?: number
          provider?: string
          symbol?: string
          timestamp?: string
          updated_at?: string
          volume_24h?: number | null
        }
        Relationships: []
      }
      market_forex: {
        Row: {
          ask: number | null
          bid: number | null
          change: number | null
          id: string
          pair: string
          percent_change: number | null
          provider: string
          rate: number
          timestamp: string
          updated_at: string
        }
        Insert: {
          ask?: number | null
          bid?: number | null
          change?: number | null
          id?: string
          pair: string
          percent_change?: number | null
          provider: string
          rate: number
          timestamp: string
          updated_at?: string
        }
        Update: {
          ask?: number | null
          bid?: number | null
          change?: number | null
          id?: string
          pair?: string
          percent_change?: number | null
          provider?: string
          rate?: number
          timestamp?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_indicators: {
        Row: {
          created_at: string
          id: string
          indicator: string
          interval: string
          period: number
          provider: string
          symbol: string
          timestamp: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          indicator: string
          interval: string
          period: number
          provider: string
          symbol: string
          timestamp: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          indicator?: string
          interval?: string
          period?: number
          provider?: string
          symbol?: string
          timestamp?: string
          value?: Json
        }
        Relationships: []
      }
      market_ohlc: {
        Row: {
          close: number
          created_at: string
          high: number
          id: string
          interval: string
          low: number
          open: number
          provider: string
          symbol: string
          timestamp: string
          volume: number | null
        }
        Insert: {
          close: number
          created_at?: string
          high: number
          id?: string
          interval: string
          low: number
          open: number
          provider: string
          symbol: string
          timestamp: string
          volume?: number | null
        }
        Update: {
          close?: number
          created_at?: string
          high?: number
          id?: string
          interval?: string
          low?: number
          open?: number
          provider?: string
          symbol?: string
          timestamp?: string
          volume?: number | null
        }
        Relationships: []
      }
      market_quotes: {
        Row: {
          change: number | null
          high: number | null
          id: string
          low: number | null
          market_type: string
          open: number | null
          percent_change: number | null
          previous_close: number | null
          price: number
          provider: string
          symbol: string
          timestamp: string
          updated_at: string
          volume: number | null
        }
        Insert: {
          change?: number | null
          high?: number | null
          id?: string
          low?: number | null
          market_type?: string
          open?: number | null
          percent_change?: number | null
          previous_close?: number | null
          price: number
          provider: string
          symbol: string
          timestamp: string
          updated_at?: string
          volume?: number | null
        }
        Update: {
          change?: number | null
          high?: number | null
          id?: string
          low?: number | null
          market_type?: string
          open?: number | null
          percent_change?: number | null
          previous_close?: number | null
          price?: number
          provider?: string
          symbol?: string
          timestamp?: string
          updated_at?: string
          volume?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          deleted_at: string | null
          id: string
          media_urls: string[] | null
          reply_to_id: string | null
          sender_id: string
          status: Database["public"]["Enums"]["message_status"] | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          media_urls?: string[] | null
          reply_to_id?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          media_urls?: string[] | null
          reply_to_id?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string
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
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_otp_requests: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          otp_code: string
          phone_number: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          otp_code: string
          phone_number: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          phone_number?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      moderation_queue: {
        Row: {
          ai_decision: Database["public"]["Enums"]["moderation_status"] | null
          author_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          human_decision:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_reasons: string[] | null
          risk_score: number | null
        }
        Insert: {
          ai_decision?: Database["public"]["Enums"]["moderation_status"] | null
          author_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          human_decision?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_reasons?: string[] | null
          risk_score?: number | null
        }
        Update: {
          ai_decision?: Database["public"]["Enums"]["moderation_status"] | null
          author_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          human_decision?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_reasons?: string[] | null
          risk_score?: number | null
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          category: string
          country: string | null
          created_at: string
          id: string
          image_url: string | null
          published_at: string
          relevance_score: number
          source: string
          summary: string | null
          thumbnail_url: string | null
          title: string
          url: string
        }
        Insert: {
          category: string
          country?: string | null
          created_at?: string
          id: string
          image_url?: string | null
          published_at?: string
          relevance_score?: number
          source: string
          summary?: string | null
          thumbnail_url?: string | null
          title: string
          url: string
        }
        Update: {
          category?: string
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string
          relevance_score?: number
          source?: string
          summary?: string | null
          thumbnail_url?: string | null
          title?: string
          url?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          payload: Json | null
          title: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          payload?: Json | null
          title?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          payload?: Json | null
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      post_topics: {
        Row: {
          post_id: string
          topic_id: string
        }
        Insert: {
          post_id: string
          topic_id: string
        }
        Update: {
          post_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_topics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          ai_generated: boolean | null
          ai_rewritten: boolean | null
          author_id: string
          body: string | null
          body_html: string | null
          comment_count: number | null
          community_id: string | null
          created_at: string
          deleted_at: string | null
          downvote_count: number | null
          id: string
          is_featured: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          link_preview: Json | null
          link_url: string | null
          media_urls: string[] | null
          moderation_score: number | null
          moderation_status:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          poll_data: Json | null
          save_count: number | null
          share_count: number | null
          title: string | null
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string
          upvote_count: number | null
          view_count: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          ai_rewritten?: boolean | null
          author_id: string
          body?: string | null
          body_html?: string | null
          comment_count?: number | null
          community_id?: string | null
          created_at?: string
          deleted_at?: string | null
          downvote_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          link_preview?: Json | null
          link_url?: string | null
          media_urls?: string[] | null
          moderation_score?: number | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          poll_data?: Json | null
          save_count?: number | null
          share_count?: number | null
          title?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          upvote_count?: number | null
          view_count?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          ai_rewritten?: boolean | null
          author_id?: string
          body?: string | null
          body_html?: string | null
          comment_count?: number | null
          community_id?: string | null
          created_at?: string
          deleted_at?: string | null
          downvote_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          link_preview?: Json | null
          link_url?: string | null
          media_urls?: string[] | null
          moderation_score?: number | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          poll_data?: Json | null
          save_count?: number | null
          share_count?: number | null
          title?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          upvote_count?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          email: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          goals: string[] | null
          headline: string | null
          id: string
          instagram_url: string | null
          interests: string[] | null
          is_expert: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          language: string | null
          linkedin_id: string | null
          linkedin_url: string | null
          linkedin_verified: boolean | null
          location: string | null
          mobile_verified: boolean | null
          onboarding_completed: boolean | null
          phone: string | null
          portfolio_change: number | null
          portfolio_value: number | null
          posts_count: number | null
          privacy_certifications: boolean | null
          privacy_education: boolean | null
          privacy_experience: boolean | null
          privacy_skills: boolean | null
          profile_completeness_score: number | null
          streak_days: number | null
          tier: Database["public"]["Enums"]["user_tier"] | null
          trust_level: Database["public"]["Enums"]["trust_level"] | null
          trust_score: number | null
          twitter_url: string | null
          updated_at: string
          upvote_rate: number | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          goals?: string[] | null
          headline?: string | null
          id: string
          instagram_url?: string | null
          interests?: string[] | null
          is_expert?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          linkedin_id?: string | null
          linkedin_url?: string | null
          linkedin_verified?: boolean | null
          location?: string | null
          mobile_verified?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          portfolio_change?: number | null
          portfolio_value?: number | null
          posts_count?: number | null
          privacy_certifications?: boolean | null
          privacy_education?: boolean | null
          privacy_experience?: boolean | null
          privacy_skills?: boolean | null
          profile_completeness_score?: number | null
          streak_days?: number | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          trust_level?: Database["public"]["Enums"]["trust_level"] | null
          trust_score?: number | null
          twitter_url?: string | null
          updated_at?: string
          upvote_rate?: number | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          goals?: string[] | null
          headline?: string | null
          id?: string
          instagram_url?: string | null
          interests?: string[] | null
          is_expert?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          linkedin_id?: string | null
          linkedin_url?: string | null
          linkedin_verified?: boolean | null
          location?: string | null
          mobile_verified?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          portfolio_change?: number | null
          portfolio_value?: number | null
          posts_count?: number | null
          privacy_certifications?: boolean | null
          privacy_education?: boolean | null
          privacy_experience?: boolean | null
          privacy_skills?: boolean | null
          profile_completeness_score?: number | null
          streak_days?: number | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          trust_level?: Database["public"]["Enums"]["trust_level"] | null
          trust_score?: number | null
          twitter_url?: string | null
          updated_at?: string
          upvote_rate?: number | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string | null
          ends_at: string | null
          entity_id: string
          id: string
          is_active: boolean | null
          priority: number | null
          starts_at: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          entity_id: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          starts_at?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          entity_id?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          starts_at?: string | null
          type?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reaction_type?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          reward_given: boolean | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          reward_given?: boolean | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_given?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      reposts: {
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
            foreignKeyName: "reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          clicked_result_id: string | null
          clicked_result_type: string | null
          created_at: string
          id: string
          query: string
          result_count: number | null
          user_id: string | null
        }
        Insert: {
          clicked_result_id?: string | null
          clicked_result_type?: string | null
          created_at?: string
          id?: string
          query: string
          result_count?: number | null
          user_id?: string | null
        }
        Update: {
          clicked_result_id?: string | null
          clicked_result_type?: string | null
          created_at?: string
          id?: string
          query?: string
          result_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          price: number | null
          provider_id: string
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          price?: number | null
          provider_id: string
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          price?: number | null
          provider_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      session_participants: {
        Row: {
          id: string
          joined_at: string | null
          left_at: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_suggestions: {
        Row: {
          category: string | null
          id: string
          name: string
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          id?: string
          name: string
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          id?: string
          name?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          is_trending: boolean | null
          name: string
          slug: string
          usage_count: number | null
          weekly_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_trending?: boolean | null
          name: string
          slug: string
          usage_count?: number | null
          weekly_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_trending?: boolean | null
          name?: string
          slug?: string
          usage_count?: number | null
          weekly_count?: number | null
        }
        Relationships: []
      }
      topic_follows: {
        Row: {
          created_at: string
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_follows_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          follower_count: number | null
          icon: string | null
          id: string
          is_trending: boolean | null
          name: string
          post_count: number | null
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          follower_count?: number | null
          icon?: string | null
          id?: string
          is_trending?: boolean | null
          name: string
          post_count?: number | null
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          follower_count?: number | null
          icon?: string | null
          id?: string
          is_trending?: boolean | null
          name?: string
          post_count?: number | null
          slug?: string
        }
        Relationships: []
      }
      trust_events: {
        Row: {
          created_at: string
          delta: number
          event_type: Database["public"]["Enums"]["trust_event_type"]
          id: string
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          event_type: Database["public"]["Enums"]["trust_event_type"]
          id?: string
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          event_type?: Database["public"]["Enums"]["trust_event_type"]
          id?: string
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
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
        ]
      }
      user_certifications: {
        Row: {
          created_at: string | null
          credential_id: string | null
          credential_url: string | null
          expiry_month: number | null
          expiry_year: number | null
          id: string
          issue_month: number | null
          issue_year: number | null
          issuing_organization: string
          name: string
          no_expiry: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          expiry_month?: number | null
          expiry_year?: number | null
          id?: string
          issue_month?: number | null
          issue_year?: number | null
          issuing_organization: string
          name: string
          no_expiry?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          expiry_month?: number | null
          expiry_year?: number | null
          id?: string
          issue_month?: number | null
          issue_year?: number | null
          issuing_organization?: string
          name?: string
          no_expiry?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_educations: {
        Row: {
          created_at: string | null
          degree: string | null
          description: string | null
          end_month: number | null
          end_year: number | null
          field_of_study: string | null
          id: string
          is_current: boolean | null
          school: string
          start_month: number | null
          start_year: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          degree?: string | null
          description?: string | null
          end_month?: number | null
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          is_current?: boolean | null
          school: string
          start_month?: number | null
          start_year?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          degree?: string | null
          description?: string | null
          end_month?: number | null
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          is_current?: boolean | null
          school?: string
          start_month?: number | null
          start_year?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_educations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_educations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_experiences: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          end_month: number | null
          end_year: number | null
          id: string
          is_current: boolean | null
          location: string | null
          start_month: number | null
          start_year: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          end_month?: number | null
          end_year?: number | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          start_month?: number | null
          start_year?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          end_month?: number | null
          end_year?: number | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          start_month?: number | null
          start_year?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_experiences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_experiences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          created_at: string | null
          id: string
          skill_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          skill_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          skill_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          goals: string[] | null
          headline: string | null
          id: string | null
          instagram_url: string | null
          interests: string[] | null
          is_expert: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          linkedin_url: string | null
          location: string | null
          posts_count: number | null
          privacy_certifications: boolean | null
          privacy_education: boolean | null
          privacy_experience: boolean | null
          privacy_skills: boolean | null
          profile_completeness_score: number | null
          tier: Database["public"]["Enums"]["user_tier"] | null
          trust_level: Database["public"]["Enums"]["trust_level"] | null
          trust_score: number | null
          twitter_url: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          goals?: string[] | null
          headline?: string | null
          id?: string | null
          instagram_url?: string | null
          interests?: string[] | null
          is_expert?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          posts_count?: number | null
          privacy_certifications?: boolean | null
          privacy_education?: boolean | null
          privacy_experience?: boolean | null
          privacy_skills?: boolean | null
          profile_completeness_score?: number | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          trust_level?: Database["public"]["Enums"]["trust_level"] | null
          trust_score?: number | null
          twitter_url?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          goals?: string[] | null
          headline?: string | null
          id?: string | null
          instagram_url?: string | null
          interests?: string[] | null
          is_expert?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          posts_count?: number | null
          privacy_certifications?: boolean | null
          privacy_education?: boolean | null
          privacy_experience?: boolean | null
          privacy_skills?: boolean | null
          profile_completeness_score?: number | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          trust_level?: Database["public"]["Enums"]["trust_level"] | null
          trust_score?: number | null
          twitter_url?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_email_otps: { Args: never; Returns: undefined }
      compute_profile_completeness: {
        Args: { p_user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      message_status: "sent" | "delivered" | "read"
      moderation_status: "pending" | "approved" | "quarantined" | "rejected"
      notification_type:
        | "like"
        | "comment"
        | "follow"
        | "mention"
        | "answer"
        | "system"
        | "live_session"
        | "badge"
        | "message"
        | "community_post"
        | "tier_change"
      post_type:
        | "question"
        | "tip"
        | "thread"
        | "video"
        | "poll"
        | "link_converted"
        | "insight"
      reaction_type: "like" | "upvote" | "downvote" | "save"
      session_status: "scheduled" | "live" | "ended" | "cancelled"
      trust_event_type:
        | "post_created"
        | "answer_accepted"
        | "upvote_received"
        | "downvote_received"
        | "report_received"
        | "verified"
        | "badge_earned"
      trust_level: "newbie" | "member" | "trusted" | "expert" | "legend"
      user_role: "learner" | "creator" | "expert" | "admin"
      user_tier:
        | "guest"
        | "unverified_user"
        | "verified_user"
        | "influencer"
        | "expert"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
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
      message_status: ["sent", "delivered", "read"],
      moderation_status: ["pending", "approved", "quarantined", "rejected"],
      notification_type: [
        "like",
        "comment",
        "follow",
        "mention",
        "answer",
        "system",
        "live_session",
        "badge",
        "message",
        "community_post",
        "tier_change",
      ],
      post_type: [
        "question",
        "tip",
        "thread",
        "video",
        "poll",
        "link_converted",
        "insight",
      ],
      reaction_type: ["like", "upvote", "downvote", "save"],
      session_status: ["scheduled", "live", "ended", "cancelled"],
      trust_event_type: [
        "post_created",
        "answer_accepted",
        "upvote_received",
        "downvote_received",
        "report_received",
        "verified",
        "badge_earned",
      ],
      trust_level: ["newbie", "member", "trusted", "expert", "legend"],
      user_role: ["learner", "creator", "expert", "admin"],
      user_tier: [
        "guest",
        "unverified_user",
        "verified_user",
        "influencer",
        "expert",
      ],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
