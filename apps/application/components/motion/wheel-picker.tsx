"use client";

import { useReducedMotion } from "motion/react";
import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { createTickPlayer } from "@/lib/tick-sound";
import {
  capturePointer,
  releasePointer,
  TOUCH_GESTURE_CLASS,
} from "@/lib/touch";
import { cn } from "@/lib/cn";

export type WheelPickerOption = string | { label: string; value: string };

export interface WheelPickerProps {
  options: WheelPickerOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  visibleCount?: number;
  itemHeight?: number;
  disabled?: boolean;
  sound?: boolean;
  className?: string;
  "aria-label"?: string;
}

const DEG = Math.PI / 180;
const DECELERATION = 0.00042;
const MAX_VELOCITY = 0.18;
const VELOCITY_WINDOW = 90;
const WHEEL_SENSITIVITY = 0.012;
const WHEEL_SETTLE = 110;
const BACK = 1.35;
const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;
const easeOutBack = (progress: number) =>
  1 +
  (BACK + 1) * (progress - 1) ** 3 +
  BACK * (progress - 1) ** 2;
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(value, maximum));

function optionValue(option: WheelPickerOption) {
  return typeof option === "string" ? option : option.value;
}

function optionLabel(option: WheelPickerOption) {
  return typeof option === "string" ? option : option.label;
}

