"use client";

// Adapted from https://beui.dev/components/motion/bottom-sheet
import {
  AnimatePresence,
  motion,
  type PanInfo,
  useDragControls,
  useReducedMotion,
} from "motion/react";
import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

const DRAWER_EASE = [0.32, 0.72, 0, 1] as const;
const DRAWER_TRANSITION = { duration: 0.5, ease: DRAWER_EASE } as const;
const subscribeToMount = () => () => undefined;

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapPoints?: (number | "auto")[];
  defaultSnap?: number;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  dismissThreshold?: number;
}

export function BottomSheet({
  open,
  onOpenChange,
  snapPoints = [0.5, 0.92],
  defaultSnap = 0,
  title,
  description,
  children,
  className,
  contentClassName,
  dismissThreshold = 120,
}: BottomSheetProps) {
  const [snap, setSnap] = useState(defaultSnap);
  const mounted = useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false,
  );
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const titleId = `${uid}-title`;
  const descriptionId = `${uid}-description`;

  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const scrollY = window.scrollY;
    const previousStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      Object.assign(body.style, previousStyles);
      window.scrollTo(0, scrollY);
    };
  }, [onOpenChange, open]);

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    const { y: velocity } = info.velocity;
    const { y: offset } = info.offset;

    if (velocity > 600 || offset > dismissThreshold) {
      const smallerSnap = snap - 1;
      if (
        smallerSnap >= 0 &&
        velocity < 800 &&
        offset < dismissThreshold * 1.6
      ) {
        setSnap(smallerSnap);
      } else {
        onOpenChange(false);
      }
      return;
    }

    if (velocity < -500) {
      setSnap((current) => Math.min(snapPoints.length - 1, current + 1));
      return;
    }

    setSnap((current) => {
      if (offset > 80 && current > 0) return current - 1;
      if (offset < -80 && current < snapPoints.length - 1) return current + 1;
      return current;
    });
  };

  const snapValue = snapPoints[snap] ?? snapPoints[0] ?? 0.5;
  const heightStyle =
    snapValue === "auto"
      ? { maxHeight: "92dvh" }
      : { height: `${snapValue * 100}dvh` };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence onExitComplete={() => setSnap(defaultSnap)}>
      {open ? (
        <>
          <motion.button
            key="bottom-sheet-backdrop"
            type="button"
            aria-label="Close bottom sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={DRAWER_TRANSITION}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[1000] bg-black/45 backdrop-blur-[2px]"
          />
          <motion.div
            key="bottom-sheet"
            ref={sheetRef}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.02, bottom: 0.4 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            transition={
              reduceMotion
                ? { duration: 0.18, ease: DRAWER_EASE }
                : DRAWER_TRANSITION
            }
            style={heightStyle}
            className={cn(
              "fixed inset-x-0 bottom-0 z-[1001] mx-auto flex w-full max-w-xl flex-col rounded-t-[3rem] bg-surface text-surface-foreground shadow-[0_-18px_0_-10px_color-mix(in_oklch,var(--surface)_96%,transparent),0_-34px_0_-22px_color-mix(in_oklch,var(--surface)_88%,transparent),0_-28px_70px_rgba(0,0,0,0.22)] will-change-transform",
              className,
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            aria-label={title ? undefined : "Bottom sheet"}
          >
            <div className="flex shrink-0 flex-col items-center px-5 pb-3 pt-4">
              <div
                onPointerDown={(event) => dragControls.start(event)}
                className="flex cursor-grab touch-none items-center justify-center px-8 py-2 active:cursor-grabbing"
              >
                <div className="h-1.5 w-12 rounded-full bg-foreground/15" />
              </div>
              {title || description ? (
                <div className="mt-3 w-full text-start">
                  {title ? (
                    <h2 id={titleId} className="text-xl font-semibold">
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p
                      id={descriptionId}
                      className="mt-1 text-sm text-muted"
                    >
                      {description}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
                contentClassName,
              )}
            >
              {children}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
