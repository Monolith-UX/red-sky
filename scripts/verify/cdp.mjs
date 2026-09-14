// A minimal Chrome DevTools Protocol driver for verifying the site when the Browser pane
// drops frames. Point BASE_URL at a running dev server; artefacts land in ./out.
//: launch headless Chrome, navigate,
// evaluate, click, type, upload files and take screenshots. No dependencies.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SCRATCH = fileURLToPath(new URL("./out", import.meta.url));
export const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ profile = "cdp-profile", port = 9333, width = 1280, height = 900 } = {}) {
  const dir = `${SCRATCH}/${profile}`;
  mkdirSync(dir, { recursive: true });
  const proc = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    "--no-default-browser-check", `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`, `--window-size=${width},${height}`, "about:blank",
  ], { stdio: "ignore" });

  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === "page");
    } catch {}
  }
  if (!target) throw new Error("Chrome did not start");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) {
      listeners.forEach((l) => l(msg));
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, { resolve, reject });
      ws.send(JSON.stringify({ id: n, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("DOM.enable");
  // Reduced motion: the site then scrolls instantly, so clicks never chase a smooth scroll.
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const errors = [];
  listeners.push((m) => {
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value ?? a.description).join(" "));
  });

  const page = {
    send,
    errors,
    async viewport(w, h, mobile = false) {
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
    },
    async goto(path, settle = 1500) {
      const loaded = new Promise((r) => listeners.push((m) => m.method === "Page.loadEventFired" && r()));
      await send("Page.navigate", { url: path.startsWith("http") ? path : BASE + path });
      await Promise.race([loaded, sleep(20000)]);
      await sleep(settle);
    },
    async eval(expression) {
      const res = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description ?? res.exceptionDetails.text);
      return res.result.value;
    },
    /** Clicks the centre of the first element matching a selector, as a real mouse would. */
    async click(selector) {
      const box = await page.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({block: "center", behavior: "instant"}); const r = el.getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + r.height / 2}; })()`);
      if (!box) throw new Error(`No element for ${selector}`);
      for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
        await send("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: "left", clickCount: 1 });
      }
      await sleep(250);
    },
    async hover(selector) {
      const box = await page.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.scrollIntoView({block: "center", behavior: "instant"}); const r = el.getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + r.height / 2}; })()`);
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x, y: box.y });
      await sleep(400);
    },
    async type(selector, text) {
      await page.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.focus({ preventScroll: true }); el.select?.(); })()`);
      await send("Input.insertText", { text });
      await sleep(100);
    },
    async key(key, code = key, keyCode = 0) {
      const text = key === "Enter" ? String.fromCharCode(13) : undefined;
      await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: keyCode, ...(text ? { text } : {}) });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: keyCode });
      await sleep(150);
    },
    async upload(selector, files) {
      const { root } = await send("DOM.getDocument", { depth: -1, pierce: true });
      const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector });
      await send("DOM.setFileInputFiles", { nodeId, files });
      await sleep(300);
    },
    async shot(name, { full = false, clip } = {}) {
      let params = { format: "png" };
      if (full) {
        const { cssContentSize } = await send("Page.getLayoutMetrics");
        params = { ...params, captureBeyondViewport: true, clip: { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 } };
      }
      if (clip) params = { ...params, captureBeyondViewport: true, clip: { ...clip, scale: 1 } };
      const { data } = await send("Page.captureScreenshot", params);
      const file = `${SCRATCH}/${name}.png`;
      writeFileSync(file, Buffer.from(data, "base64"));
      return file;
    },
    sleep,
    async close() {
      try { await send("Browser.close"); } catch {}
      ws.close();
      proc.kill();
    },
  };
  return page;
}
