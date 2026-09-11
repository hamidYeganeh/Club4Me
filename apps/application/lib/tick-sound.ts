const DURATION = 0.016;
const MASTER_GAIN = 0.04;

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext
  );
}

let context: AudioContext | null = null;
let gain: GainNode | null = null;
let buffer: AudioBuffer | null = null;
let consumers = 0;

function prepareContext() {
  if (!context) {
    const Constructor = getAudioContextConstructor();
    if (!Constructor) return;
    context = new Constructor();
    gain = context.createGain();
    gain.gain.value = MASTER_GAIN;
    gain.connect(context.destination);
    const length = Math.ceil(DURATION * context.sampleRate);
    buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      const time = index / context.sampleRate;
      data[index] =
        Math.sin(2 * Math.PI * 980 * time) * Math.exp(-time / 0.0038) *
        Math.min(1, time / 0.00012) *
        Math.min(1, (DURATION - time) / 0.001);
    }
  }
  if (context.state === "suspended") {
    void context.resume().catch(() => undefined);
  }
}

export function createTickPlayer() {
  consumers += 1;
  let disposed = false;
  let activeSource: AudioBufferSourceNode | null = null;

  return {
    prepare: prepareContext,
    play() {
      if (disposed) return;
      prepareContext();
      if (!context || !gain || !buffer) return;
      activeSource?.stop();
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.onended = () => source.disconnect();
      activeSource = source;
      source.start();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      activeSource?.stop();
      consumers = Math.max(0, consumers - 1);
      if (consumers === 0 && context) {
        void context.close();
        context = null;
        gain = null;
        buffer = null;
      }
    },
  };
}
