import {
  effectiveClubPermissions,
  STAFF_PERMISSIONS,
} from "./club-permissions";
import { InviteClubMemberDto } from "./dto/club-membership.dto";
import { iranianPhone } from "../../common/utils/phone.util";
describe("club role policies", () => {
  it("cannot escalate a role through custom or historical wildcard permissions", () => {
    for (const role of Object.keys(STAFF_PERMISSIONS))
      expect(effectiveClubPermissions(role, ["*", "admin", "owner"])).toEqual(
        [],
      );
    expect(
      effectiveClubPermissions("finance", ["students.read", "classes.write"]),
    ).toEqual(["students.read"]);
    expect(effectiveClubPermissions("owner", ["*"])).toEqual([]);
    expect(effectiveClubPermissions("unknown")).toEqual([]);
  });
  it("requires exactly one invitee identifier and only role-scoped grants", () => {
    expect(
      InviteClubMemberDto.schema.safeParse({
        phone: "09121234567",
        role: "coach",
        permissions: ["payments.write"],
      }).success,
    ).toBe(false);
    expect(
      InviteClubMemberDto.schema.safeParse({
        phone: "09121234567",
        role: "coach",
        permissions: ["attendance.write", "club.read"],
      }).success,
    ).toBe(true);
    expect(
      InviteClubMemberDto.schema.safeParse({ role: "coach", permissions: [] })
        .success,
    ).toBe(false);
    expect(
      InviteClubMemberDto.schema.safeParse({
        phone: "09121234567",
        userId: "66d400000000000000000001",
        role: "coach",
        permissions: [],
      }).success,
    ).toBe(false);
  });
  it("normalizes Persian and Arabic mobile digits", () => {
    expect(iranianPhone.parse("۰۹۱۲۱۲۳۴۵۶۷")).toBe("+989121234567");
    expect(iranianPhone.parse("٠٩١٢١٢٣٤٥٦٧")).toBe("+989121234567");
  });
});
