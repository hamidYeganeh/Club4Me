"use client";

/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect -- This low-level caret adapter deliberately mirrors DOM selection and measurement state through refs. */

import { Input, InputGroup } from "@heroui/react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import {
  type ChangeEvent,
  type ComponentPropsWithRef,
  type FocusEvent,
  type Ref,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "./cn";

const DEFAULT_SPRING = {
  stiffness: 500,
  damping: 30,
  mass: 0.5,
} as const;

const REDUCED_MOTION_SPRING = {
  stiffness: 10000,
  damping: 100,
  mass: 0.1,
} as const;

function getPasswordChar() {
  if (typeof navigator === "undefined") {
    return "\u2022";
  }

  return /firefox|fxios/i.test(navigator.userAgent) ? "\u25CF" : "\u2022";
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref) {
        ref.current = value;
      }
    }
  };
}

type SmoothCaretOptions = {
  value?: string | number | readonly string[];
  type?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  inputRef?: Ref<HTMLInputElement>;
};

function useSmoothCaret({
  value,
  type = "text",
  onChange,
  onBlur,
  inputRef,
}: SmoothCaretOptions) {
  const caretX = useMotionValue(0);
  const caretOpacity = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const localInputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [passwordChar, setPasswordChar] = useState("\u2022");
  const [caretHeightPx, setCaretHeightPx] = useState(0);

  const springCaretX = useSpring(
    caretX,
    prefersReducedMotion ? REDUCED_MOTION_SPRING : DEFAULT_SPRING,
  );

  const inputValue = value === undefined ? undefined : String(value);

  const syncMeasureSpan = () => {
    const input = localInputRef.current;
    const measureSpan = measureRef.current;
    if (!input || !measureSpan) return;

    const styles = window.getComputedStyle(input);
    const isPassword = input.type === "password";

    let fontSize = styles.fontSize;
    if (
      passwordChar === "\u2022" &&
      isPassword &&
      !/chrome|chromium|crios/i.test(navigator.userAgent)
    ) {
      fontSize = `${parseFloat(fontSize) + 6.25}px`;
    }

    measureSpan.style.font = `${styles.fontStyle} ${styles.fontWeight} ${fontSize} ${styles.fontFamily}`;
    measureSpan.style.letterSpacing = styles.letterSpacing;
    measureSpan.style.fontFeatureSettings = styles.fontFeatureSettings;
    measureSpan.style.fontVariationSettings = styles.fontVariationSettings;
  };

  const measurePrefixWidth = (text: string) => {
    const input = localInputRef.current;
    const measureSpan = measureRef.current;
    if (!input || !measureSpan) return null;

    syncMeasureSpan();
    measureSpan.textContent = text;

    const paddingLeft =
      parseFloat(window.getComputedStyle(input).paddingLeft) || 0;

    return text.length > 0
      ? measureSpan.offsetWidth + paddingLeft
      : paddingLeft - 1;
  };

  const scrollCaretIntoView = (
    target: HTMLInputElement,
    absoluteWidth: number,
  ) => {
    const styles = window.getComputedStyle(target);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const maxScroll = Math.max(0, target.scrollWidth - target.clientWidth);
    const visibleRight = target.scrollLeft + target.clientWidth - paddingRight;
    const visibleLeft = target.scrollLeft + paddingLeft;

    if (absoluteWidth > visibleRight) {
      target.scrollLeft = Math.min(
        absoluteWidth - target.clientWidth + paddingRight,
        maxScroll,
      );
      return;
    }

    if (absoluteWidth < visibleLeft) {
      target.scrollLeft = Math.max(0, absoluteWidth - paddingLeft);
    }
  };

  const getCaretIndex = (target: HTMLInputElement) => {
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;

    if (selectionStart === selectionEnd) {
      return selectionStart;
    }

    return target.selectionDirection === "backward"
      ? selectionStart
      : selectionEnd;
  };

  const updateCaretFromInput = (target: HTMLInputElement) => {
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;
    const hasSelection = selectionStart !== selectionEnd;
    const caretIndex = getCaretIndex(target);
    const isPassword = target.type === "password";
    const textBeforeCaret = isPassword
      ? passwordChar.repeat(caretIndex)
      : target.value.slice(0, caretIndex);

    const absoluteWidth = measurePrefixWidth(textBeforeCaret);
    if (absoluteWidth === null) return;

    scrollCaretIntoView(target, absoluteWidth);

    const styles = window.getComputedStyle(target);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const caretPosition = absoluteWidth - target.scrollLeft;
    const minX = paddingLeft - 1;
    const maxX = target.clientWidth - paddingRight;
    const isCaretVisible = caretPosition >= minX && caretPosition <= maxX + 1;

    caretX.set(Math.min(caretPosition, maxX));

    if (!isCaretVisible || hasSelection) {
      caretOpacity.set(0);
      return;
    }

    caretOpacity.set(1);
  };

  const updateCaretRef = useRef(updateCaretFromInput);
  updateCaretRef.current = updateCaretFromInput;
  const caretOpacityRef = useRef(caretOpacity);
  caretOpacityRef.current = caretOpacity;

  useEffect(() => {
    setPasswordChar(getPasswordChar());
  }, []);

  useEffect(() => {
    const input = localInputRef.current;
    if (input && document.activeElement === input) {
      updateCaretRef.current(input);
    }
  }, [inputValue, type, passwordChar]);

  useEffect(() => {
    const input = localInputRef.current;
    const container = containerRef.current;
    if (!input || !container) return;

    let rafId = 0;
    let lastValue = input.value;
    let lastSelection = input.selectionStart;

    const updateCaretIfFocused = () => {
      if (document.activeElement === input) {
        updateCaretRef.current(input);
      }
    };

    const tickWhileFocused = () => {
      if (document.activeElement !== input) {
        return;
      }

      const nextValue = input.value;
      const nextSelection = input.selectionStart;

      // Covers TextField-controlled reformats (e.g. phone spacing) that
      // update the DOM without re-rendering this wrapper.
      if (nextValue !== lastValue || nextSelection !== lastSelection) {
        lastValue = nextValue;
        lastSelection = nextSelection;
        updateCaretRef.current(input);
      }

      rafId = requestAnimationFrame(tickWhileFocused);
    };

    const handleFocus = () => {
      lastValue = input.value;
      lastSelection = input.selectionStart;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tickWhileFocused);
      updateCaretRef.current(input);
    };

    const handleSelectionChange = () => {
      if (document.activeElement !== input) return;

      requestAnimationFrame(() => {
        if (document.activeElement === input) {
          updateCaretRef.current(input);
        }
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.fonts.addEventListener("loadingdone", updateCaretIfFocused);
    void document.fonts.ready.then(updateCaretIfFocused);
    input.addEventListener("scroll", updateCaretIfFocused);
    input.addEventListener("focus", handleFocus);

    const resizeObserver = new ResizeObserver(updateCaretIfFocused);
    resizeObserver.observe(container);

    if (document.activeElement === input) {
      handleFocus();
    }

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.fonts.removeEventListener("loadingdone", updateCaretIfFocused);
      input.removeEventListener("scroll", updateCaretIfFocused);
      input.removeEventListener("focus", handleFocus);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const input = localInputRef.current;
    if (!input) return;

    const syncHeight = () => {
      const fontSize =
        parseFloat(window.getComputedStyle(input).fontSize) || 18;
      setCaretHeightPx(fontSize);
    };

    syncHeight();

    const resizeObserver = new ResizeObserver(syncHeight);
    resizeObserver.observe(input);
    document.fonts.addEventListener("loadingdone", syncHeight);

    return () => {
      resizeObserver.disconnect();
      document.fonts.removeEventListener("loadingdone", syncHeight);
    };
  }, [type, passwordChar]);

  return {
    containerRef,
    measureRef,
    springCaretX,
    caretOpacity,
    caretHeightPx,
    setInputRef: mergeRefs(localInputRef, inputRef),
    handleChange: (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      requestAnimationFrame(() => {
        updateCaretRef.current(event.target);
      });
    },
    handleBlur: (event: FocusEvent<HTMLInputElement>) => {
      caretOpacityRef.current.set(0);
      onBlur?.(event);
    },
  };
}

type SmoothInputProps = ComponentPropsWithRef<typeof Input>;

function composeClassName(
  base: string,
  className: SmoothInputProps["className"],
): SmoothInputProps["className"] {
  if (typeof className === "function") {
    return (values) => cn(base, className(values));
  }

  return cn(base, className);
}

/** Drop-in for HeroUI `Input` inside `TextField`. */
export function SmoothInput({
  className,
  value,
  type = "text",
  onChange,
  onBlur,
  style,
  ref,
  ...props
}: SmoothInputProps) {
  const caret = useSmoothCaret({
    value,
    type,
    onChange,
    onBlur,
    inputRef: ref,
  });

  return (
    <div
      ref={caret.containerRef}
      className="relative grid min-w-0 flex-1 grid-cols-1"
      style={{ caretColor: "transparent" }}
    >
      <Input
        {...props}
        ref={caret.setInputRef}
        type={type}
        {...(value !== undefined ? { value } : {})}
        className={composeClassName(
          "col-start-1 col-end-2 row-start-1 row-end-2 font-medium",
          className,
        )}
        style={style}
        onChange={caret.handleChange}
        onBlur={caret.handleBlur}
      />
      <span
        ref={caret.measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute top-0 left-0 whitespace-pre"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none col-start-1 col-end-2 row-start-1 row-end-2 w-0.5 self-center bg-accent"
        style={{
          x: caret.springCaretX,
          opacity: caret.caretOpacity,
          height: caret.caretHeightPx || "1em",
        }}
      />
    </div>
  );
}

type SmoothInputGroupInputProps = ComponentPropsWithRef<
  typeof InputGroup.Input
>;

/** Drop-in for `InputGroup.Input` inside `TextField` + `InputGroup`. */
export function SmoothInputGroupInput({
  className,
  value,
  type = "text",
  onChange,
  onBlur,
  style,
  ref,
  ...props
}: SmoothInputGroupInputProps) {
  const caret = useSmoothCaret({
    value,
    type,
    onChange,
    onBlur,
    inputRef: ref,
  });

  return (
    <div
      ref={caret.containerRef}
      className="relative grid min-w-0 flex-1 grid-cols-1 self-stretch"
      style={{ caretColor: "transparent" }}
    >
      <InputGroup.Input
        {...props}
        ref={caret.setInputRef}
        type={type}
        {...(value !== undefined ? { value } : {})}
        className={composeClassName(
          "col-start-1 col-end-2 row-start-1 row-end-2 font-medium",
          className,
        )}
        style={style}
        onChange={caret.handleChange}
        onBlur={caret.handleBlur}
      />
      <span
        ref={caret.measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute top-0 left-0 whitespace-pre"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none col-start-1 col-end-2 row-start-1 row-end-2 w-0.5 self-center bg-accent"
        style={{
          x: caret.springCaretX,
          opacity: caret.caretOpacity,
          height: caret.caretHeightPx || "1em",
        }}
      />
    </div>
  );
}
