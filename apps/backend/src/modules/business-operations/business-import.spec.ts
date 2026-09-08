import { BusinessOperationsService } from "./business-operations.service";
import { ImportOperationsDto } from "./business-operations.dto";
import { AppError } from "../../common/errors/app.exception";

describe("business import recovery", () => {
  const input = () =>
    ImportOperationsDto.schema.parse({
      kind: "students",
      templateVersion: 1,
      dryRun: false,
      rows: ["09120000001", "09120000002", "09120000003"].map((phone) => ({
        firstName: "سارا",
        lastName: "محمدی",
        phone,
      })),
    });
  function fixture() {
    const service = Object.create(
      BusinessOperationsService.prototype,
    ) as BusinessOperationsService;
    jest.spyOn(service as any, "club").mockResolvedValue("club");
    return service;
  }
  it("reports committed rows and the precise failed spreadsheet row, then continues", async () => {
    const service = fixture();
    const create = jest
      .spyOn(service, "createStudent")
      .mockResolvedValueOnce({} as never)
      .mockRejectedValueOnce(
        new AppError(409, "STUDENT_PHONE_EXISTS", "Duplicate phone"),
      )
      .mockResolvedValueOnce({} as never);
    const result = await service.importData("owner", "club", "owner", input());
    expect(create).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({
      dryRun: false,
      total: 3,
      imported: 2,
      errors: [{ row: 3, message: "STUDENT_PHONE_EXISTS: Duplicate phone" }],
    });
  });
  it("does not expose infrastructure errors or report uncertain writes as successful", async () => {
    const service = fixture();
    jest
      .spyOn(service, "createStudent")
      .mockRejectedValue(new Error("private database host"));
    const result = await service.importData("owner", "club", "owner", input());
    expect(result).toMatchObject({ imported: 0 });
    expect(result.errors).toHaveLength(3);
    expect(JSON.stringify(result)).not.toContain("private database host");
  });
  it("rejects invalid input before writing any row", async () => {
    const service = fixture();
    const create = jest.spyOn(service, "createStudent");
    const data = input();
    data.rows![1]!.firstName = "";
    const result = await service.importData("owner", "club", "owner", data);
    expect(result.dryRun).toBe(true);
    expect(result.errors[0]?.row).toBe(3);
    expect(create).not.toHaveBeenCalled();
  });
});