export function WheelPicker({
  options,
  value,
  defaultValue,
  onValueChange,
  visibleCount = 5,
  itemHeight = 44,
  disabled = false,
  sound = false,
  className,
  "aria-label": ariaLabel,
}: WheelPickerProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const listboxId = useId();
  const controlled = value !== undefined;
  const last = options.length - 1;
  const indexOf = useCallback(
    (candidate: string | undefined) => {
      const index = options.findIndex(
        (option) => optionValue(option) === candidate,
      );
      return index < 0 ? 0 : index;
    },
    [options],
  );
  const [internalValue, setInternalValue] = useState(
    () => defaultValue ?? value,
  );
  const currentValue = controlled ? value : internalValue;
  const [grabbing, setGrabbing] = useState(false);

  const { itemAngle, radius, height, hideBeyond } = useMemo(() => {
    const rowsEachSide = Math.max(1, Math.floor(visibleCount / 2));
    const cutoff = rowsEachSide + 1;
    const angle = 90 / cutoff;
    const wheelRadius = itemHeight / Math.tan(angle * DEG);
    return {
      itemAngle: angle,
      radius: wheelRadius,
      hideBeyond: cutoff,
      height: Math.round(
        2 * wheelRadius * Math.sin(rowsEachSide * angle * DEG) + itemHeight,
      ),
    };
  }, [visibleCount, itemHeight]);

  const container = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLUListElement>(null);
  const bandRef = useRef<HTMLUListElement>(null);
  const scroll = useRef(indexOf(currentValue));
  const animationFrame = useRef(0);
  const emitted = useRef(currentValue);
  const tickPlayer = useRef<ReturnType<typeof createTickPlayer> | null>(null);
  const lastTick = useRef(indexOf(currentValue));

  const paint = useCallback(
    (position: number) => {
      for (const list of [drumRef.current, bandRef.current]) {
        if (!list) continue;
        list.style.transform = `translateZ(${-radius}px) rotateX(${itemAngle * position}deg)`;
        for (const node of Array.from(list.children)) {
          const item = node as HTMLLIElement;
          const index = Number(item.dataset.index);
          const visibility =
            Math.abs(index - position) > hideBeyond ? "hidden" : "visible";
          if (item.style.visibility !== visibility) {
            item.style.visibility = visibility;
          }
        }
      }
    },
    [hideBeyond, itemAngle, radius],
  );

  const getPlayer = useCallback(() => {
    tickPlayer.current ??= createTickPlayer();
    return tickPlayer.current;
  }, []);

  const emit = useCallback(
    (index: number) => {
      const option = options[clamp(index, 0, last)];
      if (!option) return;
      const nextValue = optionValue(option);
      if (nextValue === emitted.current) return;
      emitted.current = nextValue;
      if (sound && reduceMotion) getPlayer().play();
      if (!controlled) setInternalValue(nextValue);
      onValueChange?.(nextValue);
    },
    [controlled, getPlayer, last, onValueChange, options, reduceMotion, sound],
  );

  const maybeTick = useCallback(
    (position: number) => {
      const row = clamp(Math.round(position), 0, last);
      if (!sound || reduceMotion) {
        lastTick.current = row;
        return;
      }
      if (row !== lastTick.current) {
        lastTick.current = row;
        getPlayer().play();
      }
    },
    [getPlayer, last, reduceMotion, sound],
  );

  const stop = useCallback(
    () => cancelAnimationFrame(animationFrame.current),
    [],
  );
  const glide = useCallback(
    (
      target: number,
      duration: number,
      easing: (progress: number) => number = easeOutCubic,
    ) => {
      cancelAnimationFrame(animationFrame.current);
      const start = scroll.current;
      const distance = target - start;
      if (!distance || duration <= 0) {
        scroll.current = target;
        paint(target);
        maybeTick(target);
        emit(target);
        return;
      }
      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = (now - startedAt) / duration;
        if (progress >= 1) {
          scroll.current = target;
          paint(target);
          maybeTick(target);
          emit(target);
          return;
        }
        scroll.current = start + distance * easing(progress);
        paint(scroll.current);
        maybeTick(scroll.current);
        animationFrame.current = requestAnimationFrame(tick);
      };
      animationFrame.current = requestAnimationFrame(tick);
    },
    [emit, maybeTick, paint],
  );

  const fling = useCallback(
    (velocity: number) => {
      const start = scroll.current;
      if (start < 0 || start > last) {
        glide(clamp(Math.round(start), 0, last), 260);
        return;
      }
      const coast =
        ((velocity * velocity) / (2 * DECELERATION)) * Math.sign(velocity);
      const target = clamp(Math.round(start + coast), 0, last);
      const duration = clamp(
        Math.sqrt(Math.abs(target - start)) * 300 + 240,
        280,
        1700,
      );
      glide(target, duration, easeOutBack);
    },
    [glide, last],
  );
  const step = useCallback(
    (offset: number) =>
      glide(
        clamp(Math.round(scroll.current) + offset, 0, last),
        300,
        easeOutBack,
      ),
    [glide, last],
  );

  const drag = useRef<{
    y: number;
    scroll: number;
    points: [number, number][];
  } | null>(null);
  const dragFrame = useRef(0);
  const latestY = useRef(0);
  const beginDrag = useCallback(
    (y: number) => {
      stop();
      if (sound) getPlayer().prepare();
      setGrabbing(true);
      drag.current = {
        y,
        scroll: scroll.current,
        points: [[y, performance.now()]],
      };
    },
    [getPlayer, sound, stop],
  );
  const moveDrag = useCallback(
    (y: number) => {
      const activeDrag = drag.current;
      if (!activeDrag) return;
      latestY.current = y;
      activeDrag.points.push([y, performance.now()]);
      if (activeDrag.points.length > 8) activeDrag.points.shift();
      if (dragFrame.current) return;
      dragFrame.current = requestAnimationFrame(() => {
        dragFrame.current = 0;
        const currentDrag = drag.current;
        if (!currentDrag) return;
        let next =
          currentDrag.scroll + (currentDrag.y - latestY.current) / itemHeight;
        if (next < 0) next *= 0.3;
        else if (next > last) next = last + (next - last) * 0.3;
        scroll.current = next;
        paint(next);
        maybeTick(next);
        emit(Math.round(clamp(next, 0, last)));
      });
    },
    [emit, itemHeight, last, maybeTick, paint],
  );
  const endDrag = useCallback(() => {
    const activeDrag = drag.current;
    if (!activeDrag) return;
    cancelAnimationFrame(dragFrame.current);
    dragFrame.current = 0;
    drag.current = null;
    setGrabbing(false);
    const points = activeDrag.points;
    let velocity = 0;
    if (points.length > 1) {
      const latest = points[points.length - 1];
      let reference = points[0];
      for (const point of points) {
        if (latest[1] - point[1] <= VELOCITY_WINDOW) {
          reference = point;
          break;
        }
      }
      const elapsed = latest[1] - reference[1];
      if (elapsed > 0) {
        velocity = clamp(
          (reference[0] - latest[0]) / itemHeight / elapsed,
          -MAX_VELOCITY,
          MAX_VELOCITY,
        );
      }
    }
    fling(velocity);
  }, [fling, itemHeight]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (disabled || reduceMotion || event.pointerType === "touch") return;
      beginDrag(event.clientY);
      capturePointer(event.currentTarget, event.pointerId);
    },
    [beginDrag, disabled, reduceMotion],
  );
  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "touch") moveDrag(event.clientY);
    },
    [moveDrag],
  );
  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;
      releasePointer(event.currentTarget, event.pointerId);
      endDrag();
    },
    [endDrag],
  );

  const wheelSnap = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onWheel = useCallback(
    (event: globalThis.WheelEvent) => {
      if (disabled || reduceMotion) return;
      event.preventDefault();
      if (sound) getPlayer().prepare();
      stop();
      const pixels =
        event.deltaMode === globalThis.WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 16
          : event.deltaY;
      const next = clamp(
        scroll.current + pixels * WHEEL_SENSITIVITY,
        0,
        last,
      );
      scroll.current = next;
      paint(next);
      maybeTick(next);
      emit(Math.round(next));
      if (wheelSnap.current) clearTimeout(wheelSnap.current);
      wheelSnap.current = setTimeout(
        () =>
          glide(
            clamp(Math.round(scroll.current), 0, last),
            240,
            easeOutBack,
          ),
        WHEEL_SETTLE,
      );
    },
    [
      disabled,
      emit,
      getPlayer,
      glide,
      last,
      maybeTick,
      paint,
      reduceMotion,
      sound,
      stop,
    ],
  );
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const current = Math.round(scroll.current);
      const offsetByKey: Record<string, number> = {
        ArrowUp: -1,
        ArrowDown: 1,
        Home: -current,
        End: last - current,
      };
      if (event.key in offsetByKey) {
        event.preventDefault();
        if (sound) getPlayer().prepare();
        step(offsetByKey[event.key]);
      }
    },
    [disabled, getPlayer, last, sound, step],
  );

  useEffect(() => {
    if (drag.current) return;
    const target = indexOf(currentValue);
    emitted.current = currentValue;
    if (Math.abs(Math.round(scroll.current) - target) < 0.001) {
      paint(scroll.current);
      return;
    }
    glide(target, 260);
  }, [currentValue, glide, indexOf, paint]);
  useEffect(
    () => () => {
      cancelAnimationFrame(animationFrame.current);
      cancelAnimationFrame(dragFrame.current);
      if (wheelSnap.current) clearTimeout(wheelSnap.current);
      tickPlayer.current?.dispose();
    },
    [],
  );
  useEffect(() => {
    const element = container.current;
    if (!element || reduceMotion || disabled) return;
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) beginDrag(touch.clientY);
    };
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || !drag.current) return;
      event.preventDefault();
      moveDrag(touch.clientY);
    };
    const handleTouchEnd = () => endDrag();
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);
    element.addEventListener("touchcancel", handleTouchEnd);
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
      element.removeEventListener("wheel", onWheel);
    };
  }, [beginDrag, disabled, endDrag, moveDrag, onWheel, reduceMotion]);

  const maskFade =
    "[mask-image:linear-gradient(to_bottom,transparent,#000_20%,#000_80%,transparent)]";
  const sharedClassName = cn(
    "relative overflow-hidden rounded-[var(--app-radius-control)] border border-border/60 bg-surface outline-none focus-visible:border-focus focus-visible:ring-3 focus-visible:ring-focus/15",
    disabled && "pointer-events-none opacity-50",
    className,
  );

  if (reduceMotion) {
    const padding = (height - itemHeight) / 2;
    return (
      <div className={sharedClassName} style={{ height }}>
        <div
          className="pointer-events-none absolute inset-x-1 top-1/2 z-10 -translate-y-1/2 rounded-xl border border-accent/20 bg-accent/10"
          style={{ height: itemHeight }}
        />
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "h-full snap-y snap-mandatory overflow-y-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            maskFade,
          )}
          style={{ paddingTop: padding, paddingBottom: padding }}
        >
          {options.map((option, index) => {
            const optionId = optionValue(option);
            const selected = optionId === currentValue;
            return (
              <li
                key={optionId}
                role="option"
                aria-selected={selected}
                className="snap-center"
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => emit(index)}
                  className={cn(
                    "flex w-full items-center justify-center text-sm font-medium tabular-nums",
                    selected ? "text-foreground" : "text-muted",
                  )}
                  style={{ height: itemHeight }}
                >
                  {optionLabel(option)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div
      ref={container}
      role="listbox"
      aria-label={ariaLabel}
      aria-activedescendant={`${listboxId}-${indexOf(currentValue)}`}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        sharedClassName,
        "touch-none",
        TOUCH_GESTURE_CLASS,
        grabbing ? "cursor-grabbing" : "cursor-grab",
        maskFade,
      )}
      style={{ height, perspective: 1000 }}
    >
      <ul
        ref={drumRef}
        aria-hidden
        className="absolute inset-x-0 top-1/2 m-0 h-0 list-none p-0 [backface-visibility:hidden] [transform-style:preserve-3d] [will-change:transform]"
      >
        {options.map((option, index) => (
          <li
            key={optionValue(option)}
            data-index={index}
            className="absolute inset-x-0 flex items-center justify-center text-sm font-medium text-muted tabular-nums"
            style={{
              top: -itemHeight / 2,
              height: itemHeight,
              transform: `rotateX(${-itemAngle * index}deg) translateZ(${radius}px)`,
            }}
          >
            {optionLabel(option)}
          </li>
        ))}
      </ul>
      <div
        className="pointer-events-none absolute inset-x-1 top-1/2 z-10 -translate-y-1/2 overflow-hidden rounded-xl border border-accent/20 bg-accent/10"
        style={{ height: itemHeight, perspective: 1000 }}
      >
        <ul
          ref={bandRef}
          role="presentation"
          className="absolute inset-x-0 top-1/2 m-0 h-0 list-none p-0 [backface-visibility:hidden] [transform-style:preserve-3d] [will-change:transform]"
        >
          {options.map((option, index) => (
            <li
              id={`${listboxId}-${index}`}
              key={optionValue(option)}
              data-index={index}
              role="option"
              aria-selected={optionValue(option) === currentValue}
              className="absolute inset-x-0 flex items-center justify-center text-sm font-bold text-foreground tabular-nums"
              style={{
                top: -itemHeight / 2,
                height: itemHeight,
                transform: `rotateX(${-itemAngle * index}deg) translateZ(${radius}px)`,
              }}
            >
              {optionLabel(option)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
