# BestSchool – Projektbeschreibung für die Weiterentwicklung

> ⚠️ Das Projekt ist KI-generiert und kann Fehler enthalten. Dieser Hinweis muss in der App, in der README und in der LICENSE erhalten bleiben.

Diese Datei erklärt, wie die App aufgebaut ist und wie man sie erweitert.
Für Nutzer (Eltern, Lehrkräfte) ist die [README.md](README.md) gedacht.

---

## 1. Ziel & Zielgruppe

- **Was:** Lern-App „BestSchool“ für Mathematik in der **1. Klasse**, Zahlenraum **0–20**.
- **Für wen:** Kinder (ca. 6–7 Jahre), die oft noch nicht flüssig lesen können. Begleitend: Eltern und Lehrkräfte.
- **Sprachen:** Deutsch (Standard) und Englisch.
- **Veröffentlichung:** Als GitHub-Repository zum Herunterladen (ZIP) und optional über GitHub Pages.
- **Grundsätze:**
  - läuft komplett offline im Browser, ohne Installation und ohne Server
  - keine externen Bibliotheken, Schriften oder Dienste, kein Tracking, keine Datenübertragung
  - kindgerecht: große Knöpfe, alles wird vorgelesen, keine Strafen, viel Lob
  - didaktisch sinnvoll: Anschauung (Zahlenstrahl, Zehnerfeld), Tipps vor der Lösung, Stufen mit steigender Schwierigkeit

## 2. Aktueller Stand (November 2026)

| Thema | Schlüssel | Stufe 1 | Stufe 2 | Stufe 3 |
|---|---|---|---|---|
| 🐸 Zählen | `count` | Nachfolger, Reihe mit 1 Lücke (bis 10), Frosch-Hüpfer 1–3 | Vorgänger/Nachfolger, Reihen vorwärts & rückwärts, Hüpfer 2–4 (bis 20) | Reihen mit 2 Lücken, Vorgänger, Hüpfer 3–6 |
| 🐊 Größer · kleiner | `compare` | 2 Zahlen mit Zehnerfeld-Punkten (bis 10) | 2 Zahlen, „größer/kleiner als X“ (bis 20) | Zeichen `< = >` (Krokodil), knappe Vergleiche |
| 🐝 Dazwischen | `between` | Zahl zwischen A und A+2 am Zahlenstrahl (bis 10) | A und A+2 (bis 20), „welche dieser Zahlen …“ | **alle** Zahlen zwischen A und B antippen |

Weitere Funktionen:

- **Bunte Mischung:** zufällige Aufgaben aus allen Themen, jeweils auf der *erspielten* Stufe.
- **Runden:** 8 Aufgaben. 6 davon beim ersten Versuch richtig → nächste Stufe wird freigeschaltet.
- **Fehler:** Beim 1. Fehler gibt es einen Tipp, oft mit Zahlenstrahl. Beim 2. Fehler wird die Lösung erklärt und gezeigt, danach geht es mit „Weiter“ zur nächsten Aufgabe.
- **Belohnung:** ⭐ für jede Aufgabe, die beim ersten Versuch stimmt. Alle 5 Sterne gibt es einen Sticker (18 Sticker im Album).
- **Eltern-Bereich:**
  - Ton & Vorlesen an/aus
  - Sprache wechseln
  - Vorlesestimme wählen und probehören
  - alle Stufen freischalten (umschaltbar)
  - Fortschritt zurücksetzen
- **Vorlesen:** Web Speech API. Die App wählt automatisch die natürlichste Frauenstimme des Geräts.

## 3. Dateien

**Online:** https://max-flex.github.io/bestschool/ (GitHub Pages aus dem Branch `main`, Repository `max-flex/bestschool`, öffentlich).
Veröffentlicht wird genauso wie bei der Getreide-App:
- GitHub-Konto `max-flex`
- Commits mit `max-flex@users.noreply.github.com`
- `.nojekyll`
- PWA

