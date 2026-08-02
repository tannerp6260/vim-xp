# Learning and session planning

Concept state keeps strength (reliable performance) separate from confidence (breadth and independence of evidence). This checkpoint does not change accepted weights: independent correctness still means no hints, no demonstration, and no incorrect checks; demonstrations add zero strength and assisted-exposure confidence; skips do not lower strength and are immediately due. Correct alternative and unknown strategies receive full outcome credit.

The planner is pure TypeScript with injected clock and seeded randomness. A fresh learner receives the unchanged `unit.precise-text-objects` session. `unit.line-targeting` is recommended afterward, but prerequisites are advisory and either unit can be opened directly. An unseen manually selected unit receives its prescribed introduction.

Later focused sessions aim for five exercises from the selected unit and up to two useful prerequisite reviews. Ranking favors new, missed, weak, and due concepts; recent variants are penalized. Concept spacing, adjacent variant avoidance, friction balancing, and the infrequent strong-concept slow ball remain preferences. Fallbacks deterministically relax concept spacing, then friction/variant constraints, then select the highest-ranked remaining candidate.

The learner model currently attributes evidence to each exercise's declared primary concepts. Before placement, more conservative strategy-specific attribution may be needed for navigation outcomes reachable through many equivalent commands. Correctness must remain outcome-based even if attribution becomes more selective.
