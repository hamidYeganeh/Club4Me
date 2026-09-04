import { compareAppVersions, isAppVersion } from "./app-version";

describe("app version", () => {
  it.each([
    ["1.0", "1.0.0", 0],
    ["2.10.0", "2.9.0", 1],
    ["1.8.4", "2.0.0", -1],
  ])("compares %s with %s", (left, right, expected) => {
    expect(compareAppVersions(left, right)).toBe(expected);
  });

  it.each(["1", "1.2.3.4", "v1.2.3", "1.2-beta"])(
    "rejects invalid version %s",
    (version) => expect(isAppVersion(version)).toBe(false),
  );
});