**Änderungen veröffentlichen:** Committen und `git push`. GitHub Pages aktualisiert sich nach 1–2 Minuten.
Weil der Ordner auf dem NAS liegt (`\\NASFOLIE\alle\…`), meldet Git „dubious ownership“. Deshalb Git-Befehle mit `git -c safe.directory=* …` ausführen.

```
index.html             Grundgerüst: Kopfzeile, <main id="screen">, Fußzeile mit KI-Hinweis
manifest.json          PWA-Manifest (Name, Icons, standalone)
service-worker.js      Offline-Fähigkeit: Netzwerk zuerst, sonst Zwischenspeicher. Bei Änderungen CACHE_NAME erhöhen
icons/                 App-Icons; neu erzeugen mit gen-icons.ps1
Start.bat, serve.ps1   Lokaler Start unter Windows (Port 8124, auch fürs Handy im WLAN)
.nojekyll              GitHub Pages ohne Jekyll-Verarbeitung
style.css              Gestaltung (CSS-Variablen, Animationen, Handy-Anpassungen)
app.js                 gesamte Logik: Aufgaben, Bildschirme, Speicher, Töne, Vorlesen, Übersetzungen
tests/aufgaben-test.js Prüft automatisch 360.000 Aufgaben (beide Sprachen) auf Korrektheit
README.md              Nutzer-Beschreibung (Deutsch + Englisch)
PROJEKT.md             diese Datei
LICENSE                MIT-Lizenz mit KI-Hinweis
```

Es gibt keinen Build-Schritt: Die Dateien werden so ausgeliefert, wie sie sind.

## 4. Aufbau von `app.js`

Die Datei ist in Abschnitte mit `/* ===== … ===== */` gegliedert, in dieser Reihenfolge:

1. **Helfer:** `$`, `$$`, `rand`, `pick`, `shuffle`, `range`, `clamp`, `esc` (HTML maskieren) und `strip` (HTML → reiner Text zum Vorlesen).
2. **Sprache:**
   - `lang` ist `'de'` oder `'en'`.
   - `tx(deutsch, englisch)` liefert den Text in der aktuellen Sprache. **Jeder sichtbare oder gesprochene Text läuft über `tx()`.**
3. **Einstellungen:**
   - Themen: `TOPIC_KEYS`, `TOPIC_STYLE`, `topicName()`, `topicDesc()`, `levelInfo()`
   - Konstanten: `TASKS_PER_ROUND`, `LEVEL_UP_AT`, `STARS_PER_STICKER`, `STICKERS`
   - Rückmeldungen: `praise()`, `encourage()`
4. **Speicherstand:** `localStorage` unter dem Schlüssel `bestschool.v1` (siehe Abschnitt 6).
5. **Töne & Vorlesen:**
   - `sfx` erzeugt Töne mit der WebAudio-API, es gibt keine Audiodateien.
   - `voiceScore()` bewertet Stimmen nach Name: natürlich, weiblich, kein Kind.
   - `findVoice()` nimmt die gespeicherte Wahl, sonst die beste Stimme.
   - `say(text)` liest vor.
6. **Bausteine:** HTML-Erzeuger für die Darstellung.
   - `lineHTML`: Zahlenstrahl
   - `seqHTML`: Zahlenreihe mit Lücken
   - `dotsHTML`: Zehnerfeld
   - `optsHTML`: Antwortknöpfe
   - `numOpts`: Antwortauswahl mit passenden Ablenkern
   - `win(x, y, max)`: wählt einen 11 Zahlen breiten Ausschnitt des Zahlenstrahls, der `x..y` sicher enthält.
