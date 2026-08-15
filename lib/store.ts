import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  role: 'creator' | 'organizer' | 'visitor' | 'admin'
  full_name: string
  avatar_url?: string | null
  is_creator?: boolean
  is_organizer?: boolean
  is_admin?: boolean | null
}

interface AuthStore {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'nexart-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

interface UiStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
