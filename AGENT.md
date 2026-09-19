# Agent implementation guide

## Conventions

- Prefer the existing inline helpers, naming, palette, and procedural drawing
  patterns. Keep changes surgical and ASCII by default.
- Preserve stable content IDs, existing URLs, controls, modal semantics, and
  classic/plain mode.
- Do not add external assets, CDNs, analytics, secrets, package manifests, or
  network dependencies.
- Keep world rendering pixel-crisp (`imageSmoothingEnabled = false` while
  composing world art) and cull expensive effects.
- Use `prefers-reduced-motion`, `focus-visible`, safe-area insets, and semantic
  labels for new UI. Every touch action needs a keyboard equivalent.

## Safety constraints

- Collision checks must be applied before both player and mounted-animal
  movement; dismount only to a valid nearby walkable tile.
- Save parsing is untrusted: validate version, IDs, numeric ranges, and object
  shapes; fall back to defaults without throwing.
- Do not broaden discovery counters or replace portfolio content accidentally.
- Sequences must be skippable, pausable where appropriate, and recover cleanly
  when a modal, blur, resize, or input interruption occurs.

## Validation commands

```powershell
$s = [IO.File]::ReadAllText('.\index.html')
$m = [regex]::Matches($s, '<script(?: [^>]*)?>([\s\S]*?)</script>')
$m[$m.Count-1].Groups[1].Value | Set-Content -Encoding utf8 .\.__check.js
node --check .\.__check.js
Remove-Item .\.__check.js
git diff --check
git status --short
git diff --stat
```

Also serve the repository over HTTP and test desktop/mobile viewport sizes,
keyboard and touch controls, modal focus, classic mode, reduced motion, save
reload, and frame pacing near water, animals, and transport landmarks.

## Handoff

Report exact files changed, validation commands and outcomes, known limitations,
branch name, and commit hash. Do not deploy. Commit source and living docs
together only when the user has requested the final commit.
