import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'

type Status = 'idle' | 'error' | 'tampered'

/** Save management menu: export, import, reset (file-based). */
export function SaveMenu() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        aria-expanded={open}
        aria-label={t('save.title')}
        title={t('save.title')}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="settings" className="h-4 w-4" />
      </Button>
      {open ? <SavePanel onDone={() => setOpen(false)} /> : null}
    </div>
  )
}

function SavePanel({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const exportSave = useGameStore((s) => s.exportSave)
  const importSave = useGameStore((s) => s.importSave)
  const reset = useGameStore((s) => s.reset)
  const persist = useGameStore((s) => s.persist)
  const enqueueEvent = useGameStore((s) => s.enqueueEvent)

  const [status, setStatus] = useState<Status>('idle')
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Flush the live state to storage on open so the download reflects it (the
  // game keeps ticking); exportSave() then reads the current state at click time.
  useEffect(() => {
    persist()
  }, [persist])

  // Confirm a successful import with a modal (the imported state replaced the
  // game), then close the menu. Failures keep their inline message.
  const onImported = (result: 'ok' | 'invalid' | 'tampered') => {
    if (result !== 'ok') return setStatus(result === 'tampered' ? 'tampered' : 'error')
    enqueueEvent({
      id: 'save:imported',
      tone: 'transition',
      titleKey: 'save.imported.title',
      bodyKey: 'save.imported.body',
      icon: 'upload',
    })
    onDone()
  }

  const download = () => {
    const blob = new Blob([exportSave()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'big-bang-clicker.sav'
    link.click()
    URL.revokeObjectURL(url)
    window.setTimeout(onDone, 400)
  }

  const importFromFile = async (file: File) => {
    const text = await file.text()
    onImported(importSave(text.trim()))
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (file) void importFromFile(file)
  }

  const doReset = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    reset()
    onDone()
  }

  return (
    <div className="shadow-float absolute top-full right-0 z-10 mt-2 w-80 rounded-lg border border-border bg-surface p-4 text-left">
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <span className="block text-xs font-semibold tracking-wide text-muted uppercase">
            {t('save.export')}
          </span>
          <Button variant="ghost" className="w-full text-center" onClick={download}>
            <Icon name="download" className="mr-1 inline h-4 w-4 align-text-bottom" />
            {t('save.download')}
          </Button>
        </section>

        <section className="flex flex-col gap-2">
          <span className="block text-xs font-semibold tracking-wide text-muted uppercase">
            {t('save.import')}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".sav"
            className="sr-only"
            aria-hidden
            tabIndex={-1}
            onChange={onFileChange}
          />
          <Button
            variant="ghost"
            className="w-full text-center"
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="upload" className="mr-1 inline h-4 w-4 align-text-bottom" />
            {t('save.importFile')}
          </Button>
          {status === 'error' ? (
            <p className="text-xs text-red-400">{t('save.importError')}</p>
          ) : null}
          {status === 'tampered' ? (
            <p className="text-xs text-red-400">{t('save.importTampered')}</p>
          ) : null}
        </section>

        <Button variant="ghost" className="w-full text-center" onClick={doReset}>
          <Icon name="rotate-ccw" className="mr-1 inline h-4 w-4 align-text-bottom" />
          {confirmReset ? t('save.resetConfirm') : t('save.reset')}
        </Button>
      </div>
    </div>
  )
}
