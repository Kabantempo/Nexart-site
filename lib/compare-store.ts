import { create } from 'zustand'

export interface CompareEvent {
  id: string
  title: string
  start_date?: string
  city?: string
  stand_price?: number
  stand_count?: number
  discipline_tags?: string[]
  cover_image?: string
  rating?: number
}

interface CompareStore {
  pinned: CompareEvent[]
  pin: (event: CompareEvent) => void
  unpin: (id: string) => void
  isPinned: (id: string) => boolean
  clear: () => void
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  pinned: [],
  pin: (event) => {
    if (get().pinned.length >= 3) return
    if (get().isPinned(event.id)) return
    set(s => ({ pinned: [...s.pinned, event] }))
  },
  unpin: (id) => set(s => ({ pinned: s.pinned.filter(e => e.id !== id) })),
  isPinned: (id) => get().pinned.some(e => e.id === id),
  clear: () => set({ pinned: [] }),
}))
