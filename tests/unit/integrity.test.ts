import { describe, it, expect } from 'vitest'
import { sign } from '@/lib/integrity'

describe('sign', () => {
  it('est déterministe pour une même entrée', () => {
    expect(sign('hello universe')).toBe(sign('hello universe'))
  })

  it('change dès que le contenu change', () => {
    expect(sign('complexity:100')).not.toBe(sign('complexity:101'))
  })
})