7. **Aufgaben-Generatoren:** `GEN.count(level)`, `GEN.compare(level)` und `GEN.between(level)` liefern jeweils **ein Aufgabenobjekt** (Abschnitt 5).
8. **Bildschirme:**
   - Seiten: `renderHome`, `renderLevels`, `renderTask`, `finishRound`, `renderAlbum`, `renderParents`
   - Ablauf einer Aufgabe: `onOption` / `onCell` / `checkMulti` → `onCorrect` bzw. `onWrong` → `showHint` / `reveal` → `nextTask`
9. **Konfetti** und **Start** (Ereignisse der Kopfzeile, erstes Zeichnen).

Wichtig für Tests: Alles **vor** dem Abschnitt `/* ======================= Bildschirme` muss ohne DOM lauffähig bleiben. Der Test lädt genau diesen Teil.

## 5. Das Aufgabenobjekt

Jeder Generator gibt ein Objekt mit diesen Feldern zurück:

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `key` | ja | eindeutiger Schlüssel. Doppelte Aufgaben in einer Runde werden darüber vermieden |
| `mode` | ja | `'choice'`, `'seq'`, `'line'` oder `'multi'` (siehe unten) |
| `prompt` | ja | Aufgabentext (HTML, `<b>` hebt Wörter hervor) |
| `speak` | nein | eigener Vorlesetext, wenn `prompt` schlecht vorlesbar ist (z. B. bei `<` `>`) |
| `answer` | je nach Modus | richtige Antwort (Zahl, Zeichen oder bei `multi` ein Array) |
| `options` | `choice`, `seq` | Antwortknöpfe `[{ value, label }]` oder `[{ value, html }]` |
| `optClass` | nein | `'cards'` (große Karten) oder `'symbols'` (Zeichen) |
| `visual` | nein | zusätzliche Darstellung über den Antworten (HTML) |
| `fill` | nein | `{ sel, text }`: Nach dem Lösen wird das Element `sel` mit `text` gefüllt (z. B. das `?`) |
| `seq`, `gapIdx`, `gaps` | `seq` | Zahlenreihe, Positionen der Lücken, Werte der Lücken (in Reihenfolge) |
| `dirLabel` | nein | Hinweis über der Reihe, z. B. „vorwärts ➜ immer 1 mehr“ |
| `line` | `line`, `multi` | Zahlenstrahl-Ausschnitt `{ lo, hi, highlight, cont, frog }` |
| `hint` | ja | `{ text, line?, highlight? }`: Tipp nach dem 1. Fehler |
| `answerText` | ja | Erklärung der Lösung nach dem 2. Fehler (HTML) |

**Modi:**

- `choice`: Antwortknöpfe, genau eine Antwort ist richtig. Falsch gewählte Knöpfe werden ausgegraut.
- `seq`: Zahlenreihe mit 1 oder 2 Lücken. Die Lücken werden der Reihe nach über die Antwortknöpfe gefüllt.
- `line`: Das Kind tippt eine Zahl auf dem Zahlenstrahl an. Mit `line.frog` hüpft ein Frosch vom Start zur Lösung.
- `multi`: Das Kind wählt mehrere Zahlen auf dem Zahlenstrahl und bestätigt mit „Fertig“.

## 6. Speicherstand (`localStorage['bestschool.v1']`)

```js
{
  stars: 0,                                      // gesammelte Sterne → Sticker = floor(stars / 5)
  levels: { count: 1, compare: 1, between: 1 },  // vom Kind ERSPIELTE Stufen (1–3)
  unlockAll: false,                              // Eltern-Schalter: alle Stufen spielbar
  sound: true,                                   // Töne und Vorlesen
  lang: 'de' | 'en' | null,                      // null = Browsersprache
  voices: { de: 'Stimmenname', en: '…' }         // gewählte Stimme je Sprache (leer = automatisch)
}
```

