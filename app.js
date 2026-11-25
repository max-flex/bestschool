'use strict';
/*
 * BestSchool – Mathe für die 1. Klasse / Maths for 1st Grade
 * Themen / Topics: Zählen 0–20 (vorwärts/rückwärts), größer/kleiner, Zahlen dazwischen.
 * Hinweis: Diese App ist KI-generiert und kann Fehler enthalten.
 * Note: This app is AI-generated and may contain errors.
 */

/* ======================= kleine Helfer ======================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const strip = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.replace(/\s+/g, ' ').trim(); };

/* ======================= Sprache / Language ======================= */
const LANGS = ['de', 'en'];
let lang = 'de';
// tx('deutsch', 'english') → Text in der aktuellen Sprache
const tx = (de, en) => (lang === 'en' ? en : de);

/* ======================= Einstellungen ======================= */
const TOPIC_KEYS = ['count', 'compare', 'between'];
const TOPIC_STYLE = {
  count:   { icon: '🐸', cls: 't-count' },
  compare: { icon: '🐊', cls: 't-compare' },
  between: { icon: '🐝', cls: 't-between' },
};
const topicName = k => ({
  count:   tx('Zählen', 'Counting'),
  compare: tx('Größer · kleiner', 'Bigger · smaller'),
  between: tx('Dazwischen', 'In between'),
}[k]);
const topicDesc = k => ({
  count:   tx('Vorwärts und rückwärts zählen', 'Count forwards and backwards'),
  compare: tx('Welche Zahl ist größer?', 'Which number is bigger?'),
  between: tx('Welche Zahl liegt dazwischen?', 'Which number is in between?'),
}[k]);
const levelInfo = (k, l) => ({
  count: [
    tx('Zahlen bis 10: Was kommt danach? Frosch-Hüpfer', 'Numbers to 10: what comes next? Frog hops'),
    tx('Zahlen bis 20: vorwärts und rückwärts', 'Numbers to 20: forwards and backwards'),
    tx('Profi: mehrere Lücken und weite Sprünge', 'Expert: several gaps and long jumps'),
  ],
  compare: [
    tx('Zahlen bis 10 mit Punkten', 'Numbers to 10 with dots'),
    tx('Zahlen bis 20: größer und kleiner', 'Numbers to 20: bigger and smaller'),
    tx('Profi: die Krokodil-Zeichen < = >', 'Expert: the crocodile signs < = >'),
  ],
  between: [
    tx('Zahlen bis 10 mit Zahlenstrahl', 'Numbers to 10 with a number line'),
    tx('Zahlen bis 20', 'Numbers to 20'),
    tx('Profi: alle Zahlen dazwischen finden', 'Expert: find all the numbers in between'),
  ],
}[k][l - 1]);

const TASKS_PER_ROUND = 8;
const LEVEL_UP_AT = 6;          // so viele Aufgaben beim 1. Versuch richtig → nächste Stufe
const STARS_PER_STICKER = 5;
const STICKERS = ['🦁', '🐼', '🦊', '🐨', '🐯', '🦄', '🐙', '🦋', '🐢', '🦉', '🐬', '🦒', '🐧', '🦖', '🐳', '🌈', '🚀', '🏆'];
const praise = () => pick(tx(
  ['Super!', 'Klasse!', 'Toll gemacht!', 'Genau richtig!', 'Prima!', 'Spitze!', 'Stark!', 'Richtig!'],
  ['Super!', 'Great!', 'Well done!', 'Exactly right!', 'Brilliant!', 'Awesome!', 'Fantastic!', 'Correct!']));
const encourage = () => pick(tx(
  ['Fast! Versuch es noch einmal.', 'Nicht schlimm – probier es nochmal!', 'Hmm, schau noch einmal genau hin.'],
  ['Almost! Have another go.', "Don't worry – try again!", 'Hmm, take another close look.']));

/* ======================= Speicherstand ======================= */
const STORE_KEY = 'bestschool.v1';
// levels = vom Kind erspielte Stufen; unlockAll = von Eltern alle Stufen freigeschaltet (umschaltbar, erspielte Stufen bleiben erhalten)
const defaultState = () => ({ stars: 0, levels: { count: 1, compare: 1, between: 1 }, unlockAll: false, sound: true, lang: null, voices: {} });
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    const d = defaultState();
    const st = { ...d, ...s, levels: { ...d.levels, ...(s.levels || {}) } };
    // Alte Version (vor dem Schalter unlockAll): „Alle Stufen freischalten“ hat levels direkt auf 3 gesetzt.
    // Solche Stände in den Schalter umwandeln, damit die Freischaltung wieder aufgehoben werden kann.
    if (s.levels && !('unlockAll' in s) && TOPIC_KEYS.every(k => s.levels[k] === 3)) {
      st.unlockAll = true;
      st.levels = { ...d.levels };
    }
    return st;
  } catch (e) { return defaultState(); }
}
function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* privater Modus */ } }
let state = loadState();
// Höchste spielbare Stufe eines Themas
const maxLevel = k => (state.unlockAll ? 3 : state.levels[k]);
let round = null;

// Sprache: ?lang=en in der Adresse > gespeicherte Wahl > Browsersprache
(function initLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(q)) lang = q;
  else if (LANGS.includes(state.lang)) lang = state.lang;
  else lang = (navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en';
})();

/* ======================= Töne & Vorlesen ======================= */
let actx = null;
function tone(freq, dur, type = 'sine', when = 0, vol = 0.15) {
  if (!state.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime + when;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  } catch (e) { /* kein Audio */ }
}
const sfx = {
  right() { tone(660, .15, 'triangle'); tone(880, .22, 'triangle', .12); },
  wrong() { tone(240, .25, 'sawtooth', 0, .06); },
  tap()   { tone(520, .06, 'square', 0, .04); },
  hop()   { tone(420, .08); tone(640, .08, 'sine', .06); },
  win()   { [523, 659, 784, 1047].forEach((f, i) => tone(f, .28, 'triangle', i * .14)); },
};

const hasSpeech = 'speechSynthesis' in window;
const VOICE_LANG = { de: 'de-DE', en: 'en-GB' };

// Bekannte Stimmen-Namen (Windows/Edge, Chrome, Apple, Android)
const FEMALE = /katja|hedda|seraphina|amala|louisa|tanja|elke|klarissa|maja|ingrid|anna|petra|helena|marlene|vicki|sandy|shelley|google deutsch|sonia|libby|hollie|bella|abbie|ava|aria|jenny|emma|michelle|zira|hazel|susan|serena|kate|samantha|karen|moira|tessa|fiona|martha|\bfemale\b|\bfrau\b/i;
const MALE = /stefan|conrad|killian|florian|bernd|christoph|kasper|ralf|markus|yannick|viktor|martin|reed|eddy|rocko|grandpa|ryan|thomas|guy|andrew|brian|christopher|eric|roger|steffan|david|mark|george|james|daniel|oliver|arthur|fred|\bmale\b|\bmann\b/i;
const CHILD = /gisela|maisie|ana\b|child|kind/i;

