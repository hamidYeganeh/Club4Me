"use client";

/* eslint-disable react-hooks/refs -- react-dropzone prop getters attach managed refs during render. */

import { ImageCropper } from "@/components/image-cropper";
import { useRef, useState } from "react";
import { Avatar, Badge, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { FALLBACK_IMAGE_SRC, resolveImageSrc } from "@ui/fallback-image";
import { useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";

import { profileImageHeroSectionStyles } from "./ProfileImageHeroSection.styles";
import type { ProfileImageHeroSectionProps } from "./ProfileImageHeroSection.types";
import { PermissionGrantSheet } from "@/components/permissions/permission-grant-sheet";

const profileImageAccept = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export function ProfileImageHeroSection({
  title,
  avatarAlt,
  avatarSrc,
  isUploading = false,
  onFile,
}: ProfileImageHeroSectionProps) {
  const [cropFile, setCropFile] = useState<File | null>(null);
  const styles = profileImageHeroSectionStyles();
  const t = useTranslations("profile");
  const [cameraPrimerOpen, setCameraPrimerOpen] = useState(false);
  const openFileDialogRef = useRef<(() => void) | null>(null);
  const { getInputProps, getRootProps, isDragActive, open } = useDropzone({
    accept: profileImageAccept,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: isUploading,
    noClick: true,
    noKeyboard: true,
    onDropAccepted: ([file]) => {
      if (file) {
        setCropFile(file);
      }
    },
  });

  const requestImage = () => {
    openFileDialogRef.current = open;
    setCameraPrimerOpen(true);
  };

  return (
    <section className={styles.root()}>
      {cropFile ? (
        <ImageCropper
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={async (file) => {
            setCropFile(null);
            await onFile(file);
          }}
        />
      ) : null}
      <Typography type="h2" align="center" className={styles.title()}>
        {title}
      </Typography>

      <div
        {...getRootProps({
          role: "button",
          tabIndex: 0,
          "aria-label": t("changeImage"),
          "aria-busy": isUploading,
          onClick: requestImage,
          onKeyDown: (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              requestImage();
            }
          },
          className: styles.avatarWrap({
            className: [
              isDragActive ? "ring-4 ring-accent/30" : undefined,
              isUploading ? "pointer-events-none" : undefined,
            ],
          }),
        })}
      >
        <input {...getInputProps()} />
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

      <Typography className={styles.uploadHint()}>{t("upload")}</Typography>

      <PermissionGrantSheet
        kind="camera"
        open={cameraPrimerOpen}
        onOpenChange={setCameraPrimerOpen}
        onGrant={() => {
          setCameraPrimerOpen(false);
          window.setTimeout(() => openFileDialogRef.current?.(), 180);
        }}
      />
    </section>
  );
}