- Spielbare Stufe = `maxLevel(k)`: das ist `3` bei `unlockAll`, sonst `levels[k]`.
- Die „Bunte Mischung“ und der Stufenaufstieg nutzen immer `levels` (den echten Lernstand).
- Neue Felder **immer** in `defaultState()` ergänzen. `loadState()` mischt alte Speicherstände mit den Standardwerten.
- Wenn sich das Format so ändert, dass alte Stände nicht mehr passen: Schlüssel auf `bestschool.v2` erhöhen und alte Daten umwandeln.
- **Umwandlung alter Stände:** Frühe Versionen hatten noch kein `unlockAll`. Dort hat „Alle Stufen freischalten“ `levels` direkt auf 3 gesetzt. `loadState()` erkennt das: Es fehlt `unlockAll` und alle Stufen stehen auf 3. Ein solcher Stand wird in `unlockAll: true` mit `levels` auf 1 umgewandelt.
- Im Eltern-Bereich setzt „Stufen auf Anfang setzen“ nur `levels` und `unlockAll` zurück. „Fortschritt zurücksetzen“ löscht zusätzlich die Sterne. Stimme und Sprache bleiben in beiden Fällen erhalten.

**Startsprache:** `?lang=en` bzw. `?lang=de` in der Adresse hat Vorrang vor der gespeicherten Wahl, die wiederum vor der Browsersprache gilt.

## 7. Gestaltung (`style.css`)

- Farben stehen als Variablen in `:root`.
- Jedes Thema hat eine Klasse, die `--c` setzt: `.t-count` grün, `.t-compare` blau, `.t-between` orange, `.t-mix` lila. Knöpfe, Hervorhebungen und Ränder nutzen `var(--c)`.
- Schrift: kindgerechte Systemschriften (Comic Neue / Comic Sans / Chalkboard), keine Web-Fonts.
- Anpassungen für kleine Bildschirme bei `max-width: 560px` und `420px`.
- Bei `prefers-reduced-motion` sind Animationen und Konfetti abgeschaltet.

## 8. Testen & lokal starten

```powershell
node tests/aufgaben-test.js
```

Prüft je Thema und Stufe 20.000 Zufallsaufgaben in beiden Sprachen:

- Die richtige Antwort ist genau einmal vorhanden.
- Keine Aufgabe ist mehrdeutig.
- Alle Zahlen liegen im Zahlenraum.
- Zahlenstrahl-Ausschnitte enthalten alle nötigen Zahlen.

Bei Fehlern endet der Test mit Exit-Code 1.

App ansehen: `index.html` per Doppelklick öffnen oder einen lokalen Server starten:

```powershell
python -m http.server 8765
```

Danach `http://localhost:8765/` öffnen (`?lang=en` für Englisch).

**Nach jeder Änderung:**
1. Test laufen lassen.
2. In beiden Sprachen und in Handy-Größe im Browser durchklicken.
3. In `index.html` die Versionsnummer an `style.css?v=…` und `app.js?v=…` erhöhen und in `service-worker.js` den `CACHE_NAME`. Sonst zeigen Browser (z. B. bei GitHub Pages) eventuell noch die alte Version aus dem Zwischenspeicher.

## 9. So erweitert man die App

### Neue Aufgabenart in einem bestehenden Thema
1. Im passenden Generator (z. B. `GEN.count`) einen neuen Typ in die `pick({...}[level])`-Liste der gewünschten Stufen aufnehmen.
2. Einen Zweig schreiben, der ein Aufgabenobjekt (Abschnitt 5) zurückgibt. Alle Texte kommen über `tx('…', '…')`.
3. Auf Mehrdeutigkeit achten: Unter den Antwortknöpfen darf nur **eine** Antwort richtig sein.
4. Eine passende Prüfung in `tests/aufgaben-test.js` ergänzen.

