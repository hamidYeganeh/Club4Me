import { UpdateProfileSchema } from "./update-profile.dto";

describe("UpdateProfileSchema", () => {
  it("accepts individual profile fields", () => {
    expect(UpdateProfileSchema.parse({ gender: "female" })).toEqual({
      gender: "female",
    });
    expect(UpdateProfileSchema.parse({ activityLevel: "normal" })).toEqual({
      activityLevel: "normal",
    });
    expect(UpdateProfileSchema.parse({ idCard: "0012345678" })).toEqual({
      idCard: "0012345678",
    });
    expect(
      UpdateProfileSchema.parse({
        avatarUrl: "data:image/png;base64,aGVsbG8=",
      }),
    ).toEqual({ avatarUrl: "data:image/png;base64,aGVsbG8=" });
  });

  it("rejects unsafe avatar URLs", () => {
    expect(() =>
      UpdateProfileSchema.parse({ avatarUrl: "https://example.com/me.png" }),
    ).toThrow();
    expect(() =>
      UpdateProfileSchema.parse({
        avatarUrl: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
      }),
    ).toThrow();
  });

  it("requires a description for the other gender choice", () => {
    expect(() => UpdateProfileSchema.parse({ gender: "other" })).toThrow();
    expect(
      UpdateProfileSchema.parse({
        gender: "other",
        genderDescription: "ترجیح شخصی",
      }),
    ).toEqual({
      gender: "other",
      genderDescription: "ترجیح شخصی",
    });
  });

  it("rejects empty updates and unknown choice values", () => {
    expect(() => UpdateProfileSchema.parse({})).toThrow();
    expect(() =>
      UpdateProfileSchema.parse({ activityLevel: "sometimes" }),
    ).toThrow();
  });
});
