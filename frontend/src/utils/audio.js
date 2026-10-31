/**
 * Web Audio API & Haptics Feedback for Barcode Scanning
 * No external audio files needed - generates clean beep and haptic pulse in-memory.
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && (typeof window !== 'undefined')) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a clean 80ms beep tone at 1100Hz (perfect for cashier/scanner feedback)
 */
export function playScanBeep(frequency = 1100, durationMs = 80) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Smooth envelope to prevent audio popping
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (err) {
    // Graceful fallback for restricted autoplay policies
    console.warn('Scan beep audio unavailable:', err.message);
  }
}

/**
 * Triggers short haptic pulse (80ms) on supported mobile devices
 */
export function triggerHaptic(durationMs = 80) {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(durationMs);
    }
  } catch (err) {
    // Ignore unsupported devices
  }
}

/**
 * Combined scanner feedback: Audio beep + Haptic vibration
 */
export function notifyScanSuccess() {
  playScanBeep(1150, 80);
  triggerHaptic(80);
}
