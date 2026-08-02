// Joue un petit carillon à deux notes pour signaler une nouvelle
// notification. Généré en pur Web Audio API : aucun fichier audio à
// héberger, aucun chargement réseau, aucune latence.
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

function tone(
  audioCtx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  gainPeak = 0.18,
) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, audioCtx.currentTime + start);
  gain.gain.linearRampToValueAtTime(gainPeak, audioCtx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + start);
  osc.stop(audioCtx.currentTime + start + duration + 0.05);
}

/** Joue le carillon de notification MSN Tracker (deux notes montantes). */
export function playNotificationChime() {
  try {
    const audioCtx = getContext();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    tone(audioCtx, 880, 0, 0.18); // La5
    tone(audioCtx, 1318.5, 0.12, 0.22); // Mi6
  } catch {
    // Lecture audio bloquée par le navigateur (pas d'interaction
    // utilisateur préalable) — on ignore silencieusement.
  }
}
