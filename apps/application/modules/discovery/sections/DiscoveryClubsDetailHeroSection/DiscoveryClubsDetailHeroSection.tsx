"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { SaveButton } from "@/components/save-button";
import { useRouter } from "next/navigation";
import { Button, Typography } from "@heroui/react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { Icon } from "@theme/icon";
import { FALLBACK_IMAGE_SRC } from "@ui/fallback-image";
import { useLocale, useTranslations } from "next-intl";
import { Autoplay, FreeMode, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { FallbackImage } from "@/components/FallbackImage";
import { getLocaleDirection } from "@/lib/locale-direction";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/thumbs";

import { discoveryClubsDetailHeroSectionStyles } from "./DiscoveryClubsDetailHeroSection.styles";
import type { DiscoveryClubsDetailHeroSectionProps } from "./DiscoveryClubsDetailHeroSection.types";

const GALLERY_PULL_THRESHOLD = 56;
const GALLERY_PULL_RESISTANCE = 180;

export function DiscoveryClubsDetailHeroSection({
  clubId,
  favoriteId,
  name,
  location,
  statusLabel,
  images,
  thumbsSwiper,
  onMainSwiper,
  sectionRef,
}: DiscoveryClubsDetailHeroSectionProps) {
  const t = useTranslations("discovery.clubDetail");
  const direction = getLocaleDirection(useLocale());
  const styles = discoveryClubsDetailHeroSectionStyles();
  const router = useRouter();
  const [pullReady, setPullReady] = useState(false);
  const slides = images.length > 0 ? images : [FALLBACK_IMAGE_SRC];
  const rootRef = useRef<HTMLElement | null>(null);
  const navigationStartedRef = useRef(false);
  const gestureRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    pointerId: -1,
  });
  const pullY = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const pullProgress = useTransform(pullY, [0, GALLERY_PULL_THRESHOLD], [0, 1]);
  const arrowRotation = useTransform(pullProgress, [0, 1], [0, 180]);
  const indicatorOpacity = useTransform(
    pullY,
    [0, 12, GALLERY_PULL_THRESHOLD],
    [0, 0.5, 1],
  );
  const indicatorScale = useTransform(
    pullY,
    [0, GALLERY_PULL_THRESHOLD],
    [0.88, 1],
  );

  useMotionValueEvent(pullY, "change", (latest) => {
    setPullReady(latest >= GALLERY_PULL_THRESHOLD);
  });

  const setRootRef = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      sectionRef?.(node);
    },
    [sectionRef],
  );

  const openGallery = useCallback(() => {
    if (navigationStartedRef.current) return;
    navigationStartedRef.current = true;
    router.push(`/discovery/clubs/${clubId}/gallery`);
  }, [clubId, router]);

  const updatePull = useCallback(
    (distance: number) => {
      const resisted =
        GALLERY_PULL_RESISTANCE *
        (1 - Math.exp(-Math.max(0, distance) / GALLERY_PULL_RESISTANCE));
      pullY.set(resisted);
      if (resisted >= GALLERY_PULL_THRESHOLD) openGallery();
    },
    [openGallery, pullY],
  );

  const finishPull = useCallback(() => {
    const shouldOpen = pullY.get() >= GALLERY_PULL_THRESHOLD;
    gestureRef.current.active = false;
    if (shouldOpen) openGallery();
    if (reduceMotion) pullY.set(0);
    else animate(pullY, 0, { type: "spring", stiffness: 350, damping: 30 });
  }, [openGallery, pullY, reduceMotion]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onTouchStart = (event: TouchEvent) => {
      const scrollRoot = root.closest(".app-scroll-root");
      if ((scrollRoot?.scrollTop ?? 0) > 1 || event.touches.length !== 1)
        return;
      const touch = event.touches[0];
      if (!touch) return;
      navigationStartedRef.current = false;
      gestureRef.current = {
        active: true,
        startX: touch.clientX,
        startY: touch.clientY,
        pointerId: -1,
      };
    };
    const onTouchMove = (event: TouchEvent) => {
      const gesture = gestureRef.current;
      const touch = event.touches[0];
      if (!gesture.active || !touch) return;
      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;
      if (deltaY < 0 || Math.abs(deltaX) > deltaY) return;
      event.preventDefault();
      updatePull(deltaY);
    };
    const onTouchEnd = () => {
      if (gestureRef.current.active) finishPull();
    };

    // Capture before Swiper claims the gesture. Horizontal movement is still left
    // to Swiper, while a downward gesture at the top belongs to the gallery pull.
    root.addEventListener("touchstart", onTouchStart, {
      passive: true,
      capture: true,
    });
    root.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });
    root.addEventListener("touchend", onTouchEnd, { capture: true });
    root.addEventListener("touchcancel", onTouchEnd, { capture: true });
    return () => {
      root.removeEventListener("touchstart", onTouchStart, { capture: true });
      root.removeEventListener("touchmove", onTouchMove, { capture: true });
      root.removeEventListener("touchend", onTouchEnd, { capture: true });
      root.removeEventListener("touchcancel", onTouchEnd, { capture: true });
    };
  }, [finishPull, updatePull]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const scrollRoot = event.currentTarget.closest(".app-scroll-root");
    if (
      event.pointerType === "touch" ||
      event.button !== 0 ||
      (scrollRoot?.scrollTop ?? 0) > 1
    )
      return;
    navigationStartedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture.active || gesture.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (deltaY < 0 || Math.abs(deltaX) > deltaY) return;
    event.preventDefault();
    updatePull(deltaY);
  };

  return (
    <section
      ref={setRootRef}
      className={styles.root()}
      dir={direction}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => {
        if (gestureRef.current.pointerId === event.pointerId) finishPull();
      }}
      onPointerCancel={(event) => {
        if (gestureRef.current.pointerId === event.pointerId) finishPull();
      }}
    >
      <motion.div
        aria-hidden
        style={{ opacity: indicatorOpacity, scale: indicatorScale }}
        className={styles.pullIndicator()}
      >
        <motion.span style={{ rotate: arrowRotation }}>
          <Icon name="chevron-down" size="lg" />
        </motion.span>
        <span>
          {pullReady ? "رها کن و گالری را ببین" : "برای دیدن گالری بکش"}
        </span>
      </motion.div>

      <motion.div style={{ y: pullY }} className={styles.pullContent()}>
        <Swiper
          dir={direction}
          modules={[Autoplay, FreeMode, Thumbs]}
          onSwiper={onMainSwiper}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          rewind
          watchOverflow
          className={styles.mainSwiper()}
        >
          {slides.map((src, index) => (
            <SwiperSlide key={`${src}-${index}`} className={styles.slide()}>
              <FallbackImage
                src={src}
                alt={name}
                fill
                unoptimized
                priority={index === 0}
                sizes="100vw"
                className={styles.image()}
                data-zoom-enter-key={index === 0 ? clubId : undefined}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <div aria-hidden className={styles.overlay()} />

        <div className={styles.topBar()} dir={direction}>
          <Button
            isIconOnly
            aria-label={t("back")}
            variant="secondary"
            size="lg"
            onPress={() => router.back()}
          >
            <Icon name="chevron-right" size="lg" />
          </Button>

          <SaveButton entityType="club" entityId={favoriteId} />
        </div>

        <div className={styles.metaRow()} dir={direction}>
          <div className={styles.meta()}>
            <Typography type="body-sm" className={styles.location()}>
              {location}
            </Typography>
            <Typography type="h2" truncate className={styles.name()}>
              {name}
            </Typography>
          </div>

          <span className={styles.price()}>{statusLabel}</span>
        </div>
      </motion.div>
    </section>
  );
}
