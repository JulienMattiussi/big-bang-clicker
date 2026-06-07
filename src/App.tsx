import { useEffect } from 'react'
import { GameShell } from '@/components/layout/GameShell'
import { EventModal } from '@/components/game/EventModal'
import { useTick } from '@/hooks/useTick'
import { useEvents } from '@/hooks/useEvents'
import { useGalets } from '@/hooks/useGalets'
import { useTranslation } from '@/i18n/useTranslation'

function App() {
  useTick()
  useEvents()
  useGalets()
  const { locale } = useTranslation()

  // Reflects the current language on <html lang> (screen-reader pronunciation).
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <>
      <GameShell />
      <EventModal />
    </>
  )
}

export default App
