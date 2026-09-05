"use client";

import { useRef, useState } from "react";
import { Avatar, Typography } from "@heroui/react";
import { FALLBACK_IMAGE_SRC, resolveImageSrc } from "@ui/fallback-image";
import { imageUploaderAccept, Uploader } from "@ui/uploader";
import { useTranslations } from "next-intl";

import { profileImageHeroSectionStyles } from "./ProfileImageHeroSection.styles";
import type { ProfileImageHeroSectionProps } from "./ProfileImageHeroSection.types";
import { PermissionGrantSheet } from "@/components/permissions/permission-grant-sheet";

export function ProfileImageHeroSection({
  title,
  avatarAlt,
  avatarSrc,
  onFile,
}: ProfileImageHeroSectionProps) {
  const styles = profileImageHeroSectionStyles();
  const t = useTranslations("uploader");
  const [cameraPrimerOpen, setCameraPrimerOpen] = useState(false);
  const openFileDialogRef = useRef<(() => void) | null>(null);

  return (
    <section className={styles.root()}>
      <Typography type="h2" align="center" className={styles.title()}>
        {title}
      </Typography>

      <div className={styles.avatarWrap()}>
        <Avatar className={styles.avatar()}>
          <Avatar.Image alt={avatarAlt} src={resolveImageSrc(avatarSrc)} />
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
      </div>

      <div className={styles.actions()}>
        <Uploader
          multiple={false}
          accept={imageUploaderAccept}
          labels={{
            clickToUpload: t("clickToUpload"),
            dropHint: t("dropHint"),
            formats: t("formats"),
            progress: t("progress"),
            success: t("success"),
            error: t("error"),
            retry: t("retry"),
            remove: t("remove"),
            dropzoneAria: t("dropzoneAria"),
          }}
          onDrop={(files) => {
            const file = files[0];
            if (file) {
              onFile(file);
            }
          }}
          onBrowseRequest={(openFileDialog) => {
            openFileDialogRef.current = openFileDialog;
            setCameraPrimerOpen(true);
          }}
        />
      </div>

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
