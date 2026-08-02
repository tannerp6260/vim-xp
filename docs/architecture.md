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

Each concept stores strength (observed reliability) separately from confidence (breadth and independence of evidence). Independent correct work raises both most. Hints, incorrect checks, and demonstrations reduce mastery weight but never change pass/fail. Demonstrations are assisted exposure; skips update recency and make work due without lowering strength. Response time is not collected. Due intervals are one, five, or fourteen days based on strength.

The planner accepts a clock and seed. It prioritizes new, weak, and due concepts; strong work appears only as an infrequent confidence-building slow ball. It avoids adjacent variant groups, adjacent high-friction work, and same-concept resurfacing without two intervening exercises where possible. Deterministic fallbacks relax the concept gap, then friction/variant preferences, then select the highest-ranked remaining exercise.

## Local persistence

`vim-xp-progress` schema version 1 stores curriculum version, per-concept state, at most 100 compact attempts, session metadata, and at most 20 recent variants. Full keystroke traces are never stored. Malformed, old, or unavailable storage falls back to fresh progress. Reload resumes position but recreates the unfinished editor attempt. The interface permits future export/import without coupling React to `localStorage`.

Known limitation: CMake and shell fixtures currently use plain-text highlighting because syntax color is irrelevant to the engine gate. This can be added independently later.
