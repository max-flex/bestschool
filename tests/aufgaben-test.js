// Prüft die Aufgaben-Generatoren aus app.js auf mathematische Korrektheit.
// Aufruf (Node.js ≥ 18):   node tests/aufgaben-test.js        → Deutsch und Englisch
//                          node tests/aufgaben-test.js en     → nur eine Sprache
'use strict';
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
// Nur den Logik-Teil laden (alles vor den Bildschirmen braucht kein echtes DOM)
const logic = src.split('/* ======================= Bildschirme')[0];
const RUNS = 20000; // Aufgaben je Thema und Stufe

function loadGen(lang) {
  global.location = { search: '?lang=' + lang };
  Object.defineProperty(global, 'navigator', { value: { language: lang }, configurable: true, writable: true });
  global.window = {};
  global.localStorage = { getItem: () => null, setItem() {} };
  global.document = { createElement: () => ({ set innerHTML(v) { this.t = v.replace(/<[^>]*>/g, ''); }, get textContent() { return this.t; } }) };
  return new Function(logic + '; return GEN;')();
}

function check(lang) {
  const GEN = loadGen(lang);
  let n = 0;
  const errs = [];
  const fail = (m, t) => { if (errs.length < 20) errs.push(`${m}: ${JSON.stringify(t).slice(0, 300)}`); };

  for (const topic of ['count', 'compare', 'between']) for (const lv of [1, 2, 3]) for (let i = 0; i < RUNS; i++) {
    const t = GEN[topic](lv); n++;
    const max = lv === 1 ? 10 : 20;
    const vals = (t.options || []).map(o => o.value);
    if (!t.prompt || !t.answerText) fail('Text fehlt', t);
    if (new Set(vals).size !== vals.length) fail('doppelte Antwort', t);

    if (t.mode === 'choice') {
      if (vals.filter(v => v === t.answer).length !== 1) fail('richtige Antwort nicht genau einmal', t);
      if (typeof t.answer === 'number' && vals.some(v => v < 0 || v > max)) fail('Antwort außerhalb des Zahlenraums', t);
      if (t.key.startsWith('bo:')) { const [, a, b] = t.key.split(':').map(Number); if (vals.filter(v => v > a && v < b).length !== 1) fail('mehrdeutig (dazwischen)', t); }
      if (t.key.startsWith('gt:')) { const x = +t.key.split(':')[1]; if (vals.filter(v => v > x).length !== 1) fail('mehrdeutig (größer als)', t); }
      if (t.key.startsWith('lt:')) { const x = +t.key.split(':')[1]; if (vals.filter(v => v < x).length !== 1) fail('mehrdeutig (kleiner als)', t); }
    }
    if (t.mode === 'seq') {
      for (const g of t.gaps) if (!vals.includes(g)) fail('Lückenzahl fehlt in Antworten', t);
      if (t.seq.some(v => v < 0 || v > max)) fail('Reihe außerhalb des Zahlenraums', t);
      for (let k = 1; k < t.seq.length; k++) if (Math.abs(t.seq[k] - t.seq[k - 1]) !== 1) fail('Reihe springt', t);
      if (t.hint.line && (t.hint.line.lo > Math.min(...t.seq) || t.hint.line.hi < Math.max(...t.seq))) fail('Tipp-Zahlenstrahl zu kurz', t);
    }
    if (t.mode === 'line') {
      const L = t.line;
      if (t.answer < L.lo || t.answer > L.hi || L.frog < L.lo || L.frog > L.hi) fail('Frosch/Ziel nicht sichtbar', t);
      if (t.answer < 0 || t.answer > max) fail('Ziel außerhalb des Zahlenraums', t);
    }
    if (t.mode === 'multi') {
      const L = t.line;
      if (t.answer.some(v => v < L.lo || v > L.hi) || L.highlight.some(v => v < L.lo || v > L.hi)) fail('Zahlen nicht sichtbar', t);
    }
    if (t.line && (t.line.hi - t.line.lo !== 10 || t.line.lo < 0 || t.line.hi > 20)) fail('Zahlenstrahl-Ausschnitt falsch', t);
  }
  console.log(`[${lang}] ${n} Aufgaben geprüft, ${errs.length} Fehler`);
  errs.forEach(e => console.log('  ✗ ' + e));
  return errs.length;
}

const langs = process.argv[2] ? [process.argv[2]] : ['de', 'en'];
const total = langs.reduce((s, l) => s + check(l), 0);
process.exit(total ? 1 : 0);
