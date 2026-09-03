import type { ProfileEditField } from "./profile.types";

export const PROFILE_COVER_SRC = "/profile/cover.jpg";

export const PROFILE_AVATAR_SRC = "/profile/avatar.jpg";

export const PROFILE_EDIT_FIELDS: readonly ProfileEditField[] = [
  "name",
  "gender",
  "id-card",
  "birthdate",
];