// Je natürlicher und weiblicher, desto höher die Punktzahl
function voiceScore(v) {
  const n = v.name;
  let s = 0;
  if (/natural|neural|premium|enhanced|erweitert|verbessert|online/i.test(n)) s += 100;
  if (/^google/i.test(n)) s += 40;                 // Chrome-Stimmen klingen deutlich weicher als SAPI
  if (FEMALE.test(n) && !MALE.test(n.replace(/microsoft|google|apple/ig, ''))) s += 50;
  if (MALE.test(n) && !FEMALE.test(n)) s -= 80;
  if (CHILD.test(n)) s -= 30;
  if (/seraphina|katja|amala|louisa|sonia|libby|ava|jenny/i.test(n)) s += 10; // besonders angenehm
  if (/hedda|zira/i.test(n)) s -= 5;               // ältere, härtere Stimmen
  if (v.lang === VOICE_LANG[lang] || v.lang.replace('_', '-') === VOICE_LANG[lang]) s += 5;
  return s;
}
function langVoices() {
  if (!hasSpeech) return [];
  return speechSynthesis.getVoices()
    .filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(lang))
    .sort((a, b) => voiceScore(b) - voiceScore(a));
}
function findVoice() {
  const vs = langVoices();
  const chosen = state.voices && state.voices[lang];
  return vs.find(v => v.name === chosen) || vs[0] || null;
}
if (hasSpeech) speechSynthesis.getVoices();

function say(text) {
  if (!state.sound || !hasSpeech || !text) return;
  try {
    speechSynthesis.cancel();
    const clean = text
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/…/g, ', ')            // kurze Sprechpause statt „Punkt Punkt Punkt“
      .replace(/\s–\s/g, ', ')
      .replace(/\s+/g, ' ').trim();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = VOICE_LANG[lang];
    const v = findVoice();
    if (v) { u.voice = v; u.lang = v.lang; }
    const natural = v && /natural|neural|premium|enhanced|erweitert|online|google/i.test(v.name);
    // Natürliche Stimmen klingen im Normaltempo am besten; einfache Stimmen etwas langsamer und minimal heller
    u.rate = natural ? 0.95 : 0.88;
    u.pitch = natural ? 1 : 1.05;
    u.volume = 1;
    speechSynthesis.speak(u);
  } catch (e) { /* kein Vorlesen */ }
}

/* ======================= Bausteine (HTML) ======================= */
// Ausschnitt des Zahlenstrahls (11 Zahlen), der x..y sicher enthält
function win(x, y, max, highlight = [], extra = {}) {
  if (max <= 10) return { lo: 0, hi: 10, highlight, ...extra };
  const lo = clamp(Math.floor((x + y) / 2) - 5, 0, 10);
  return { lo, hi: lo + 10, highlight, cont: true, ...extra };
}

function lineHTML({ lo = 0, hi = 10, highlight = [], hidden = [], interactive = false, frog = null, cont = false }) {
  const tag = interactive ? 'button' : 'div';
  const cells = range(lo, hi).map(v => {
    const cls = ['nl-cell'];
    if (v % 5 === 0) cls.push('five');
    if (v % 10 === 0) cls.push('ten');
    if (highlight.includes(v)) cls.push('hl');
    if (hidden.includes(v)) cls.push('hidden');
    return `<${tag} class="${cls.join(' ')}" data-v="${v}">${hidden.includes(v) ? '?' : v}</${tag}>`;
  }).join('');
  const frogEl = frog != null ? `<div class="frog" style="--i:${frog - lo}">🐸</div>` : '';
  return `<div class="nline${interactive ? ' interactive' : ''}${frog != null ? ' has-frog' : ''}" style="--n:${hi - lo + 1}">`
    + (cont && lo > 0 ? '<span class="nl-more">…</span>' : '')
    + `<div class="nl-track">${cells}${frogEl}</div>`
    + (cont && hi < 20 ? '<span class="nl-more">…</span>' : '')
    + '</div>';
}

function seqHTML(seq, gapIdx) {
  return `<div class="seq">${seq.map((v, i) => gapIdx.includes(i)
    ? `<div class="tile gap" data-gi="${gapIdx.indexOf(i)}">?</div>`
    : `<div class="tile">${v}</div>`).join('<span class="arrow">›</span>')}</div>`;
}

// Zehnerfeld: Zehnerreihen mit Fünfer-Lücke
function dotsHTML(n, max) {
  const rows = max > 10 ? 2 : 1;
  let s = '<div class="dots">';
  for (let r = 0; r < rows; r++) {
    s += '<div class="drow">';
    for (let i = 0; i < 10; i++) {
      s += `<span class="dot${r * 10 + i < n ? ' on' : ''}"></span>`;
      if (i === 4) s += '<span class="dgap"></span>';
    }
    s += '</div>';
  }
  return s + '</div>';
}

function optsHTML(options, cls = '') {
  return `<div class="opts ${cls}">${options.map((o, i) => `<button class="opt" data-i="${i}">${o.html || o.label}</button>`).join('')}</div>`;
}

// Zahl-Antworten: richtige Antworten + passende Ablenker, aufsteigend sortiert
function numOpts(answers, cands, n, lo = 0, hi = 20) {
  const set = new Set(answers);
  for (const c of shuffle(cands)) { if (set.size >= n) break; if (c >= lo && c <= hi) set.add(c); }
  let g = 0;
  while (set.size < n && g++ < 200) set.add(rand(lo, hi));
  return [...set].sort((a, b) => a - b).map(v => ({ value: v, label: String(v) }));
}

