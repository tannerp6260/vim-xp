import { describe, expect, it } from 'vitest'
import { initialPlayerState, reducePlayer } from './playerState'

describe('demonstration player state', () => {
  it('steps next and previous within bounds', () => { let state = initialPlayerState(); state = reducePlayer(state, { type: 'next', stepCount: 3 }); expect(state.nextIndex).toBe(1); state = reducePlayer(state, { type: 'previous', stepCount: 3 }); expect(state).toEqual(initialPlayerState()); expect(reducePlayer(state, { type: 'previous', stepCount: 3 }).nextIndex).toBe(0) })
  it('restarts from completion', () => expect(reducePlayer({ nextIndex: 3, playing: false }, { type: 'restart', stepCount: 3 })).toEqual(initialPlayerState()))
  it('plays, pauses, and stops on completion', () => { const playing = reducePlayer(initialPlayerState(), { type: 'play', stepCount: 2 }); expect(playing.playing).toBe(true); expect(reducePlayer(playing, { type: 'pause', stepCount: 2 }).playing).toBe(false); const last = reducePlayer({ nextIndex: 1, playing: true }, { type: 'next', stepCount: 2 }); expect(last).toEqual({ nextIndex: 2, playing: false }) })
  it('does not play or advance beyond completion', () => { const done = { nextIndex: 2, playing: false }; expect(reducePlayer(done, { type: 'play', stepCount: 2 })).toEqual(done); expect(reducePlayer(done, { type: 'next', stepCount: 2 })).toEqual(done) })
})
