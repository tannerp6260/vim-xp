import { useEffect, useState } from 'react'
import { LabScreen } from './components/LabScreen'
import { PracticeScreen } from './components/PracticeScreen'
import { CurriculumScreen } from './components/CurriculumScreen'
import { WelcomeScreen } from './components/WelcomeScreen'
import { PlacementScreen } from './components/PlacementScreen'
import { curriculum } from './content/curriculum'
import { createProgressStore } from './learning/persistence'

function currentRoute() {
  if (!window.location.hash) { const progress = createProgressStore(localStorage, curriculum.version, curriculum.exercises.map((item) => item.id), curriculum.units.map((unit) => unit.id), curriculum.placementGates.map((gate) => gate.id)).load(); return progress.learner.attempts.length > 0 || Boolean(progress.session) || Boolean(progress.placement) ? 'practice' : 'welcome' }
  return window.location.hash === '#/lab' ? 'lab' : window.location.hash === '#/curriculum' ? 'curriculum' : window.location.hash === '#/welcome' ? 'welcome' : window.location.hash === '#/placement' ? 'placement' : 'practice'
}

export function App() {
  const [route, setRoute] = useState(currentRoute)
  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/${route}`)
    const update = () => setRoute(currentRoute())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [route])
  return route === 'lab' ? <LabScreen /> : route === 'curriculum' ? <CurriculumScreen /> : route === 'welcome' ? <WelcomeScreen /> : route === 'placement' ? <PlacementScreen /> : <PracticeScreen />
}
