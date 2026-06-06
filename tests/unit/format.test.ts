import { describe, it, expect } from 'vitest'
import { formatFixed, formatNumber } from '@/lib/format'

describe('formatNumber', () => {
  it('affiche les petits nombres tels quels', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(42)).toBe('42')
    expect(formatNumber(999)).toBe('999')
  })

  it('abrège milliers et millions', () => {
    expect(formatNumber(1000)).toBe('1k')
    expect(formatNumber(1500)).toBe('1.5k')
    expect(formatNumber(2_000_000)).toBe('2M')
  })

  it("gère les négatifs et l'infini", () => {
    expect(formatNumber(-1000)).toBe('-1k')
    expect(formatNumber(Infinity)).toBe('∞')
    expect(formatNumber(-Infinity)).toBe('-∞')
  })

  it('bascule en notation scientifique pour les très grands nombres', () => {
    expect(formatNumber(1e25)).toContain('e')
  })
})

describe('formatFixed', () => {
  it('garde un nombre de décimales constant (pas de flick)', () => {
    expect(formatFixed(20.9)).toBe('20.9')
    expect(formatFixed(21)).toBe('21.0')
    expect(formatFixed(21.1)).toBe('21.1')
    expect(formatFixed(0)).toBe('0.0')
  })

  it('abrège aussi avec décimales fixes', () => {
    expect(formatFixed(1500)).toBe('1.5k')
    expect(formatFixed(2_000_000)).toBe('2.0M')
  })
})
