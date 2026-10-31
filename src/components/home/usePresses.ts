import { useEffect } from 'react'
import { makeMixer } from '~/audio/mixer'
import { listenPresses } from '~/audio/presses'

/** The home's and its leaves' pieces heard as the game's are, each press a light click (« Les son de hud doivent être aussi dans la home »); muted as the game is, by the same choice. */
export function usePresses() {
  useEffect(() => {
    const mixer = makeMixer('home')
    const stop = listenPresses((cue) => mixer.play(cue))
    return () => {
      stop()
      mixer.destroy()
    }
  }, [])
}
