# Tip of the Tongue

A phone-first, two-team party game for decoding warped familiar sayings. The
app is deliberately small and static: `index.html` contains the interface and
gameplay, while `cards.js` contains the deck.

## Run locally

Serve the repository root with any static server, for example:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Validate

The regression suite uses Node's built-in test runner and has no third-party
dependencies:

```sh
npm test
```

It exercises the real card data and gameplay source with controlled DOM,
clock, timer, and audio doubles. Tests cover deck integrity, unbiased
shuffling, round deadlines, rapid duplicate actions, skip/reveal states,
audio failures, equal-turn wins, ties, and rematches.

Production is served from the `main` branch through GitHub Pages at
<https://spencer-c-reed.github.io/idiom-party/>.
