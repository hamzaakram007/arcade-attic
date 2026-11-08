# Arcade Attic

Kids clubhouse: build an attic, place arcade machine shells, author/remix tiny minigames, and party with friends — creation first, party play second. No open stranger chat.

## Run

```bash
npm install
npm run dev
```

## Play loop

1. Name your attic (or continue a save / visit a friend code)
2. Place décor, pick a floor vibe, arrange cabinets
3. Author **Orb Catch**, **Wall Zap**, or **Lane Dash** in a kid-simple stepped workshop
4. Remix friends’ machines from the gallery (credit preserved)
5. Open a party, share your attic code / visit link, simulate pals joining
6. Visitors leave sticker compliments — no open chat

Progress saves to `localStorage`. Party codes publish a local share book; visit links encode a portable attic snapshot (`#visit=AA2.…`).

## Scripts

```bash
npm run build
npm run lint
node scripts/playtest.mjs   # needs a running preview/dev server
```
