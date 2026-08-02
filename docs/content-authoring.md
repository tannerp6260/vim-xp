# Content authoring

This repository contains a narrow nine-exercise cluster about precise operator and inner-text-object edits. Content lives in framework-independent TypeScript under `src/content`; it must not import React, CodeMirror, or browser APIs.

## Inline command markup

Wrap commands and literal target text in single backticks, for example ``Use `ciw` on `staging`.`` The parser produces text/code segments and React renders semantic `<code>`. This is not full Markdown. Empty spans and unmatched backticks fail validation. Continue using `<kbd>` in React for physical shortcuts such as Ctrl+Enter.

## Declarative format

Each concept and exercise has a stable namespaced ID and semantic content version. Exercises also declare a variant group, role, friction, prompt, initial state, exact outcome, known strategies, a four-step hint ladder, and executable references. Exercise definitions contain data, never evaluator functions.

The currently supported outcome rules form a discriminated union:

- `exact-document` requires byte-for-byte final document text.
- `required-mode` requires the declared final Vim mode.
- `all` requires every nested rule to pass.

Add a new rule by extending the union, evaluator, exhaustive validation, and focused unit tests together. Do not silently accept unknown rule types.

## Correctness and strategy recognition

The outcome evaluator decides correctness from observed document and mode state. Reference sequences and input traces do not decide whether an attempt passes. Only after an outcome passes may coaching compare the semantic trace with known strategies. A known strategy can receive specific reinforcement; an unknown but correct approach passes with neutral coaching and no unsupported efficiency claim.

## Hint ladders and demonstrations

Hints are ordered from conceptual guidance through command family and exact technique to an optional demonstration. They are learner-controlled and non-punitive. Opening a demonstration does not execute it. Manual Next is the default; autoplay is optional. Executing the first step marks the attempt as demonstrated, so later correct reproduction remains assisted exposure rather than independent mastery.

Every exercise declares `demonstration.referenceSolutionId` and one or more ordered steps. Each step has a stable lowercase-hyphenated ID, nonempty tokens, a `key` or `literal` display category, title, and explanation. Concatenated step tokens must exactly equal the selected executable reference. Current change demonstrations separate operator, inner form, target, replacement literal, and Escape. The `di(` demonstration contains only `d`, `i`, and `(`.

Validation rejects missing plans, invalid or duplicate step IDs, empty tokens/copy, unknown references, and token drift. Keep long inserted literals as one semantic step. Explanations describe Vim meaning; observable effects are not authored because the player derives them from real editor snapshots.

Resetting an exercise preserves hints already requested and demonstration-viewed evidence for that attempt. Resetting all local progress cancels any active replay and clears every transient assistance, feedback, and editor state.

## Validation and reference solutions

`validateCurriculum` rejects duplicate IDs, unknown concept references, invalid initial cursor/selection positions, empty prompts or hint ladders, unsupported outcome rules, and empty reference solutions. `validateReferenceSolutions` evaluates replayed reference states against the same declared outcome. Browser coverage must replay every new reference solution through the actual Vim adapter from a clean initial state and prove it passes.

## Adding an exercise safely

1. Add or reuse versioned concepts with stable IDs.
2. Define the exercise as declarative data and use only supported outcome rules.
3. Provide a progressive hint ladder and at least one executable reference solution.
4. Provide a semantic demonstration plan tied exactly to one executable reference solution.
5. Add evaluator and validation unit coverage for any new rule or content shape.
6. Add real-browser coverage that replays each reference solution through `VimEditorAdapter` and satisfies the declared outcome.
7. Add alternative-solution coverage where the exercise names known strategies.
8. Run `npm run check` and `git diff --check`.

Choose a distinct variant group, realistic C++/CMake/shell fixture, valid cursor, exact final text plus Normal-mode outcome, and a replayable reference. Transfer prompts state only the goal; reserve commands for later hints. Update the prescribed sequence only when intentionally changing the teaching design.

Never reject a correct final outcome because its trace differs from a reference solution, and never add an authoritative numerical efficiency score.
