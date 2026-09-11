import { Types } from "mongoose";
import { withReferenceSummaries } from "./reference-summaries";
describe("reference summaries", () => {
  it("batches duplicate references, projects only approved fields and represents missing relations as null", async () => {
    const id = new Types.ObjectId();
    const missing = new Types.ObjectId();
    const find = jest
      .fn()
      .mockReturnValue({ toArray: async () => [{ _id: id, name: "باشگاه" }] });
    const connection = { collection: jest.fn().mockReturnValue({ find }) };
    const rows = await withReferenceSummaries(
      connection as never,
      [
        { clubId: String(id) },
        { clubId: String(id) },
        { clubId: String(missing) },
      ],
      [{ field: "clubId", as: "club", collection: "clubs", fields: ["name"] }],
    );
    expect(find).toHaveBeenCalledTimes(1);
    expect(find.mock.calls[0][0]._id.$in).toHaveLength(2);
    expect(find.mock.calls[0][1]).toEqual({ projection: { name: 1 } });
    expect(rows[0]).toEqual({
      clubId: String(id),
      club: { id: String(id), name: "باشگاه" },
    });
    expect(rows[2]!.club).toBeNull();
    expect(JSON.stringify(rows)).not.toContain('"_id"');
  });
});
