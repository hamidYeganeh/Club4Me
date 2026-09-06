import { model, Types } from "mongoose";
import { UserLocationFieldsSchema } from "./create-user-location.dto";
import { UserLocationSchema } from "../schemas/user-location.schema";

const id = new Types.ObjectId().toHexString();
const input = {
  title: "خانه",
  countryId: id,
  provinceId: id,
  cityId: id,
  latitude: 35.7,
  longitude: 51.4,
};

describe("optional user location address", () => {
  it.each([undefined, "", "   "])(
    "accepts an absent or blank address: %s",
    (address) => {
      const parsed = UserLocationFieldsSchema.parse({ ...input, address });
      expect(parsed.address ?? "").toBe("");
    },
  );
  it("retains the maximum address length", () => {
    expect(
      UserLocationFieldsSchema.safeParse({ ...input, address: "x".repeat(301) })
        .success,
    ).toBe(false);
  });
  it("persists an empty address without required-string validation", () => {
    const Location = model("OptionalAddressValidation", UserLocationSchema);
    const document = new Location({
      userId: id,
      title: "خانه",
      geo: { countryId: id, provinceId: id, cityId: id },
      location: { type: "Point", coordinates: [51.4, 35.7] },
      slot: 0,
    });
    expect(document.validateSync()).toBeUndefined();
    expect(document.address).toBe("");
  });
});
