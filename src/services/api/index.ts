
// Re-export types
export type {
  User,
  Comment,
  Category,
  Message
} from './types';

// Export individual services
export * from './authService';
export * from './userService';
export * from './categoryService';
export * from './messageService';

// Create a consolidated API service object for backward compatibility
import { authService } from './authService';
import { userService } from './userService';
import { categoryService } from './categoryService';
import { messageService } from './messageService';

// API service object with all services
export const apiService = {
  ...authService,
  ...userService,
  ...categoryService,
  ...messageService
};
