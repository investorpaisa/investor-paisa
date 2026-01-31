// Database types for InvestorPaisa
// These complement the auto-generated Supabase types

export type UserRole = 'learner' | 'creator' | 'expert' | 'admin';
export type TrustLevel = 'newbie' | 'member' | 'trusted' | 'expert' | 'legend';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type PostType = 'question' | 'tip' | 'thread' | 'video' | 'poll' | 'link_converted' | 'insight';
export type ReactionType = 'like' | 'upvote' | 'downvote' | 'save';
export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'answer' | 'system' | 'live_session' | 'badge';
export type SessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type ModerationStatus = 'pending' | 'approved' | 'quarantined' | 'rejected';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  headline: string | null;
  language: string;
  location: string | null;
  website: string | null;
  goals: string[];
  interests: string[];
  trust_level: TrustLevel;
  trust_score: number;
  is_verified: boolean;
  is_premium: boolean;
  is_expert: boolean;
  onboarding_completed: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  portfolio_value: number | null;
  portfolio_change: number | null;
  mobile_verified: boolean;
  linkedin_verified: boolean;
  linkedin_id: string | null;
  phone: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  type: PostType;
  title: string | null;
  body: string | null;
  body_html: string | null;
  media_urls: string[];
  link_url: string | null;
  link_preview: Record<string, unknown> | null;
  poll_data: Record<string, unknown> | null;
  ai_generated: boolean;
  ai_rewritten: boolean;
  is_pinned: boolean;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  save_count: number;
  upvote_count: number;
  downvote_count: number;
  moderation_status: ModerationStatus;
  moderation_score: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined data
  author?: Profile;
  topics?: Topic[];
  tags?: Tag[];
}

export interface Answer {
  id: string;
  post_id: string;
  author_id: string;
  body_simple: string | null;
  body_detailed: string | null;
  body_steps: Record<string, unknown> | null;
  ai_generated: boolean;
  upvote_count: number;
  downvote_count: number;
  is_accepted: boolean;
  is_verified: boolean;
  moderation_status: ModerationStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: Profile;
}

export interface Comment {
  id: string;
  entity_type: 'post' | 'answer';
  entity_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  like_count: number;
  is_pinned: boolean;
  moderation_status: ModerationStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined data
  author?: Profile;
  replies?: Comment[];
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  post_count: number;
  follower_count: number;
  is_trending: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
  is_trending: boolean;
  weekly_count: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown>;
  is_read: boolean;
  actor_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  // Joined data
  actor?: Profile;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  participants?: Profile[];
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  media_urls: string[];
  status: MessageStatus;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined data
  sender?: Profile;
}

export interface ExpertProfile {
  id: string;
  user_id: string;
  credentials: string | null;
  license_id: string | null;
  license_verified: boolean;
  verification_status: VerificationStatus;
  specializations: string[];
  years_experience: number | null;
  firm_name: string | null;
  sebi_registered: boolean;
  rating: number;
  session_count: number;
  follower_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: Profile;
}

export interface LiveSession {
  id: string;
  expert_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  start_time: string;
  duration_minutes: number;
  status: SessionStatus;
  max_participants: number;
  participant_count: number;
  topics: string[];
  is_free: boolean;
  price: number | null;
  recording_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  expert?: Profile;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  user_id: string;
  entity_type: 'post' | 'answer' | 'comment';
  entity_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  entity_type: 'post' | 'answer';
  entity_id: string;
  collection_name: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  points: number;
  criteria: Record<string, unknown> | null;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
