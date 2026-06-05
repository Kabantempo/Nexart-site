import { create } from 'zustand'

interface User {
  id: string
  email: string
  role: 'creator' | 'organizer'
  full_name: string
  avatar_url?: string
}

interface AuthStore {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))

interface UiStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
