export function normalizeNumberInput(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => String(digit.charCodeAt(0) - (digit <= "٩" ? 0x660 : 0x6f0)))
    .replace(/٫/g, ".").replace(/−/g, "-");
}

export function numberInputError(value: string, min?: number | string, max?: number | string, step: number | string = 1, base = 0) {
  if (!value) return "";
  const n = Number(value);
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(value) || !Number.isFinite(n)) return "یک عدد معتبر وارد کنید.";
  if (min !== undefined && n < Number(min)) return `کمترین مقدار ${Number(min).toLocaleString("fa-IR")} است.`;
  if (max !== undefined && n > Number(max)) return `بیشترین مقدار ${Number(max).toLocaleString("fa-IR")} است.`;
  if (step !== "any" && Number(step) > 0) {
    const offset = (n - (min !== undefined ? Number(min) : base)) / Number(step);
    if (Math.abs(offset - Math.round(offset)) > 1e-7) return `مقدار را با گام ${Number(step).toLocaleString("fa-IR")} وارد کنید.`;
  }
  return "";
}
