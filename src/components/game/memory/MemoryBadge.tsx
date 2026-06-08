/**
 * Small playing-card badge shown next to a resource whose production has been
 * multiplied by the memory mini-game (×2 / ×4 / ×8). Octarine, like the memory
 * cards themselves. Mirrors the Complexity-impact icon on the resources panel.
 */
export function MemoryBadge({ factor, title }: { factor: number; title: string }) {
  return (
    <span className="relative inline-flex h-5 shrink-0 items-center text-octarine" title={title}>
      <svg viewBox="0 0 16 22" className="h-5 w-auto" aria-hidden>
        <rect
          x="1"
          y="1"
          width="14"
          height="20"
          rx="3"
          fill="var(--color-octarine)"
          fillOpacity="0.15"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] leading-none font-bold">
        &times;{factor}
      </span>
      <span className="sr-only">
        &times;{factor} {title}
      </span>
    </span>
  )
}
