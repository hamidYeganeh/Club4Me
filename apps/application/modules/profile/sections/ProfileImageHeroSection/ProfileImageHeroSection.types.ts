import type { ChangeEventHandler } from "react";

export type ProfileImageHeroSectionProps = {
  title: string;
  avatarAlt: string;
  avatarSrc: string | null;
  fallback: string;
  uploadLabel: string;
  onUpload: ChangeEventHandler<HTMLInputElement>;
};