### Neues Thema (z. B. „Plus bis 10“)
1. Den Schlüssel in `TOPIC_KEYS` eintragen, Icon und Farbklasse in `TOPIC_STYLE`.
2. Texte ergänzen: `topicName`, `topicDesc`, `levelInfo`.
3. `GEN.<schlüssel>(level)` schreiben.
4. In `defaultState().levels` den Startwert `1` eintragen.
5. In `style.css` eine Klasse `.t-<schlüssel> { --c: … }` anlegen.
6. Die Schleife in `tests/aufgaben-test.js` um das Thema erweitern.
7. Eltern-Bereich (`renderParents`, beide Sprachen) und README beschreiben.

### Neue Sprache
1. Den Sprachcode in `LANGS` und `VOICE_LANG` eintragen.
2. `tx()` braucht dann mehr als zwei Sprachen. Am einfachsten wird es auf ein Objekt umgestellt: `tx({ de: '…', en: '…', fr: '…' })`.
3. Den Sprachknopf (`applyLang`, `setLang`) von einem Umschalter zu einer Auswahl erweitern.
4. Die Namenslisten `FEMALE` / `MALE` in der Stimmenauswahl um typische Stimmennamen der neuen Sprache ergänzen.

## 10. Bekannte Grenzen

- **Stimmen:** Die Vorlesestimme hängt vom Gerät ab.
  - Am natürlichsten klingen die „Natural“-Stimmen in Microsoft Edge. Sie brauchen Internet.
  - Firefox unter Windows hat oft nur die einfachen Windows-Stimmen.
  - Ohne deutsche Stimme liest der Browser mit einer anderen Stimme oder gar nicht vor.
- **Stimmen-Erkennung:** Ob eine Stimme weiblich ist, wird nur am Namen erkannt (Listen `FEMALE`, `MALE`, `CHILD` in `app.js`). Unbekannte Namen bekommen keinen Bonus.
- **Speicherort:** Der Fortschritt hängt am Browser und Gerät. Es gibt keine Konten und keine Synchronisierung.
- **Runde abbrechen:** Wer während einer Runde auf 🏠 tippt, verliert diese Runde. Bereits verdiente Sterne bleiben.
- **Sprachwechsel:** Ein Wechsel führt zur Startseite. Eine laufende Runde wird nicht übersetzt.

## 11. Ideen für später

- Zahlenraum bis 100; Plus und Minus bis 10/20 (die Frosch-Hüpfer sind schon die Vorstufe)
- Zahlzerlegung, Verdoppeln/Halbieren, Mengen schätzen
- ~~Installierbar und offline (PWA)~~ erledigt am 2026-11-25
- Mehrere Kinder-Profile auf einem Gerät
- Lehrkraft-Übersicht: welche Aufgabenarten oft falsch sind
- Vorgefertigte Audiodateien mit einer festen, natürlichen Stimme. Das ist aufwendig, weil die Aufgaben zufällig erzeugt werden: Man müsste sie aus Satzbausteinen zusammensetzen.
- Weitere Sprachen (siehe Abschnitt 9)

## 12. Entscheidungen

| Entscheidung | Grund |
|---|---|
| Reines HTML/CSS/JS ohne Framework | Läuft per Doppelklick, funktioniert dauerhaft ohne Updates und ist leicht zu verstehen |
| Aufgaben werden zufällig erzeugt, nicht fest hinterlegt | Unendlich viele Aufgaben, kein Auswendiglernen |
| Antworten zum Antippen statt Eintippen | Erstklässler tippen Zahlen noch unsicher; Tippen ist schneller und motivierender |
| Zahlenstrahl als Ausschnitt mit 11 Zahlen | 21 Zahlen wären auf Handys zu klein |
| Sterne nur für den ersten Versuch | Belohnt genaues Hinschauen statt Raten; Fehler werden trotzdem nicht bestraft |
| „Alle Stufen freischalten“ als Schalter (`unlockAll`) | Eltern können es wieder rückgängig machen, der echte Lernstand bleibt erhalten |
| Grenzzahlen als Ablenker bei „Dazwischen“ | Typischer Denkfehler von Kindern, der gezielt geübt werden soll |
