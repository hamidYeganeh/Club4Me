import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadVitalCatalog } from "./vital-catalog";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "vital-catalog-test-"));
  mkdirSync(join(root, "media"));
  const exercises = Array.from({ length: 50 }, (_, i) => {
    const id = String(i + 51).padStart(4, "0");
    writeFileSync(join(root, "media", `${id}.mp4`), "fixture");
    return {
      id: `vital:${id}`,
      sourceId: id,
      name: `Exercise ${id}`,
      bodyPart: "chest",
      equipment: ["machine"],
      translations: [{ description: "Fixture instructions" }],
      media: [{ localPath: `media/${id}.mp4` }],
    };
  });
  const save = () =>
    writeFileSync(join(root, "catalog.json"), JSON.stringify({ exercises }));
  save();
  return { root, exercises, save };
}
describe("Vital private exercise catalog", () => {
  it("loads 50 localized entries with local media and publisher credits", () => {
    const f = fixture(),
      result = loadVitalCatalog(f.root);
    expect(result.items).toHaveLength(50);
    expect(result.files.size).toBe(50);
    expect(result.items[0]?.name).toBe("فلای دستگاه پک‌دک");
    expect(result.items[1]?.equipment).toBe("صفحه وزنه");
    expect(
      result.items.every(
        (e) => e.animation && e.attribution?.publisher === "Vital Animations",
      ),
    ).toBe(true);
    expect(result.files.get("../../etc/passwd")).toBeUndefined();
  });
  it("refuses traversal and mismatched media identities", () => {
    const f = fixture();
    f.exercises[0]!.media[0]!.localPath = "../../private.mp4";
    f.save();
    expect(() => loadVitalCatalog(f.root)).toThrow();
    f.exercises[0]!.media[0]!.localPath = "media/0052.mp4";
    f.save();
    expect(() => loadVitalCatalog(f.root)).toThrow("Mismatched");
  });
  it("refuses duplicate ids, missing packages and incomplete snapshots", () => {
    const f = fixture();
    f.exercises[1] = f.exercises[0]!;
    f.save();
    expect(() => loadVitalCatalog(f.root)).toThrow();
    f.exercises.pop();
    f.save();
    expect(() => loadVitalCatalog(f.root)).toThrow();
    expect(() => loadVitalCatalog(join(f.root, "missing"))).toThrow();
    expect(loadVitalCatalog().items).toEqual([]);
  });
});
