import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

/**
 * A walk through the panels, clicking the forms the way a person would.
 *
 * The API was tested with curl, which bypasses the forms entirely. This
 * drives the actual buttons, because the two are not the same thing.
 *
 * Each section gets its own browser. Reusing one across sections made the
 * CDP connection flaky for reasons that had nothing to do with the app.
 */

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const APP = process.env.APP || "http://localhost:3000";
let port = Number(process.env.CDP || 9830);

/**
 * Opens a browser and hands back the tools to drive it.
 */
async function openBrowser() {
  const myPort = port++;
  const chrome = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${myPort}`,
    "--hide-scrollbars",
    "--window-size=1400,1100",
    `--user-data-dir=/tmp/opencode/chrome-ui${myPort}`,
    "about:blank",
  ], { stdio: "ignore" });

  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${myPort}/json/list`)).json();
      target = list.find((t) => t.type === "page");
    } catch {}
    if (!target) await sleep(250);
  }
  if (!target) throw new Error("no chrome");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 0;
  const pending = new Map();
  const calls = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) {
        rej(new Error(JSON.stringify(m.error)));
      } else {
        res(m.result);
      }
    }
    if (m.method === "Network.requestWillBeSent" && m.params.request.url.includes("/api/platform")) {
      calls.push({ url: m.params.request.url, body: m.params.request.postData });
    }
    if (m.method === "Network.responseReceived" && m.params.response.url.includes("/api/platform")) {
      const entry = calls.find((c) => c.url === m.params.response.url);
      if (entry) { entry.status = m.params.response.status; }
    }
  };

  const send = (me, p = {}) =>
    new Promise((res, rej) => {
      const n = ++id;
      pending.set(n, { res, rej });
      ws.send(JSON.stringify({ id: n, method: me, params: p }));
    });

  const ev = async (x, timeout = 8000) => {
    const r = await Promise.race([
      send("Runtime.evaluate", {
        expression: x,
        returnByValue: true,
        awaitPromise: true,
      }).catch(() => ({ navigated: true })),
      sleep(timeout).then(() => ({ timedOut: true })),
    ]);
    if (r.timedOut) return "__TIMEOUT__";
    if (r.navigated) return "__NAVIGATED__";
    if (r.exceptionDetails) return "__ERROR__";
    return r.result.value;
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");

  return {
    ev,
    calls,
    go: async (url) => {
      await send("Page.navigate", { url });
      await sleep(2500);
    },
    close: () => {
      ws.close();
      chrome.kill();
    },
  };
}

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const signIn = async (b, role, identifier, password) => {
  await b.ev(`(function(){
    return fetch("/api/platform/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({role:${JSON.stringify(role)},identifier:${JSON.stringify(identifier)},password:${JSON.stringify(password)}})}).then(r=>r.status);
  })()`);
};

/**
 * Fills the named fields in the form whose submit button says `buttonText`,
 * and presses it. The form is found by its button, because a page can have
 * more than one form with a field of the same name.
 */
const submitForm = async (b, buttonText, values) =>
  b.ev(`(function(){
    const button = [...document.querySelectorAll('button[type=submit]')].find(b => b.textContent.trim().toLowerCase().includes(${JSON.stringify(buttonText.toLowerCase())}));
    if (!button) return { ok: false, why: 'no button matching ${buttonText}' };
    const form = button.closest('form');
    if (!form) return { ok: false, why: 'button is not in a form' };

    const values = ${JSON.stringify(values)};
    for (const [name, value] of Object.entries(values)) {
      const field = form.querySelector('[name=' + name + ']');
      if (!field) return { ok: false, why: 'no field named ' + name + ' in that form' };
      if (field.tagName === 'SELECT') {
        field.value = value;
      } else {
        const proto = field.tagName === 'TEXTAREA'
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(field, value);
      }
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }

    button.click();
    return { ok: true };
  })()`);

const alertText = async (b) =>
  b.ev(`[...document.querySelectorAll('p[role=alert]')].map(a => a.textContent.trim()).filter(Boolean).join(' | ')`);

const stamp = Date.now();

// --- the mentor panel -----------------------------------------------------

