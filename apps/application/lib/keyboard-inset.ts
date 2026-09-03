const KEYBOARD_OPEN_THRESHOLD_PX = 80;

type KeyboardInsetListener = (height: number) => void;

const listeners = new Set<KeyboardInsetListener>();

let currentInset = 0;
let pluginHeight = 0;
let started = false;

function isEditableTarget(el: EventTarget | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) {
    return false;
  }

  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }

  return el.isContentEditable;
}

function notify(height: number) {
  currentInset = height;
  for (const listener of listeners) {
    listener(height);
  }
}

export function getKeyboardInset() {
  return currentInset;
}

export function subscribeKeyboardInset(listener: KeyboardInsetListener) {
  listeners.add(listener);
  listener(currentInset);

  return () => {
    listeners.delete(listener);
  };
}

export function applyKeyboardInset(height: number) {
  const inset = Math.max(0, Math.round(height));
  const root = document.documentElement;
  root.style.setProperty("--keyboard-inset", `${inset}px`);

  if (inset >= KEYBOARD_OPEN_THRESHOLD_PX) {
    root.setAttribute("data-keyboard-open", "");
  } else {
    root.removeAttribute("data-keyboard-open");
  }

  notify(inset);
}

export function scrollFocusedFieldIntoView() {
  const el = document.activeElement;
  if (!isEditableTarget(el)) {
    return;
  }

  const target = el.closest(".input-otp") ?? el;

  window.requestAnimationFrame(() => {
    target.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  });
}

function visualViewportInset() {
  const viewport = window.visualViewport;
  if (!viewport) {
    return 0;
  }

  return Math.max(
    0,
    document.documentElement.clientHeight -
      viewport.height -
      viewport.offsetTop,
  );
}

function syncInset() {
  const visualInset = visualViewportInset();
  const inset =
    visualInset >= KEYBOARD_OPEN_THRESHOLD_PX ? visualInset : pluginHeight;
  applyKeyboardInset(inset);

  if (inset >= KEYBOARD_OPEN_THRESHOLD_PX) {
    scrollFocusedFieldIntoView();
  }
}

export function startKeyboardInsets() {
  if (started) {
    return () => undefined;
  }

  started = true;
  syncInset();

  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", syncInset);
  viewport?.addEventListener("scroll", syncInset);
  window.addEventListener("focusin", scrollFocusedFieldIntoView);

  return () => {
    started = false;
    pluginHeight = 0;
    viewport?.removeEventListener("resize", syncInset);
    viewport?.removeEventListener("scroll", syncInset);
    window.removeEventListener("focusin", scrollFocusedFieldIntoView);
    applyKeyboardInset(0);
  };
}

export function setPluginKeyboardHeight(height: number) {
  pluginHeight = Math.max(0, Math.round(height));
  syncInset();
}
