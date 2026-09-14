type BarcodeDetectorLike = {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorLike;

type ScannerCallbacks = {
  onReady: () => void;
  onScan: (value: string) => void;
  onError: (error: unknown) => void;
};

/** Each opening owns its camera and cancellation state, including pending permission requests. */
export function startQrScanner(
  video: HTMLVideoElement,
  { onReady, onScan, onError }: ScannerCallbacks,
): () => void {
  let active = true;
  let stream: MediaStream | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    active = false;
    clearTimeout(timer);
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.pause();
    video.srcObject = null;
  };

  const start = async () => {
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (!active) {
        acquired.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = acquired;
      video.srcObject = acquired;
      await video.play();
      if (!active) return;
      const decode = (await import("jsqr")).default;
      if (!active) return;
      const Detector = (
        window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
      ).BarcodeDetector;
      let detector: BarcodeDetectorLike | null = null;
      try {
        if (Detector) detector = new Detector({ formats: ["qr_code"] });
      } catch {
        // Some browsers expose the API without supporting QR codes.
      }
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Camera frame decoding is unavailable");
      onReady();

      const scan = async () => {
        if (!active) return;
        let value: string | undefined;
        if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
          if (detector) {
            try {
              value = (await detector.detect(video))[0]?.rawValue;
            } catch {
              detector = null;
            }
          }
          if (!active) return;
          if (!value) {
            try {
              const ratio = Math.min(
                1,
                1280 / Math.max(video.videoWidth, video.videoHeight),
              );
              canvas.width = Math.round(video.videoWidth * ratio);
              canvas.height = Math.round(video.videoHeight * ratio);
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const pixels = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
              );
              value = decode(pixels.data, pixels.width, pixels.height, {
                inversionAttempts: "attemptBoth",
              })?.data;
            } catch {
              // A camera frame may be temporarily unavailable during orientation changes.
            }
          }
        }
        if (!active) return;
        if (value) {
          stop();
          onScan(value);
          return;
        }
        // Avoid decoding on every animation frame and blocking the close button.
        timer = setTimeout(() => void scan(), 150);
      };
      void scan();
    } catch (error) {
      if (!active) return;
      stop();
      onError(error);
    }
  };
  void start();
  return stop;
}
