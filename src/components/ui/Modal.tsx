import type { KeyboardEvent, ReactNode } from 'react'

/**
 * Shared modal shell: a dimmed backdrop and a centred dialog. Centralises the
 * scrim, Escape-to-close and the dialog ARIA, so each modal only supplies its
 * own box look (`className`) and content. `onClose` is what Escape triggers (and
 * a backdrop click, when `closeOnBackdrop` is set).
 */
export function Modal({
  onClose,
  labelledBy,
  label,
  className,
  tier,
  closeOnBackdrop,
  children,
}: {
  onClose: () => void
  labelledBy?: string
  label?: string
  className?: string
  tier?: string
  closeOnBackdrop?: boolean
  children: ReactNode
}) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }
  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onKeyDown={onKeyDown}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        data-tier={tier}
        className={className}
        onClick={closeOnBackdrop ? (e) => e.stopPropagation() : undefined}
      >
        {children}
      </div>
    </div>
  )
}
