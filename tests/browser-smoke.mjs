import assert from "node:assert/strict";
import { constants as fsConstants, mkdtempSync } from "node:fs";
import {
  access,
  readFile,
  rm,
  stat,
} from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const viewport = { width: 320, height: 568 };
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.waiters = new Map();
  }

  async connect(timeoutMs = 15_000) {
    this.socket = new WebSocket(this.url);
    await new Promise((resolvePromise, rejectPromise) => {
      const timer = setTimeout(() => {
        rejectPromise(new Error(`Timed out connecting to ${this.url}`));
        this.socket.close();
      }, timeoutMs);
      this.socket.addEventListener(
        "open",
        () => {
          clearTimeout(timer);
          resolvePromise();
        },
        { once: true },
      );
      this.socket.addEventListener(
        "error",
        () => {
          clearTimeout(timer);
          rejectPromise(new Error(`Unable to connect to ${this.url}`));
        },
        { once: true },
      );
      this.socket.addEventListener(
        "close",
        () => {
          clearTimeout(timer);
          rejectPromise(
            new Error(`DevTools connection closed before opening: ${this.url}`),
          );
        },
        { once: true },
      );
    });
    this.socket.addEventListener("message", (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        this.failPending(new Error("DevTools sent an invalid JSON message"));
        return;
      }
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (message.error) {
          pending.reject(
            new Error(`${pending.method}: ${message.error.message}`),
          );
        } else {
          pending.resolve(message.result);
        }
        return;
      }

      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params);
      }
      const waiter = this.waiters.get(message.method)?.shift();
      if (waiter) {
        clearTimeout(waiter.timer);
        waiter.resolve(message.params);
      }
    });
    this.socket.addEventListener("close", () => {
      this.failPending(new Error("DevTools connection closed"));
    });
    this.socket.addEventListener("error", () => {
      this.failPending(new Error("DevTools connection failed"));
    });
  }

  close() {
    this.failPending(new Error("DevTools client closed"));
    if (
      this.socket?.readyState === WebSocket.CONNECTING ||
      this.socket?.readyState === WebSocket.OPEN
    ) {
      this.socket.close();
    }
  }

  failPending(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
    for (const waiters of this.waiters.values()) {
      for (const waiter of waiters) {
        clearTimeout(waiter.timer);
        waiter.reject(error);
      }
    }
    this.waiters.clear();
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  send(method, params = {}, timeoutMs = 15_000) {
    return new Promise((resolvePromise, rejectPromise) => {
      if (this.socket?.readyState !== WebSocket.OPEN) {
        rejectPromise(new Error(`Cannot send ${method}: DevTools is not open`));
        return;
      }
      const id = this.nextId++;
      const pending = {
        method,
        reject: rejectPromise,
        resolve: resolvePromise,
        timer: setTimeout(() => {
          this.pending.delete(id);
          rejectPromise(new Error(`Timed out sending ${method}`));
        }, timeoutMs),
      };
      this.pending.set(id, pending);
      try {
        this.socket.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        clearTimeout(pending.timer);
        this.pending.delete(id);
        rejectPromise(error);
      }
    });
  }

  waitFor(method, timeoutMs = 15_000) {
    return new Promise((resolvePromise, rejectPromise) => {
      const waiters = this.waiters.get(method) ?? [];
      const waiter = {
        reject: rejectPromise,
        resolve: resolvePromise,
        timer: setTimeout(() => {
          const index = waiters.indexOf(waiter);
          if (index >= 0) waiters.splice(index, 1);
          rejectPromise(new Error(`Timed out waiting for ${method}`));
        }, timeoutMs),
      };
      waiters.push(waiter);
      this.waiters.set(method, waiters);
    });
  }

  async evaluate(expression) {
    const response = await this.send("Runtime.evaluate", {
      awaitPromise: true,
      expression,
      returnByValue: true,
      userGesture: true,
    });
    if (response.exceptionDetails) {
      const detail =
        response.exceptionDetails.exception?.description ??
        response.exceptionDetails.text;
      throw new Error(`Browser evaluation failed: ${detail}`);
    }
    return response.result.value;
  }
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return { body: await response.json(), response };
  } finally {
    clearTimeout(timer);
  }
}

