import type { ReactNode } from 'react'

interface PanelProps {
  title?: string
  children: ReactNode
  className?: string
}

/** Panel container (surface + border + radius), with an optional title. */
export function Panel({ title, children, className = '' }: PanelProps) {
  return (
    <section
      className={`rounded-lg border border-border bg-surface p-4 transition-colors duration-700 ${className}`}
    >
      {title ? (
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">{title}</h2>
      ) : null}
      {children}
    </section>
  )
}
