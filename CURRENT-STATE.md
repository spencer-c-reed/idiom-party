# Tip of the Tongue — current state

## What is true
- Static phone-first party game for decoding warped familiar sayings.
- `index.html` contains the interface and gameplay, `styles.css` presentation, and `cards.js` the decks.
- Production is a private-page deployment at `/p/idiom-party/`.

## In flight
- Maintaining card decks, gameplay behavior, and regression coverage.
- Browser and Node test paths validate real game behavior.

## Next action
- Keep card data and gameplay changes covered by `npm test` and browser smoke checks before publishing.

## Known failure modes
- Static client-side changes can affect gameplay without server-side safety nets.
- Deck integrity and timer/action edge cases depend on regression coverage.

## Ground truth
- `README.md`
- `index.html`
- `cards.js`
- `styles.css`
- `package.json`