console.log("\nMENTOR PANEL");
{
  const b = await openBrowser();
  await b.go(`${APP}/login`);
  await signIn(b, "mentor", "joel2@gmail.com", "techneeds-demo");
  await b.go(`${APP}/mentor`);

  let r = await submitForm(b, "Add mentee", { name: `UI Test Mentee ${stamp}` });
  await sleep(2500);
  const alert = await alertText(b);
  check(
    "add a mentee shows the credentials",
    r.ok && !alert && (await b.ev(`document.body.textContent.includes("Copy these now")`)),
    alert || `201 ${b.calls.at(-1)?.body}`,
  );

  r = await submitForm(b, "Publish", {
    title: `UI Test Resource ${stamp}`,
    type: "project",
    maxScore: "25",
  });
  await sleep(2500);
  const alert2 = await alertText(b);
  check(
    "publish a resource lists it",
    r.ok && !alert2 && (await b.ev(`document.body.textContent.includes(${JSON.stringify(`UI Test Resource ${stamp}`)})`)),
    alert2 || `201 ${b.calls.at(-1)?.body}`,
  );

  b.close();
}

// --- the admin panel ------------------------------------------------------

console.log("\nADMIN PANEL");
{
  const b = await openBrowser();
  await b.go(`${APP}/login`);
  await signIn(b, "admin", "admin@techneeds.test", "admin-demo");
  await b.go(`${APP}/admin`);

  let r = await submitForm(b, "Create program", { name: `UI Test Program ${stamp}` });
  await sleep(2500);
  const alert = await alertText(b);
  check(
    "create a program lists it",
    r.ok && !alert && (await b.ev(`document.body.textContent.includes(${JSON.stringify(`UI Test Program ${stamp}`)})`)),
    alert || `201 ${b.calls.at(-1)?.body}`,
  );

  await b.ev(`(function(){
    const link = [...document.querySelectorAll('a')].find(a => a.textContent.trim() === ${JSON.stringify(`UI Test Program ${stamp}`)});
    if (link) link.click();
    return !!link;
  })()`);
  await sleep(2500);

  r = await submitForm(b, "Put on this program", {
    name: `UI Test Mentor ${stamp}`,
    email: `ui.mentor.${stamp}@example.com`,
  });
  await sleep(2500);
  const alert2 = await alertText(b);
  check(
    "put a mentor on a program",
    r.ok && !alert2 && (await b.ev(`document.body.textContent.includes(${JSON.stringify(`UI Test Mentor ${stamp}`)})`)),
    alert2 || `201 ${b.calls.at(-1)?.body}`,
  );

  r = await submitForm(b, "Onboard mentor", {
    name: `UI Test Onboarded ${stamp}`,
    email: `ui.onboard.${stamp}@example.com`,
  });
  await sleep(2500);
  const alert3 = await alertText(b);
  check(
    "onboard a mentor shows a password",
    r.ok && !alert3 && (await b.ev(`document.body.textContent.includes("Copy these now")`)),
    alert3 || `201 ${b.calls.at(-1)?.body}`,
  );

  r = await submitForm(b, "Add admin", { email: `ui.admin.${stamp}@example.com` });
  await sleep(2500);
  const alert4 = await alertText(b);
  check(
    "add an admin shows a password",
    r.ok && !alert4 && (await b.ev(`document.body.textContent.includes("Copy these now")`)),
    alert4 || `201 ${b.calls.at(-1)?.body}`,
  );

  b.close();
}

// --- the mentee panel -----------------------------------------------------

console.log("\nMENTEE PANEL");
{
  const b = await openBrowser();
  await b.go(`${APP}/login`);
  await signIn(b, "mentee", "1234567", "techneeds-demo");
  await b.go(`${APP}/mentee`);

  const r = await b.ev(`(function(){
    const button = [...document.querySelectorAll('button')].find(b => /^(Start|Mark watched|Hand in)$/.test(b.textContent.trim()));
    if (!button) return { ok: false, why: 'no work button' };
    const label = button.textContent.trim();
    button.click();
    return { ok: true, label };
  })()`);
  await sleep(2500);
  const alert = await alertText(b);
  check(
    "open a piece of work from the mentee panel",
    r.ok && !alert,
    alert || `${r.label} -> ${b.calls.at(-1)?.status} ${b.calls.at(-1)?.body}`,
  );

  // Hand the work in.
  const submitted = await b.ev(`(function(){
    const button = [...document.querySelectorAll('button[type=submit]')].find(b => b.textContent.trim() === 'Hand in');
    if (!button) return { ok: false, why: 'no submit button' };
    const form = button.closest('form');
    const area = form && form.querySelector('textarea');
    if (area) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(area, 'https://github.com/example/ui-test');
      area.dispatchEvent(new Event('input', { bubbles: true }));
    }
    button.click();
    return { ok: true };
  })()`);
  await sleep(2500);
  const alert2 = await alertText(b);
  check(
    "hand the work in",
    submitted.ok && !alert2,
    alert2 || `202 ${b.calls.at(-1)?.body}`,
  );

  b.close();
}

const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length === 0 ? 0 : 1);
