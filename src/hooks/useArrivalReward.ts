import { useEffect, useRef } from 'react'

export function useArrivalReward(total: number, onReward: (delta: number) => void) {
  const seen = useRef(0)
  const cb = useRef(onReward)
  useEffect(() => {
    cb.current = onReward
  })
  useEffect(() => {
    const delta = total - seen.current
    if (delta > 0) {
      seen.current = total
      cb.current(delta)
    }
  }, [total])
}
