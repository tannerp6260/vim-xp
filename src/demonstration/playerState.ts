export type PlayerState = { nextIndex: number; playing: boolean }
export type PlayerAction = { type: 'next' | 'previous' | 'restart' | 'play' | 'pause'; stepCount: number }
export const initialPlayerState = (): PlayerState => ({ nextIndex: 0, playing: false })

export function reducePlayer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'next': return { nextIndex: Math.min(action.stepCount, state.nextIndex + 1), playing: state.playing && state.nextIndex + 1 < action.stepCount }
    case 'previous': return { nextIndex: Math.max(0, state.nextIndex - 1), playing: false }
    case 'restart': return initialPlayerState()
    case 'play': return state.nextIndex < action.stepCount ? { ...state, playing: true } : state
    case 'pause': return { ...state, playing: false }
  }
}
