const ONES = [
  "",
  "یک",
  "دو",
  "سه",
  "چهار",
  "پنج",
  "شش",
  "هفت",
  "هشت",
  "نه",
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
] as const;

const TENS = [
  "",
  "",
  "بیست",
  "سی",
  "چهل",
  "پنجاه",
  "شصت",
  "هفتاد",
  "هشتاد",
  "نود",
] as const;

const HUNDREDS = [
  "",
  "صد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
] as const;

const SCALES = ["", "هزار", "میلیون", "میلیارد", "تریلیون"] as const;

function threeDigitsToWords(value: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;

  if (hundreds > 0) parts.push(HUNDREDS[hundreds]!);
  if (remainder >= 20) {
    parts.push(TENS[Math.floor(remainder / 10)]!);
    const ones = remainder % 10;
    if (ones > 0) parts.push(ONES[ones]!);
  } else if (remainder > 0) {
    parts.push(ONES[remainder]!);
  }

  return parts.join(" و ");
}

/** Convert a non-negative integer to Persian words (e.g. 1_200_000 → «یک میلیون و دویست هزار»). */
export function numberToPersianWords(value: number): string {
  if (!Number.isFinite(value)) return "";
  const absolute = Math.floor(Math.abs(value));
  if (absolute === 0) return "صفر";

  const parts: string[] = [];
  let remaining = absolute;
  let scale = 0;

  while (remaining > 0 && scale < SCALES.length) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const scaleWord = SCALES[scale];
      // Prefer «هزار» over «یک هزار»; keep «یک میلیون» / «یک میلیارد».
      if (chunk === 1 && scale === 1) {
        parts.unshift("هزار");
      } else {
        const words = threeDigitsToWords(chunk);
        parts.unshift(scaleWord ? `${words} ${scaleWord}` : words);
      }
    }
    remaining = Math.floor(remaining / 1000);
    scale += 1;
  }

  return parts.join(" و ");
}

/**
 * Describe a rial amount in toman words for form helper text.
 * Uses the common UI convention: 10 ریال = 1 تومان.
 */
export function formatRialAsTomanWords(rial: number): string {
  if (!Number.isFinite(rial) || rial <= 0) return "صفر تومان";

  const amount = Math.floor(rial);
  const toman = Math.floor(amount / 10);
  if (toman <= 0) {
    return `${numberToPersianWords(amount)} ریال`;
  }

  return `${numberToPersianWords(toman)} تومان`;
}
