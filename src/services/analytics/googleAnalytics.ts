
// Google Analytics service for tracking events and page views
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = 'G-2KS1ZW7BFC';

// Track page views
export const trackPageView = (path: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: path,
    });
  }
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track user interactions
export const trackUserEvent = {
  login: (method: string) => trackEvent('login', 'user', method),
  signup: (method: string) => trackEvent('sign_up', 'user', method),
  logout: () => trackEvent('logout', 'user'),
  shareArticle: (articleId: string) => trackEvent('share', 'engagement', articleId),
  bookmarkArticle: (articleId: string) => trackEvent('bookmark', 'engagement', articleId),
  likePost: (postId: string) => trackEvent('like', 'engagement', postId),
  viewMarket: (symbol: string) => trackEvent('view_market', 'market', symbol),
  searchQuery: (query: string) => trackEvent('search', 'search', query),
};

// New analytics events for comprehensive tracking
export const trackEvents = {
  landingView: () => trackEvent('landing_view', 'page'),
  authOpen: () => trackEvent('auth_open', 'auth'),
  signupSuccess: (method: string) => trackEvent('signup_success', 'auth', method),
  loginSuccess: (method: string) => trackEvent('login_success', 'auth', method),
  upvote: (postId: string) => trackEvent('upvote', 'engagement', postId),
  downvote: (postId: string) => trackEvent('downvote', 'engagement', postId),
  comment: (postId: string) => trackEvent('comment', 'engagement', postId),
  repost: (postId: string) => trackEvent('repost', 'engagement', postId),
  share: (type: string, id: string) => trackEvent('share', 'engagement', `${type}:${id}`),
  messageSend: () => trackEvent('message_send', 'messaging'),
  // Edit Profile events
  editProfileOpen: () => trackEvent('edit_profile_open', 'profile'),
  mobileVerifyStart: () => trackEvent('mobile_verify_start', 'verification'),
  mobileVerifySuccess: () => trackEvent('mobile_verify_success', 'verification'),
  linkedinConnect: () => trackEvent('linkedin_connect', 'verification'),
  profileSave: () => trackEvent('profile_save', 'profile'),
};
