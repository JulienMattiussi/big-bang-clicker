import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

/**
 * True while the tab is hidden (backgrounded). Lets purely decorative work (the
 * ambient scene animations) stand down when nothing is on screen, instead of
 * compositing for hours behind another tab.
 */
export function usePageHidden(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.visibilityState === 'hidden',
    () => false,
  )
}
