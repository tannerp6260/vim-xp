import { afterEach, describe, expect, it, vi } from 'vitest'
import { abortableDelay } from './VimEditorAdapter'

describe('replay cancellation', () => {
  afterEach(() => vi.useRealTimers())

  it('settles an active delay immediately when aborted', async () => {
    vi.useFakeTimers(); const controller = new AbortController(); const delay = abortableDelay(5_000, controller.signal)
    controller.abort()
    await expect(delay).resolves.toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('completes an uninterrupted delay normally', async () => {
    vi.useFakeTimers(); const delay = abortableDelay(45); await vi.advanceTimersByTimeAsync(45); await expect(delay).resolves.toBe(true)
  })
})
