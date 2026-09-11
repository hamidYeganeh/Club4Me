import {
  CreateDiscoverySectionDto,
  UpdateDiscoverySectionDto,
} from "./discovery-section.dto";

describe("discovery section patches", () => {
  it("does not reset banners or placement when toggling publication", () => {
    expect(UpdateDiscoverySectionDto.schema.parse({ enabled: true })).toEqual({
      enabled: true,
    });
  });
  it("does not reset other fields when changing placement", () => {
    expect(
      UpdateDiscoverySectionDto.schema.parse({ placement: "coach-home" }),
    ).toEqual({ placement: "coach-home" });
  });
  it("retains discovery as the default for newly created legacy sections", () => {
    expect(
      CreateDiscoverySectionDto.schema.parse({
        key: "new",
        title: "New",
        type: "banners",
      }).placement,
    ).toBe("discovery");
  });
  it("rejects an unsupported banner placement", () => {
    expect(
      UpdateDiscoverySectionDto.schema.safeParse({ placement: "admin" })
        .success,
    ).toBe(false);
  });
});
