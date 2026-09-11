"use client";

import { CroppedImageUpload } from "@/components/cropped-image-upload";
import { Avatar, Badge, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { FALLBACK_IMAGE_SRC, resolveImageSrc } from "@ui/fallback-image";
import { useTranslations } from "next-intl";

import { profileImageHeroSectionStyles } from "./ProfileImageHeroSection.styles";
import type { ProfileImageHeroSectionProps } from "./ProfileImageHeroSection.types";

export function ProfileImageHeroSection({
  title,
  avatarAlt,
  avatarSrc,
  isUploading = false,
  onFile,
}: ProfileImageHeroSectionProps) {
  const styles = profileImageHeroSectionStyles();
  const t = useTranslations("profile");
  return (
    <section className={styles.root()}>
      <Typography type="h2" align="center" className={styles.title()}>
        {title}
      </Typography>

      <div className={styles.avatarWrap()}>
        {isUploading ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 192 192"
            className={styles.uploadProgress()}
          >
            <circle
              cx="96"
              cy="96"
              r="92"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className={styles.uploadProgressTrack()}
            />
            <circle
              cx="96"
              cy="96"
              r="92"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="145 434"
              className={styles.uploadProgressValue()}
            />
          </svg>
        ) : null}
        <Badge.Anchor>
          <Avatar
            className={styles.avatar({
              className: isUploading ? "opacity-70" : undefined,
            })}
          >
            <Avatar.Image
              className="object-cover"
              alt={avatarAlt}
              src={resolveImageSrc(avatarSrc)}
            />
            <Avatar.Fallback
              className={`${styles.avatarFallback()} overflow-hidden p-0`}
            >
              {/* Avatar fallback supports runtime and local asset URLs. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={FALLBACK_IMAGE_SRC}
                alt=""
                className="size-full object-cover"
              />
            </Avatar.Fallback>
          </Avatar>
          <Badge
            aria-hidden
            color="default"
            placement="bottom-right"
            size="lg"
            className={styles.avatarBadge()}
          >
            <Icon name="camera-1" size={18} />
          </Badge>
        </Badge.Anchor>
      </div>

      <div className="mt-5 w-full">
        <CroppedImageUpload
          onFile={async (file) => {
            await onFile(file);
          }}
          label={t("changeImage")}
          aspectRatio={1}
          disabled={isUploading}
        />
      </div>
    </section>
  );
}
