import { useEffect, useState } from 'react'
import { LabScreen } from './components/LabScreen'
import { PracticeScreen } from './components/PracticeScreen'

function currentRoute() {
  return window.location.hash === '#/lab' ? 'lab' : 'practice'
}

export function App() {
  const [route, setRoute] = useState(currentRoute)
  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/practice`)
    const update = () => setRoute(currentRoute())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return route === 'lab' ? <LabScreen /> : <PracticeScreen />
}
