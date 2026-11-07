import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const cardsSource = readFileSync(new URL("../cards.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const stylesSource = readFileSync(
  new URL("../styles.css", import.meta.url),
  "utf8",
);
const inlineScripts = [
  ...htmlSource.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g),
]
  .map((match) => match[1].trim())
  .filter(Boolean);
const appSource = inlineScripts.at(-1);

class ClassList {
  constructor(classes = "") {
    this.values = new Set(classes.split(/\s+/).filter(Boolean));
  }

  add(...classes) {
    classes.forEach((className) => this.values.add(className));
  }

  remove(...classes) {
    classes.forEach((className) => this.values.delete(className));
  }

  contains(className) {
    return this.values.has(className);
  }

  toggle(className, force) {
    const enabled = force === undefined ? !this.contains(className) : force;
    enabled ? this.add(className) : this.remove(className);
    return enabled;
  }
}

class Element {
  constructor(id, classes = "") {
    this.id = id;
    this.classList = new ClassList(classes);
    this.dataset = {};
    this._disabled = false;
    this.tagName = "DIV";
    this.textContent = "";
    this.value = "";
    this.attributes = new Map();
    this.ownerDocument = null;
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this._disabled = Boolean(value);
    if (this._disabled && this.ownerDocument?.activeElement === this) {
      this.ownerDocument.activeElement = null;
    }
  }

