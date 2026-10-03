# Tip of the Tongue

A phone-first, two-team party game for decoding warped familiar sayings. The
app is deliberately small and static: `index.html` contains the interface and
gameplay, `styles.css` contains presentation, and `cards.js` contains the decks.

After each turn, the handoff shows points earned and both teams’ totals. Expand
the missed-sayings review to see skipped, revealed and timed-out answers. The
winning turn keeps the same review; starting a new game or rematch clears it.

During a turn, **Show answer** puts the answer on the card without moving on,
so the reader can check a guess and then tap Got it or Skip. It costs nothing;
a skip after a peek is logged as revealed.

Choose Mixed sayings, Synonym Twists, Mixed Messages, or Dinner table. The dinner
mode retains all 120 category cards (40 in each category), with a meaning as the
clue and the idiom as the answer. `?deck=dinner` opens its setup directly.

## Run locally

Serve the repository root with any static server, for example:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Validate

The regression suite uses Node 22's built-in test runner and has no third-party
dependencies:

```sh
npm test
```

It exercises the real card data and gameplay source with controlled DOM,
clock, timer, and audio doubles. Tests cover deck integrity, unbiased
shuffling, round deadlines, rapid duplicate actions, skip/reveal states,
audio failures, equal-turn wins, ties, rematches, and accessibility contracts.

An end-to-end smoke test launches a locally installed Chrome or Chromium
against a temporary local server:

```sh
npm run test:browser
```

Run both suites with `npm run check`.

Source ships through the `main` branch. Production is a static copy behind the
private gate at <https://spencercav.com/p/idiom-party/>; GitHub Pages is disabled.
The served copy retains the Folio tokens, masthead, and private home-link script.
