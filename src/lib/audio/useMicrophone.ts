// src/lib/audio/useMicrophone.ts
// WHAT: mic capture + a real-time analyser. Produces (a) 28 bar levels for the
//       waveform, (b) an ambient-RMS reading for "Auto" environment sensing,
//       (c) a rolling PCM buffer for the fingerprint engine to query.
// WHY:  the environment presets are a UX claim; sensing the room's noise floor is
//       what makes "Auto" honest. Same analyser feeds the waveform, so the visual
//       is finally reacting to the room instead of Math.random().
// HOW:  Web Audio API — MediaStreamSource → AnalyserNode (levels) → ScriptProcessor
//       (PCM tap). AudioWorklet would be cleaner; ScriptProcessor is used here because
//       it works in Safari without a separate worklet file. Swap when Olaf is wired.
import type { Environment } from "../types";

export interface MicrophoneHandle {
  takeBuffer(): Float32Array;   // last ~3 s of mono PCM at `sampleRate`
  sampleRate: number;           // the AudioContext rate (44.1 or 48 kHz on iPhone)
  close(): void;
}

interface Options {
  bars?: number;
  onLevels?: (levels: number[]) => void;
  onAmbient?: (rms: number) => void;
}

export async function openMicrophone({ bars = 28, onLevels, onAmbient }: Options): Promise<MicrophoneHandle> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error("Microphone not supported in this browser"), { code: "unsupported" });
  }
  let stream: MediaStream;
  try {
    // echoCancellation/noiseSuppression OFF: fingerprinting wants the raw room,
    // and Shazam-style matching is robust to noise by design.
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch {
    throw Object.assign(new Error("Microphone permission denied"), { code: "mic-denied" });
  }

  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;                       // 128 frequency bins → grouped into `bars`
  analyser.smoothingTimeConstant = 0.7;
  source.connect(analyser);

  // Rolling PCM ring buffer (3 s) for the recognizer.
  const RING_SECONDS = 3;
  const ring = new Float32Array(ctx.sampleRate * RING_SECONDS);
  let write = 0;
  const tap = ctx.createScriptProcessor(2048, 1, 1);
  tap.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    for (let i = 0; i < input.length; i++) { ring[write] = input[i]; write = (write + 1) % ring.length; }
    // RMS of this block = ambient loudness; caller maps it to a preset.
    let sum = 0;
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
    onAmbient?.(Math.sqrt(sum / input.length));
  };
  analyser.connect(tap);
  tap.connect(ctx.destination); // required for onaudioprocess to fire; tap outputs silence

  const freq = new Uint8Array(analyser.frequencyBinCount);
  let raf = 0;
  const tick = () => {
    analyser.getByteFrequencyData(freq);
    const per = Math.floor(freq.length / bars);
    const levels = Array.from({ length: bars }, (_, b) => {
      let acc = 0;
      for (let i = 0; i < per; i++) acc += freq[b * per + i];
      return Math.max(0.06, acc / per / 255);   // floor keeps bars visible in silence
    });
    onLevels?.(levels);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    sampleRate: ctx.sampleRate,
    takeBuffer() {
      // Unroll the ring so index 0 is the oldest sample.
      const out = new Float32Array(ring.length);
      out.set(ring.subarray(write));
      out.set(ring.subarray(0, write), ring.length - write);
      return out;
    },
    close() {
      cancelAnimationFrame(raf);
      tap.disconnect(); analyser.disconnect(); source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}

/** Map a noise floor to the nearest preset. Thresholds are a first guess — tune with
 *  real readings from a bar and a mall; log `rms` in the console during a test walk. */
export function suggestEnvironment(rms: number): Environment {
  if (rms < 0.02) return "faint";
  if (rms < 0.08) return "mall";
  return "bar";
}
