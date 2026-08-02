# Local persistence and migration

Browser-local key `vim-xp-progress` uses schema version 3 with curriculum version 3.0.0. It stores concept strength/confidence and due timestamps, at most 100 compact attempts, the current or latest unit-aware session, and at most 20 recent variants. It never stores full keystroke traces, accounts, or synchronized data.

The schema-2/curriculum-2.0.0 migration is deterministic and idempotent. It preserves valid concept state, attempts, timestamps, recent variants, session ID, queue, index, completion state, seed, and creation time, then identifies that session as `unit.precise-text-objects`. New Unit 2 concepts remain absent and therefore New. Bounds are applied without duplicating attempts.

Malformed nested concept or attempt data, unknown versions, impossible indexes, and unknown exercise or unit IDs fail safely to fresh progress. Unavailable storage also falls back without blocking practice. Reset local progress intentionally removes all state. Future content additions should preserve stable IDs and add an explicit migration whenever a version change would otherwise invalidate compatible evidence.
