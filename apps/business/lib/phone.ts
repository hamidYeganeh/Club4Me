const IRAN_MOBILE = /^9\d{9}$/;

export function normalizeIranianPhone(value: string): string {
  const trimmed = value.trim().replace(/[\s-]/g, "");

  let national: string;

  if (trimmed.startsWith("+98")) {
    national = trimmed.slice(3);
  } else if (trimmed.startsWith("0098")) {
    national = trimmed.slice(4);
  } else if (trimmed.startsWith("98") && trimmed.replace(/\D/g, "").length >= 12) {
    national = trimmed.slice(2);
  } else if (trimmed.startsWith("0")) {
    national = trimmed.slice(1);
  } else {
    national = trimmed;
  }

  national = national.replace(/\D/g, "");

  if (national.startsWith("0")) {
    national = national.slice(1);
  }

  return national;
}

export function toE164IranianPhone(value: string): string {
  return `+98${normalizeIranianPhone(value)}`;
}

export function isValidIranianPhone(value: string): boolean {
  return IRAN_MOBILE.test(normalizeIranianPhone(value));
}

export function maskIranianPhone(value: string): string {
  const local = `0${normalizeIranianPhone(value)}`;
  return `••${local.slice(-4)}`;
}

export function formatIranianPhoneDisplay(value: string): string {
  const compact = value.replace(/[\s-]/g, "");

  if (
    compact === "+" ||
    compact === "+9" ||
    compact === "+98" ||
    compact === "00" ||
    compact === "009" ||
    compact === "0098"
  ) {
    return compact;
  }

  let digits = compact.replace(/\D/g, "");

  if (compact.startsWith("+98")) {
    digits = compact.slice(3).replace(/\D/g, "");
  } else if (compact.startsWith("0098")) {
    digits = compact.slice(4).replace(/\D/g, "");
  } else if (digits.startsWith("98") && digits.length >= 12) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("9")) {
    digits = `0${digits}`;
  }

  digits = digits.slice(0, 11);

  if (digits.length <= 4) {
    return digits;
  }

  if (digits.length <= 8) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }

  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
}
