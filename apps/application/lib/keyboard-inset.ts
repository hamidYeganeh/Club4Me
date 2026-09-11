import { keyboardGeometry } from "./keyboard-geometry";

const KEYBOARD_OPEN_THRESHOLD_PX = 80;

type KeyboardInsetListener = (height: number) => void;

const listeners = new Set<KeyboardInsetListener>();

let currentInset = 0;
let pluginHeight = 0;
let started = false;
let baselineHeight = 0;

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

export function applyKeyboardInset(height: number, overlay = height) {
  const inset = Math.max(0, Math.round(overlay));
  const root = document.documentElement;
  root.style.setProperty("--keyboard-inset", `${inset}px`);

  if (height >= KEYBOARD_OPEN_THRESHOLD_PX) {
    root.setAttribute("data-keyboard-open", "");
  } else {
    root.removeAttribute("data-keyboard-open");
  }

  notify(height);
}

export function scrollFocusedFieldIntoView() {
  const el = document.activeElement;
  if (!isEditableTarget(el)) {
    return;
  }

  const target = el.closest(".input-otp") ?? el;
  const bounds = target.getBoundingClientRect();
  const viewport = window.visualViewport;
  const top = viewport?.offsetTop ?? 0;
  const bottom = top + (viewport?.height ?? window.innerHeight);
  if (bounds.top >= top + 24 && bounds.bottom <= bottom - 24) return;

  window.requestAnimationFrame(() => {
    target.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "instant",
    });
  });
}

function syncInset() {
  const layoutHeight = document.documentElement.clientHeight;
  const editable = isEditableTarget(document.activeElement);
  if (!editable && pluginHeight === 0 && currentInset === 0)
    baselineHeight = layoutHeight;
  const viewport = window.visualViewport;
  const geometry = keyboardGeometry({
    layoutHeight,
    baselineHeight,
    pluginHeight,
    editable,
    viewportHeight: viewport?.height ?? layoutHeight,
    viewportOffsetTop: viewport?.offsetTop ?? 0,
    scale: viewport?.scale ?? 1,
  });
  applyKeyboardInset(geometry.height, geometry.inset);
  if (geometry.height >= KEYBOARD_OPEN_THRESHOLD_PX)
    scrollFocusedFieldIntoView();
}

function onFocus() {
  if (currentInset === 0 && pluginHeight === 0)
    baselineHeight = document.documentElement.clientHeight;
  syncInset();
  scrollFocusedFieldIntoView();
}

export function startKeyboardInsets() {
  if (started) {
    return () => undefined;
  }

  started = true;
  baselineHeight = document.documentElement.clientHeight;
  syncInset();

  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", syncInset);
  window.addEventListener("resize", syncInset);
  window.addEventListener("focusin", onFocus);
  window.addEventListener("focusout", syncInset);

  return () => {
    started = false;
    pluginHeight = 0;
    viewport?.removeEventListener("resize", syncInset);
    window.removeEventListener("resize", syncInset);
    window.removeEventListener("focusin", onFocus);
    window.removeEventListener("focusout", syncInset);
    applyKeyboardInset(0);
  };
}

export function setPluginKeyboardHeight(height: number) {
  pluginHeight = Math.max(0, Math.round(height));
  syncInset();
}
