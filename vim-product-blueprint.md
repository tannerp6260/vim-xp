# Vim Fluency Product Blueprint

Status: implementation-ready planning baseline
Working title: Vim Fluency (provisional; not a branding decision)

## Product promise

Discover the Vim techniques experienced developers rely on—and practice them until they become part of how you edit.

This is an interactive Vim apprenticeship for developers who understand basic Vim but still perform many edits manually or repetitively. It should reproduce the useful discoveries that normally occur while pairing with an experienced Vim user, then reinforce those discoveries through varied, spaced, hands-on practice.

## Primary audience

The MVP is optimized for developers who:

- Understand Normal and Insert mode.
- Can open and edit a file.
- Know basic movement, insertion, deletion, and change operations.
- Are not yet fluent with composable or efficient Vim techniques.
- Want practical improvement without studying an encyclopedia or solving hard puzzles.

Complete beginners are not the primary MVP audience. Advanced users should be able to take optional placement, skip freely, browse topics, and reach useful material quickly, but sustained expert-level breadth is not an MVP success requirement.

## Defining emotional tone

- Approachable and encouraging.
- Curious and discovery-oriented.
- Easy enough to maintain momentum.
- Helpful rather than judgmental.
- Never LeetCode-like.
- Never punitive about hints or alternate valid solutions.

The satisfying moment is: “I did not know Vim could do that—and now I can see when I would use it.”

## Core learning loop

1. Introduce a useful technique with generous guidance.
2. Let the learner perform it in a realistic developer-oriented edit.
3. Present one or more related applications soon afterward.
4. Gradually remove clues that name the desired command.
5. Interleave the technique with unrelated skills.
6. Test it later in a changed context.
7. Continue resurfacing it indefinitely at decreasing frequency.

Mastered material is never permanently removed. It becomes a rare “slow ball” that preserves confidence, fluency, and the ability to detect forgetting.

## Learning standard

The product aims for automatic command selection, not mere awareness.

Evidence progresses through:

1. Recognition.
2. Guided execution.
3. Independent execution.
4. Unprompted selection.
5. Transfer to a different context.
6. Delayed recall.

Showing an exact answer is a valid practice event, but it is not equivalent evidence of mastery.

## Practice session composition

A finite practice session should draw from four pools:

- Current or new material.
- Weak, missed, or due material.
- Mixed transfer exercises.
- Occasional familiar confidence-building exercises.

Repetition should vary the application rather than merely repeat the same question. Variation can change:

- Programming language or text domain.
- Cursor starting position.
- Direction of movement.
- Surrounding syntax.
- Whether the concept is isolated or composed with another.
- Whether the command is named.
- Whether the learner must recognize that the concept is appropriate.

The initial target is a short session of roughly five to ten minutes, followed by a satisfying stopping point and an option to continue.

## Product structure

### First launch

- Start learning.
- Take optional placement.
- Explore topics.
- Briefly explain editor capture, reset, checking, hints, and compatibility scope.
- Reach a real exercise quickly.

### Recommended practice

- A dominant Continue practice action.
- A dynamically assembled finite session.
- No artificial daily streak requirement.

### Topic explorer

- All content remains accessible.
- Show simple states such as New, Learning, Familiar, Strong, and Due.
- Allow direct practice and user controls such as Practice more, Show less often, and I already know this.
- Placement and prerequisites guide recommendations rather than gate access.

### Progress

- Techniques discovered.
- Concepts currently in rotation.
- Strong areas and weak areas.
- Recent improvement.
- Optional practice history.

Do not prioritize leaderboards, social feeds, competition, or a global Vim rank.

### Compatibility and feedback

- A concise onboarding statement that the trainer is not a complete Vim or Neovim distribution.
- A permanently accessible compatibility page.
- Contextual notices for recognizable unsupported behavior when feasible.
- General feedback.
- Report this exercise.
- Progress export, import, and reset.

## Exercise experience

The active exercise should prioritize:

- Clear editing goal.
- Large Vim editor.
- Visible mode.
- Reset.
- Progressive hints.
- Explicit Check action with a keyboard shortcut.
- Concise feedback.

### Hint ladder

1. Conceptual direction.
2. Relevant command family or mental model.
3. Exact command or sequence.
4. Demonstration or replay.
5. Reset and reproduce.

### Correctness and coaching

