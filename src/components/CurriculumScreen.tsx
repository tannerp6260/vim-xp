import { useMemo, useState } from 'react'
import { curriculum, getUnit } from '../content/curriculum'
import type { CurriculumUnit, UnitId } from '../content/model'
import { learnerLabel } from '../learning/learnerModel'
import { createProgressStore, type StoredProgress } from '../learning/persistence'
import { planSession, recommendedUnitId } from '../learning/planner'
import { ProductNav } from './ProductNav'

const timestamp = () => Date.now()
const navigateToPractice = () => { window.location.hash = '#/practice' }

const unitStatus = (unit: CurriculumUnit, progress: StoredProgress, now: number) => {
  const labels = unit.conceptIds.map((id) => learnerLabel(progress.learner.concepts[id], now))
  if (labels.includes('Due')) return 'Due'
  if (labels.every((label) => label === 'New')) return 'New'
  if (labels.every((label) => label === 'Strong')) return 'Strong'
  if (labels.some((label) => label === 'Familiar' || label === 'Strong')) return 'Familiar'
  return 'Learning'
}

export function CurriculumScreen() {
  const store = useMemo(() => createProgressStore(localStorage, curriculum.version, curriculum.exercises.map((item) => item.id), curriculum.units.map((unit) => unit.id)), [])
  const [progress] = useState(() => store.load()); const [now] = useState(() => Date.now())
  const recommended = recommendedUnitId(curriculum, progress.learner)
  const unfinished = progress.session && !progress.session.completed
  const start = (unitId: UnitId) => {
    if (unfinished && progress.session?.unitId !== unitId && !window.confirm(`Replace your unfinished ${getUnit(progress.session?.unitId ?? '')?.title ?? 'practice'} session? Completed and skipped attempts will remain saved.`)) return
    const startedAt = timestamp(); const plan = planSession(curriculum, progress.learner, { now: () => startedAt }, (startedAt + progress.learner.attempts.length) >>> 0, false, progress.recentVariants, unitId)
    store.save({ ...progress, session: { ...plan, index: 0, completed: false } }); navigateToPractice()
  }
  return <main className="curriculum-screen"><ProductNav /><header><p className="lesson-label">Small, deliberate curriculum</p><h1>Choose what to practice</h1><p>Units are recommended in order, but never locked. Progress reflects learner evidence, not a completion percentage.</p></header>
    {unfinished && <section className="resume-card"><div><strong>Current session</strong><span>{getUnit(progress.session?.unitId ?? '')?.title ?? 'Adaptive review'} · {progress.session!.index + 1} of {progress.session!.exerciseIds.length}</span></div><a className="button-link primary" href="#/practice">Resume current session</a></section>}
    <section className="unit-list" aria-label="Curriculum units">{[...curriculum.units].sort((a, b) => a.order - b.order).map((unit) => <article className="unit-card" key={unit.id} data-unit-id={unit.id}>
      <div className="unit-meta"><span>Unit {unit.order}</span><span>{unitStatus(unit, progress, now)}</span>{recommended === unit.id && <strong>Recommended</strong>}</div>
      <h2>{unit.title}</h2><p>{unit.description}</p><h3>Techniques introduced</h3><ul>{unit.conceptIds.map((id) => <li key={id}><code>{curriculum.concepts.find((concept) => concept.id === id)!.title}</code></li>)}</ul>
      {unit.recommendedPrerequisiteUnitIds.length > 0 && <p className="prerequisite">Recommended first: {unit.recommendedPrerequisiteUnitIds.map((id) => getUnit(id)!.title).join(', ')}. You can start here now if this material is familiar.</p>}
      <button className="primary" onClick={() => start(unit.id)}>{unitStatus(unit, progress, now) === 'New' ? 'Begin unit' : 'Practice unit'}</button>
    </article>)}</section>
  </main>
}
