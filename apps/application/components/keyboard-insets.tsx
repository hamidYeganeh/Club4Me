"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";

import {
  setPluginKeyboardHeight,
  startKeyboardInsets,
} from "@/lib/keyboard-inset";

export function KeyboardInsets() {
  useEffect(() => {
    const stop = startKeyboardInsets();
    const handles: Array<Promise<{ remove: () => Promise<void> }>> = [];

    if (Capacitor.isNativePlatform()) {
      handles.push(
        Keyboard.addListener("keyboardWillShow", ({ keyboardHeight }) => {
          setPluginKeyboardHeight(keyboardHeight);
        }),
        Keyboard.addListener("keyboardDidShow", ({ keyboardHeight }) => {
          setPluginKeyboardHeight(keyboardHeight);
        }),
        Keyboard.addListener("keyboardWillHide", () => {
          setPluginKeyboardHeight(0);
        }),
        Keyboard.addListener("keyboardDidHide", () => {
          setPluginKeyboardHeight(0);
        }),
      );
    }

    return () => {
      stop();
      for (const handle of handles) {
        void handle
          .then((listener) => listener.remove())
          .catch(() => undefined);
      }
    };
  }, []);

  return null;
}
