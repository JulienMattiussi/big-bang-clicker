import type { ReactElement } from 'react'
import { CoolingWidget } from './CoolingWidget'
import { RocketWidget } from './RocketWidget'
import { GenericWidget } from './GenericWidget'

type WidgetComponent = (props: { className?: string }) => ReactElement

/**
 * Registry of PASSIVE iconic widgets by identifier (the era's `widget` field).
 * Interactive widgets (their own mechanic) are routed earlier by ClickArea via
 * INTERACTIVE_WIDGETS; this registry only covers eras without one.
 */
const WIDGETS: Record<string, WidgetComponent> = {
  cooling: CoolingWidget,
  rocket: RocketWidget,
}

export function EraWidget({ widget, className }: { widget: string; className?: string }) {
  const Widget = WIDGETS[widget] ?? GenericWidget
  return <Widget className={className} />
}
