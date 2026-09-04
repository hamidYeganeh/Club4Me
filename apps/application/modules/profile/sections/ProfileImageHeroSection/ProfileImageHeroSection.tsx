"use client";

import { Avatar, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { imageUploaderAccept, Uploader } from "@ui/uploader";
import { useTranslations } from "next-intl";

import { profileImageHeroSectionStyles } from "./ProfileImageHeroSection.styles";
import type { ProfileImageHeroSectionProps } from "./ProfileImageHeroSection.types";

export function ProfileImageHeroSection({
  title,
  avatarAlt,
  avatarSrc,
  fallback,
  onFile,
}: ProfileImageHeroSectionProps) {
  const styles = profileImageHeroSectionStyles();
  const t = useTranslations("uploader");

  return (
    <section className={styles.root()}>
      <Typography type="h2" align="center" className={styles.title()}>
        {title}
      </Typography>

      <div className={styles.avatarWrap()}>
        <Avatar className={styles.avatar()}>
          {avatarSrc ? (
            <Avatar.Image alt={avatarAlt} src={avatarSrc} />
          ) : null}
          <Avatar.Fallback className={styles.avatarFallback()}>
            {avatarSrc ? fallback : <Icon name="user" size={56} />}
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
        />
      </div>
    </section>
  );
}
