"""Erzeugt die Sprachaufnahmen für BestSchool mit Piper (Stimme: Kerstin, Lizenz CC0).

Ablauf:
  1. node tools/audio/sammle-saetze.js            → tools/audio/saetze-de.json
  2. python tools/audio/erzeuge-aufnahmen.py <ordner-mit-stimmmodell>
                                                   → audio/de/*.mp3 + audio/de/index.json

Nur neue oder geänderte Sätze werden erzeugt; nicht mehr benutzte Dateien werden gelöscht.
Benötigt: pip install piper-tts soundfile  und das Modell de_DE-kerstin-low.onnx (+ .onnx.json)
"""
import hashlib, io, json, sys, unicodedata
from pathlib import Path

import numpy as np
import soundfile as sf
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "audio" / "de"
MODEL = "de_DE-kerstin-low.onnx"
LENGTH_SCALE = 1.08      # etwas langsamer als normal – angenehm für Kinder
MP3_QUALITY = 0.95       # libsndfile compression_level (0 = beste Qualität … <1); 0.95 ≈ 26 kbit/s, für Sprache ausreichend


def synth(voice, text: str, cfg) -> np.ndarray:
    """Text → 16-bit-Samples. Wie voice.synthesize(), aber mit Korrektur der Lautschrift:
    espeak liefert das „ch“ in „ich“ als c + U+0327 (zerlegt); das Kerstin-Modell kennt nur das
    zusammengesetzte „ç“. Ohne NFC-Normalisierung klingt „ich“ wie „ik“."""
    parts = []
    gap = np.zeros(int(voice.config.sample_rate * 0.25), dtype=np.float32)
    for phonemes in voice.phonemize(text):
        if not phonemes:
            continue
        fixed = list(unicodedata.normalize("NFC", "".join(phonemes)))
        audio = voice.phoneme_ids_to_audio(voice.phonemes_to_ids(fixed), cfg)
        m = float(np.max(np.abs(audio))) or 1.0
        parts += [audio / m * 0.95, gap]
    if not parts:
        return np.zeros(0, dtype=np.int16)
    return (np.concatenate(parts[:-1]) * 32767).astype(np.int16)


def sentence_id(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


def trim(samples: np.ndarray, sr: int, keep_ms: int = 60) -> np.ndarray:
    """Stille am Anfang und Ende kürzen (auf keep_ms), damit Sätze flüssig aufeinander folgen."""
    thr = max(250, int(np.abs(samples).max() * 0.02))
    idx = np.where(np.abs(samples) > thr)[0]
    if len(idx) == 0:
        return samples
    pad = int(sr * keep_ms / 1000)
    return samples[max(0, idx[0] - pad): min(len(samples), idx[-1] + pad)]


def main() -> None:
    voice_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None   # nur zum Testen: Anzahl begrenzen
    sentences = json.loads((ROOT / "tools" / "audio" / "saetze-de.json").read_text(encoding="utf-8"))
    if limit:
        sentences = sentences[:limit]
    OUT.mkdir(parents=True, exist_ok=True)
    voice = PiperVoice.load(str(voice_dir / MODEL))
    cfg = SynthesisConfig(length_scale=LENGTH_SCALE)

    index, made, total_bytes, total_sec = {}, 0, 0, 0.0
    for i, text in enumerate(sentences, 1):
        sid = sentence_id(text)
        index[text] = sid
        f = OUT / f"{sid}.mp3"
        if not f.exists():
            sr = voice.config.sample_rate
            s = trim(synth(voice, text, cfg), sr)
            mp3 = io.BytesIO()
            sf.write(mp3, s, sr, format="MP3", compression_level=MP3_QUALITY)
            f.write_bytes(mp3.getvalue())
            made += 1
            total_sec += len(s) / sr
        total_bytes += f.stat().st_size
        if i % 250 == 0:
            print(f"  {i}/{len(sentences)} …", flush=True)

    # Nicht mehr benutzte Aufnahmen entfernen (nur bei vollem Lauf)
    removed = 0
    if not limit:
        used = set(index.values())
        for f in OUT.glob("*.mp3"):
            if f.stem not in used:
                f.unlink(); removed += 1

    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(index)} Sätze · {made} neu erzeugt ({total_sec:.0f} s Sprache) · {removed} entfernt · "
          f"{total_bytes / 1024 / 1024:.1f} MB gesamt")


if __name__ == "__main__":
    main()
