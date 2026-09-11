import {
  recommendationMismatches,
  recommendationPreferencesSchema,
} from "./recommendation-preferences";
const now = Date.parse("2026-09-11T00:00:00Z");
const base = {
  price: 3000000,
  currency: "IRR",
  level: "مبتدی",
  sport: "یوگا",
  remainingCapacity: 1,
  distanceKm: 2,
  sessions: [
    {
      startsAt: "2026-09-12T15:30:00Z",
      endsAt: "2026-09-12T16:30:00Z",
      status: "scheduled",
    },
  ],
};
it("matches the complete class window in Tehran, including end time", () => {
  const p = recommendationPreferencesSchema.parse({
    weekdays: [0],
    timeFrom: "19:00",
    timeTo: "20:00",
  });
  expect(recommendationMismatches(base, p, now)).toEqual([]);
  expect(
    recommendationMismatches(
      {
        ...base,
        sessions: [
          ...base.sessions,
          {
            ...base.sessions[0]!,
            startsAt: "2026-09-13T15:30:00Z",
            endsAt: "2026-09-13T16:30:00Z",
          },
        ],
      },
      p,
      now,
    ),
  ).toHaveLength(1);
  expect(
    recommendationMismatches(base, { ...p, timeTo: "19:30" }, now),
  ).toHaveLength(1);
});
it("never claims unknown distance, a different currency or full capacity is an exact match", () => {
  const p = recommendationPreferencesSchema.parse({
    maxPrice: 5000000,
    radiusKm: 5,
  });
  expect(
    recommendationMismatches(
      { ...base, currency: "USD", distanceKm: null, remainingCapacity: 0 },
      p,
      now,
    ),
  ).toHaveLength(3);
  expect(recommendationMismatches(base, { ...p, level: "مبتدي" }, now)).toEqual(
    [],
  );
});
it("rejects impossible time windows and invalid numeric budgets", () => {
  expect(
    recommendationPreferencesSchema.safeParse({
      timeFrom: "22:00",
      timeTo: "08:00",
    }).success,
  ).toBe(false);
  expect(
    recommendationPreferencesSchema.safeParse({ maxPrice: -1 }).success,
  ).toBe(false);
});
