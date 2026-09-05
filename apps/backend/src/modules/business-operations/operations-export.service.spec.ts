import { Types } from "mongoose";

import { OperationsExportService } from "./operations-export.service";

describe("OperationsExportService", () => {
  it("renders a queued export and stores it outside MongoDB", async () => {
    const job = {
      _id: new Types.ObjectId(),
      actorId: new Types.ObjectId(),
      clubId: new Types.ObjectId(),
      kind: "students",
      format: "csv",
      status: "processing",
      storageKey: null,
      filename: null,
      mimeType: null,
      sizeBytes: null,
      error: "",
      startedAt: new Date(),
      completedAt: null,
      expiresAt: null,
      createdAt: new Date(),
      save: jest.fn(),
    };
    const jobs = {
      updateMany: jest.fn(),
      updateOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
      findOneAndUpdate: jest.fn().mockResolvedValue(job),
    };
    const storage = { store: jest.fn() };
    const service = new OperationsExportService(
      jobs as never,
      {} as never,
      {
        exportData: jest.fn().mockResolvedValue({
          filename: "students.csv",
          mimeType: "text/csv;charset=utf-8",
          content: "name\nMahdi",
          encoding: "utf8",
        }),
      } as never,
      storage as never,
      { eval: jest.fn().mockResolvedValue(1) } as never,
      { env: { NODE_ENV: "test", EXPORT_TTL_HOURS: 24 } } as never,
    );

    const result = await service.run();

    expect(result).toEqual({ skipped: false, processed: 1 });
    expect(storage.store).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^${String(job.clubId)}/.+\\.csv$`)),
      Buffer.from("name\nMahdi"),
      "text/csv;charset=utf-8",
    );
    expect(job.status).toBe("ready");
    expect(job.save).toHaveBeenCalledTimes(1);
  });
});
