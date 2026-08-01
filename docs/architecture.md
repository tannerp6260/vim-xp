# Architecture

## Current learning-loop checkpoint

Hash routing selects the learner-facing `#/practice` screen by default and preserves the diagnostic `#/lab` screen without a routing dependency. `PracticeScreen` owns only the in-memory lifecycle and presentation. Framework-independent modules under `src/content` define versioned concepts and exercises, validate content, evaluate declarative outcomes, and produce post-correctness coaching. They do not import React, CodeMirror, or browser APIs.

Correctness is computed from the final editor snapshot and a discriminated outcome-rule union. Trace-based strategy recognition runs only after correctness is known, so an unrecognized correct solution passes. Reference solutions remain executable Vim token sequences and must pass the same outcome rules through the real adapter.

This checkpoint intentionally contains one exercise. It does not implement curriculum breadth, scheduling, persistence, placement, accounts, achievements, or adaptive behavior.

## Editor and diagnostic laboratory

`App` renders diagnostic controls and observed state. `VimEditor` owns the React lifecycle boundary. `VimEditorAdapter` alone constructs CodeMirror, enables Vim, reads state, subscribes to changes, captures normalized keyboard input, replays tokens, focuses, and destroys the editor. Pure trace normalization has no browser or React dependency. Its semantic stream discards modifier-only `Control`, `Shift`, `Alt`, and `Meta` keydowns while retaining completed chords such as `<C-r>`. Any future raw DOM diagnostic log must remain a separate channel and must not contaminate the semantic trace used for coaching.

Reset increments a React generation and destroys/recreates the complete editor. This is intentional: replacing document text alone does not clear Vim registers, marks, macros, search state, and CodeMirror undo history. Vim registers, marks, macros, search state, and related state are global in `@replit/codemirror-vim`. Exercise isolation therefore relies on its typed but underscore-suffixed `resetVimGlobalState_` hook. All direct reliance on that hook is confined to `src/editor/vimCompatibility.ts`, which fails with a clear compatibility error if the pinned package stops exposing it. This bounded architecture supports one active Vim editor.

The production build currently emits a bundle-size warning. That warning is accepted for this diagnostic prototype and bundle optimization is deferred until product development.

Hash URLs remain suitable for the two static Pages routes. A later multi-screen shell may add a small router if navigation requirements justify it.

## Intended boundaries

Current layers are React shell → in-memory exercise lifecycle → thin editor adapter, alongside framework-independent validated content, evaluator, and coaching modules. Future learner model, scheduler, and persistence layers remain deliberately absent. Curriculum rules must not move into React or CodeMirror callbacks. Do not generalize the adapter ahead of evidenced exercise needs.

Known limitation: CMake and shell fixtures currently use plain-text highlighting because syntax color is irrelevant to the engine gate. This can be added independently later.
