import { useEffect } from 'react'
import { GameShell } from '@/components/layout/GameShell'
import { useTick } from '@/hooks/useTick'
import { useTranslation } from '@/i18n/useTranslation'

function App() {
  useTick()
  const { locale } = useTranslation()

  // Reflète la langue courante sur <html lang> (prononciation des lecteurs d'écran).
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return <GameShell />
}

export default App
