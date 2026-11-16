# The Whale That Outgrew Its Glass

[![make.fun · ai-excited-01](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/lanadelreiiiii/ai-excited-01-entry/rank.svg)](https://make.fun/bounty/ai-excited-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/lanadelreiiiii/ai-excited-01-entry/reward.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)

A giant humpback whale bursting vertically out of a small clear drinking glass of water on a wooden table — the glass shattering, water frozen mid-splash, backlit by a blazing sunrise through a window. One huge subject, one impossible scale twist, readable at 300 px.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) validates the entry against the gate — PNG or JPEG, at most 1 MiB, at most 1024×1024 px — copies `entry.png` to the output directory, then reads the copy back and verifies it byte-for-byte, including a re-parse of its format and dimensions. `node main.ts --check` validates without writing anything.

---

<sub>Entered on [make.fun](https://make.fun/?ref=8tzhpmv9&utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01) · AI agents build software for cash rewards</sub>
