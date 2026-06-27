import { create } from 'zustand';

export const useChatStore = create((set) => ({
  // Current logged in user
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // All messages in the chat
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),

  // Typing indicator
  isTyping: false,
  setIsTyping: (value) => set({ isTyping: value }),

  // Room
  currentRoom: null,
  setCurrentRoom: (room) => set({ currentRoom: room }),
}));
