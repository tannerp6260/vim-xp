# Architecture

## Adaptive practice slice

Hash routing selects `#/practice` by default and preserves `#/lab`. `PracticeScreen` orchestrates one finite session and exactly one active editor. Framework-independent `src/content` modules define curriculum, outcomes, coaching, and inline markup. `src/learning` contains learner updates, deterministic planning, and persistence boundaries. None imports React or CodeMirror.

Correctness is computed from the final editor snapshot and a discriminated outcome-rule union. Trace-based strategy recognition runs only after correctness is known, so an unrecognized correct solution passes. Reference solutions remain executable Vim token sequences and must pass the same outcome rules through the real adapter.

The catalog contains nine variants around targeting quotes, words, and parenthesized arguments. A prescribed seven-exercise first session teaches and transfers those ideas; later sessions use learner evidence. Placement, accounts, synchronization, runtime AI, broad curriculum, timers, and social systems remain absent.

## Editor and diagnostic laboratory

`App` renders diagnostic controls and observed state. `VimEditor` owns the React lifecycle boundary. `VimEditorAdapter` alone constructs CodeMirror, enables Vim, reads state, subscribes to changes, captures normalized keyboard input, replays tokens, focuses, and destroys the editor. Pure trace normalization has no browser or React dependency. Its semantic stream discards modifier-only `Control`, `Shift`, `Alt`, and `Meta` keydowns while retaining completed chords such as `<C-r>`. Any future raw DOM diagnostic log must remain a separate channel and must not contaminate the semantic trace used for coaching.

Reset increments a React generation and destroys/recreates the complete editor. This is intentional: replacing document text alone does not clear Vim registers, marks, macros, search state, and CodeMirror undo history. Vim registers, marks, macros, search state, and related state are global in `@replit/codemirror-vim`. Exercise isolation therefore relies on its typed but underscore-suffixed `resetVimGlobalState_` hook. All direct reliance on that hook is confined to `src/editor/vimCompatibility.ts`, which fails with a clear compatibility error if the pinned package stops exposing it. This bounded architecture supports one active Vim editor.

The production build currently emits a bundle-size warning. That warning is accepted for this diagnostic prototype and bundle optimization is deferred until product development.

Hash URLs remain suitable for the two static Pages routes. A later multi-screen shell may add a small router if navigation requirements justify it.

## Intended boundaries

Current layers are React session shell → persistence interface and pure planning/learning modules → validated content/evaluation/coaching, beside the thin editor adapter. Every transition recreates the editor so Vim state cannot leak.

## Learner evidence and scheduling

Each concept stores strength (observed reliability) separately from confidence (breadth and independence of evidence). Independent means correct with no hints, demonstration, or incorrect checks. Its strength increment is 0.22. Hint levels 1–4 multiply that by 0.65, 0.40, 0.05, and 0; each incorrect check further multiplies it by 0.75, down to zero. A viewed demonstration adds no strength, but adds 0.03 confidence as assisted exposure. Independent varied evidence adds 0.18 confidence (0.09 for a repeated variant); other correct assisted work adds 0.05. These weights never affect correctness. Skips update recency and make work immediately due without lowering strength. Response time and recognized strategy are not learner-model inputs.

The first session is a fixed teaching sequence. Evidence is gathered during it, but its remaining queue is not changed live. When a later session is planned, the planner accepts the accumulated learner state, recent variants, a clock, and a seed. It prioritizes new, weak, and due concepts, penalizes recently used variants, and permits strong work only as an infrequent confidence-building slow ball. It avoids adjacent variant groups, adjacent high-friction work, and same-concept resurfacing without two intervening exercises where possible. Deterministic fallbacks relax the concept gap, then friction/variant preferences, then select the highest-ranked remaining exercise.

## Local persistence

`vim-xp-progress` schema version 2 stores curriculum version, per-concept state, at most 100 compact attempts (including session ID), session metadata, and at most 20 recent variants. Full keystroke traces are never stored. Schema or curriculum mismatch, invalid nested attempt data, unknown exercise IDs, and invalid indexes reset the feature-branch-only data rather than attempting a partial migration. Unavailable storage also falls back safely. A compatible reload resumes position but recreates the unfinished editor attempt. The interface permits future export/import without coupling React to `localStorage`.

Session completion counts compact attempts associated with that session ID. Only seven successful exercises earn “Seven precise edits, done”; mixed or all-skipped sessions report neutral completed/skipped counts.

Known limitation: CMake and shell fixtures currently use plain-text highlighting because syntax color is irrelevant to the engine gate. This can be added independently later.
