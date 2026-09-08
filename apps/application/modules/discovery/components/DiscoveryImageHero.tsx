import type { CSSProperties, ReactNode } from "react";
import { FallbackImage } from "@/components/FallbackImage";
import styles from "./DiscoveryHero.module.css";

/** Bottom-up gradient and progressive blur keep copy readable over photography. */
export function DiscoveryHeroScrim() {
  return (
    <div className={styles.scrim} aria-hidden="true" data-hero-scrim>
      <div className={styles.edge}>
        {[2, 4, 8, 16].map((blur, index) => (
          <div
            key={blur}
            className={styles.layer}
            style={
              {
                "--blur": `${blur}px`,
                "--reach": `${100 - index * 20}%`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

export function DiscoveryImageHero({
  imageUrl,
  imageClassName,
  title,
  eyebrow,
  description,
  children,
  titleId,
  compact = false,
}: {
  imageUrl?: string | null;
  imageClassName?: string;
  title: string;
  eyebrow?: string;
  description?: string | null;
  children?: ReactNode;
  titleId?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={`${styles.hero} ${compact ? styles.compact : ""}`}
      aria-label={title}
    >
      <FallbackImage
        src={imageUrl}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 576px) 100vw, 576px"
        className={imageClassName}
      />
      <DiscoveryHeroScrim />
      <div className={styles.content}>
        {eyebrow ? (
          <p className="mb-3 inline-flex rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1
          id={titleId}
          className="text-2xl leading-10 font-extrabold text-white sm:text-3xl"
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-7 text-white/90">{description}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
