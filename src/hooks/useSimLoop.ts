import { useEffect, useRef, useState } from 'react'

export function useSimLoop<T>(initial: () => T, advance: (world: T) => T, stepMs: number) {
  const [world, setWorld] = useState(initial)
  const adv = useRef(advance)
  useEffect(() => {
    adv.current = advance
  })
  useEffect(() => {
    const handle = setInterval(() => setWorld((w) => adv.current(w)), stepMs)
    return () => clearInterval(handle)
  }, [stepMs])
  return [world, setWorld] as const
}
