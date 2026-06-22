import { useEffect } from 'react'
import { GameShell } from '@/components/layout/GameShell'
import { EventModal } from '@/components/game/EventModal'
import { EndGameModal } from '@/components/game/EndGameModal'
import { useTick } from '@/hooks/useTick'
import { useEvents } from '@/hooks/useEvents'
import { useGalets } from '@/hooks/useGalets'
import { useEndgame } from '@/hooks/useEndgame'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'

function App() {
  useTick()
  useEvents()
  useGalets()
  useEndgame()
  const { locale } = useTranslation()
  const tampered = useGameStore((s) => s.tampered)
  const clearTampered = useGameStore((s) => s.clearTampered)

  // Reflects the current language on <html lang> (screen-reader pronunciation).
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  // A stored save was edited outside the game and rejected: wink at the player.
  useEffect(() => {
    if (!tampered) return
    useGameStore.getState().enqueueEvent({
      id: 'save:tampered',
      tone: 'tutorial',
      titleKey: 'save.tampered.title',
      bodyKey: 'save.tampered.body',
      icon: 'skull',
    })
    clearTampered()
  }, [tampered, clearTampered])

  return (
    <>
      <GameShell />
      <EventModal />
      <EndGameModal />
    </>
  )
}

export default App
