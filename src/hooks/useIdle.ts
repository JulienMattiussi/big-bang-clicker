import { useEffect, useRef, useState } from 'react'

/** True once the player has not interacted for `delayMs` (any input wakes it). */
export function useIdle(delayMs: number): boolean {
  const [idle, setIdle] = useState(false)
  // Mirror of `idle` so the high-frequency wake handler flips state only on the
  // idle->active boundary, never re-rendering on every pointermove.
  const idleRef = useRef(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const goIdle = () => {
      idleRef.current = true
      setIdle(true)
    }
    const wake = () => {
      if (idleRef.current) {
        idleRef.current = false
        setIdle(false)
      }
      clearTimeout(timer)
      timer = setTimeout(goIdle, delayMs)
    }
    const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }))
    timer = setTimeout(goIdle, delayMs)
    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, wake))
    }
  }, [delayMs])

  return idle
}
