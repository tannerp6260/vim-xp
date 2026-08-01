import { describe, expect, it, vi } from 'vitest'
import { missingResetHookMessage, resetVimGlobalState } from './vimCompatibility'

describe('Vim compatibility boundary', () => {
  it('resets package-global Vim state through the compatibility hook', () => {
    const resetVimGlobalState_ = vi.fn()
    resetVimGlobalState({ resetVimGlobalState_ })
    expect(resetVimGlobalState_).toHaveBeenCalledOnce()
  })

  it('fails clearly when the pinned package no longer exposes the reset hook', () => {
    expect(() => resetVimGlobalState({})).toThrow(missingResetHookMessage)
  })
})
