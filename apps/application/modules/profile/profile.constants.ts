import type { ProfileEditField } from "./profile.types";
import { FALLBACK_IMAGE_SRC } from "@ui/fallback-image";

export const PROFILE_COVER_SRC = "/profile/cover.jpg";

export const PROFILE_AVATAR_SRC = FALLBACK_IMAGE_SRC;

export const PROFILE_EDIT_FIELDS: readonly ProfileEditField[] = [
  "name",
  "gender",
  "id-card",
  "birthdate",
];
