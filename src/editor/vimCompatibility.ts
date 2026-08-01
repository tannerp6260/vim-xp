import { Vim } from '@replit/codemirror-vim'

type VimResetCompatibility = {
  resetVimGlobalState_?: () => void
}

export const missingResetHookMessage =
  'Incompatible @replit/codemirror-vim: resetVimGlobalState_ is unavailable. Exercise isolation requires the pinned adapter version.'

export function resetVimGlobalState(vimApi: VimResetCompatibility = Vim): void {
  if (typeof vimApi.resetVimGlobalState_ !== 'function') {
    throw new Error(missingResetHookMessage)
  }
  vimApi.resetVimGlobalState_()
}