  focus() {
    if (this.ownerDocument && !this.disabled) {
      this.ownerDocument.activeElement = this;
    }
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  querySelector(selector) {
    if (selector === ".on") {
      return this.buttons.find((button) => button.classList.contains("on"));
    }
    return null;
  }

  querySelectorAll(selector) {
    return selector === "button" ? this.buttons ?? [] : [];
  }
}

function createFixture({ audio = "missing" } = {}) {
  let now = 1_000;
  let nextTimerId = 1;
  const timeouts = new Map();
  const intervals = new Map();
  const listeners = new Map();
  let audioContextsCreated = 0;

  const ids = [
    "sound",
    "soundIcon",
    "t1",
    "t2",
    "times",
    "targets",
    "decks",
    "categories",
    "dinnerCategories",
    "handoff",
    "cardHint",
    "homeTitle",
    "howTitle",
    "setupTitle",
    "n1",
    "n2",
    "s1",
    "s2",
    "teamA",
    "teamB",
    "turnTitle",
    "gameTitle",
    "skipBtn",
    "correctBtn",
    "revealBtn",
    "clock",
    "gib",
    "answer",
    "winTitle",
    "finalScore",
    "announcer",
    "turnRecap",
    "turnRecapTitle",
    "turnRecapScore",
    "turnMissed",
    "turnMissedTitle",
    "turnMissedCards",
    "winRecap",
    "winRecapTitle",
    "winRecapScore",
    "winMissed",
    "winMissedTitle",
    "winMissedCards",

  ];
  const elements = Object.fromEntries(ids.map((id) => [id, new Element(id)]));
  elements.t1.value = "Hot Dogs";
  elements.t2.value = "Cool Cats";

  function makeSegment(id, values, selected) {
    const segment = elements[id];
    segment.buttons = values.map((value) => {
      const button = new Element("");
      button.tagName = "BUTTON";
      button.dataset.v = String(value);
      if (value === selected) button.classList.add("on");
      return button;
    });
  }

  makeSegment("decks", ["mixed", "SYNONYM TWIST", "MIXED MESSAGE", "dinner"], "mixed");
  makeSegment("categories", ["All", "Easy classics", "Food & life", "Difficult delightful"], "All");
  makeSegment("times", [30, 45, 60], 30);
  makeSegment("targets", [7, 10, 15], 10);

  const screens = ["home", "how", "setup", "turn", "game", "win"].map(
    (id, index) => {
      const screen = new Element(id, `screen${index === 0 ? " active" : ""}`);
      elements[id] = screen;
      return screen;
    },
  );
  const card = new Element("", "card");

  const document = {
    activeElement: null,
    hidden: false,
    addEventListener(name, listener) {
      listeners.set(name, listener);
    },
    getElementById(id) {
      return elements[id];
    },
    querySelector(selector) {
      return selector === ".card" ? card : null;
    },
    querySelectorAll(selector) {
      if (selector === ".screen") return screens;
      if (selector === ".seg") return [elements.times, elements.targets, elements.decks, elements.categories];
      return [];
    },
  };
  [
    ...Object.values(elements),
    ...elements.times.buttons,
    ...elements.targets.buttons,
    ...screens,
    card,
  ].forEach((element) => {
    element.ownerDocument = document;
  });

  class WorkingAudioContext {
    constructor() {
      audioContextsCreated += 1;
      this.currentTime = 0;
      this.destination = {};
      this.state = "running";
    }

    createGain() {
      return {
        connect() {
          return this;
        },
        gain: {
          exponentialRampToValueAtTime() {},
          setValueAtTime() {},
        },
      };
    }

    createOscillator() {
      return {
        connect(target) {
          return target;
        },
        frequency: { value: 0 },
        start() {},
        stop() {},
        type: "",
      };
    }

    resume() {
      return Promise.resolve();
    }
  }

  class ThrowingAudioContext {
    constructor() {
      audioContextsCreated += 1;
      throw new Error("audio unavailable");
    }
  }

  const context = {
    AudioContext:
      audio === "working"
        ? WorkingAudioContext
        : audio === "throwing"
          ? ThrowingAudioContext
          : undefined,
    Date: { now: () => now },
    Math: Object.create(Math),
    clearInterval(id) {
      intervals.delete(id);
    },
    clearTimeout(id) {
      timeouts.delete(id);
    },
    console,
    document,
    performance: { now: () => 1_000 },
    setInterval(callback) {
      const id = nextTimerId++;
      intervals.set(id, callback);
      return id;
    },
    setTimeout(callback, delay = 0) {
      const id = nextTimerId++;
      timeouts.set(id, { callback, dueAt: now + delay });
      return id;
    },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(cardsSource, context, { filename: "cards.js" });
  vm.runInContext(appSource, context, { filename: "index.html" });

  function advance(milliseconds) {
    now += milliseconds;
    let ranTimer;
    do {
      ranTimer = false;
      const due = [...timeouts.entries()]
        .filter(([, timer]) => timer.dueAt <= now)
        .sort((left, right) => left[1].dueAt - right[1].dueAt);
      for (const [id, timer] of due) {
        if (!timeouts.delete(id)) continue;
        timer.callback();
        ranTimer = true;
      }
    } while (ranTimer);
  }

  function value(expression) {
    const result = vm.runInContext(expression, context);
    return result === undefined
      ? undefined
      : JSON.parse(JSON.stringify(result));
  }

  return {
    advance,
    audioContextsCreated: () => audioContextsCreated,
    elements,
    listeners,
    now: () => now,
    runIntervals() {
      [...intervals.values()].forEach((callback) => callback());
    },
    run(expression) {
      return vm.runInContext(expression, context);
    },
    value,
  };
}

function visibleScreen(fixture) {
  return fixture.value(
    `[...document.querySelectorAll(".screen")].find(
      (screen) => screen.classList.contains("active")
    ).id`,
  );
}

test("card data and deck-cycle invariants remain valid", () => {
  const fixture = createFixture();
  const summary = fixture.value(`(() => {
    const deck = makeDeck();
    const keys = deck.map((card) => answerKey(card[1]));
    const nextDeck = makeDeck(deck.at(-1)[1]);
    return {
      cards: cards.length,
      deck: deck.length,
      difficulties: [...new Set(cards.map((card) => card[2]))].sort(),
      modes: [...new Set(cards.map((card) => card[3]))].sort(),
      recordsValid: cards.every(
        (card) =>
          Array.isArray(card) &&
          card.length === 4 &&
          card.every((field) => typeof field === "string" && field.length > 0)
      ),
      uniqueAnswers: new Set(keys).size,
      boundaryRepeats:
        answerKey(deck.at(-1)[1]) === answerKey(nextDeck[0][1]),
    };
  })()`);

  assert.deepEqual(summary, {
    boundaryRepeats: false,
    cards: 103,
    deck: 93,
    difficulties: ["E", "H", "M"],
    modes: ["MIXED MESSAGE", "SYNONYM TWIST"],
    recordsValid: true,
    uniqueAnswers: 93,
  });
});

test("shuffle is deterministic with an injected RNG and does not mutate input", () => {
  const fixture = createFixture();
  const result = fixture.value(`(() => {
    const source = [0, 1, 2, 3];
    return { source, shuffled: shuffle(source, () => 0) };
  })()`);

  assert.deepEqual(result.source, [0, 1, 2, 3]);
  assert.deepEqual(result.shuffled, [1, 2, 3, 0]);
  assert.doesNotMatch(appSource, /\.sort\(\s*\(\)\s*=>\s*Math\.random/);
});

test("markup and responsive styles preserve core accessibility guarantees", () => {
  assert.match(
    htmlSource,
    /<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" \/>/,
  );
  assert.doesNotMatch(htmlSource, /user-scalable\s*=\s*no/i);
  assert.match(htmlSource, /<label for="t1">Team 1<\/label>/);
  assert.match(htmlSource, /<label for="t2">Team 2<\/label>/);
  assert.match(htmlSource, /<fieldset class="field">[\s\S]*?<legend>Seconds per turn<\/legend>/);
  assert.match(htmlSource, /aria-pressed="true"/);
  assert.match(htmlSource, /role="timer"/);
  assert.match(htmlSource, /aria-live="polite"/);

  assert.match(
    stylesSource,
    /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+minmax\(0,\s*1fr\)/,
  );
  const cssRule = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return stylesSource.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
  };
  assert.match(cssRule(".team"), /overflow-wrap:\s*anywhere/);
  assert.match(
    stylesSource,
    /#turnTitle,\s*#winTitle\s*\{[^}]*overflow-wrap:\s*anywhere/,
  );
  assert.match(stylesSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(cssRule(".pill"), /min-width:\s*44px/);
  assert.match(cssRule(".hint"), /opacity:\s*0\.68/);
  assert.match(cssRule(".team.active-team"), /color:\s*#a92916/);
  assert.match(
    cssRule(".active-team .turn-marker"),
    /display:\s*block/,
  );
  assert.match(stylesSource, /env\(safe-area-inset-left\)/);
  assert.match(stylesSource, /env\(safe-area-inset-right\)/);
});

test("screen focus, choice state, and sound state stay synchronized", () => {
  const fixture = createFixture();

  fixture.run("go('setup')");
  assert.equal(fixture.value("document.activeElement.id"), "setupTitle");
  assert.equal(fixture.elements.home.getAttribute("aria-hidden"), "true");
  assert.equal(fixture.elements.setup.getAttribute("aria-hidden"), "false");

  const [, fortyFive] = fixture.elements.times.buttons;
  fixture.elements.times.onclick({ target: fortyFive });
  assert.equal(fixture.elements.times.buttons[0].getAttribute("aria-pressed"), "false");
  assert.equal(fortyFive.getAttribute("aria-pressed"), "true");
  assert.equal(fortyFive.classList.contains("on"), true);

  fixture.elements.sound.onclick();
  assert.equal(fixture.elements.sound.getAttribute("aria-pressed"), "false");
  assert.equal(fixture.elements.sound.getAttribute("aria-label"), "Turn sounds on");
  assert.equal(fixture.elements.soundIcon.textContent, "🔇");

  fixture.run("startGame(); startRound()");
  assert.equal(fixture.value("document.activeElement.id"), "gameTitle");
  assert.equal(
    fixture.elements.teamA.getAttribute("aria-label"),
    "Hot Dogs: 0 points, guessing",
  );
  assert.equal(fixture.elements.clock.getAttribute("aria-label"), "45 seconds remaining");
  assert.equal(
    fixture.elements.announcer.textContent,
    fixture.value(
      "`${state.names[state.team]} round started. 45 seconds. First clue: ${document.querySelector('.card').dataset.mode}. ${document.getElementById('gib').textContent}`",
    ),
  );
});

test("round actions reject duplicate clicks and post-deadline scoring", () => {
  const fixture = createFixture();
  fixture.run("startGame(); state.sound = false; startRound()");
  const firstRound = fixture.value(
    "({ idx: state.idx, token: state.roundToken, endsAt: state.endsAt })",
  );

  fixture.run("startRound()");
  assert.deepEqual(
    fixture.value("({ idx: state.idx, token: state.roundToken })"),
    { idx: firstRound.idx, token: firstRound.token },
  );

  fixture.run("correct(); correct()");
  assert.deepEqual(fixture.value("({ idx: state.idx, score: state.scores[0] })"), {
    idx: 2,
    score: 1,
  });
  assert.equal(fixture.elements.correctBtn.disabled, true);

  fixture.advance(400);
  fixture.run("correct()");
  assert.deepEqual(fixture.value("({ idx: state.idx, score: state.scores[0] })"), {
    idx: 3,
    score: 2,
  });

  fixture.advance(firstRound.endsAt - fixture.now() + 1);
  fixture.run("correct()");
  assert.equal(fixture.value("state.scores[0]"), 2);
  assert.equal(fixture.value("state.roundActive"), false);
  assert.equal(fixture.value("state.team"), 1);
  assert.equal(visibleScreen(fixture), "turn");
});

test("locked actions restore keyboard focus and announce changing card content", () => {
  const fixture = createFixture();
  fixture.run("startGame(); state.sound = false; startRound()");

  fixture.elements.correctBtn.focus();
  fixture.run("correct()");
  assert.equal(fixture.value("document.activeElement?.id"), undefined);
  assert.match(
    fixture.elements.announcer.textContent,
    /^Hot Dogs score 1\. Next clue: (MIXED MESSAGE|SYNONYM TWIST)\. /,
  );
  fixture.advance(400);
  assert.equal(fixture.value("document.activeElement.id"), "correctBtn");

  const answer = fixture.value("state.currentAnswer");
  fixture.run("reveal()");
  assert.equal(fixture.elements.announcer.textContent, `Answer: ${answer}`);
});

test("skip and reveal controls expose every no-op state", () => {
  const fixture = createFixture();
  fixture.run("startGame(); state.sound = false; startRound(); skip()");
  fixture.advance(400);
  fixture.run("skip()");
  fixture.advance(400);

  assert.equal(fixture.value("state.skips"), 0);
  assert.equal(fixture.elements.skipBtn.disabled, true);
  assert.equal(fixture.elements.revealBtn.disabled, false);
  assert.equal(fixture.elements.correctBtn.disabled, false);

});

test("show answer stays up until the reader marks the guess", () => {
  const right = createFixture();
  right.run("startGame(); state.sound = false; startRound(); reveal()");
  const clue = right.value("state.currentClue");
  assert.equal(right.elements.answer.classList.contains("show"), true);
  assert.equal(right.elements.revealBtn.disabled, true);
  assert.equal(right.elements.revealBtn.textContent, "ANSWER SHOWN");
  right.advance(5_000);
  assert.equal(right.value("state.currentClue"), clue);
  assert.equal(right.elements.answer.classList.contains("show"), true);
  assert.equal(right.value("state.skips"), 2);
  assert.equal(right.elements.correctBtn.disabled, false);
  right.run("correct()");
  assert.equal(right.value("state.scores[0]"), 1);
  assert.equal(right.elements.answer.classList.contains("show"), false);
  right.advance(400);
  assert.equal(right.elements.revealBtn.disabled, false);
  assert.equal(right.elements.revealBtn.textContent, "SHOW ANSWER");

  const wrong = createFixture();
  wrong.run("startGame(); state.sound = false; startRound(); reveal()");
  const answer = wrong.value("state.currentAnswer");
  wrong.advance(400);
  wrong.run("skip()");
  assert.equal(wrong.value("state.scores[0]"), 0);
  assert.equal(wrong.value("state.skips"), 1);
  assert.ok(wrong.value("state.missed[0]").startsWith("Revealed: "));
  assert.ok(wrong.value("state.missed[0]").endsWith(answer));
});

test("audio is reused and audio failures never interrupt gameplay", () => {
  const working = createFixture({ audio: "working" });
  working.run("startGame(); startRound(); correct()");
  working.advance(400);
  working.run("skip(); endRound()");
  assert.equal(working.audioContextsCreated(), 1);
  assert.equal(working.value("state.scores[0]"), 1);
  assert.equal(visibleScreen(working), "turn");

  const throwing = createFixture({ audio: "throwing" });
  assert.doesNotThrow(() => throwing.run("startGame(); startRound(); correct()"));
  assert.equal(throwing.value("state.scores[0]"), 1);
  assert.equal(throwing.value("state.idx"), 2);
  assert.doesNotThrow(() => throwing.run("endRound()"));
  assert.equal(throwing.value("state.team"), 1);
  assert.equal(visibleScreen(throwing), "turn");
});

test("equal turns, target ties, and alternating rematches are preserved", () => {
  const fixture = createFixture();
  fixture.run(`
    startGame();
    state.sound = false;
    state.target = 7;
    startRound();
    state.scores = [7, 0];
    endRound();
  `);
  assert.equal(visibleScreen(fixture), "turn");
  assert.equal(fixture.value("state.team"), 1);
  assert.equal(fixture.elements.teamA.getAttribute("aria-current"), "false");
  assert.equal(fixture.elements.teamB.getAttribute("aria-current"), "true");

  fixture.run(`
    startRound();
    state.scores[1] = 7;
    endRound();
  `);
  assert.equal(visibleScreen(fixture), "turn");
  assert.deepEqual(fixture.value("state.scores"), [7, 7]);

  fixture.run(`
    startRound();
    state.scores[0] = 8;
    endRound();
    startRound();
    endRound();
  `);
  assert.equal(visibleScreen(fixture), "win");
  assert.equal(fixture.elements.winTitle.textContent, "Hot Dogs win!");

  fixture.run("rematch()");
  assert.deepEqual(fixture.value("state.scores"), [0, 0]);
  assert.equal(fixture.value("state.team"), 1);
  assert.equal(visibleScreen(fixture), "turn");
});

test("visibility reconciliation uses wall-clock time", () => {
  const fixture = createFixture();
  fixture.run("startGame(); state.sound = false; startRound()");
  const endsAt = fixture.value("state.endsAt");
  fixture.advance(endsAt - fixture.now() + 1);
  fixture.listeners.get("visibilitychange")();

  assert.equal(fixture.value("state.roundActive"), false);
  assert.equal(visibleScreen(fixture), "turn");
  assert.doesNotMatch(appSource, /performance\.now/);
});

test("countdown interval renders remaining seconds and ends at zero", () => {
  const fixture = createFixture();
  fixture.run("startGame(); state.sound = false; startRound()");

  fixture.advance(25_000);
  fixture.runIntervals();
  assert.equal(fixture.elements.clock.textContent, 5);
  assert.equal(fixture.elements.announcer.textContent, "5 seconds remaining.");
  assert.equal(fixture.value("state.roundActive"), true);
  assert.equal(visibleScreen(fixture), "game");

  fixture.advance(5_000);
  fixture.runIntervals();
  assert.equal(fixture.elements.clock.textContent, 0);
  assert.equal(fixture.value("state.roundActive"), false);
  assert.equal(visibleScreen(fixture), "turn");
});


test("Dinner table retains 120 cards, categories, scoring and rematch selection", () => {
  const f = createFixture();
  assert.equal(f.value('dinnerCards.length'), 120);
  for (const category of ['Easy classics', 'Food & life', 'Difficult delightful']) {
    f.run(`state.mode='dinner';state.category=${JSON.stringify(category)}`);
    assert.equal(f.value('makeDeck().length'), 40);
    assert.ok(f.value('makeDeck().every(c=>c[3]===state.category && c[0] && c[1])'));
  }
  f.elements.decks.onclick({target:f.elements.decks.buttons[3]});
  assert.equal(f.elements.dinnerCategories.hidden, false);
  f.run('startGame();startRound();correct()');
  assert.equal(f.value('state.mode'), 'dinner');
  assert.equal(f.value('state.deck.length'), 120);
  assert.deepEqual(f.value('state.scores'), [1,0]);
  f.run('endRound()');
  assert.match(f.elements.handoff.textContent, /Pass the phone/);
  assert.equal(f.value('state.team'), 1);
  f.run('rematch()');
  assert.equal(f.value('state.deck.length'), 120);
  for (const mode of ['SYNONYM TWIST', 'MIXED MESSAGE']) {
    f.run(`state.mode=${JSON.stringify(mode)}`);
    assert.ok(f.value('makeDeck().length>0 && makeDeck().every(c=>c[3]===state.mode)'));
  }
});

test("expiry during a reveal retains one missed answer and resets recaps for rematch", () => {
  const f = createFixture();
  f.run("startGame(); state.sound=false; startRound()");
  const answer = f.value("state.currentAnswer");
  f.run("reveal()");
  f.advance(30_000);
  f.runIntervals();
  assert.equal(f.value("state.missed.length"), 1);
  assert.ok(f.elements.turnMissedCards.textContent.includes(answer));
  assert.equal(f.elements.turnRecap.hidden, false);
  assert.ok(f.elements.turnRecapScore.textContent.includes("+0 points this turn"));
  f.run("startRound()");
  assert.equal(f.value("state.missed.length"), 0);
  f.run("endRound(); rematch()");
  assert.equal(f.elements.turnRecap.hidden, true);
  assert.equal(f.elements.winRecap.hidden, true);
});