Correctness is evaluated first. Coaching follows.

- Intended approach: recognize and reinforce it.
- Equivalent approach: accept fully and optionally show another useful method.
- Correct but laborious: pass and offer a shorter or more repeatable method.
- Correct but target technique not practiced: acknowledge completion and offer an optional targeted retry.
- Unknown but correct approach: pass without unsupported claims about its efficiency.

Do not expose one authoritative numerical efficiency score in the MVP.

## Initial exercise formats

1. Direct editing.
2. Demonstrate and reproduce.
3. Predict or choose.
4. Diagnose and improve.

Direct editing remains the majority. Larger open-ended workflows and numerous custom minigames are deferred until the core evaluator is proven.

## Placement

Placement is part of the fuller MVP, not the first technical prototype.

It should:

- Be optional.
- Sample representative concept families.
- Escalate quickly.
- Stop when additional tasks are unlikely to change the recommendation.
- Seed strength estimates with explicit uncertainty.
- Produce a recommended starting position rather than a rank.
- Never lock content.

## Learner model

Maintain separate estimates for:

- Strength: how reliably the learner appears to perform the concept.
- Confidence: how much varied evidence supports that estimate.

Potential evidence:

- Independent and assisted successes.
- Highest hint level used.
- Recent failures.
- Distinct contexts encountered.
- Unprompted transfer.
- Last-seen time.
- Recent exercise and variant IDs.

Response speed should not initially affect mastery.

## Scheduler principles

- Deterministic and independently testable.
- Uses an injectable clock and seeded randomness.
- Introduces few new concepts at once.
- Resurfaces a missed concept after a short gap.
- Avoids identical recent variants.
- Avoids several high-friction exercises in a row.
- Reduces frequency after repeated success.
- Increases contextual variation as strength rises.
- Preserves a small long-term resurfacing probability.
- Allows the learner to influence recommendations.

No runtime AI or opaque machine-learning tutor is required.

## Curriculum direction

Organize around capabilities rather than an alphabetical command list:

- Target text precisely.
- Change structured text.
- Navigate code efficiently.
- Search and act on matches.
- Repeat and scale edits.
- Reuse and move text.
- Transform larger regions.
- Manage increasingly complex workflows.

Primary content domains:

- C++.
- CMake.
- Shell scripts.

Supporting domains may include configuration, logs, JSON, YAML, build output, and documentation.

The first vertical slice focuses on precise, composable, single-buffer editing. It must demonstrate introduction, guided repetition, contextual variation, unprompted transfer, and delayed review before expanding breadth.

## Prototype scope

The first deployable vertical slice includes:

- React, TypeScript, and Vite shell.
- CodeMirror 6 Vim feasibility laboratory.
- Thin editor adapter.
- One coherent skill cluster.
- Several polished exercise variations.
- Final-state correctness evaluation.
- Progressive hints.
- Basic solution feedback.
- Simple local progress.
- Rudimentary review queue.
- Automated tests.
- GitHub Pages deployment.

It excludes:

- Accounts and backend.
- Runtime AI.
- Placement.
- Broad curriculum.
- Social or competitive systems.
- Plugins and user configuration.
- Authentic shell execution or arbitrary filesystem access.
- Complete multi-window or multi-buffer workflows.
- Mobile support.

## Technical architecture

Major layers:

1. React application shell.
2. Exercise runtime.
3. Vim editor adapter.
4. Validated curriculum catalog.
5. Outcome and strategy evaluation.
6. Learner model and session scheduler.
7. Versioned local persistence.

Learning and evaluation logic should be framework-independent TypeScript. React should not own curriculum rules, mastery updates, or session-selection algorithms.

## Vim engine decision

Use CodeMirror 6 with @replit/codemirror-vim as the first candidate, subject to a feasibility gate.

The product guarantees fidelity for behavior it teaches. Untaught behavior may be unsupported or best effort. Never silently teach known incorrect behavior.

The editor feasibility laboratory must verify:

- Modes, motions, operators, counts, and text objects.
- Visual mode.
- Search and repeat.
- Undo and redo.
- Registers, marks, macros, and representative Ex commands.
- State isolation between exercises.
- Mode, cursor, selection, and document observability.
- Normalized input capture.
- Programmatic reference-solution replay.
- Chrome and Firefox behavior.
- GitHub Pages behavior.

