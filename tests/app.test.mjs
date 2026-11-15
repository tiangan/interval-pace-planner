import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function app(savedTime) {
  const elements = new Map();
  const listeners = new Map();
  const intervals = new Map();
  const storage = new Map(savedTime ? [['ipp.time', savedTime]] : []);
  let now = 0, intervalId = 0;
  function element() {
    const classes = new Set();
    return {
      value: '', textContent: '', children: [], style: {}, hidden: false,
      classList: {
        toggle(name, on) { on ? classes.add(name) : classes.delete(name); },
        contains(name) { return classes.has(name); },
      },
      set innerHTML(value) { this.markup = value; this.children = []; },
      get innerHTML() { return this.markup || ''; },
      append(child) { this.children.push(child); },
    };
  }
  const get = id => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  };
  const document = {
    hidden: false,
    getElementById: get,
    querySelectorAll: () => [],
    createElement: element,
    addEventListener: (name, fn) => listeners.set(name, fn),
  };
  const context = vm.createContext({
    document,
    window: { scrollTo() {} },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    Date: { now: () => now },
    setInterval: fn => { intervals.set(++intervalId, fn); return intervalId; },
    clearInterval: id => intervals.delete(id),
  });
  vm.runInContext(script, context);
  return {
    get, storage, intervals,
    read: expression => vm.runInContext(expression, context),
    submit(value = '24:00') { get('t').value = value; get('f').onsubmit({ preventDefault() {} }); },
    select(index = 0) { get('sessions').children[index].onclick(); },
    advance(seconds) { now += seconds * 1000; for (const fn of [...intervals.values()]) fn(); },
    hide() { document.hidden = true; listeners.get('visibilitychange')(); },
    returnAfter(seconds) { now += seconds * 1000; document.hidden = false; listeners.get('visibilitychange')(); },
  };
}

test('validates time without creating a session for invalid inputs', () => {
  for (const input of ['', '24', '24:60', '0:00', '-1:00', '<img>']) {
    const a = app();
    a.submit(input);
    assert.notEqual(a.get('err').textContent, '', input);
    assert.equal(a.get('sessions').children.length, 0);
  }
});

test('calculates paces and an exact-distance 400m target', () => {
  const a = app();
  a.submit();
  assert.equal(a.read('P.mile'), 480);
  assert.equal(a.read('P.thr'), 507);
  assert.equal(a.read('P.e1'), 570);
  assert.equal(a.read('P.e2'), 630);
  assert.equal(a.read('P.r400'), 119);
  assert.match(a.get('paces').innerHTML, /1:59/);
  assert.match(a.get('paces').innerHTML, /8:27\/mi/);
});

test('persists and restores the input time', () => {
  const a = app('23:15');
  assert.equal(a.get('t').value, '23:15');
  a.submit(' 24:00 ');
  assert.equal(a.storage.get('ipp.time'), '24:00');
});

test('constructs all three workouts with the intended rests and totals', () => {
  const a = app();
  a.submit();
  for (const [index, segments, total, reps] of [[0, 26, 1920, 12], [1, 17, 2782, 8], [2, 5, 2520, 2]]) {
    a.select(index);
    assert.equal(a.read('plan.length'), segments);
    assert.equal(a.read('plan.reduce((sum, segment) => sum + segment.dur, 0)'), total);
    assert.equal(a.read('plan.find(segment => segment.n).n'), reps);
    assert.equal(a.read('plan[0].name'), 'Warmup');
    assert.equal(a.read('plan.at(-1).name'), 'Cooldown');
  }
});

test('keeps segments positive even for the smallest accepted input', () => {
  const a = app();
  a.submit('0:01');
  a.select(1);
  assert.equal(a.read('plan.every(segment => segment.dur > 0)'), true);
});

test('starts, pauses, resumes and resets without counting paused time', () => {
  const a = app();
  a.submit(); a.select();
  a.get('go').onclick(); a.advance(10);
  assert.equal(a.get('clock').textContent, '9:50');
  a.get('go').onclick(); a.advance(30);
  assert.equal(a.get('state').textContent, 'PAUSED');
  assert.equal(a.get('clock').textContent, '9:50');
  a.get('go').onclick(); a.advance(5);
  assert.equal(a.get('clock').textContent, '9:45');
  assert.equal(a.intervals.size, 1);
  a.get('rs').onclick();
  assert.equal(a.get('state').textContent, 'READY');
  assert.equal(a.get('clock').textContent, '10:00');
  assert.equal(a.intervals.size, 0);
});

test('catches up across multiple segments after a background delay', () => {
  const a = app();
  a.submit(); a.select(); a.get('go').onclick();
  a.hide(); a.returnAfter(665);
  assert.equal(a.get('seg').textContent, 'Interval');
  assert.equal(a.get('rep').textContent, '2 / 12');
  assert.equal(a.get('clock').textContent, '0:25');
  a.advance(1255);
  assert.equal(a.get('state').textContent, 'COMPLETE');
  assert.equal(a.get('clock').textContent, '0:00');
  assert.equal(a.get('rep').textContent, '12 / 12');
  assert.equal(a.get('go').disabled, true);
  assert.equal(a.intervals.size, 0);
});

for (const button of ['back', 'home']) {
  test(`${button} cancels the session, including visibility callbacks`, () => {
    const a = app();
    a.submit(); a.select(); a.get('go').onclick(); a.advance(10);
    a.get(button).onclick();
    assert.equal(a.intervals.size, 0);
    assert.equal(a.get(button === 'back' ? 's2' : 's1').classList.contains('on'), true);
    a.hide(); a.returnAfter(2000);
    assert.equal(a.get('state').textContent, 'READY');
    assert.equal(a.get('clock').textContent, '10:00');
    a.select();
    assert.equal(a.get('state').textContent, 'READY');
    assert.equal(a.get('go').disabled, false);
  });
}

test('runs without audio support and shows a warning', () => {
  const a = app();
  a.submit(); a.select(); a.get('go').onclick(); a.advance(1);
  assert.equal(a.get('state').textContent, 'RUNNING');
  assert.equal(a.get('clock').textContent, '9:59');
  assert.equal(a.get('audio').hidden, false);
  assert.match(a.get('audio').textContent, /Audio is not supported/);
});
