export const TOUCH_GESTURE_CLASS =
  "select-none [-webkit-touch-callout:none]";

export function capturePointer(element: Element, pointerId: number) {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Pointer capture is best-effort on WebKit and touch devices.
  }
}

export function releasePointer(element: Element, pointerId: number) {
  try {
    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  } catch {
    // The browser may already have released a cancelled pointer.
  }
}
