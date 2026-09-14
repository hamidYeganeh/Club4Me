import assert from "node:assert/strict";
import { test } from "node:test";
import QRCode from "qrcode";
import { startQrScanner } from "../../lib/qr-scanner";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function setup(Detector?: unknown) {
  let stopped = 0;
  const stream = {
    getTracks: () => [
      {
        stop: () => {
          stopped++;
        },
      },
    ],
  } as unknown as MediaStream;
  const video = {
    srcObject: null,
    play: async () => {},
    pause: () => {},
    readyState: 2,
    videoWidth: 400,
    videoHeight: 400,
  } as unknown as HTMLVideoElement;
  const qr = QRCode.create("gym4me-test-qr").modules;
  const size = (qr.size + 8) * 8;
  const pixels = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const row = Math.floor(y / 8) - 4;
      const col = Math.floor(x / 8) - 4;
      // Inverted QR verifies the software decoder's inversion fallback too.
      const color =
        row >= 0 &&
        col >= 0 &&
        row < qr.size &&
        col < qr.size &&
        qr.get(row, col)
          ? 255
          : 0;
      const offset = (y * size + x) * 4;
      pixels.set([color, color, color, 255], offset);
    }
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { mediaDevices: { getUserMedia: async () => stream } },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { BarcodeDetector: Detector },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => ({
        getContext: () => ({
          drawImage: () => {},
          getImageData: () => ({ data: pixels, width: size, height: size }),
        }),
      }),
    },
  });
  return { stream, video, stopped: () => stopped };
}

for (const mode of ["missing", "constructor-fails", "detect-fails"] as const) {
  test(`software decoding works when native detector is ${mode}`, async () => {
    const Detector =
      mode === "missing"
        ? undefined
        : class {
            constructor() {
              if (mode === "constructor-fails") throw new Error("unsupported");
            }
            async detect() {
              throw new Error("unsupported");
            }
          };
    const env = setup(Detector);
    const result = deferred<string>();
    const stop = startQrScanner(env.video, {
      onReady() {},
      onScan: result.resolve,
      onError: (error) => {
        throw error;
      },
    });
    try {
      assert.equal(await result.promise, "gym4me-test-qr");
      assert.equal(env.stopped(), 1);
      assert.equal(env.video.srcObject, null);
    } finally {
      stop();
    }
  });
}

test("closing during camera permission stops the late stream without decoding", async () => {
  const env = setup();
  const permission = deferred<MediaStream>();
  navigator.mediaDevices.getUserMedia = () => permission.promise;
  let calls = 0;
  const stop = startQrScanner(env.video, {
    onReady: () => calls++,
    onScan: () => calls++,
    onError: () => calls++,
  });
  stop();
  permission.resolve(env.stream);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(env.stopped(), 1);
  assert.equal(calls, 0);
  assert.equal(env.video.srcObject, null);
});

test("closing during detection ignores late results and releases the camera", async () => {
  const detection = deferred<Array<{ rawValue: string }>>();
  const detecting = deferred<void>();
  const env = setup(
    class {
      detect() {
        detecting.resolve();
        return detection.promise;
      }
    },
  );
  let scans = 0;
  const stop = startQrScanner(env.video, {
    onReady() {},
    onScan: () => scans++,
    onError: (error) => {
      throw error;
    },
  });
  await detecting.promise;
  stop();
  detection.resolve([{ rawValue: "late-result" }]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(scans, 0);
  assert.equal(env.stopped(), 1);
  assert.equal(env.video.srcObject, null);
});

test("playback failure releases the acquired camera", async () => {
  const env = setup();
  env.video.play = async () => {
    throw new Error("playback failed");
  };
  const failed = deferred<unknown>();
  startQrScanner(env.video, {
    onReady() {},
    onScan() {
      assert.fail("unexpected scan");
    },
    onError: failed.resolve,
  });
  assert.match(String(await failed.promise), /playback failed/);
  assert.equal(env.stopped(), 1);
  assert.equal(env.video.srcObject, null);
});
