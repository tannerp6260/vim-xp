# CodeMirror Vim engine evaluation

Status: automation executed on Node 22.23.2 with Playwright 1.62.1 in Chromium and Firefox. Manual validation was performed in Chrome; Firefox has automated Playwright coverage only, and no manual Firefox pass is claimed. Evidence test names refer to `tests/browser/lab.spec.ts`.

| Capability | Expected real Vim behavior | Evidence kind | Result | Evidence/test | Known divergence | Curriculum consequence |
|---|---|---|---|---|---|---|
| Normal, Insert, Visual | Modal input and characterwise selection | Automated | Pass | `supports Normal, Insert, Visual...` | Mode read uses CM5 compatibility state | Gate introductory exercises passed |
| Basic/line movement | `h/j/k/l`, line navigation | Automated + lab | Partial | broad browser sequences | Dedicated line-boundary assertions remain manual | Add explicit coverage per taught motion |
| Word/line motions | `w`, line actions | Automated | Pass | first two browser tests | Representative cases only | Gate precise targeting passed provisionally |
| Character find | `f{char}` finds on line | Automated | Pass | first browser test | Representative `f(` only | Expand per taught use |
| Counts | Count prefixes multiply motion/action | Automated | Pass | first browser test | Only representative count | Expand per taught command |
| Operator + motion | `d{motion}`, `c{motion}` compose | Automated | Pass | first browser test | None observed | Core feasibility gate passed |
| Inner/around text objects | Inner and around objects such as `ca"` and `da(` target expected text | Automated (inner) + Chrome manual (around) | Pass for validated examples | first browser test; manual `ca"` and `da(` | Around examples are not yet automated | Add focused coverage for each object before teaching it |
| Undo/redo | `u` and Ctrl-R traverse history | Automated + Chrome manual | Pass | `supports undo, redo...`; manual Ctrl-R restored an undone change | Host reset intentionally replaces history | Required practice safety available |
| Dot repeat | `.` repeats last change | Automated | Pass | same test | Representative case only | Gate passed; test each taught composition |
| Search and next/previous | `/`, `n`, `N` navigate matches | Automated | Pass | same test | Search query is not cleanly exposed | Teach behavior; avoid query-specific strategy claims |
| Yank/delete/paste | Vim registers drive `y/d/p` | Automated | Pass | same test | Register contents are not exposed cleanly | Document outcome remains observable |
| Named registers | `"a` addresses register a | Automated | Pass | same test and reset test | Internals are compatibility API state | Avoid deep register coaching until expanded |
| Marks | `ma` and `'a` return linewise to mark | Automated | Pass | `supports marks, macro replay...` | Mark state not directly exposed | Document/cursor outcome is observable |
| Macros | `qa...q`, `@a` record/replay | Automated | Pass | same test | Recording state not exposed | Document outcome is observable |
| Ex substitution | `:%s/x/y/g` transforms buffer | Automated | Pass | same test | Ex UI differs from terminal Vim | Representative transformation is viable |
| Unsupported/intercepted Ex | Unsupported command is safe | Automated | Pass | `an unsupported Ex command...` | `:terminal` is rejected by engine, not contextual host UI | Add learner-facing interception before product use |
| Reset state isolation | Registers/search/marks/macros/undo do not leak and fixture is restored | Unit + automated + Chrome manual | Pass with limitation | compatibility-boundary unit tests; `full recreation resets...`; manual full reset | Package state is global; isolation relies on `resetVimGlobalState_` and one active editor | Acceptable bounded risk; keep pinned and regression-tested |
| Input trace | Normalized keys observable without standalone modifiers | Unit + automated + Chrome manual | Pass with limitation | trace unit tests; `semantic trace omits modifier-only events...`; manual trace observation | Raw modifier keydowns, Meta shortcuts, and paste/IME semantics are omitted | Coaching evidence only, never correctness; keep raw debugging separate |
| Reference replay | Normalized token sequence applies programmatically and observed state stays synchronized | Automated + Chrome manual | Pass | `ordinary-key tracing and normalized replay...`; manual automated and stepped replay | Uses CM5 compatibility API; no cancellation | Suitable for bounded demonstrations |
| Chrome shortcuts | Ctrl-R redoes, Ctrl-A increments, and Ctrl-F advances; browser-reserved chords are identified | Manual | Pass with explicit exception | Manual Ctrl-R, Ctrl-A, Ctrl-F, and Ctrl-W checks | Ctrl-W closes the browser tab | Ctrl-W is unsupported and must never be taught as functioning in-browser |
| Firefox shortcuts | Representative engine behavior works in Firefox | Automated only | Automated pass; manual unverified | Firefox Playwright project | No manual Firefox shortcut pass; Ctrl-W remains unsupported across browser delivery | Keep automated coverage; do not claim manual validation |
| Production/Pages build | Lab loads from built artifact/base path | Automated + Chrome manual preview | Local pass | `production build loads...`; manual `npm run preview` | Build emits an accepted size warning; remote Pages deployment not performed | Defer bundle optimization until product development; verify Pages after publication |

## Decision rule

The engine is suitable only if core composition, state recreation, mode/document/cursor observation, and replay pass without a growing patch layer. Bounded missing introspection may be acceptable because final-state correctness is authoritative. Global state leakage or incorrect taught edits makes it unsuitable until isolated or fixed.

## Conclusion

**Suitable with bounded limitations.** Core modal editing, composition, history, repeat, search, registers, marks, macros, substitution, input observation, reference replay, reset, and the local production build are viable for the bounded first curriculum. Chrome manual validation confirmed Ctrl-R redo, Ctrl-A increment, Ctrl-F forward movement in a sufficiently long document, `ca"` and `da(` around text objects, synchronized automated and stepped replay, full reset, and single-entry control-chord traces such as `<C-r>` without `<C-control>`. Firefox has automated Playwright coverage only.

The principal engine risk is global Vim state: `@replit/codemirror-vim` stores registers, marks, macros, search state, and related state globally. Exercise isolation relies on its internal-looking `resetVimGlobalState_` hook, isolated behind one checked compatibility boundary, and the architecture supports one active Vim editor. Ctrl-W closes the browser tab, is explicitly unsupported, and must never be taught as functioning in the browser. The current bundle-size warning is accepted for the diagnostic prototype and optimization is deferred until product development.
