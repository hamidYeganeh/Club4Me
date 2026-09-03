"use client";

import { useRef } from "react";
import { Avatar, Button, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";

import { profileImageHeroSectionStyles } from "./ProfileImageHeroSection.styles";
import type { ProfileImageHeroSectionProps } from "./ProfileImageHeroSection.types";

export function ProfileImageHeroSection({
  title,
  avatarAlt,
  avatarSrc,
  fallback,
  uploadLabel,
  onUpload,
}: ProfileImageHeroSectionProps) {
  const styles = profileImageHeroSectionStyles();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className={styles.root()}>
      <Typography type="h2" align="center" className={styles.title()}>{title}</Typography>

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
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onUpload}
        />
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => inputRef.current?.click()}
        >
          {uploadLabel}
          <Icon name="arrow-upload" size={18} />
        </Button>
      </div>
    </section>
  );
}
