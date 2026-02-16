import { create } from 'zustand'

interface QuoteState {
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  resetSelectedIndex: () => void
}

export const useQuoteStore = create<QuoteState>()(set => ({
  selectedIndex: 0,
  setSelectedIndex: index => set({ selectedIndex: index }),
  resetSelectedIndex: () => set({ selectedIndex: 0 })
}))

export const useSelectedQuoteIndex = () => useQuoteStore(state => state.selectedIndex)
export const useSetSelectedQuoteIndex = () => useQuoteStore(state => state.setSelectedIndex)
export const useResetSelectedQuoteIndex = () => useQuoteStore(state => state.resetSelectedIndex)