async function clickPoint(page, point) {
  await page.send("Input.dispatchMouseEvent", {
    button: "left",
    clickCount: 1,
    type: "mousePressed",
    x: point.x,
    y: point.y,
  });
  await page.send("Input.dispatchMouseEvent", {
    button: "left",
    clickCount: 1,
    type: "mouseReleased",
    x: point.x,
    y: point.y,
  });
}

async function clickCenter(page, selector) {
  const point = await page.evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return null;
    element.scrollIntoView({block: 'center', behavior: 'instant'});
    const rect = element.getBoundingClientRect();
    return {
      disabled: Boolean(element.disabled),
      height: rect.height,
      width: rect.width,
      x: rect.left + rect.width / 2 - visualViewport.offsetLeft,
      y: rect.top + rect.height / 2 - visualViewport.offsetTop
    };
  })()`);
  assert.ok(point, `Expected ${selector} to exist`);
  assert.equal(point.disabled, false, `Expected ${selector} to be enabled`);
  assert.ok(point.width > 0 && point.height > 0, JSON.stringify(point));
  await clickPoint(page, point);
  return point;
}

async function pressEnter(page) {
  await page.send("Input.dispatchKeyEvent", {
    code: "Enter",
    key: "Enter",
    nativeVirtualKeyCode: 13,
    text: "\r",
    type: "keyDown",
    unmodifiedText: "\r",
    windowsVirtualKeyCode: 13,
  });
  await page.send("Input.dispatchKeyEvent", {
    code: "Enter",
    key: "Enter",
    nativeVirtualKeyCode: 13,
    type: "keyUp",
    windowsVirtualKeyCode: 13,
  });
}

async function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Try the next known executable.
    }
  }
  throw new Error(
    "Chrome/Chromium was not found. Set CHROME_BIN to run browser smoke tests.",
  );
}

function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      if (url.pathname === "/favicon.ico") {
        response.writeHead(204);
        response.end();
        return;
      }

      const pathname = decodeURIComponent(url.pathname);
      const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
      const filePath = resolve(repoRoot, relativePath);
      if (
        filePath !== repoRoot &&
        !filePath.startsWith(`${repoRoot}${sep}`)
      ) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) throw new Error("Not a file");
      const body = await readFile(filePath);
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type":
          mimeTypes[extname(filePath)] ?? "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  return new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolvePromise({
        server,
        url: `http://127.0.0.1:${address.port}/`,
      });
    });
  });
}

function launchChrome(chromePath, userDataDir) {
  const child = spawn(
    chromePath,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--disable-sync",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-first-run",
      "--remote-debugging-port=0",
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  child.stderr.setEncoding("utf8");

  const ready = new Promise((resolvePromise, rejectPromise) => {
    let stderr = "";
    let devtoolsFound = false;
    const timer = setTimeout(() => {
      rejectPromise(
        new Error(`Chrome did not expose DevTools within 90s.\n${stderr}`),
      );
    }, 90_000);

    child.stderr.on("data", (chunk) => {
      if (devtoolsFound) return;
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      devtoolsFound = true;
      clearTimeout(timer);
      resolvePromise(match[1]);
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      rejectPromise(
        new Error(
          `Chrome exited before DevTools was ready (${code ?? signal}).\n${stderr}`,
        ),
      );
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });
  });

  return { child, ready };
}

async function closeServer(server) {
  if (!server.listening) return;
  server.closeAllConnections?.();
  await new Promise((resolvePromise) => server.close(resolvePromise));
}

async function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return new Promise((resolvePromise) => {
    const onExit = () => {
      clearTimeout(timer);
      resolvePromise(true);
    };
    const timer = setTimeout(() => {
      child.off("exit", onExit);
      resolvePromise(false);
    }, timeoutMs);
    child.once("exit", onExit);
  });
}

