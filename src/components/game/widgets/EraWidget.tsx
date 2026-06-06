import type { ReactElement } from 'react'
import { CoolingWidget } from './CoolingWidget'
import { BohrWidget } from './BohrWidget'
import { GalaxyWidget } from './GalaxyWidget'
import { AccretionWidget } from './AccretionWidget'
import { CellWidget } from './CellWidget'
import { CityWidget } from './CityWidget'
import { RocketWidget } from './RocketWidget'
import { GenericWidget } from './GenericWidget'

type WidgetComponent = (props: { className?: string }) => ReactElement

/** Registry of iconic widgets by identifier (the era's `widget` field). */
const WIDGETS: Record<string, WidgetComponent> = {
  cooling: CoolingWidget,
  bohr: BohrWidget,
  galaxy: GalaxyWidget,
  accretion: AccretionWidget,
  cell: CellWidget,
  city: CityWidget,
  rocket: RocketWidget,
}

export function EraWidget({ widget, className }: { widget: string; className?: string }) {
  const Widget = WIDGETS[widget] ?? GenericWidget
  return <Widget className={className} />
}
