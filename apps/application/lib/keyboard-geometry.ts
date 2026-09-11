/** Native resize already removes part (usually all) of the keyboard from the WebView. */
export function keyboardGeometry({
  layoutHeight,
  viewportHeight,
  viewportOffsetTop,
  baselineHeight,
  pluginHeight,
  editable,
  scale = 1,
}: {
  layoutHeight: number;
  viewportHeight: number;
  viewportOffsetTop: number;
  baselineHeight: number;
  pluginHeight: number;
  editable: boolean;
  scale?: number;
}) {
  const resizedBy = Math.max(0, baselineHeight - layoutHeight);
  // Pinch zoom also shrinks visualViewport; it must not be treated as a keyboard.
  const visualInset =
    Math.abs(scale - 1) < 0.05 && editable
      ? Math.max(0, layoutHeight - viewportHeight - viewportOffsetTop)
      : 0;
  const overlay = Math.max(visualInset, pluginHeight - resizedBy, 0);
  const height = Math.max(pluginHeight, editable ? resizedBy : 0, visualInset);
  return {
    height: height >= 80 ? Math.round(height) : 0,
    inset: height >= 80 ? Math.round(overlay) : 0,
  };
}
