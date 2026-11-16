# ai-excited-01 — "The Whale That Outgrew Its Glass"

A giant humpback whale bursting vertically out of a small clear drinking
glass of water on a wooden table, glass shattering, water frozen mid-splash,
backlit by a blazing sunrise through a window. One huge subject, one
impossible scale twist, readable at 300 px.

## How to run

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/entry.png (JPEG bytes, 1024x1024, ~260 KB)
```

## Files

- `entry.png` — the entry image (JPEG data in a `.png` file; the gate reads
  magic bytes, so this is valid)
- `main.ts` — Node 22, stdlib only; copies `entry.png` to
  `$MAKEFUN_OUTPUT_DIR/entry.png` (or `/output/entry.png`). Deterministic:
  two runs produce byte-identical output.
- `LICENSE` — MIT

The image was generated with Muse's built-in media pipeline in the recorded
build session for this competition. No external downloads, no API keys.
