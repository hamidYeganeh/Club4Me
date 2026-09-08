import { classDecisionFilters } from "./class-decision-filters";
import { businessClassCatalogQuery } from "./business-class-catalog-query";

describe("class budget and delivery filters", () => {
  it("compares Iranian rial amounts using each model's actual price fields", () => {
    expect(
      classDecisionFilters({
        minPrice: "0",
        maxPrice: "200000",
        serviceMode: "online",
      }),
    ).toEqual({
      "price.amount": { $gte: 0, $lte: 200000 },
      "price.currency": "IRR",
      deliveryMode: "online",
    });
    expect(
      businessClassCatalogQuery({ minPrice: "100000", serviceMode: "club" })
        .filter,
    ).toMatchObject({
      price: { $gte: 100000 },
      currency: "IRR",
      visibility: "public",
      status: "active",
    });
  });
  it("does not return an in-club business class for an online search", () => {
    expect(classDecisionFilters({ serviceMode: "online" }, true)).toEqual({
      _id: { $in: [] },
    });
  });
  it("filters both class models by admission and their actual start field", () => {
    const skillLevelId = "66d400000000000000000099";
    expect(
      classDecisionFilters({
        admission: "requires_approval",
        startsFrom: "2026-09-01",
        startsTo: "2026-09-30",
        skillLevelId,
      }),
    ).toMatchObject({
      enrollmentMode: "requires_approval",
      courseStartAt: { $gte: expect.any(Date), $lte: expect.any(Date) },
      skillLevelId: expect.objectContaining({}),
    });
    expect(
      classDecisionFilters(
        {
          startsFrom: "2026-09-01",
          skillLevelId,
          legacyLevel: "متوسط",
        },
        true,
      ),
    ).toMatchObject({ startDate: { $gte: expect.any(Date) } });
  });
  it.each([
    { minPrice: "-1" },
    { maxPrice: "1.5" },
    { maxPrice: "NaN" },
    { maxPrice: "9007199254740992" },
    { minPrice: "" },
    { minPrice: "2", maxPrice: "1" },
    { serviceMode: "invalid" },
    { admission: "invalid" },
    { skillLevelId: "invalid" },
    { startsFrom: "1405/06/01" },
    { startsFrom: "2026-10-01", startsTo: "2026-09-01" },
  ])("rejects malformed or reversed decision filters %j", (query) => {
    expect(() => classDecisionFilters(query)).toThrow();
  });
});