async function run() {
  const chromePath = await findChrome();
  const userDataDir = mkdtempSync(join(tmpdir(), "idiom-party-browser-"));
  let child;
  let page;
  let server;
  let url;
  let cleanupPromise;

  const cleanup = () => {
    cleanupPromise ??= (async () => {
      page?.close();
      if (child && child.exitCode === null && child.signalCode === null) {
        child.kill("SIGTERM");
      }
      if (child && !(await waitForExit(child, 5_000))) {
        child.kill("SIGKILL");
        await waitForExit(child, 5_000);
      }
      if (server) await closeServer(server);
      await rm(userDataDir, {
        force: true,
        maxRetries: 10,
        recursive: true,
        retryDelay: 100,
      });
    })();
    return cleanupPromise;
  };
  const signalHandlers = new Map(
    [
      ["SIGINT", 130],
      ["SIGTERM", 143],
    ].map(([signal, exitCode]) => [
      signal,
      () => {
        void cleanup().finally(() => process.exit(exitCode));
      },
    ]),
  );
  for (const [signal, handler] of signalHandlers) {
    process.once(signal, handler);
  }

  try {
    ({ server, url } = await startStaticServer());
    const launched = launchChrome(chromePath, userDataDir);
    child = launched.child;
    const { ready } = launched;
    const browserWsUrl = await ready;
    const browserOrigin = new URL(browserWsUrl);
    browserOrigin.protocol = "http:";
    browserOrigin.pathname = "";
    browserOrigin.search = "";
    browserOrigin.hash = "";

    const { body: target, response: targetResponse } =
      await fetchJsonWithTimeout(
      `${browserOrigin}json/new?${encodeURIComponent("about:blank")}`,
      { method: "PUT" },
    );
    assert.equal(targetResponse.ok, true, "Chrome should create a test page");
    page = new CdpClient(target.webSocketDebuggerUrl);
    await page.connect();

    const runtimeExceptions = [];
    const errorLogs = [];
    page.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
      runtimeExceptions.push(
        exceptionDetails.exception?.description ?? exceptionDetails.text,
      );
    });
    page.on("Log.entryAdded", ({ entry }) => {
      if (entry.level === "error") errorLogs.push(entry.text);
    });
    page.on("Runtime.consoleAPICalled", ({ args, type }) => {
      if (type !== "error") return;
      errorLogs.push(
        args
          .map((argument) => argument.value ?? argument.description ?? "")
          .join(" "),
      );
    });

    await page.send("Accessibility.enable");
    await page.send("Page.enable");
    await page.send("Runtime.enable");
    await page.send("Log.enable");
    await page.send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height: viewport.height,
      mobile: true,
      screenHeight: viewport.height,
      screenWidth: viewport.width,
      width: viewport.width,
    });
    const loaded = page.waitFor("Page.loadEventFired");
    await page.send("Page.navigate", { url });
    await loaded;

    const initial = await page.evaluate(`(() => ({
      active: document.querySelector('.screen.active')?.id,
      documentWidth: document.documentElement.scrollWidth,
      stylesheetLoaded: getComputedStyle(document.body).backgroundImage !== 'none',
      viewport: innerWidth
    }))()`);
    assert.deepEqual(initial, {
      active: "home",
      documentWidth: 320,
      stylesheetLoaded: true,
      viewport: 320,
    });

    await page.evaluate(`document.querySelector('#home .ghost').focus()`);
    await pressEnter(page);
    assert.deepEqual(
      await page.evaluate(`(() => ({
        active: document.querySelector('.screen.active')?.id,
        focus: document.activeElement?.id
      }))()`),
      { active: "how", focus: "howTitle" },
    );
    await page.evaluate(`document.querySelector('#how .ghost').focus()`);
    await pressEnter(page);
    assert.deepEqual(
      await page.evaluate(`(() => ({
        active: document.querySelector('.screen.active')?.id,
        focus: document.activeElement?.id
      }))()`),
      { active: "home", focus: "homeTitle" },
    );
    await clickCenter(page, "#home .primary");
    const setup = await page.evaluate(`(() => ({
      active: document.querySelector('.screen.active')?.id,
      focus: document.activeElement?.id,
      inputLabels: [...document.querySelectorAll('input')].map(
        (input) => input.labels.length
      )
    }))()`);
    assert.deepEqual(setup, {
      active: "setup",
      focus: "setupTitle",
      inputLabels: [1, 1],
    });
    const setupAccessibility = await page.send("Accessibility.getFullAXTree");
    const textboxNames = setupAccessibility.nodes
      .filter((node) => node.role?.value === "textbox")
      .map((node) => node.name?.value)
      .sort();
    assert.deepEqual(textboxNames, ["Team 1", "Team 2"]);

    await page.evaluate(`(() => {
      document.querySelector('#times [data-v="45"]').click();
      document.getElementById('t1').value = 'ABCDEFGHIJKLMNOPQR';
      document.getElementById('t2').value = 'WWWWWWWWWWWWWWWWWW';
    })()`);
    await clickCenter(page, "#setup .primary");
    const turn = await page.evaluate(`(() => {
      const title = document.getElementById('turnTitle').getBoundingClientRect();
      return {
        active: document.querySelector('.screen.active')?.id,
        documentWidth: document.documentElement.scrollWidth,
        focus: document.activeElement?.id,
        titleRight: Math.ceil(title.right),
        viewport: innerWidth
      };
    })()`);
    assert.equal(turn.active, "turn");
    assert.equal(turn.focus, "turnTitle");
    assert.ok(turn.documentWidth <= turn.viewport, JSON.stringify(turn));
    assert.ok(turn.titleRight <= turn.viewport, JSON.stringify(turn));

    await clickCenter(page, "#turn .yellow");
    const game = await page.evaluate(`(() => {
      const score = document.querySelector('.scorebar').getBoundingClientRect();
      return {
        active: document.querySelector('.screen.active')?.id,
        currentTeam: document.getElementById('teamA').getAttribute('aria-current'),
        documentWidth: document.documentElement.scrollWidth,
        focus: document.activeElement?.id,
        scoreLeft: Math.floor(score.left),
        scoreRight: Math.ceil(score.right),
        timerLabel: document.getElementById('clock').getAttribute('aria-label'),
        viewport: innerWidth
      };
    })()`);
    assert.equal(game.active, "game");
    assert.equal(game.currentTeam, "true");
    assert.equal(game.focus, "gameTitle");
    assert.match(game.timerLabel, /^(?:[1-9]|[1-3][0-9]|4[0-5]) seconds remaining$/);
    assert.ok(game.documentWidth <= game.viewport, JSON.stringify(game));
    assert.ok(game.scoreLeft >= 0, JSON.stringify(game));
    assert.ok(game.scoreRight <= game.viewport, JSON.stringify(game));
    const gameAccessibility = await page.send("Accessibility.getFullAXTree");
    const timerNode = gameAccessibility.nodes.find(
      (node) => node.role?.value === "timer",
    );
    assert.match(
      timerNode?.name?.value ?? "",
      /^(?:[1-9]|[1-3][0-9]|4[0-5]) seconds remaining$/,
    );
    assert.match(
      await page.evaluate(`document.getElementById('announcer').textContent`),
      /^ABCDEFGHIJKLMNOPQR round started\. 45 seconds\. First clue: (MIXED MESSAGE|SYNONYM TWIST)\. /,
    );

    await page.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    assert.equal(
      await page.evaluate(
        `getComputedStyle(document.querySelector('.burst')).animationName`,
      ),
      "none",
    );

    await page.evaluate(`state.sound = false`);
    const correctPoint = await clickCenter(page, "#correctBtn");
    await clickPoint(page, correctPoint);
    const duplicateScore = await page.evaluate(`state.scores[0]`);
    assert.equal(duplicateScore, 1);
    assert.equal(
      await page.evaluate(`document.activeElement?.id || ''`),
      "",
      "the focused action is temporarily disabled",
    );
    assert.match(
      await page.evaluate(`document.getElementById('announcer').textContent`),
      /^ABCDEFGHIJKLMNOPQR score 1\. Next clue: (MIXED MESSAGE|SYNONYM TWIST)\. /,
    );
    await page.evaluate(
      `new Promise((resolvePromise) => setTimeout(resolvePromise, 450))`,
    );
    assert.equal(
      await page.evaluate(`document.activeElement?.id`),
      "correctBtn",
      "keyboard focus should return after the action lock",
    );

    const scoreBeforeExpiry = await page.evaluate(`(() => {
      state.actionLocked = false;
      state.endsAt = Date.now() - 1;
      syncControls();
      return state.scores[0];
    })()`);
    await clickCenter(page, "#correctBtn");
    await page.evaluate(
      `new Promise((resolvePromise) => setTimeout(resolvePromise, 0))`,
    );
    const expired = await page.evaluate(`(() => ({
      active: document.querySelector('.screen.active')?.id,
      focus: document.activeElement?.id,
      scoreAfter: state.scores[0]
    }))()`);
    assert.deepEqual(expired, {
      active: "turn",
      focus: "turnTitle",
      scoreAfter: scoreBeforeExpiry,
    });

    await clickCenter(page, "#turn .yellow");
    await clickCenter(page, "#skipBtn");
    assert.match(
      await page.evaluate(`document.getElementById('announcer').textContent`),
      /^Skipped\. Next clue: (MIXED MESSAGE|SYNONYM TWIST)\. /,
    );
    await page.evaluate(
      `new Promise((resolvePromise) => setTimeout(resolvePromise, 450))`,
    );
    assert.equal(await page.evaluate(`document.activeElement?.id`), "skipBtn");
    await clickCenter(page, "#skipBtn");
    await page.evaluate(
      `new Promise((resolvePromise) => setTimeout(resolvePromise, 450))`,
    );
    const skipState = await page.evaluate(`(() => ({
      correctDisabled: document.getElementById('correctBtn').disabled,
      revealDisabled: document.getElementById('revealBtn').disabled,
      skipDisabled: document.getElementById('skipBtn').disabled,
      skips: state.skips
    }))()`);
    assert.deepEqual(skipState, {
      correctDisabled: false,
      revealDisabled: true,
      skipDisabled: true,
      skips: 0,
    });

    await page.evaluate(`(() => {
      endRound();
    })()`);
    await clickCenter(page, "#turn .yellow");
    const revealedAnswer = await page.evaluate(`state.currentAnswer`);
    await clickCenter(page, "#revealBtn");
    const duringReveal = await page.evaluate(`(() => ({
      answerShown: document.getElementById('answer').classList.contains('show'),
      announcement: document.getElementById('announcer').textContent,
      correctDisabled: document.getElementById('correctBtn').disabled,
      revealDisabled: document.getElementById('revealBtn').disabled,
      skipDisabled: document.getElementById('skipBtn').disabled
    }))()`);
    assert.deepEqual(duringReveal, {
      answerShown: true,
      announcement: `Answer: ${revealedAnswer}`,
      correctDisabled: true,
      revealDisabled: true,
      skipDisabled: true,
    });
    await page.evaluate(
      `new Promise((resolvePromise) => setTimeout(resolvePromise, 1450))`,
    );
    const revealState = await page.evaluate(`(() => ({
      answerShown: document.getElementById('answer').classList.contains('show'),
      correctDisabled: document.getElementById('correctBtn').disabled,
      focus: document.activeElement?.id,
      revealDisabled: document.getElementById('revealBtn').disabled,
      skipDisabled: document.getElementById('skipBtn').disabled
    }))()`);
    assert.deepEqual(revealState, {
      answerShown: false,
      correctDisabled: false,
      focus: "revealBtn",
      revealDisabled: false,
      skipDisabled: false,
    });

    const responsiveViewports = [
      { height: 568, width: 320 },
      { height: 667, width: 375 },
      { height: 1024, width: 768 },
      { height: 768, width: 1024 },
      { height: 900, width: 1440 },
      { height: 1080, width: 1920 },
    ];
    for (const targetViewport of responsiveViewports) {
      await page.send("Emulation.setDeviceMetricsOverride", {
        deviceScaleFactor: 1,
        mobile: targetViewport.width < 768,
        screenHeight: targetViewport.height,
        screenWidth: targetViewport.width,
        ...targetViewport,
      });
      const measurements = await page.evaluate(`(() => {
        state.names = ['MMMMMMMMMMMMMMMMMM', 'WWWWWWWWWWWWWWWWWW'];
        update();
        document.getElementById('turnTitle').textContent =
          \`\${state.names[1]}, you're up!\`;
        document.getElementById('winTitle').textContent =
          \`\${state.names[1]} win!\`;
        document.getElementById('finalScore').textContent =
          'Final score: 100–99';
        const longestClue = cards.reduce(
          (longest, card) => card[0].length > longest.length ? card[0] : longest,
          ''
        );
        const longestAnswer = cards.reduce(
          (longest, card) => card[1].length > longest.length ? card[1] : longest,
          ''
        );
        document.getElementById('gib').textContent = longestClue;
        document.getElementById('answer').textContent = longestAnswer;
        document.getElementById('answer').classList.add('show');

        const results = {};
        for (const id of ['home', 'how', 'setup', 'turn', 'game', 'win']) {
          go(id);
          const active = document.getElementById(id);
          const app = document.querySelector('.app').getBoundingClientRect();
          const horizontalOffenders = [active, ...active.querySelectorAll('*')]
            .filter((element) => {
              if (element.classList.contains('sr-only')) return false;
              const style = getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                rect.width > 0 &&
                (rect.left < -0.5 || rect.right > innerWidth + 0.5)
              );
            })
            .map((element) => ({
              id: element.id,
              left: Math.floor(element.getBoundingClientRect().left),
              right: Math.ceil(element.getBoundingClientRect().right),
              tag: element.tagName
            }));
          const clippedText = [
            '.team',
            '#turnTitle',
            '#winTitle',
            '#gib',
            '#answer',
            '.rules'
          ]
            .map((selector) => active.querySelector(selector))
            .filter(Boolean)
            .filter((element) => element.scrollWidth > element.clientWidth + 1)
            .map((element) => element.id || element.className);
          const card = id === 'game' ? active.querySelector('.card') : null;
          results[id] = {
            activeWidth: active.scrollWidth,
            appLeft: Math.floor(app.left),
            appRight: Math.ceil(app.right),
            cardClipped: Boolean(
              card && card.scrollHeight > card.clientHeight + 1
            ),
            clippedText,
            documentWidth: document.documentElement.scrollWidth,
            horizontalOffenders,
            viewport: innerWidth
          };
        }
        return results;
      })()`);
      for (const [screen, measurement] of Object.entries(measurements)) {
        const context = JSON.stringify({ measurement, screen, targetViewport });
        assert.ok(measurement.documentWidth <= measurement.viewport, context);
        assert.ok(measurement.activeWidth <= measurement.viewport, context);
        assert.ok(
          measurement.appLeft >= 0 &&
            measurement.appRight <= measurement.viewport,
          context,
        );
        assert.deepEqual(measurement.horizontalOffenders, [], context);
        assert.deepEqual(measurement.clippedText, [], context);
        assert.equal(measurement.cardClipped, false, context);
      }
    }

    assert.deepEqual(runtimeExceptions, []);
    assert.deepEqual(
      errorLogs.filter((entry) => !entry.toLowerCase().includes("favicon")),
      [],
    );
    console.log(
      "Browser smoke passed: real input, accessible state, action locks, and max-content layouts at 320–1920px.",
    );
  } finally {
    for (const [signal, handler] of signalHandlers) {
      process.off(signal, handler);
    }
    await cleanup();
  }
}

await run();
