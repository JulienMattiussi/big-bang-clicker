import type { ReactElement, ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'

/** Visual tone of a hero modal: octarine (a new power), accent (era / feature /
 *  rebirth), danger (a crisis). It drives the eyebrow colour, the flankers and
 *  the glow behind the central glyph. */
export type HeroTone = 'octarine' | 'accent' | 'danger'

const GLOW: Record<HeroTone, { color: string; anim: string; opacity: number }> = {
  octarine: { color: 'var(--color-octarine)', anim: 'bg-breathe', opacity: 0.5 },
  accent: { color: 'var(--color-accent)', anim: 'bg-breathe', opacity: 0.5 },
  // Danger red is a deliberate crisis colour (not a tier token), like the banner.
  danger: { color: '#ef4444', anim: 'crisis-flash', opacity: 0.35 },
}
const EYEBROW: Record<HeroTone, string> = {
  octarine: 'text-octarine',
  accent: 'text-accent',
  danger: 'text-red-400',
}

/**
 * Shared "hero" layout for the dramatic / celebratory event modals (era unlock,
 * feature unlock, crisis announcement, crisis overcome): a tracked eyebrow with
 * flankers, a glowing central glyph, then title and body. Only the legendary
 * pebble discovery keeps its own bespoke layout (extra power box).
 */
export function EventHero({
  tone,
  eyebrow,
  title,
  body,
  wide,
  children,
}: {
  tone: HeroTone
  eyebrow: string
  title: string
  body: string
  /** Crisis: a full-width illustration box, with the SVG accent forced to red. */
  wide?: boolean
  children: ReactNode
}): ReactElement {
  const glow = GLOW[tone]
  const flanker =
    tone === 'danger' ? (
      <Icon name="skull" className="h-3.5 w-3.5" aria-hidden />
    ) : (
      <span aria-hidden>✦</span>
    )
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span
        className={`flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase ${EYEBROW[tone]}`}
      >
        {flanker}
        {eyebrow}
        {flanker}
      </span>
      <div
        className={`relative my-1 flex items-center justify-center ${
          wide ? 'h-32 w-full' : 'h-28 w-28'
        } ${wide && tone === 'danger' ? '[--color-accent:#ef4444]' : ''}`}
      >
        <div
          aria-hidden
          className={`${glow.anim} absolute inset-0 rounded-full ${wide ? 'blur-xl' : 'blur-md'}`}
          style={{
            background: `radial-gradient(circle, ${glow.color}, transparent ${wide ? 65 : 68}%)`,
            opacity: glow.opacity,
          }}
        />
        {children}
      </div>
      <h2 id="event-title" className="text-2xl font-bold">
        {title}
      </h2>
      {/* A body may carry "\n" breaks to read as separate paragraphs. */}
      <div className="flex flex-col gap-2 leading-relaxed text-muted">
        {body.split('\n').map((para, i) => (para.trim() ? <p key={i}>{para}</p> : null))}
      </div>
    </div>
  )
}
