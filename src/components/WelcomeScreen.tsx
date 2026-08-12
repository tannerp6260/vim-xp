import { useMemo } from 'react'
import { curriculum } from '../content/curriculum'
import { createProgressStore } from '../learning/persistence'
import { planSession } from '../learning/planner'

export function WelcomeScreen() {
  const store = useMemo(() => createProgressStore(localStorage, curriculum.version, curriculum.exercises.map((item) => item.id), curriculum.units.map((unit) => unit.id), curriculum.placementGates.map((gate) => gate.id)), [])
  const start = () => { const progress = store.load(); const now = Date.now(); const plan = planSession(curriculum, progress.learner, { now: () => now }, now >>> 0, true); store.save({ ...progress, session: { ...plan, index: 0, completed: false } }); window.location.hash = '#/practice' }
  return <main className="welcome-screen"><p className="lesson-label">Vim XP</p><h1>Build precise Vim habits with real editing tasks.</h1><p>Practice small, realistic changes and get feedback based on the editor outcome.</p><section className="welcome-actions"><button className="primary" onClick={start}>Start from the beginning <span>Recommended</span></button><a className="button-link" href="#/placement">Find my starting point</a><a href="#/curriculum">Browse curriculum</a></section><p className="placement-note">Placement takes about five editing tasks. It is optional and not timed.</p></main>
}
