import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_HISTORY = 20

type ActivityState = {
  viewedProductIds: string[]
  recordView: (productId: string) => void
  clearHistory: () => void
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      viewedProductIds: [],

      recordView: (productId) =>
        set((state) => {
          const filtered = state.viewedProductIds.filter((id) => id !== productId)
          return { viewedProductIds: [productId, ...filtered].slice(0, MAX_HISTORY) }
        }),

      clearHistory: () => set({ viewedProductIds: [] }),
    }),
    { name: 'shopnow-activity' }
  )
)
