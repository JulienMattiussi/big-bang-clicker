import { useEffect } from 'react'
import { useFeedbackStore } from '@/store/feedbackStore'
import type { FloaterTone } from '@/store/feedbackStore'

/**
 * Renders ephemeral floating +X / -X numbers anchored to a counter (identified
 * by `target`). Each one rises, fades, and removes itself. Decorative only:
 * the parent must be `relative`.
 */
export function FloaterLayer({ target }: { target: string }) {
  const floaters = useFeedbackStore((s) => s.floaters)
  const mine = floaters.filter((f) => f.target === target)
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {mine.map((f) => (
        <FloaterItem key={f.id} id={f.id} text={f.text} tone={f.tone} />
      ))}
    </span>
  )
}

function FloaterItem({ id, text, tone }: { id: number; text: string; tone: FloaterTone }) {
  const remove = useFeedbackStore((s) => s.remove)
  // Safety net so floaters are removed even when animations are disabled
  // (prefers-reduced-motion: onAnimationEnd never fires).
  useEffect(() => {
    const timer = setTimeout(() => remove(id), 1000)
    return () => clearTimeout(timer)
  }, [id, remove])

  const color =
    tone === 'spend' ? 'text-accent' : tone === 'resource' ? 'text-secondary' : 'text-octarine'
  return (
    <span
      onAnimationEnd={() => remove(id)}
      className={`float-delta absolute -top-1 right-0 text-xs font-bold tabular-nums ${color}`}
    >
      {text}
    </span>
  )
}
