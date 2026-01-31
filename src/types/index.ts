
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  published_at: string;
  thumbnail_url?: string;
  relevance_score: number;
}

// Circle related types
export interface Circle {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  created_at: string;
  created_by: string;
  member_count?: number;
  post_count?: number;
  hasNewPost?: boolean; // Added missing property
}

export interface CircleInsert {
  name: string;
  type: 'public' | 'private';
  description?: string;
  created_by: string;
}

export interface CircleUpdate {
  name?: string;
  type?: 'public' | 'private';
  description?: string;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: 'admin' | 'co-admin' | 'member';
  created_at: string;
  profile?: Profile;
}

export interface CirclePost {
  id: string;
  circle_id: string;
  post_id: string;
  is_pinned?: boolean;
  created_at: string;
}

export interface EnhancedPost extends Post {
  is_pinned?: boolean;
  author?: Profile;
  category?: Category;
  isLiked?: boolean;
  isBookmarked?: boolean;
  type?: 'insight' | 'question' | 'opinion' | 'link' | 'media' | 'poll' | 'news';
}

// Post related types
export interface Post {
  id: string;
  title: string;
  content: string;
  user_id: string;
  category_id?: string;
  likes: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  like_count?: number;
  share_count?: number;
  type?: 'insight' | 'question' | 'opinion' | 'link' | 'media' | 'poll' | 'news';
}

// Comment related types
export interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  author?: Profile; // Added missing property
  edited?: boolean; // Added missing property
  replies?: Comment[]; // Added missing property
}

export interface CommentInsert {
  content: string;
  user_id: string;
  post_id: string;
  parent_id?: string;
}

export interface CommentUpdate {
  content: string;
}

// Profile related types
export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  is_verified?: boolean;
  role: 'user' | 'expert' | 'admin';
}

// Engagement related types
export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface LikeInsert {
  user_id: string;
  post_id: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface BookmarkInsert {
  user_id: string;
  post_id: string;
}

// Share related types
export enum ShareType {
  SOCIAL = 'social',
  INTERNAL = 'internal',
  EMAIL = 'email',
  PUBLIC = 'public', // Added missing values to match what's used in the code
  USER = 'user',
  CIRCLE = 'circle'
}

export interface PostShare {
  id: string;
  user_id: string;
  post_id: string;
  share_type: ShareType;
  target_id?: string;
  commentary?: string;
  created_at: string;
  sharer?: any; // Added to support the sharer property
}

export interface PostShareInsert {
  user_id: string;
  post_id: string;
  share_type: ShareType;
  target_id?: string;
  commentary?: string;
}

// Category related types
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  post_count: number;
  created_at: string;
  updated_at: string;
}

// Analytics related types
export interface AnalyticsMetric {
  id: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  entity_id?: string;
  entity_type?: string;
  date_recorded: string;
  created_at: string;
}

// Re-export types from profile.ts
export * from './profile';
