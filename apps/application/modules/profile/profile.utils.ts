import type { AccountUser } from "@api/account";

import { PROFILE_EDIT_FIELDS } from "./profile.constants";
import type { ProfileEditField, ProfileRole } from "./profile.types";

export function getProfileDisplayName(
  user: AccountUser | null | undefined,
  fallback: string,
): string {
  return getProfileFullName(user) || fallback;
}

export function getProfileFullName(
  user: AccountUser | null | undefined,
): string | null {
  const name = [user?.firstName, user?.lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ")
    .trim();

  return name || null;
}

export function getProfileInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "ک";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join("");
}

export function isProfileEditField(value: string): value is ProfileEditField {
  return PROFILE_EDIT_FIELDS.includes(value as ProfileEditField);
}

export function getProfileEditFieldParams(): Array<{ field: ProfileEditField }> {
  return PROFILE_EDIT_FIELDS.map((field) => ({ field }));
}

export function getProfileEditHref(role: ProfileRole, field: ProfileEditField): string {
  return `/${role}/profile/edit/${field}`;
}

export function getProfileEditFieldLabelKey(
  field: ProfileEditField,
): "editName" | "editGender" | "editIdCard" | "editBirthdate" {
  switch (field) {
    case "name":
      return "editName";
    case "gender":
      return "editGender";
    case "id-card":
      return "editIdCard";
    case "birthdate":
      return "editBirthdate";
  }
}

export function formatProfileBirthdate(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const dateOnly = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);

  if (match) {
    return `${match[3]} / ${match[2]} / ${match[1]}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${day} / ${month} / ${year}`;
}
