"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "./cn";

export type SwipeSide = "left" | "right";

export type SwipeableListValue = {
  id: string;
  side: SwipeSide;
};

export type SwipeAction = {
  id: string;
  label: string;
  icon: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export type SwipeableListItem = {
  id: string;
  content: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  disabled?: boolean;
};

export type SwipeableListProps = {
  items: SwipeableListItem[];
  value?: SwipeableListValue | null;
  defaultValue?: SwipeableListValue | null;
  onValueChange?: (value: SwipeableListValue | null) => void;
  actionWidth?: number;
  revealThreshold?: number;
  className?: string;
  itemClassName?: string;
  surfaceClassName?: string;
  railClassName?: string;
};

const SETTLE = {
  type: "spring",
  stiffness: 560,
  damping: 48,
  mass: 0.82,
  restDelta: 0.5,
  restSpeed: 8,
} as const;

const OPEN_DISTANCE_RATIO = 0.46;
const CLOSE_DISTANCE_RATIO = 0.72;
const OPEN_VELOCITY = 720;
const CLOSE_VELOCITY = 320;
const FLING_DISTANCE = 14;
const RELEASE_VELOCITY_LIMIT = 1500;

function SwipeableRow({
  item,
  actionWidth,
  revealThreshold,
  openValue,
  setOpenValue,
  itemClassName,
  surfaceClassName,
  railClassName,
}: {
  item: SwipeableListItem;
  actionWidth: number;
  revealThreshold: number;
  openValue: SwipeableListValue | null;
  setOpenValue: (value: SwipeableListValue | null) => void;
  itemClassName?: string;
  surfaceClassName?: string;
  railClassName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const animationRef = useRef<{ stop: () => void } | null>(null);
  const commandedTargetRef = useRef(0);
  const leftActions = item.leftActions ?? [];
  const rightActions = item.rightActions ?? [];
  const leftWidth = leftActions.length * actionWidth;
  const rightWidth = rightActions.length * actionWidth;
  const openSide = openValue?.id === item.id ? openValue.side : null;
  const targetX =
    openSide === "left" ? leftWidth : openSide === "right" ? -rightWidth : 0;

  const settleX = useCallback(
    (nextX: number, velocity = 0) => {
      commandedTargetRef.current = nextX;
      animationRef.current?.stop();
      if (reduceMotion) {
        x.set(nextX);
        return;
      }
      animationRef.current = animate(x, nextX, {
        ...SETTLE,
        velocity: Math.max(
          -RELEASE_VELOCITY_LIMIT,
          Math.min(RELEASE_VELOCITY_LIMIT, velocity),
        ),
        onComplete: () => x.set(nextX),
      });
    },
    [reduceMotion, x],
  );

  useEffect(() => () => animationRef.current?.stop(), []);
  useEffect(() => {
    if (commandedTargetRef.current !== targetX) settleX(targetX);
  }, [settleX, targetX]);

  const snapTo = useCallback(
    (side: SwipeSide | null, velocity = 0) => {
      setOpenValue(side ? { id: item.id, side } : null);
      settleX(
        side === "left" ? leftWidth : side === "right" ? -rightWidth : 0,
        velocity,
      );
    },
    [item.id, leftWidth, rightWidth, setOpenValue, settleX],
  );

  const handleDragEnd = useCallback(
    (_: PointerEvent, info: PanInfo) => {
      const velocity = info.velocity.x;
      const latest = x.get();
      if (openSide === "left") {
        snapTo(
          latest < leftWidth * CLOSE_DISTANCE_RATIO || velocity < -CLOSE_VELOCITY
            ? null
            : "left",
          velocity,
        );
        return;
      }
      if (openSide === "right") {
        snapTo(
          Math.abs(latest) < rightWidth * CLOSE_DISTANCE_RATIO ||
            velocity > CLOSE_VELOCITY
            ? null
            : "right",
          velocity,
        );
        return;
      }
      if (
        leftWidth > 0 &&
        (latest > Math.max(revealThreshold, leftWidth * OPEN_DISTANCE_RATIO) ||
          (velocity > OPEN_VELOCITY && latest > FLING_DISTANCE))
      ) {
        snapTo("left", velocity);
        return;
      }
      if (
        rightWidth > 0 &&
        (latest < -Math.max(revealThreshold, rightWidth * OPEN_DISTANCE_RATIO) ||
          (velocity < -OPEN_VELOCITY && latest < -FLING_DISTANCE))
      ) {
        snapTo("right", velocity);
        return;
      }
      snapTo(null, velocity);
    },
    [leftWidth, openSide, revealThreshold, rightWidth, snapTo, x],
  );

  const renderActions = (actions: SwipeAction[], side: SwipeSide) =>
    actions.map((action) => (
      <button
        key={action.id}
        type="button"
        disabled={action.disabled}
        tabIndex={openSide === side ? 0 : -1}
        aria-label={action.label}
        className={cn(
          "group flex h-full shrink-0 items-center justify-center outline-none disabled:pointer-events-none disabled:opacity-45",
          "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
          action.className,
        )}
        style={{ width: actionWidth }}
        onClick={() => {
          action.onClick?.();
          snapTo(null);
        }}
      >
        <span className="grid size-10 place-items-center rounded-full transition-transform group-active:scale-90">
          {action.icon}
        </span>
      </button>
    ));

  return (
    <div className={cn("relative isolate overflow-hidden", itemClassName)}>
      <div
        aria-hidden={!openSide}
        inert={!openSide}
        className={cn("absolute inset-0 z-0 flex overflow-hidden", railClassName)}
      >
        <div className="flex h-full">{renderActions(leftActions, "left")}</div>
        <div className="ms-auto flex h-full">
          {renderActions(rightActions, "right")}
        </div>
      </div>
      <motion.div
        drag={item.disabled ? false : "x"}
        dragConstraints={{ left: -rightWidth, right: leftWidth }}
        dragElastic={0.04}
        dragMomentum={false}
        onDragStart={() => {
          animationRef.current?.stop();
          if (openValue && openValue.id !== item.id) setOpenValue(null);
        }}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          "relative z-10 cursor-grab touch-pan-y select-none active:cursor-grabbing",
          surfaceClassName,
        )}
      >
        {item.content}
      </motion.div>
    </div>
  );
}

export function SwipeableList({
  items,
  value,
  defaultValue = null,
  onValueChange,
  actionWidth = 56,
  revealThreshold = 34,
  className,
  itemClassName,
  surfaceClassName,
  railClassName,
}: SwipeableListProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const controlled = value !== undefined;
  const openValue = controlled ? (value ?? null) : internalValue;
  const setOpenValue = useCallback(
    (next: SwipeableListValue | null) => {
      if (!controlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  return (
    <div className={cn("flex w-full flex-col", className)}>
      {items.map((item) => (
        <SwipeableRow
          key={item.id}
          item={item}
          actionWidth={actionWidth}
          revealThreshold={revealThreshold}
          openValue={openValue}
          setOpenValue={setOpenValue}
          itemClassName={itemClassName}
          surfaceClassName={surfaceClassName}
          railClassName={railClassName}
        />
      ))}
    </div>
  );
}
