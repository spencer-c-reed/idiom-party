import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const cardsSource = readFileSync(new URL("../cards.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
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
    this.disabled = false;
    this.tagName = "DIV";
    this.textContent = "";
    this.value = "";
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
    "t1",
    "t2",
    "times",
    "targets",
    "n1",
    "n2",
    "s1",
    "s2",
    "teamA",
    "teamB",
    "turnTitle",
    "skipBtn",
    "correctBtn",
    "revealBtn",
    "clock",
    "gib",
    "answer",
    "winTitle",
    "finalScore",
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
      if (selector === ".seg") return [elements.times, elements.targets];
      return [];
    },
  };

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

test("skip and reveal controls expose every no-op state", () => {
  const fixture = createFixture();
  fixture.run("startGame(); state.sound = false; startRound(); skip()");
  fixture.advance(400);
  fixture.run("skip()");
  fixture.advance(400);

  assert.equal(fixture.value("state.skips"), 0);
  assert.equal(fixture.elements.skipBtn.disabled, true);
  assert.equal(fixture.elements.revealBtn.disabled, true);
  assert.equal(fixture.elements.correctBtn.disabled, false);

  const revealing = createFixture();
  revealing.run("startGame(); state.sound = false; startRound(); reveal()");
  assert.equal(revealing.elements.answer.classList.contains("show"), true);
  assert.equal(revealing.elements.skipBtn.disabled, true);
  assert.equal(revealing.elements.revealBtn.disabled, true);
  assert.equal(revealing.elements.correctBtn.disabled, true);

  revealing.advance(1_400);
  assert.equal(revealing.elements.answer.classList.contains("show"), false);
  assert.equal(revealing.value("state.skips"), 1);
  assert.equal(revealing.elements.skipBtn.disabled, false);
  assert.equal(revealing.elements.revealBtn.disabled, false);
  assert.equal(revealing.elements.correctBtn.disabled, false);
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
  assert.equal(fixture.value("state.roundActive"), true);
  assert.equal(visibleScreen(fixture), "game");

  fixture.advance(5_000);
  fixture.runIntervals();
  assert.equal(fixture.elements.clock.textContent, 0);
  assert.equal(fixture.value("state.roundActive"), false);
  assert.equal(visibleScreen(fixture), "turn");
});
