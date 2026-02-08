-- Add 'repost' value to post_type enum for Issue #2
ALTER TYPE post_type ADD VALUE IF NOT EXISTS 'repost';
