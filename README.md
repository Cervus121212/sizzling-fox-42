# Make the best cooking game — Dapur Kilat

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/competitions/best-cooking-game-20261125-0137)

Entry for the make.fun bounty **"Make the best cooking game"**
(`best-cooking-game-20261125-0137`): a complete, original cooking game
that runs offline in a desktop browser from static files, played with
keyboard and mouse.

## The game

**Dapur Kilat** — run a fast kitchen through a 3-minute shift. Orders
arrive on the board; take ingredients from the counter, chop them, cook
them, assemble the dish on a plate, and serve it before the timer runs
out. Four recipes (Burger Kilat, Salad Segar, Steak Tomat, Sandwich
Taman), a score + combo system, rising pressure as the shift goes on,
WebAudio sounds, and a game-over screen with restart.

## Cara jalan

Serve `game/` with any static HTTP server and open `game/index.html`
in desktop Chrome, or open the file directly:

```sh
python3 -m http.server 8080 --directory game
```

No network requests, no build step — every file the game loads lives
under `game/`.

## Screenshots

`screenshots/` holds 4 real renders of the game's own code: the kitchen
in full rush, chopping, cooking, and a plate ready to serve.

## Lisensi

MIT — see [LICENSE](LICENSE).
