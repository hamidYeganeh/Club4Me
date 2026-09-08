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
const DRAWER_TRANSITION = { duration: 0.24, ease: DRAWER_EASE } as const;
const subscribeToMount = () => () => undefined;

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapPoints?: (number | "auto")[];
  defaultSnap?: number;
  title?: string;
  description?: string;
  headerAction?: ReactNode;
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
  headerAction,
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

    const scrollRoot = document.querySelector<HTMLElement>(".app-scroll-root");
    const previousOverflow = scrollRoot?.style.overflow;
    scrollRoot?.style.setProperty("overflow", "hidden");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (scrollRoot) scrollRoot.style.overflow = previousOverflow ?? "";
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
      ? { maxHeight: "min(92dvh, calc(100dvh - var(--keyboard-inset, 0px)))" }
      : {
          height: `min(${snapValue * 100}dvh, calc(100dvh - var(--keyboard-inset, 0px)))`,
        };

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
            transition={{ duration: 0.16, ease: "linear" }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[1000] bg-black/50"
          />
          <motion.div
            key="bottom-sheet"
            ref={sheetRef}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.16 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            transition={
              reduceMotion
                ? { duration: 0.12, ease: DRAWER_EASE }
                : DRAWER_TRANSITION
            }
            style={heightStyle}
            className={cn(
              "fixed inset-x-0 bottom-[var(--keyboard-inset,0px)] z-[1001] mx-auto flex w-full max-w-xl translate-z-0 flex-col contain-paint rounded-t-[2rem] bg-surface text-surface-foreground will-change-transform",
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
                <div className="mt-3 flex w-full items-start gap-3 text-start">
                  <div className="min-w-0 flex-1">
                    {title ? (
                      <h2 id={titleId} className="text-xl font-semibold">
                        {title}
                      </h2>
                    ) : null}
                    {description ? (
                      <p id={descriptionId} className="mt-1 text-sm text-muted">
                        {description}
                      </p>
                    ) : null}
                  </div>
                  {headerAction ? (
                    <div className="shrink-0">{headerAction}</div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div
              className={cn(
                "min-h-0 flex-1 scroll-pt-3 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
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
