
// Re-export types
export type {
  User,
  Comment,
  Category,
  Message
} from './types';

// Export individual services
// Note: authService was removed as it contained legacy mock auth code
// Use AuthContext with Supabase for authentication
export * from './userService';
export * from './categoryService';
export * from './messageService';

// Create a consolidated API service object for backward compatibility
import { userService } from './userService';
import { categoryService } from './categoryService';
import { messageService } from './messageService';

// API service object with all services
export const apiService = {
  ...userService,
  ...categoryService,
  ...messageService
};