If core taught behavior requires numerous patches or clean reset and observability are not possible, stop and reconsider the engine before building the product around it.

## Content representation

Use serializable TypeScript content objects validated independently during build and test.

Separate:

- Concepts.
- Units.
- Exercises.
- Variant groups.
- Reference strategies.

An exercise includes:

- Stable ID and content version.
- Kind and language.
- Primary and supporting concepts.
- Variant group.
- Prompt.
- Initial text, cursor, selection, and optional mode.
- Declarative outcome rules.
- Known strategies.
- Progressive hints.
- One or more reference solutions.
- Difficulty and scheduling metadata.
- Placement eligibility.

Do not embed arbitrary evaluator functions in exercise content. Use a tested union of declarative evaluator types.

## Evaluation model

Initial outcome rules may support:

- Exact text.
- Configurably normalized text.
- Required changes within a range.
- Required or forbidden text.
- Ordered expected lines.
- Optional cursor, selection, or mode requirements.
- Logical combinations of supported rules.

Strategy recognition may use normalized key input, editor transactions, cursor and selection changes, and mode transitions. If strategy recognition is uncertain but the final state is correct, the attempt passes.

Every reference solution should be replayed automatically from the exercise starting state and verified against the outcome rule.

## Persistence

Use compact browser-local storage behind a persistence interface with:

- Load.
- Save.
- Export.
- Import.
- Reset.
- Migration.

Store:

- Schema version.
- Content/application version.
- Concept states.
- Attempt summaries.
- Settings.
- Onboarding and placement status.

Do not persist full keystroke traces by default. Feedback may include diagnostic traces only with user consent.

## Routing and deployment

- Desktop first.
- Chrome/Chromium primary.
- Firefox compatibility testing.
- Hash-based routing for dependable GitHub Pages behavior.
- Main is the deployable production branch.
- Short-lived feature branches for nontrivial work.
- No permanent develop branch.
- GitHub Actions verifies branches and pull requests.
- Only main deploys to GitHub Pages.
- No manually maintained gh-pages branch.

## Testing

### Unit

- Outcome evaluators.
- Strategy recognizers.
- Learner-profile updates.
- Scheduler and session planning.
- Storage migrations.
- Content validation.

### Browser integration

- Vim behavior.
- Editor reset and state isolation.
- Key capture.
- Reference replay.
- Chrome and Firefox.

### End to end

- First launch.
- Exercise completion.
- Hints.
- Correct and incorrect submission.
- Progress reload.
- Session completion.
- Import and export.
- Pages-style base path.

### Content validation

Reject duplicate IDs, broken references, invalid cursor positions, unknown concepts, invalid outcome rules, empty hint ladders, and reference solutions that do not satisfy their exercises.

## Repository documentation requirements

- README.md: overview and fastest start.
- AGENTS.md: durable Codex rules and verification expectations.
- docs/product-blueprint.md.
- docs/architecture.md.
- docs/local-development.md.
- docs/deployment.md.
- docs/git-workflow.md.
- docs/content-authoring.md.
- docs/engine-evaluation.md.
- docs/troubleshooting.md.

The project should provide obvious scripts for development, linting, type checking, unit tests, browser tests, build, production preview, and one comprehensive local verification command.

## Implementation sequence

1. Repository scaffold, documentation skeleton, CI, and deployment configuration.
2. CodeMirror Vim laboratory and conformance suite.
3. Thin editor adapter.
4. Declarative exercise definition and content validation.
5. Outcome evaluator.
6. One complete exercise from load through feedback.
7. Hint progression and reference replay.
8. Small polished vertical-slice curriculum.
9. Local attempt and progress persistence.
10. Basic review and session selection.
11. Coworker testing and exercise reporting.
12. Placement and fuller adaptive scheduling.
13. Topic explorer, import/export, and polish.

## Repository-wide non-negotiables

- No runtime AI.
- No backend or accounts in the MVP.
- No leaderboard, social feed, or mandatory streak.
- Correct unknown solutions are not rejected merely because they differ from a reference.
- Hints are part of learning and are never treated as moral failure.
- Do not optimize for command count or content volume.
- Do not couple domain logic to React or CodeMirror.
- Do not add exercises without validation and executable reference-solution tests.
- Do not claim full Vim or Neovim compatibility.
- Keep the prototype narrow until the learning loop and engine are proven.
