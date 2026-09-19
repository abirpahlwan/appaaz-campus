# Implementation tasks

## Phase 1 — world and interactions

- [x] Add expanded biomes, water routes, rail/runway, and portfolio landmarks.
- [x] Add procedural rabbits, goats, deer, and animal rendering.
- [x] Give every animal entity a distinct stable name and show names in
  contextual animal interactions.
- [x] Polish added biome palettes and landmark silhouettes without changing
  mechanics or entity contracts.
- [x] Add a bounded mountain exploration pass: switchback route, tiered
  alpenglow peak, summit flag, ambient motes, Pipkin cameo, telescope, and bell.
- [x] Complete accepted mountain Level 3 trail readability and Level 4 alpine
  meadow/meltwater slice.
- [x] Complete accepted mountain Level 5 rope-bridge crossing with safe
  bidirectional approach and contextual feedback.
- [ ] Validate and implement mountain Levels 6-10 as separate milestones.
- [x] Make placement deterministic and movement collision-safe.
- [x] Complete petting, affinity, care/raising state, mounting, riding, and
  safe dismount behavior.
- [x] Add environmental, railway, aircraft, and rocket interactions.

## Phase 2 — accessibility and resilience

- [x] Verify E/Space, WASD/arrows, LOOK, and touch parity in source paths.
- [x] Make sequences skippable, pause-safe, reduced-motion aware, and modal-safe.
- [x] Validate classic/plain mode and preserve discovery totals in source paths.
- [x] Validate bounded localStorage migration and reset behavior in source paths.

## Phase 3 — dreamy visual treatment

- [x] Add initial glass tokens and translucent village surfaces.
- [x] Finish village fog/atmosphere without increasing per-frame cost sharply.
- [x] Apply shared glass treatment to blog and arcade wrapper pages.
- [x] Apply palette/effect treatment to all four playable canvases without
  changing simulation mechanics.

## Phase 4 — validation and handoff

- [x] Run initial JavaScript syntax check.
- [x] Run static/diff checks after final edits.
- [x] Re-run all inline-script checks and smoke-test every portfolio/game route.
- [ ] Test desktop, mobile/coarse pointer, reduced motion, and accessibility
  manually in a real browser/device.
- [ ] Check performance around expanded terrain, water, animals, and sequences
  with a profiler.
- [x] Update all living docs with final status and known limitations.
- [x] Commit source and docs together; do not deploy.

## Phase 5 — audio feedback

- [x] Add gesture-gated procedural audio manager with mute/volume controls.
- [x] Cover object, animal, summit, transport, environment, success/failure,
  and UI interactions with distinct one-shots.
- [x] Add deterministic biome-aware low-volume BGM with visibility/unload
  cleanup and no overlapping schedulers.
- [x] Validate syntax, diff whitespace, route smoke tests, and live preview;
  commit locally without pushing.

## Checkpoints

- **Complete:** source and living docs are committed; static and route checks
  pass.
- **Known limitation:** browser/device interaction and frame profiling are not
  automated in this repository and should be run before a public release.
- **Aesthetic checkpoint:** terrain and landmark polish is staged for validation;
  OpenCode free-model review stalled after inspection, so the final bounded
  patch was applied locally.
- **Mountain checkpoint:** accepted progress is Level 5. Levels 6-10 remain
  unstarted; exploratory wildlife, overlook, balloon, and camp ideas are not
  milestone completion.
- **Audio child session:** `Audio FX and BGM` completed handoff on
  `abirpahlwan-audio-fx-bgm`; no audio work has been merged into this branch.