/* ======================= Aufgaben-Generatoren ======================= */
const GEN = {
  /* ---------- Zählen / Counting ---------- */
  count(level) {
    const max = level === 1 ? 10 : 20;
    const t = pick({
      1: ['next', 'next', 'seqF', 'seqF', 'hopF'],
      2: ['next', 'prev', 'seqF', 'seqB', 'hopF', 'hopB'],
      3: ['prev', 'seqF', 'seqB', 'seqB', 'hopF', 'hopB'],
    }[level]);

    if (t === 'next' || t === 'prev') {
      const fwd = t === 'next';
      const n = fwd ? rand(0, max - 1) : rand(1, max);
      const ans = fwd ? n + 1 : n - 1;
      return {
        key: t + n, mode: 'seq',
        seq: fwd ? [n, ans] : [ans, n], gapIdx: [fwd ? 1 : 0], gaps: [ans],
        prompt: tx(`Welche Zahl kommt <b>${fwd ? 'nach' : 'vor'}</b> der ${n}?`,
                   `What number comes <b>${fwd ? 'after' : 'before'}</b> ${n}?`),
        options: numOpts([ans], [n, ans + 1, ans - 1, fwd ? n + 2 : n - 2], 4, 0, max),
        hint: {
          text: tx(`Schau auf den Zahlenstrahl: Welche Zahl steht <b>${fwd ? 'rechts' : 'links'}</b> neben der ${n}?`,
                   `Look at the number line: which number is just to the <b>${fwd ? 'right' : 'left'}</b> of ${n}?`),
          line: win(n, n, max, [n]),
        },
        answerText: tx(`${fwd ? 'Nach' : 'Vor'} der ${n} kommt die <b>${ans}</b>.`,
                       `<b>${ans}</b> comes ${fwd ? 'after' : 'before'} ${n}.`),
      };
    }

    if (t === 'seqF' || t === 'seqB') {
      const fwd = t === 'seqF';
      const len = level === 3 ? 6 : 5;
      const nG = level === 3 ? 2 : 1;
      const s = fwd ? rand(0, max - len + 1) : rand(len - 1, max);
      const seq = range(0, len - 1).map(i => (fwd ? s + i : s - i));
      const gapIdx = shuffle(range(1, len - 1)).slice(0, nG).sort((a, b) => a - b);
      const gaps = gapIdx.map(i => seq[i]);
      const lo = Math.min(...seq), hi = Math.max(...seq);
      const dir = fwd ? tx('vorwärts', 'forwards') : tx('rückwärts', 'backwards');
      return {
        key: `${t}${s}:${gapIdx.join(',')}`, mode: 'seq', seq, gapIdx, gaps,
        dirLabel: fwd ? tx('vorwärts ➜ immer 1 mehr', 'forwards ➜ always 1 more')
                      : tx('rückwärts ➜ immer 1 weniger', 'backwards ➜ always 1 less'),
        prompt: nG === 1
          ? tx(`Zähle <b>${dir}</b>. Welche Zahl fehlt?`, `Count <b>${dir}</b>. Which number is missing?`)
          : tx(`Zähle <b>${dir}</b>. Welche Zahlen fehlen? Fülle die Lücken von links nach rechts.`,
               `Count <b>${dir}</b>. Which numbers are missing? Fill the gaps from left to right.`),
        options: numOpts(gaps, [lo - 1, hi + 1, lo - 2, hi + 2, ...gaps.flatMap(g => [g - 1, g + 1])], nG === 1 ? 4 : 5, 0, max),
        hint: {
          text: tx(`Sprich die Zahlen laut mit: ${seq.slice(0, gapIdx[0]).join(', ')}, …`,
                   `Say the numbers out loud: ${seq.slice(0, gapIdx[0]).join(', ')}, …`),
          line: win(lo, hi, max, seq.filter((_, i) => !gapIdx.includes(i)), { hidden: gaps }),
        },
        answerText: nG === 1
          ? tx(`Es fehlt die <b>${gaps[0]}</b>.`, `<b>${gaps[0]}</b> is missing.`)
          : tx(`Es fehlen die <b>${gaps[0]}</b> und die <b>${gaps[1]}</b>.`, `<b>${gaps[0]}</b> and <b>${gaps[1]}</b> are missing.`),
      };
    }

    // Frosch-Hüpfer auf dem Zahlenstrahl (Weiter- und Zurückzählen)
    const fwd = t === 'hopF';
    const k = level === 1 ? rand(1, 3) : level === 2 ? rand(2, 4) : rand(3, 6);
    const s = fwd ? rand(0, max - k) : rand(k, max);
    const ans = fwd ? s + k : s - k;
    const hops = tx(k === 1 ? '<b>einen</b> Hüpfer' : `<b>${k}</b> Hüpfer`, k === 1 ? '<b>one</b> hop' : `<b>${k}</b> hops`);
    const dir = fwd ? tx('vorwärts', 'forwards') : tx('rückwärts', 'backwards');
    return {
      key: `${t}${s}:${k}`, mode: 'line',
      line: { ...win(Math.min(s, ans), Math.max(s, ans), max, []), frog: s }, answer: ans,
      prompt: tx(`Der Frosch sitzt auf der <b>${s}</b> und macht ${hops} <b>${dir}</b>. Tippe an, wo er landet!`,
                 `The frog is sitting on <b>${s}</b> and makes ${hops} <b>${dir}</b>. Tap where it lands!`),
      hint: {
        text: tx(`Lege deinen Finger auf die ${s}. Hüpfe ${k}-mal nach <b>${fwd ? 'rechts' : 'links'}</b> und zähle mit: ${range(1, k).join(', ')}.`,
                 `Put your finger on ${s}. Hop ${k} ${k === 1 ? 'time' : 'times'} to the <b>${fwd ? 'right' : 'left'}</b> and count along: ${range(1, k).join(', ')}.`),
        highlight: [s],
      },
      answerText: tx(`Von der ${s} aus ${k}-mal ${dir} gehüpft: Der Frosch landet auf der <b>${ans}</b>.`,
                     `From ${s}, ${k} ${k === 1 ? 'hop' : 'hops'} ${dir}: the frog lands on <b>${ans}</b>.`),
    };
  },

  /* ---------- Größer / kleiner – Bigger / smaller ---------- */
  compare(level) {
    if (level === 1) {
      const a = rand(0, 10); let b;
      do { b = rand(0, 10); } while (b === a);
      const big = Math.random() < 0.7;
      const ans = big ? Math.max(a, b) : Math.min(a, b);
      const other = ans === a ? b : a;
      return {
        key: `c1:${a}:${b}:${big}`, mode: 'choice', optClass: 'cards', answer: ans,
        options: [a, b].map(v => ({ value: v, html: `<span class="cnum">${v}</span>${dotsHTML(v, 10)}` })),
        prompt: tx(`Welche Zahl ist <b>${big ? 'größer' : 'kleiner'}</b>? Tippe sie an!`,
                   `Which number is <b>${big ? 'bigger' : 'smaller'}</b>? Tap it!`),
        hint: {
          text: big
            ? tx('Vergleiche die Punkte. Wo sind <b>mehr</b> Punkte? Mehr Punkte heißt: größere Zahl.',
                 'Compare the dots. Where are there <b>more</b> dots? More dots means a bigger number.')
            : tx('Vergleiche die Punkte. Wo sind <b>weniger</b> Punkte? Weniger Punkte heißt: kleinere Zahl.',
                 'Compare the dots. Where are there <b>fewer</b> dots? Fewer dots means a smaller number.'),
          line: win(0, 10, 10, [a, b]),
        },
        answerText: tx(`Die <b>${ans}</b> ist ${big ? 'größer' : 'kleiner'} als die ${other}.`,
                       `<b>${ans}</b> is ${big ? 'bigger' : 'smaller'} than ${other}.`),
      };
    }

    const t = pick(level === 2 ? ['pick2', 'pick2', 'gt', 'lt'] : ['symbol', 'symbol', 'gt', 'lt', 'pick2']);

    if (t === 'pick2') {
      const a = rand(0, 20); let b;
      do { b = level === 3 ? a + pick([-2, -1, 1, 2]) : rand(Math.max(0, a - 9), Math.min(20, a + 9)); }
      while (b === a || b < 0 || b > 20);
      const big = Math.random() < 0.5;
      const ans = big ? Math.max(a, b) : Math.min(a, b);
      const other = ans === a ? b : a;
      return {
        key: `c2:${a}:${b}:${big}`, mode: 'choice', optClass: 'cards', answer: ans,
        options: [a, b].map(v => ({ value: v, html: `<span class="cnum">${v}</span>` })),
        prompt: tx(`Welche Zahl ist <b>${big ? 'größer' : 'kleiner'}</b>? Tippe sie an!`,
                   `Which number is <b>${big ? 'bigger' : 'smaller'}</b>? Tap it!`),
        hint: {
          text: tx(`Auf dem Zahlenstrahl steht die ${big ? 'größere' : 'kleinere'} Zahl weiter <b>${big ? 'rechts' : 'links'}</b>.`,
                   `On the number line, the ${big ? 'bigger' : 'smaller'} number is further to the <b>${big ? 'right' : 'left'}</b>.`),
          line: win(Math.min(a, b), Math.max(a, b), 20, [a, b]),
        },
        answerText: tx(`Die <b>${ans}</b> ist ${big ? 'größer' : 'kleiner'} als die ${other}.`,
                       `<b>${ans}</b> is ${big ? 'bigger' : 'smaller'} than ${other}.`),
      };
    }

    if (t === 'gt' || t === 'lt') {
      const gt = t === 'gt';
      const x = rand(3, 17);
      const ans = gt ? rand(x + 1, Math.min(20, x + 6)) : rand(Math.max(0, x - 6), x - 1);
      const pool = gt ? range(Math.max(0, x - 6), x - 1) : range(x + 1, Math.min(20, x + 6));
      const opts = [ans, x, ...shuffle(pool).slice(0, 2)].sort((p, q) => p - q);
      return {
        key: `${t}:${x}:${ans}`, mode: 'choice', answer: ans,
        options: opts.map(v => ({ value: v, label: String(v) })),
        prompt: tx(`Welche Zahl ist <b>${gt ? 'größer' : 'kleiner'} als ${x}</b>?`,
                   `Which number is <b>${gt ? 'greater' : 'less'} than ${x}</b>?`),
        hint: {
          text: gt
            ? tx(`Größere Zahlen stehen auf dem Zahlenstrahl <b>rechts</b> von der ${x}. Die ${x} selbst ist nicht größer als ${x}!`,
                 `Greater numbers are to the <b>right</b> of ${x} on the number line. ${x} itself is not greater than ${x}!`)
            : tx(`Kleinere Zahlen stehen auf dem Zahlenstrahl <b>links</b> von der ${x}. Die ${x} selbst ist nicht kleiner als ${x}!`,
                 `Smaller numbers are to the <b>left</b> of ${x} on the number line. ${x} itself is not less than ${x}!`),
          line: win(Math.max(0, x - 5), Math.min(20, x + 5), 20, [x]),
        },
        answerText: tx(`Die <b>${ans}</b> ist ${gt ? 'größer' : 'kleiner'} als ${x}.`,
                       `<b>${ans}</b> is ${gt ? 'greater' : 'less'} than ${x}.`),
      };
    }

    // Zeichen < = > (Krokodil) / signs < = > (crocodile)
    const a = rand(0, 20); let b = a;
    if (Math.random() > 0.2) { do { b = rand(Math.max(0, a - 8), Math.min(20, a + 8)); } while (b === a); }
    const ans = a < b ? '<' : a > b ? '>' : '=';
    const word = {
      '<': tx('ist kleiner als', 'is less than'),
      '=': tx('ist gleich', 'is equal to'),
      '>': tx('ist größer als', 'is greater than'),
    };
    return {
      key: `sym:${a}:${b}`, mode: 'choice', optClass: 'symbols', answer: ans,
      visual: `<div class="cmp"><span class="cnum big">${a}</span><span class="slot">?</span><span class="cnum big">${b}</span></div>`,
      fill: { sel: '.visual .slot', text: ans },
      options: ['<', '=', '>'].map(s => ({ value: s, html: `<span class="sym">${esc(s)}</span><small>${word[s]}</small>` })),
      prompt: tx('Welches Zeichen passt? <b>&lt;</b>, <b>=</b> oder <b>&gt;</b>', 'Which sign fits? <b>&lt;</b>, <b>=</b> or <b>&gt;</b>'),
      speak: tx(`Welches Zeichen passt? Ist ${a} kleiner, gleich oder größer als ${b}?`,
                `Which sign fits? Is ${a} less than, equal to, or greater than ${b}?`),
      hint: {
        text: tx('Das Krokodil 🐊 ist hungrig: Sein offenes Maul zeigt immer zur <b>größeren</b> Zahl. Sind beide Zahlen gleich, nimmst du das =.',
                 'The crocodile 🐊 is hungry: its open mouth always points to the <b>bigger</b> number. If both numbers are the same, use =.'),
        line: win(Math.min(a, b), Math.max(a, b), 20, [a, b]),
      },
      answerText: tx(`${a} ${esc(ans)} ${b} – denn ${a} ${word[ans]} ${b}.`, `${a} ${esc(ans)} ${b} – because ${a} ${word[ans]} ${b}.`),
    };
  },

  /* ---------- Dazwischen / In between ---------- */
  between(level) {
    const max = level === 1 ? 10 : 20;
    const t = level === 1 ? 'gap' : pick(level === 2 ? ['gap', 'gap', 'oneOf'] : ['multi', 'multi', 'oneOf', 'gap']);

    if (t === 'gap') {
      const a = rand(0, max - 2), b = a + 2, ans = a + 1;
      return {
        key: `bg:${a}`, mode: 'choice', answer: ans,
        visual: level === 1 ? lineHTML({ lo: 0, hi: 10, highlight: [a, b], hidden: [ans] }) : seqHTML([a, ans, b], [1]),
        fill: { sel: level === 1 ? '.visual .nl-cell.hidden' : '.visual .tile.gap', text: ans },
        options: numOpts([ans], [a, b, a - 1, b + 1], level === 1 ? 3 : 4, 0, max),
        prompt: tx(`Welche Zahl liegt <b>zwischen</b> ${a} und ${b}?`, `Which number is <b>between</b> ${a} and ${b}?`),
        hint: {
          text: tx(`Zähle von ${a} bis ${b}: ${a}, …, ${b}. Welche Zahl sagst du in der Mitte?`,
                   `Count from ${a} to ${b}: ${a}, …, ${b}. Which number do you say in the middle?`),
          line: level === 1 ? null : win(a, b, max, [a, b]),
        },
        answerText: tx(`Zwischen ${a} und ${b} liegt die <b>${ans}</b>.`, `<b>${ans}</b> is between ${a} and ${b}.`),
      };
    }

    const d = rand(3, 5), a = rand(0, 20 - d), b = a + d;

    if (t === 'oneOf') {
      const ans = rand(a + 1, b - 1);
      const edge = pick([a, b]); // eine Grenzzahl als Stolperstein
      const outside = shuffle([a, b, a - 1, a - 2, b + 1, b + 2].filter(v => v >= 0 && v <= 20 && v !== edge));
      const opts = [ans, edge, ...outside.slice(0, 2)].sort((p, q) => p - q);
      return {
        key: `bo:${a}:${b}:${ans}`, mode: 'choice', answer: ans,
        visual: `<div class="seq"><div class="tile">${a}</div><span class="arrow">· · ·</span><div class="tile">${b}</div></div>`,
        options: opts.map(v => ({ value: v, label: String(v) })),
        prompt: tx(`Welche dieser Zahlen liegt <b>zwischen</b> ${a} und ${b}?`, `Which of these numbers is <b>between</b> ${a} and ${b}?`),
        hint: {
          text: tx(`Zähle von ${a} bis ${b}. Nur die Zahlen, die du <b>dazwischen</b> sagst, gehören dazu – die ${a} und die ${b} selbst nicht!`,
                   `Count from ${a} to ${b}. Only the numbers you say <b>in between</b> count – not ${a} and ${b} themselves!`),
          line: win(a, b, 20, [a, b]),
        },
        answerText: tx(`Die <b>${ans}</b> liegt zwischen ${a} und ${b}.`, `<b>${ans}</b> is between ${a} and ${b}.`),
      };
    }

    const ans = range(a + 1, b - 1);
    return {
      key: `bm:${a}:${b}`, mode: 'multi', answer: ans, line: win(a, b, 20, [a, b]),
      prompt: tx(`Tippe <b>alle</b> Zahlen an, die zwischen ${a} und ${b} liegen. Drücke dann auf „Fertig“.`,
                 `Tap <b>all</b> the numbers between ${a} and ${b}. Then press “Done”.`),
      hint: {
        text: tx(`Zähle von ${a} bis ${b}. Alle Zahlen, die du dazwischen sagst, gehören dazu – die ${a} und die ${b} selbst nicht.`,
                 `Count from ${a} to ${b}. All the numbers you say in between belong – ${a} and ${b} themselves don't.`),
      },
      answerText: tx(`Zwischen ${a} und ${b} liegen: <b>${ans.join(', ')}</b>.`, `Between ${a} and ${b} are: <b>${ans.join(', ')}</b>.`),
    };
  },
};

