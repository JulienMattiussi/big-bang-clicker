import { useEffect } from 'react'
import { GameShell } from '@/components/layout/GameShell'
import { useTick } from '@/hooks/useTick'
import { useTranslation } from '@/i18n/useTranslation'

function App() {
  useTick()
  const { locale } = useTranslation()

  // Reflects the current language on <html lang> (screen-reader pronunciation).
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return <GameShell />
}

export default App
