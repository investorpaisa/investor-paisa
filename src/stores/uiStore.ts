import { create } from 'zustand';

type FeedTab = 'pulse' | 'learn' | 'following';
type AskSheetState = 'closed' | 'opening' | 'open' | 'submitting' | 'error';
type AnswerSheetState = 'closed' | 'generating' | 'open' | 'submitting' | 'error';

interface UIState {
  // Sidebar
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  
  // Modals
  isSearchOpen: boolean;
  isCreatePostOpen: boolean;
  isCommandPaletteOpen: boolean;
  
  // Feed
  activeFeedTab: FeedTab;
  
  // Ask Sheet (Pi Copilot)
  askSheetState: AskSheetState;
  isAskSheetOpen: boolean;
  
  // Answer Sheet
  answerSheetState: AnswerSheetState;
  isAnswerSheetOpen: boolean;
  activePostForAnswer: string | null;
  
  // Create Hub
  isCreateHubOpen: boolean;
  
  // Live Session
  activeLiveSession: string | null;
  
  // Auth Gate
  isAuthGateOpen: boolean;
  authGateIntendedAction: string | null;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setSearchOpen: (open: boolean) => void;
  setCreatePostOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveFeedTab: (tab: FeedTab) => void;
  
  // Ask Sheet Actions
  setAskSheetState: (state: AskSheetState) => void;
  openAskSheet: () => void;
  closeAskSheet: () => void;
  
  // Answer Sheet Actions
  setAnswerSheetState: (state: AnswerSheetState) => void;
  openAnswerSheet: (postId: string) => void;
  closeAnswerSheet: () => void;
  
  // Create Hub Actions
  setCreateHubOpen: (open: boolean) => void;
  
  // Live Session Actions
  setActiveLiveSession: (sessionId: string | null) => void;
  
  // Auth Gate Actions
  openAuthGate: (intendedAction?: string) => void;
  closeAuthGate: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  isSearchOpen: false,
  isCreatePostOpen: false,
  isCommandPaletteOpen: false,
  activeFeedTab: 'pulse',
  
  // Ask Sheet
  askSheetState: 'closed',
  isAskSheetOpen: false,
  
  // Answer Sheet
  answerSheetState: 'closed',
  isAnswerSheetOpen: false,
  activePostForAnswer: null,
  
  // Create Hub
  isCreateHubOpen: false,
  
  // Live Session
  activeLiveSession: null,
  
  // Auth Gate
  isAuthGateOpen: false,
  authGateIntendedAction: null,
  
  // Basic actions
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setCreatePostOpen: (isCreatePostOpen) => set({ isCreatePostOpen }),
  setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
  setActiveFeedTab: (activeFeedTab) => set({ activeFeedTab }),
  
  // Ask Sheet Actions
  setAskSheetState: (askSheetState) => set({ askSheetState }),
  openAskSheet: () => set({ isAskSheetOpen: true, askSheetState: 'opening' }),
  closeAskSheet: () => set({ isAskSheetOpen: false, askSheetState: 'closed' }),
  
  // Answer Sheet Actions
  setAnswerSheetState: (answerSheetState) => set({ answerSheetState }),
  openAnswerSheet: (postId) => set({ 
    isAnswerSheetOpen: true, 
    answerSheetState: 'generating',
    activePostForAnswer: postId 
  }),
  closeAnswerSheet: () => set({ 
    isAnswerSheetOpen: false, 
    answerSheetState: 'closed',
    activePostForAnswer: null 
  }),
  
  // Create Hub Actions
  setCreateHubOpen: (isCreateHubOpen) => set({ isCreateHubOpen }),
  
  // Live Session Actions
  setActiveLiveSession: (activeLiveSession) => set({ activeLiveSession }),
  
  // Auth Gate Actions
  openAuthGate: (intendedAction) => set({ 
    isAuthGateOpen: true, 
    authGateIntendedAction: intendedAction || null 
  }),
  closeAuthGate: () => set({ 
    isAuthGateOpen: false, 
    authGateIntendedAction: null 
  }),
}));
