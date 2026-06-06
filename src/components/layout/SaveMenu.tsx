import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'

type Status = 'idle' | 'copied' | 'ok' | 'error'

/** Menu de gestion de la sauvegarde : export, import, réinitialisation. */
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

  const [code] = useState(() => exportSave())
  const [importText, setImportText] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [confirmReset, setConfirmReset] = useState(false)

  const fieldClass = 'h-16 w-full resize-none rounded-md border border-border bg-bg p-2 text-xs'

  const copy = () => {
    void navigator.clipboard?.writeText(code)
    setStatus('copied')
  }

  const download = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'big-bang-clicker-save.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const doImport = () => setStatus(importSave(importText.trim()) ? 'ok' : 'error')

  const doReset = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    reset()
    onDone()
  }

  return (
    <div className="absolute top-full right-0 z-10 mt-2 w-80 rounded-lg border border-border bg-surface p-4 text-left shadow-xl">
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <span className="block text-xs font-semibold tracking-wide text-muted uppercase">
            {t('save.export')}
          </span>
          <textarea readOnly aria-label={t('save.export')} value={code} className={fieldClass} />
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1 text-center" onClick={copy}>
              <Icon name="copy" className="mr-1 inline h-4 w-4 align-text-bottom" />
              {status === 'copied' ? t('save.copied') : t('save.copy')}
            </Button>
            <Button variant="ghost" className="flex-1 text-center" onClick={download}>
              <Icon name="download" className="mr-1 inline h-4 w-4 align-text-bottom" />
              {t('save.download')}
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <span className="block text-xs font-semibold tracking-wide text-muted uppercase">
            {t('save.import')}
          </span>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={t('save.importPlaceholder')}
            aria-label={t('save.import')}
            className={fieldClass}
          />
          <Button
            variant="ghost"
            className="w-full text-center"
            disabled={!importText.trim()}
            onClick={doImport}
          >
            <Icon name="upload" className="mr-1 inline h-4 w-4 align-text-bottom" />
            {t('save.import')}
          </Button>
          {status === 'ok' ? (
            <p className="text-xs text-accent">{t('save.importSuccess')}</p>
          ) : null}
          {status === 'error' ? (
            <p className="text-xs text-red-400">{t('save.importError')}</p>
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
