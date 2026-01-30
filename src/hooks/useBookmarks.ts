import { useState } from 'react';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const addBookmark = async (entityId: string) => setBookmarks(prev => [...prev, entityId]);
  const removeBookmark = async (entityId: string) => setBookmarks(prev => prev.filter(id => id !== entityId));
  const isBookmarked = (entityId: string) => bookmarks.includes(entityId);
  return { bookmarks, bookmarkedPosts: [], addBookmark, removeBookmark, isBookmarked, loading: false, error: null };
};
