import type { ReactNode } from 'react'
import { WidgetGalet } from './WidgetGalet'

/**
 * Footer of an interactive era widget: its hint plus the widget-pebble badge
 * (WidgetGalet, which renders nothing until the pebble is found). Centralises the
 * shared styling so every widget's hint reads the same - centred and honouring the
 * "\n" an i18n hint may contain (multi-line hints wrap onto their own lines).
 */
export function WidgetHint({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`flex flex-col items-center gap-1.5 text-center text-xs whitespace-pre-line text-muted${className ? ` ${className}` : ''}`}
    >
      {children}
      <WidgetGalet />
    </span>
  )
}
