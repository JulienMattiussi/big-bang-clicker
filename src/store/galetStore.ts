import { create } from 'zustand'

/**
 * Transient (not persisted) UI signal for a freshly discovered infinity pebble:
 * its id is flashed when the discovery modal is dismissed, so the receptacle can
 * play the giant-clone-shrinks-into-its-socket effect (like the memory/backpack
 * feature buttons).
 */
interface GaletStore {
  flashed: string | null
  flash: (id: string) => void
  clear: () => void
}

export const useGaletStore = create<GaletStore>((set) => ({
  flashed: null,
  flash: (id) => set({ flashed: id }),
  clear: () => set({ flashed: null }),
}))
