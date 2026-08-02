import { useEffect, useState } from 'react'
import { LabScreen } from './components/LabScreen'
import { PracticeScreen } from './components/PracticeScreen'
import { CurriculumScreen } from './components/CurriculumScreen'

function currentRoute() {
  return window.location.hash === '#/lab' ? 'lab' : window.location.hash === '#/curriculum' ? 'curriculum' : 'practice'
}

export function App() {
  const [route, setRoute] = useState(currentRoute)
  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/practice`)
    const update = () => setRoute(currentRoute())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return route === 'lab' ? <LabScreen /> : route === 'curriculum' ? <CurriculumScreen /> : <PracticeScreen />
}