/* ======================= Bildschirme ======================= */
const screen = document.getElementById('screen');
function setScreen(html) { screen.innerHTML = html; window.scrollTo(0, 0); }

// Feste Texte in index.html an die Sprache anpassen
function applyLang() {
  document.documentElement.lang = lang;
  document.title = tx('BestSchool – Mathe für die 1. Klasse', 'BestSchool – Maths for 1st Grade');
  $('#aiNote').textContent = tx('⚠️ Diese App ist KI-generiert und kann Fehler enthalten.', '⚠️ This app is AI-generated and may contain errors.');
  $('#btnHome').setAttribute('aria-label', tx('Zur Startseite', 'Home'));
  $('#btnSound').setAttribute('aria-label', tx('Ton an oder aus', 'Sound on or off'));
  $('#starBox').setAttribute('aria-label', tx('Gesammelte Sterne', 'Stars collected'));
  $('#btnLang').textContent = lang === 'de' ? 'EN' : 'DE';
  $('#btnLang').setAttribute('aria-label', tx('Switch to English', 'Auf Deutsch umschalten'));
}

function updateHeader(pop) {
  $('#starCount').textContent = state.stars;
  $('#btnSound').textContent = state.sound ? '🔊' : '🔇';
  if (pop) { const el = $('#starBox'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
}

function askHTML(icon, text, big = false) {
  return `<div class="ask"><div class="mascot${big ? ' big' : ''}">${icon}</div><div class="bubble"><div class="prompt">${text}</div><button class="speak" aria-label="${tx('Vorlesen', 'Read aloud')}">🔊</button></div></div>`;
}

/* ---------- Start ---------- */
function renderHome(greet) {
  round = null;
  const card = k => {
    const t = TOPIC_STYLE[k], lv = maxLevel(k);
    return `<button class="topic ${t.cls}" data-topic="${k}">
      <span class="ticon">${t.icon}</span><span class="tname">${topicName(k)}</span><span class="tdesc">${topicDesc(k)}</span>
      <span class="tlevel" aria-label="${tx('Stufe', 'Level')} ${lv} / 3">${[1, 2, 3].map(i => `<i class="${i <= lv ? 'on' : ''}"></i>`).join('')}</span>
    </button>`;
  };
  const intro = tx('Hallo! Ich bin <b>Ole die Eule</b>. Was möchtest du heute üben?',
                   'Hi! I am <b>Ollie the Owl</b>. What would you like to practise today?');
  setScreen(`
    <section class="home">
      ${askHTML('🦉', intro, true)}
      <div class="topics">
        ${TOPIC_KEYS.map(card).join('')}
        <button class="topic t-mix" data-topic="mix"><span class="ticon">🎲</span><span class="tname">${tx('Bunte Mischung', 'Mixed bag')}</span><span class="tdesc">${tx('Von allem etwas', 'A bit of everything')}</span></button>
      </div>
      <div class="homebar">
        <button class="btn" id="goAlbum">📒 ${tx('Sticker-Album', 'Sticker album')}</button>
        <button class="btn" id="goParents">👪 ${tx('Für Eltern &amp; Lehrkräfte', 'For parents &amp; teachers')}</button>
      </div>
    </section>`);
  $('.speak').onclick = () => say(strip(intro));
  if (greet) say(strip(intro));
  $$('.topic').forEach(b => b.onclick = () => {
    sfx.tap();
    const k = b.dataset.topic;
    if (k === 'mix') startRound('mix', null); else renderLevels(k);
  });
  $('#goAlbum').onclick = () => { sfx.tap(); renderAlbum(); };
  $('#goParents').onclick = () => { sfx.tap(); renderParents(); };
}

/* ---------- Stufenwahl ---------- */
function renderLevels(k) {
  const T = TOPIC_STYLE[k];
  const text = tx(`<b>${topicName(k)}</b> – welche Stufe möchtest du spielen?`, `<b>${topicName(k)}</b> – which level would you like to play?`);
  const lockedText = l => tx(`Schaffe ${LEVEL_UP_AT} von ${TASKS_PER_ROUND} Aufgaben in Stufe ${l - 1}`,
                             `Get ${LEVEL_UP_AT} out of ${TASKS_PER_ROUND} right in level ${l - 1}`);
  setScreen(`
    <section class="${T.cls}">
      ${askHTML(T.icon, text)}
      <div class="levels">
        ${[1, 2, 3].map(l => {
          const locked = l > maxLevel(k);
          return `<button class="level${locked ? ' locked' : ''}" data-l="${l}">
            <span class="num">${locked ? '🔒' : l}</span>
            <span>${tx('Stufe', 'Level')} ${l}<small>${locked ? lockedText(l) : levelInfo(k, l)}</small></span>
          </button>`;
        }).join('')}
      </div>
    </section>`);
  $('.speak').onclick = () => say(strip(text));
  say(strip(text));
  $$('.level').forEach(b => b.onclick = () => {
    const l = +b.dataset.l;
    if (l > maxLevel(k)) {
      sfx.wrong(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      say(tx(`Diese Stufe ist noch gesperrt. ${lockedText(l)}.`, `This level is still locked. ${lockedText(l)}.`));
      return;
    }
    sfx.tap(); startRound(k, l);
  });
}

/* ---------- Runde ---------- */
function startRound(topic, level) {
  const tasks = [], keys = new Set();
  let guard = 0;
  while (tasks.length < TASKS_PER_ROUND && guard++ < 500) {
    const tp = topic === 'mix' ? pick(TOPIC_KEYS) : topic;
    const lv = topic === 'mix' ? state.levels[tp] : level;
    const task = GEN[tp](lv);
    if (keys.has(task.key) && guard < 400) continue;
    keys.add(task.key);
    task.topic = tp;
    tasks.push(task);
  }
  round = { topic, level, tasks, idx: 0, startStars: state.stars };
  renderTask();
}

const cur = () => round.tasks[round.idx];

function renderTask() {
  const task = cur();
  Object.assign(task, { wrong: 0, done: false, gi: 0, firstTry: false });
  const T = TOPIC_STYLE[task.topic];
  let visual = task.visual || '', answers = '';
  if (task.mode === 'seq') {
    visual = (task.dirLabel ? `<div class="dirlabel">${task.dirLabel}</div>` : '') + seqHTML(task.seq, task.gapIdx);
    answers = optsHTML(task.options);
  } else if (task.mode === 'choice') {
    answers = optsHTML(task.options, task.optClass || '');
  } else {
    visual = lineHTML({ ...task.line, interactive: true });
    if (task.mode === 'multi') answers = `<button class="btn big go" id="checkMulti">${tx('Fertig', 'Done')} ✔</button>`;
  }
  const label = round.topic === 'mix' ? `🎲 ${tx('Bunte Mischung', 'Mixed bag')}` : `${topicName(task.topic)} · ${tx('Stufe', 'Level')} ${round.level}`;
  setScreen(`
    <section class="game ${T.cls}">
      <div class="gamehead">
        <span class="glabel">${label} · ${tx('Aufgabe', 'Task')} ${round.idx + 1} ${tx('von', 'of')} ${round.tasks.length}</span>
        <div class="progress">${round.tasks.map((t, i) => `<span class="pdot ${i < round.idx ? (t.firstTry ? 'ok' : 'meh') : ''} ${i === round.idx ? 'cur' : ''}"></span>`).join('')}</div>
      </div>
      ${askHTML(T.icon, task.prompt)}
      <div class="visual">${visual}</div>
      <div class="answers">${answers}</div>
      <div class="feedback" aria-live="polite"></div>
    </section>`);

  const spoken = task.speak || strip(task.prompt);
  $('.speak').onclick = () => say(spoken);
  say(spoken);

  if (task.mode === 'seq' || task.mode === 'choice') {
    $$('.opt').forEach(b => b.onclick = () => onOption(b, task.options[+b.dataset.i].value));
    if (task.mode === 'seq') markActiveGap();
  } else {
    $$('.visual .nl-cell').forEach(c => c.onclick = () => onCell(c, +c.dataset.v));
    if (task.mode === 'multi') $('#checkMulti').onclick = checkMulti;
  }
}

function markActiveGap() {
  const task = cur();
  $$('.visual .tile.gap').forEach(t => t.classList.toggle('active', +t.dataset.gi === task.gi && !t.classList.contains('filled')));
}

function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function disableAll() { $$('.opt, .visual .nl-cell, #checkMulti').forEach(b => { b.disabled = true; }); }
function fillVisual(task) {
  if (!task.fill) return;
  const el = $(task.fill.sel);
  if (el) { el.textContent = task.fill.text; el.classList.add('filled'); el.classList.remove('hidden'); }
}

function onOption(btn, v) {
  const task = cur(); if (task.done) return;
  if (task.mode === 'seq') {
    if (v === task.gaps[task.gi]) {
      const tile = $(`.visual .tile.gap[data-gi="${task.gi}"]`);
      tile.textContent = v; tile.classList.remove('active'); tile.classList.add('filled');
      task.gi++;
      if (task.gi >= task.gaps.length) onCorrect(btn);
      else { sfx.tap(); markActiveGap(); }
    } else onWrong(btn);
  } else if (v === task.answer) onCorrect(btn);
  else onWrong(btn, { disable: true });
}

function onCell(cell, v) {
  const task = cur(); if (task.done) return;
  if (task.mode === 'multi') { sfx.tap(); cell.classList.toggle('sel'); return; }
  if (v === task.answer) onCorrect(cell); else onWrong(cell, { disable: true });
}

function checkMulti() {
  const task = cur(); if (task.done) return;
  const sel = $$('.visual .nl-cell.sel');
  if (!sel.length) { say(tx('Tippe zuerst die Zahlen an.', 'Tap the numbers first.')); shake($('#checkMulti')); return; }
  const wrongCells = sel.filter(c => !task.answer.includes(+c.dataset.v));
  const missing = task.answer.filter(v => !sel.some(c => +c.dataset.v === v));
  if (!wrongCells.length && !missing.length) { onCorrect(null); return; }
  wrongCells.forEach(c => { c.classList.remove('sel'); shake(c); });
  onWrong(null, {
    msg: wrongCells.length
      ? tx('Ein paar Zahlen passen nicht – die habe ich wieder weggenommen.', "Some numbers don't fit – I have taken them away again.")
      : tx('Es fehlen noch Zahlen!', 'Some numbers are still missing!'),
  });
}

function onCorrect(el) {
  const task = cur(); if (task.done) return;
  task.done = true; task.firstTry = task.wrong === 0;
  disableAll();
  if (el) el.classList.add('right');
  if (task.mode === 'multi') $$('.visual .nl-cell.sel').forEach(c => c.classList.add('right'));
  fillVisual(task);
  const r = round, idx = round.idx;
  const finish = () => {
    if (round !== r) return;
    sfx.right();
    const p = praise();
    if (task.firstTry) { state.stars++; saveState(); updateHeader(true); }
    $('.feedback').innerHTML = `<div class="praise">${p}${task.firstTry ? ' <span class="plus">+1 ⭐</span>' : ''}</div>`;
    say(p);
    confetti(task.firstTry ? 28 : 12);
    setTimeout(() => { if (round === r && r.idx === idx) nextTask(); }, 1700);
  };
  if (task.mode === 'line' && task.line.frog != null) hopFrog(task, finish); else finish();
}

function onWrong(el, { disable = false, msg } = {}) {
  const task = cur(); if (task.done) return;
  task.wrong++;
  sfx.wrong();
  if (el) { shake(el); if (disable) { el.classList.add('wrong'); el.disabled = true; } }
  if (task.wrong >= 2) reveal(); else showHint(msg);
}

function showHint(msg) {
  const task = cur(), h = task.hint || {};
  const head = msg || encourage();
  (h.highlight || []).forEach(v => { const c = $(`.visual .nl-cell[data-v="${v}"]`); if (c) c.classList.add('hl'); });
  $('.feedback').innerHTML = `<div class="hint"><div class="hint-head">💡 ${head}</div>`
    + (h.text ? `<div class="hint-text">${h.text}</div>` : '')
    + (h.line ? lineHTML(h.line) : '') + '</div>';
  say(`${head} ${strip(h.text || '')}`);
}

function reveal() {
  const task = cur();
  task.done = true; task.firstTry = false;
  disableAll();
  const isHop = task.mode === 'line' && task.line.frog != null;
  const look = tx('Schau mal:', 'Look:');
  if (task.mode === 'seq') {
    task.gaps.forEach((g, gi) => {
      const tile = $(`.visual .tile.gap[data-gi="${gi}"]`);
      if (!tile.classList.contains('filled')) { tile.textContent = g; tile.classList.remove('active'); tile.classList.add('revealed'); }
    });
  } else if (task.mode === 'choice') {
    const i = task.options.findIndex(o => o.value === task.answer);
    if (i >= 0) $$('.opt')[i].classList.add('right');
    fillVisual(task);
  } else if (task.mode === 'line') {
    const cell = $(`.visual .nl-cell[data-v="${task.answer}"]`);
    if (isHop) hopFrog(task, () => { cell.classList.add('right'); say(strip(task.answerText)); });
    else cell.classList.add('right');
  } else if (task.mode === 'multi') {
    $$('.visual .nl-cell').forEach(c => { c.classList.remove('sel'); c.classList.toggle('right', task.answer.includes(+c.dataset.v)); });
  }
  $('.feedback').innerHTML = `<div class="hint reveal"><div class="hint-head">🦉 ${look}</div><div class="hint-text">${task.answerText}</div><button class="btn big go" id="nextBtn">${tx('Weiter', 'Next')} ➜</button></div>`;
  $('#nextBtn').onclick = () => { sfx.tap(); nextTask(); };
  if (!isHop) say(`${look} ${strip(task.answerText)}`);
}

function hopFrog(task, done) {
  const r = round, frog = $('.visual .frog');
  if (!frog) { done(); return; }
  let pos = task.line.frog;
  const dir = task.answer > pos ? 1 : -1;
  const step = () => {
    if (round !== r) return;
    if (pos === task.answer) { done(); return; }
    pos += dir;
    frog.style.setProperty('--i', pos - task.line.lo);
    frog.classList.remove('jump'); void frog.offsetWidth; frog.classList.add('jump');
    sfx.hop(); say(String(pos));
    setTimeout(step, 650);
  };
  step();
}

function nextTask() {
  if (!round) return;
  round.idx++;
  if (round.idx >= round.tasks.length) finishRound(); else renderTask();
}

/* ---------- Rundenende ---------- */
function finishRound() {
  const { topic, level, tasks, startStars } = round;
  const n = tasks.length;
  const ft = tasks.filter(t => t.firstTry).length;
  let levelUp = false;
  if (topic !== 'mix' && ft >= LEVEL_UP_AT && level === state.levels[topic] && level < 3) {
    state.levels[topic]++; levelUp = true;
  }
  saveState();
  const before = Math.min(Math.floor(startStars / STARS_PER_STICKER), STICKERS.length);
  const after = Math.min(Math.floor(state.stars / STARS_PER_STICKER), STICKERS.length);
  const newStickers = STICKERS.slice(before, after);
  const trophies = ft >= 7 ? 3 : ft >= 5 ? 2 : 1;
  const msg = ft === n ? tx('Perfekt! Alles beim ersten Mal richtig!', 'Perfect! Everything right first time!')
    : ft >= 6 ? tx('Super gemacht!', 'Brilliant work!')
    : ft >= 4 ? tx('Gut gemacht! Übung macht den Meister.', 'Well done! Practice makes perfect.')
    : tx('Toll, dass du geübt hast! Probier es gleich nochmal.', 'Great that you practised! Try again straight away.');
  const summary = tx(`Du hast <b>${ft} von ${n}</b> Aufgaben beim ersten Versuch geschafft.`,
                     `You got <b>${ft} out of ${n}</b> right on the first try.`);
  const newLevel = tx(`Neue Stufe freigeschaltet: Stufe ${level + 1}!`, `New level unlocked: level ${level + 1}!`);
  const newSticker = tx('Neuer Sticker für dein Album!', 'New sticker for your album!');
  const cls = topic === 'mix' ? 't-mix' : TOPIC_STYLE[topic].cls;
  round = null;

  setScreen(`
    <section class="end ${cls}">
      <div class="trophies">${[1, 2, 3].map(i => `<span class="${i <= trophies ? '' : 'off'}">⭐</span>`).join('')}</div>
      <div class="endtext">${msg}</div>
      <p>${summary}</p>
      ${levelUp ? `<div class="newbadge"><span class="big">🎉</span>${newLevel}</div>` : ''}
      ${newStickers.length ? `<div class="newbadge"><span class="big">${newStickers.join(' ')}</span>${newSticker}</div>` : ''}
      <div class="endbtns">
        ${levelUp ? `<button class="btn big go" id="btnNextLevel">${tx('Nächste Stufe', 'Next level')} ➜</button>` : ''}
        <button class="btn big${levelUp ? '' : ' go'}" id="btnAgain">🔁 ${tx('Nochmal', 'Play again')}</button>
        <button class="btn big" id="btnBack">🏠 ${tx('Übersicht', 'Home')}</button>
      </div>
    </section>`);
  sfx.win(); confetti(70);
  let spoken = `${msg} ${strip(summary)}`;
  if (levelUp) spoken += ` ${newLevel}`;
  if (newStickers.length) spoken += ` ${newSticker}`;
  setTimeout(() => say(spoken), 500);
  if (levelUp) $('#btnNextLevel').onclick = () => { sfx.tap(); startRound(topic, level + 1); };
  $('#btnAgain').onclick = () => { sfx.tap(); startRound(topic, level); };
  $('#btnBack').onclick = () => { sfx.tap(); renderHome(false); };
}

/* ---------- Sticker-Album ---------- */
function renderAlbum() {
  round = null;
  const have = Math.min(Math.floor(state.stars / STARS_PER_STICKER), STICKERS.length);
  const rest = STARS_PER_STICKER - (state.stars % STARS_PER_STICKER);
  const text = have >= STICKERS.length
    ? tx('Wow! Du hast <b>alle Sticker</b> gesammelt!', 'Wow! You have collected <b>all the stickers</b>!')
    : tx(`Du hast <b>${have}</b> Sticker. Noch <b>${rest}</b> ${rest === 1 ? 'Stern' : 'Sterne'} bis zum nächsten!`,
         `You have <b>${have}</b> ${have === 1 ? 'sticker' : 'stickers'}. <b>${rest}</b> more ${rest === 1 ? 'star' : 'stars'} until the next one!`);
  setScreen(`
    <section>
      ${askHTML('📒', text)}
      ${have < STICKERS.length ? `<div class="bar"><div style="width:${((STARS_PER_STICKER - rest) / STARS_PER_STICKER) * 100}%"></div></div>` : ''}
      <div class="album">${STICKERS.map((s, i) => i < have ? `<div class="sticker">${s}</div>` : '<div class="sticker locked">❔</div>').join('')}</div>
      <p style="text-align:center;color:var(--muted)">${tx('Für jede Aufgabe, die du beim ersten Versuch richtig löst, bekommst du einen ⭐.', 'You get a ⭐ for every task you solve on the first try.')}</p>
    </section>`);
  $('.speak').onclick = () => say(strip(text));
  say(strip(text));
}

/* ---------- Eltern & Lehrkräfte ---------- */
function renderParents() {
  round = null;
  const body = lang === 'en' ? `
      <h2>👪 For parents &amp; teachers</h2>
      <div class="notice"><b>⚠️ Please note:</b> This app was created with the help of artificial intelligence (AI) and <b>may contain errors</b>.
        Please support your child while practising, and feel free to report any mistakes on GitHub.</div>
      <h3>🐸 Counting (numbers 0–20)</h3>
      <p>Numbers before and after, completing number sequences forwards and backwards, counting on and back with frog hops on the number line.
        The hops prepare children for addition and subtraction later on.</p>
      <h3>🐊 Bigger · smaller</h3>
      <p>Level 1 compares amounts in a ten-frame (dots in groups of five), level 2 compares numbers up to 20 and asks “greater/less than …”,
        level 3 introduces the signs &lt;, = and &gt; with the well-known crocodile memory aid.</p>
      <h3>🐝 In between</h3>
      <p>From the number line (up to 10) via numbers up to 20 to the expert task of finding <i>all</i> numbers between two numbers.
        The boundary numbers are deliberately included as traps – they are not “in between”.</p>
      <h3>🧠 Teaching approach</h3>
      <ul>
        <li><b>Read aloud:</b> every task is read out (🔊 to repeat), so children do not need to read fluently yet.</li>
        <li><b>Learning from mistakes:</b> after one mistake there is a hint with a number line, after the second the solution is explained. No penalty points.</li>
        <li><b>Levels:</b> getting ${LEVEL_UP_AT} out of ${TASKS_PER_ROUND} right on the first try unlocks the next level.</li>
        <li><b>Motivation:</b> stars for tasks solved on the first try, a sticker for every ${STARS_PER_STICKER} stars.</li>
        <li><b>Short rounds:</b> ${TASKS_PER_ROUND} tasks – ideal for 5–10 minutes of focused practice.</li>
      </ul>`
    : `
      <h2>👪 Für Eltern &amp; Lehrkräfte</h2>
      <div class="notice"><b>⚠️ Hinweis:</b> Diese App wurde mit Hilfe künstlicher Intelligenz (KI) erstellt und <b>kann Fehler enthalten</b>.
        Bitte begleiten Sie Ihr Kind beim Üben und melden Sie gefundene Fehler gerne über GitHub.</div>
      <h3>🐸 Zählen (Zahlenraum 0–20)</h3>
      <p>Nachfolger und Vorgänger, Zahlenreihen vorwärts und rückwärts ergänzen, Weiter- und Zurückzählen mit Frosch-Hüpfern auf dem Zahlenstrahl.
        Die Hüpfer bereiten das spätere Plus- und Minusrechnen vor.</p>
      <h3>🐊 Größer · kleiner</h3>
      <p>Stufe 1 vergleicht Mengen im Zehnerfeld (Punkte in Fünfergruppen), Stufe 2 Zahlen bis 20 und „größer/kleiner als …“,
        Stufe 3 führt die Zeichen &lt;, = und &gt; mit der bekannten Krokodil-Eselsbrücke ein.</p>
      <h3>🐝 Dazwischen</h3>
      <p>Vom Zahlenstrahl (bis 10) über Zahlen bis 20 hin zur Profi-Aufgabe, <i>alle</i> Zahlen zwischen zwei Zahlen zu finden.
        Bewusst sind die Grenzzahlen als Stolpersteine dabei – sie gehören nicht „dazwischen“.</p>
      <h3>🧠 Didaktisches Konzept</h3>
      <ul>
        <li><b>Vorlesen:</b> Alle Aufgaben werden vorgelesen (🔊 zum Wiederholen) – das Kind muss noch nicht flüssig lesen können.</li>
        <li><b>Lernen aus Fehlern:</b> Nach einem Fehler gibt es einen Tipp mit Zahlenstrahl, nach dem zweiten wird die Lösung erklärt. Es gibt keine Strafpunkte.</li>
        <li><b>Stufen:</b> Wer ${LEVEL_UP_AT} von ${TASKS_PER_ROUND} Aufgaben beim ersten Versuch löst, schaltet die nächste Stufe frei.</li>
        <li><b>Motivation:</b> Sterne für Aufgaben beim ersten Versuch, alle ${STARS_PER_STICKER} Sterne ein Sticker.</li>
        <li><b>Kurze Runden:</b> ${TASKS_PER_ROUND} Aufgaben – ideal für 5–10 Minuten konzentriertes Üben.</li>
      </ul>`;
  setScreen(`
    <section class="panel">
      ${body}
      <h3>⚙️ ${tx('Einstellungen', 'Settings')}</h3>
      <p>${tx('Gesammelte Sterne', 'Stars collected')}: <b>${state.stars}</b> · ${tx('Stufen', 'Levels')}:
        ${TOPIC_KEYS.map(k => `${topicName(k)} ${state.levels[k]}`).join(', ')}
        ${state.unlockAll ? `<br>🔓 ${tx('Zurzeit sind alle Stufen freigeschaltet.', 'All levels are currently unlocked.')}` : ''}</p>
      <h3>🗣️ ${tx('Vorlesestimme', 'Reading voice')}</h3>
      <div class="row voicerow">
        <select id="pVoice" class="voicesel" aria-label="${tx('Stimme wählen', 'Choose voice')}"></select>
        <button class="btn" id="pVoiceTest">▶️ ${tx('Probe hören', 'Listen')}</button>
      </div>
      <p class="voicetip">${tx(
        'Die App wählt automatisch die natürlichste Frauenstimme. Am schönsten klingen die kostenlosen „Natural“-Stimmen im Browser <b>Microsoft Edge</b> (z. B. Katja oder Seraphina) oder „Google Deutsch“ in Chrome.',
        'The app automatically picks the most natural female voice. The free “Natural” voices in <b>Microsoft Edge</b> (e.g. Sonia or Libby) or the Google voices in Chrome sound best.')}</p>
      <div class="row">
        <button class="btn" id="pSound">${state.sound ? tx('🔇 Ton &amp; Vorlesen aus', '🔇 Sound &amp; reading off') : tx('🔊 Ton &amp; Vorlesen an', '🔊 Sound &amp; reading on')}</button>
        <button class="btn" id="pLang">🌐 ${tx('English version', 'Deutsche Version')}</button>
        <button class="btn" id="pUnlock">${state.unlockAll
          ? `🔒 ${tx('Freischaltung aufheben', 'Lock levels again')}`
          : `🔓 ${tx('Alle Stufen freischalten', 'Unlock all levels')}`}</button>
        <button class="btn" id="pLevels">↩️ ${tx('Stufen auf Anfang setzen', 'Reset levels to 1')}</button>
        <button class="btn warn" id="pReset">🗑️ ${tx('Fortschritt zurücksetzen', 'Reset progress')}</button>
      </div>
      <p style="color:var(--muted);font-size:.9rem;margin-top:18px">
        ${tx('Der Fortschritt wird nur lokal in diesem Browser gespeichert. Es werden keine Daten übertragen.',
             'Progress is only stored locally in this browser. No data is sent anywhere.')}
        ${hasSpeech ? '' : `<br>${tx('Dieser Browser unterstützt leider kein Vorlesen.', 'Unfortunately this browser does not support reading aloud.')}`}</p>
      <p style="color:var(--muted);font-size:.9rem">BestSchool · Open Source (MIT) · ${tx('KI-generiert – kann Fehler enthalten.', 'AI-generated – may contain errors.')}</p>
    </section>`);
  fillVoiceSelect();
  if (hasSpeech) speechSynthesis.onvoiceschanged = fillVoiceSelect; // Stimmen laden teils verzögert
  $('#pVoice').onchange = e => {
    state.voices = { ...(state.voices || {}), [lang]: e.target.value || undefined };
    saveState(); sayVoiceSample();
  };
  $('#pVoiceTest').onclick = sayVoiceSample;
  $('#pSound').onclick = () => { state.sound = !state.sound; saveState(); updateHeader(); renderParents(); };
  $('#pLang').onclick = () => { setLang(lang === 'de' ? 'en' : 'de'); renderParents(); };
  // Umschalter: erspielte Stufen (state.levels) bleiben unverändert
  $('#pUnlock').onclick = () => { state.unlockAll = !state.unlockAll; saveState(); renderParents(); };
  // Nur die Stufen zurücksetzen – Sterne und Sticker bleiben
  $('#pLevels').onclick = () => {
    if (confirm(tx('Alle Themen wieder auf Stufe 1 setzen? Sterne und Sticker bleiben erhalten.',
                   'Set all topics back to level 1? Stars and stickers are kept.'))) {
      state.levels = defaultState().levels; state.unlockAll = false; saveState(); renderParents();
    }
  };
  $('#pReset').onclick = () => {
    if (confirm(tx('Wirklich alle Sterne, Sticker und Stufen zurücksetzen?', 'Really reset all stars, stickers and levels?'))) {
      const { sound, voices } = state;
      state = defaultState(); Object.assign(state, { sound, voices, lang });
      saveState(); updateHeader(); renderParents();
    }
  };
}

// Auswahlliste der Stimmen (beste zuerst, „automatisch“ ganz oben)
function fillVoiceSelect() {
  const sel = $('#pVoice'); if (!sel) return;
  const vs = langVoices();
  const chosen = state.voices && state.voices[lang];
  const best = vs[0];
  sel.innerHTML = `<option value="">${tx('Automatisch', 'Automatic')}${best ? ` (${esc(best.name)})` : ''}</option>`
    + vs.map(v => `<option value="${esc(v.name)}"${v.name === chosen ? ' selected' : ''}>${esc(v.name)}</option>`).join('');
  sel.disabled = !vs.length;
  if (!vs.length) sel.innerHTML = `<option>${tx('Keine Stimme gefunden', 'No voice found')}</option>`;
}
function sayVoiceSample() {
  if (!state.sound) { state.sound = true; saveState(); updateHeader(); }
  say(tx('Hallo! Ich bin Ole die Eule. Welche Zahl kommt nach der sieben? Super, das ist richtig!',
         'Hello! I am Ollie the Owl. What number comes after seven? Brilliant, that is right!'));
}

function setLang(l) {
  lang = l; state.lang = l; saveState();
  if (hasSpeech) speechSynthesis.cancel();
  // ?lang= aus der Adresse entfernen, damit die Wahl beim Neuladen gilt
  if (new URLSearchParams(location.search).has('lang')) {
    try { history.replaceState(null, '', location.pathname); } catch (e) { /* file:// */ }
  }
  applyLang();
}

/* ======================= Konfetti ======================= */
function confetti(n = 24) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#ffc93c', '#2fa866', '#3a86ff', '#ff8c42', '#e4572e', '#8e5cf7'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = pick(colors);
    c.style.animationDelay = Math.random() * 0.3 + 's';
    c.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2400);
  }
}

/* ======================= Start ======================= */
$('#btnHome').onclick = () => { sfx.tap(); renderHome(true); };
$('#btnSound').onclick = () => {
  state.sound = !state.sound; saveState(); updateHeader();
  if (!state.sound && hasSpeech) speechSynthesis.cancel();
  else sfx.tap();
};
$('#btnLang').onclick = () => { sfx.tap(); setLang(lang === 'de' ? 'en' : 'de'); renderHome(true); };
applyLang();
updateHeader();
renderHome(false);
