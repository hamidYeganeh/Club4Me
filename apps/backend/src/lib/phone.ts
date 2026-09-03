import { z } from "zod";

const IRAN_MOBILE = /^9\d{9}$/;

export function normalizeIranianPhone(value: string): string {
  const trimmed = value.trim().replace(/[\s-]/g, "");

  let national: string;

  if (trimmed.startsWith("+98")) {
    national = trimmed.slice(3);
  } else if (trimmed.startsWith("0098")) {
    national = trimmed.slice(4);
  } else if (trimmed.startsWith("98")) {
    national = trimmed.slice(2);
  } else if (trimmed.startsWith("0")) {
    national = trimmed.slice(1);
  } else {
    national = trimmed;
  }

  if (national.startsWith("0")) {
    national = national.slice(1);
  }

  return national;
}

export function toE164IranianPhone(value: string): string {
  return `+98${normalizeIranianPhone(value)}`;
}

export function toLocalIranianPhone(e164: string): string {
  const national = e164.startsWith("+98")
    ? e164.slice(3)
    : normalizeIranianPhone(e164);
  return `0${national}`;
}

export const iranianPhone = z
  .string()
  .trim()
  .min(10, "Invalid phone number")
  .transform(toE164IranianPhone)
  .refine((value) => IRAN_MOBILE.test(value.slice(3)), {
    message: "Invalid phone number",
  });
