// Sammelt alle deutschen Sätze, die BestSchool vorlesen kann → tools/audio/saetze-de.json
// Aufruf: node tools/audio/sammle-saetze.js
// Danach: tools/audio/erzeuge-aufnahmen.py (erzeugt die MP3-Dateien in audio/de/)
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const logic = src.split('/* ======================= Bildschirme')[0];

global.location = { search: '?lang=de' };
Object.defineProperty(global, 'navigator', { value: { language: 'de' }, configurable: true, writable: true });
global.window = {};
global.localStorage = { getItem: () => null, setItem() {} };
// strip() braucht ein DOM-Element: Tags entfernen und die wenigen benutzten Entities auflösen
global.document = {
  createElement: () => ({
    set innerHTML(v) { this.t = v.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); },
    get textContent() { return this.t; },
  }),
};
const app = new Function(logic + '; return { GEN, strip, speechSentences, topicName, TOPIC_KEYS, LEVEL_UP_AT, TASKS_PER_ROUND, STICKERS, STARS_PER_STICKER };')();
const { GEN, strip, speechSentences } = app;

const sentences = new Set();
const add = text => speechSentences(text).forEach(s => sentences.add(s));

// 1) Alle Aufgaben: sehr viele Zufallsaufgaben je Thema und Stufe erzeugen
const RUNS = 60000;
for (const topic of app.TOPIC_KEYS) for (const lv of [1, 2, 3]) for (let i = 0; i < RUNS; i++) {
  const t = GEN[topic](lv);
  add(t.speak || strip(t.prompt));
  if (t.hint && t.hint.text) add(strip(t.hint.text));
  add(t.answerSpeak || strip(t.answerText));
}

// 2) Feste Texte der Bildschirme (müssen zu app.js passen – fehlende Sätze meldet die App in der Konsole)
const praise = ['Super!', 'Klasse!', 'Toll gemacht!', 'Genau richtig!', 'Prima!', 'Spitze!', 'Stark!', 'Richtig!'];
const encourage = ['Fast! Versuch es noch einmal.', 'Nicht schlimm – probier es nochmal!', 'Hmm, schau noch einmal genau hin.'];
[
  'Hallo! Ich bin Ole die Eule. Was möchtest du heute üben?',
  ...app.TOPIC_KEYS.map(k => `${app.topicName(k)} – welche Stufe möchtest du spielen?`),
  ...[2, 3].map(l => `Diese Stufe ist noch gesperrt. Schaffe ${app.LEVEL_UP_AT} von ${app.TASKS_PER_ROUND} Aufgaben in Stufe ${l - 1}.`),
  'Tippe zuerst die Zahlen an.',
  'Ein paar Zahlen passen nicht – die habe ich wieder weggenommen.',
  'Es fehlen noch Zahlen!',
  'Schau mal!',
  ...praise, ...encourage,
  'Perfekt! Alles beim ersten Mal richtig!', 'Super gemacht!', 'Gut gemacht! Übung macht den Meister.',
  'Toll, dass du geübt hast! Probier es gleich nochmal.',
  'Neue Stufe freigeschaltet: Stufe 2!', 'Neue Stufe freigeschaltet: Stufe 3!', 'Neuer Sticker für dein Album!',
  'Wow! Du hast alle Sticker gesammelt!',
  'Hallo! Ich bin Ole die Eule. Welche Zahl kommt nach der sieben? Super, das ist richtig!',
].forEach(add);
for (let ft = 0; ft <= app.TASKS_PER_ROUND; ft++) add(`Du hast ${ft} von ${app.TASKS_PER_ROUND} Aufgaben beim ersten Versuch geschafft.`);
for (let h = 0; h < app.STICKERS.length; h++) add(`Du hast ${h} Sticker.`);
add('Noch einen Stern bis zum nächsten!');
for (let r = 2; r <= app.STARS_PER_STICKER; r++) add(`Noch ${r} Sterne bis zum nächsten!`);
for (let n = 0; n <= 20; n++) add(String(n));   // Frosch zählt beim Hüpfen mit

const list = [...sentences].sort((a, b) => a.localeCompare(b, 'de'));
fs.writeFileSync(path.join(__dirname, 'saetze-de.json'), JSON.stringify(list, null, 0).replace(/","/g, '",\n"'));
const chars = list.reduce((s, x) => s + x.length, 0);
console.log(`${list.length} Sätze, ${chars} Zeichen (≈ ${Math.round(chars / 14 / 60)} Minuten Sprache)`);
