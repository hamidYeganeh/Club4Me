import {
  iranianPhone,
  normalizeIranianPhone,
  toE164IranianPhone,
  toLocalIranianPhone,
} from "./phone.util";

describe("phone.util", () => {
  const accepted = [
    "+989121234567",
    "00989121234567",
    "989121234567",
    "09121234567",
    "9121234567",
  ];

  it.each(accepted)("normalizes %s to E.164", (input) => {
    expect(toE164IranianPhone(input)).toBe("+989121234567");
    expect(iranianPhone.parse(input)).toBe("+989121234567");
  });

  it("stores the national number without country prefix", () => {
    expect(normalizeIranianPhone("09121234567")).toBe("9121234567");
  });

  it("converts E.164 to the SMS local format", () => {
    expect(toLocalIranianPhone("+989121234567")).toBe("09121234567");
  });

  it("rejects invalid numbers", () => {
    expect(iranianPhone.safeParse("12345").success).toBe(false);
    expect(iranianPhone.safeParse("08121234567").success).toBe(false);
  });
});
