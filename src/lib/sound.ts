// Efeitos sonoros gerados via Web Audio — sem ficheiros de áudio.
// Tudo falha em silêncio (sem AudioContext, com som desligado ou sem
// gesto do utilizador, o jogo continua mudo sem erros).

const MUTE_STORAGE_KEY = 'quinta-magnifica.muted';

let audioCtx: AudioContext | null = null;
let gestureSeen = false;

if (typeof window !== 'undefined') {
  try {
    const markGesture = () => { gestureSeen = true; };
    window.addEventListener('pointerdown', markGesture, { once: true });
    window.addEventListener('keydown', markGesture, { once: true });
  } catch {
    // Sem listeners, sem problema: vale a User Activation API.
  }
}

/** Verdadeiro só após interação do utilizador (evita o aviso de autoplay). */
function hasUserGesture(): boolean {
  if (gestureSeen) return true;
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const activation = (nav as unknown as { userActivation?: { hasBeenActive?: boolean } } | undefined)?.userActivation;
    return activation?.hasBeenActive === true;
  } catch {
    return false;
  }
}

export function isSoundMuted(): boolean {
  try {
    return globalThis.localStorage?.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  try {
    globalThis.localStorage?.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // Ignorar: o jogo continua com a preferência em memória.
  }
}

function audioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined' || !hasUserGesture()) return null;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

interface Note {
  f: number;
  at: number;
  dur: number;
  /** Pico do volume (0–1). Por omissão 0.18; sons subtis usam menos. */
  g?: number;
}

function playMelody(notes: Note[]): void {
  if (isSoundMuted()) return;
  const ctx = audioContext();
  if (!ctx) return;
  try {
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = note.f;
      const peak = note.g ?? 0.18;
      const start = ctx.currentTime + note.at;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + note.dur + 0.05);
    }
  } catch {
    // Sem som, sem problema.
  }
}

export function playHarvestSound(): void {
  playMelody([
    { f: 523.25, at: 0, dur: 0.12 },
    { f: 659.25, at: 0.09, dur: 0.12 },
    { f: 783.99, at: 0.18, dur: 0.2 },
  ]);
}

export function playLevelUpSound(): void {
  playMelody([
    { f: 392.0, at: 0, dur: 0.15 },
    { f: 523.25, at: 0.12, dur: 0.15 },
    { f: 659.25, at: 0.24, dur: 0.15 },
    { f: 783.99, at: 0.36, dur: 0.35 },
  ]);
}

export function playCoinSound(): void {
  playMelody([
    { f: 987.77, at: 0, dur: 0.08 },
    { f: 1318.51, at: 0.07, dur: 0.18 },
  ]);
}

export function playPlantSound(): void {
  playMelody([
    { f: 196.0, at: 0, dur: 0.12 },
    { f: 261.63, at: 0.08, dur: 0.15 },
  ]);
}

export function playCollectSound(): void {
  playMelody([
    { f: 659.25, at: 0, dur: 0.09 },
    { f: 880.0, at: 0.07, dur: 0.14 },
  ]);
}

export function playCraftSound(): void {
  playMelody([
    { f: 880.0, at: 0, dur: 0.12 },
    { f: 1174.66, at: 0.1, dur: 0.22 },
  ]);
}

export function playCatchSound(): void {
  playMelody([
    { f: 698.46, at: 0, dur: 0.08 },
    { f: 1046.5, at: 0.06, dur: 0.12 },
    { f: 1396.91, at: 0.12, dur: 0.16 },
  ]);
}

export function playMissSound(): void {
  playMelody([
    { f: 220.0, at: 0, dur: 0.1, g: 0.08 },
  ]);
}

export function playUpgradeSound(): void {
  playMelody([
    { f: 440.0, at: 0, dur: 0.1 },
    { f: 554.37, at: 0.08, dur: 0.1 },
    { f: 659.25, at: 0.16, dur: 0.18 },
  ]);
}

export function playBuySound(): void {
  playMelody([
    { f: 880.0, at: 0, dur: 0.07 },
    { f: 659.25, at: 0.06, dur: 0.12 },
  ]);
}

export function playWaterSound(): void {
  playMelody([
    { f: 1174.66, at: 0, dur: 0.06, g: 0.12 },
    { f: 1567.98, at: 0.05, dur: 0.1, g: 0.12 },
  ]);
}

export function playContractSound(): void {
  playMelody([
    { f: 783.99, at: 0, dur: 0.12 },
    { f: 1046.5, at: 0.1, dur: 0.2 },
  ]);
}
