export function ProductNav({ onReset, busy = false }: { onReset?: () => void; busy?: boolean }) {
  return <nav className="product-nav" aria-label="Product"><a className="brand" href="#/practice">Vim XP <span>working title</span></a><div>
    <a className={`lab-link ${busy ? 'disabled' : ''}`} aria-disabled={busy} onClick={(event) => { if (busy) event.preventDefault() }} href="#/curriculum">Curriculum</a>
    {onReset && <button className="reset-progress" onClick={onReset}>Reset local progress</button>}
    <a className={`lab-link ${busy ? 'disabled' : ''}`} aria-disabled={busy} onClick={(event) => { if (busy) event.preventDefault() }} href="#/lab">Engine lab</a>
  </div></nav>
}
