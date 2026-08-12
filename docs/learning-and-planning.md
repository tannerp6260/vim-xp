# Learning and session planning

Concept state keeps strength (reliable performance) separate from confidence (breadth and independence of evidence). This checkpoint does not change accepted weights: independent correctness still means no hints, no demonstration, and no incorrect checks; demonstrations add zero strength and assisted-exposure confidence; skips do not lower strength and are immediately due. Correct alternative and unknown strategies receive full outcome credit.

The planner is pure TypeScript with injected clock and seeded randomness. A fresh learner receives the unchanged `unit.precise-text-objects` session. `unit.line-targeting` is recommended afterward, but prerequisites are advisory and either unit can be opened directly. An unseen manually selected unit receives its prescribed introduction.

Later focused sessions aim for five exercises from the selected unit and up to two useful prerequisite reviews. Ranking favors new, missed, weak, and due concepts; recent variants are penalized. Concept spacing, adjacent variant avoidance, friction balancing, and the infrequent strong-concept slow ball remain preferences. Fallbacks deterministically relax concept spacing, then friction/variant constraints, then select the highest-ranked remaining candidate.

Ordinary practice continues attributing its unchanged evidence weights to primary concepts. Placement is more conservative: correctness is evaluated first, and only a recognized accepted strategy credits its explicitly declared concepts. Unknown-correct, incorrect, and “I don’t know” results never reduce evidence. Timing is ignored because speed is neither correctness nor reliable technique evidence.

Placement probes quoted-value editing, direct `t` movement, parenthesized editing, repeat/reverse, operator composition, a representative move-and-repeat workflow, and a representative search-and-act workflow; a word confirmation appears only for split Unit 1 evidence. Recommendation walks units in curriculum order and selects the earliest unit with an unconfirmed required gate. Only confirmation across all four units recommends mixed adaptive review. Strong practice evidence can satisfy a gate.

Focused Units 3 and 4 begin with their fixed seven-exercise introductions unless their required placement capability is confirmed. Later focused sessions retain the five-focus/two-prerequisite balance. Unfocused adaptive sessions first represent every current unit, then fill remaining slots using weak/due priority, variant penalties, concept spacing, friction balance, and infrequent mastered-concept slow balls.

Confirmed concepts receive provisional floors of strength 0.60, confidence 0.35, one exposure/success, and a due date about three days later. Higher values and later due dates are preserved. Application is idempotent and retakes cannot farm evidence. Placement alone reads Familiar, never Strong or mastered.
