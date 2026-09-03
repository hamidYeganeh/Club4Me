"use client";

import { useSyncExternalStore } from "react";

import {
  getKeyboardInset,
  subscribeKeyboardInset,
} from "@/lib/keyboard-inset";

const KEYBOARD_OPEN_THRESHOLD_PX = 80;

function subscribe(onStoreChange: () => void) {
  return subscribeKeyboardInset(() => {
    onStoreChange();
  });
}

export function useKeyboardInset() {
  const height = useSyncExternalStore(
    subscribe,
    getKeyboardInset,
    () => 0,
  );

  return {
    height,
    isOpen: height >= KEYBOARD_OPEN_THRESHOLD_PX,
  };
}

export function useKeyboardOpen() {
  const { isOpen } = useKeyboardInset();
  return isOpen;
}
