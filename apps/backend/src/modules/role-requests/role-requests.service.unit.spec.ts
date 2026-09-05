import type { UsersRepository } from "../users/users.repository";
import type { PublicRoleRequest } from "./mappers/role-request.mapper";
import type { RoleRequestsRepository } from "./role-requests.repository";
import { RoleRequestsService } from "./role-requests.service";

const ownerRequest: PublicRoleRequest = {
  id: "507f1f77bcf86cd799439011",
  userId: "507f1f77bcf86cd799439012",
  phone: "+989121234567",
  role: "owner",
  details: {
    displayName: "مالک تست",
    city: "تهران",
    businessName: "باشگاه تست",
    businessType: "باشگاه",
    description: "مدیریت یک مجموعه ورزشی فعال را بر عهده دارم.",
  },
  status: "approved",
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-03T00:00:00.000Z",
};

describe("RoleRequestsService review flow", () => {
  const roleRequestsRepository = {
    decidePending: jest.fn(),
    restorePending: jest.fn(),
  };
  const usersRepository = {
    grantRole: jest.fn(),
  };
  const service = new RoleRequestsService(
    roleRequestsRepository as unknown as RoleRequestsRepository,
    usersRepository as unknown as UsersRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("grants the requested role after approval", async () => {
    roleRequestsRepository.decidePending.mockResolvedValue(ownerRequest);
    usersRepository.grantRole.mockResolvedValue(undefined);

    await expect(
      service.decideForAdmin(["admin"], ownerRequest.id, "approved"),
    ).resolves.toEqual(ownerRequest);
    expect(usersRepository.grantRole).toHaveBeenCalledWith(
      ownerRequest.userId,
      "owner",
    );
  });

  it("does not grant a role after rejection", async () => {
    const rejected = { ...ownerRequest, status: "rejected" as const };
    roleRequestsRepository.decidePending.mockResolvedValue(rejected);

    await expect(
      service.decideForAdmin(["admin"], ownerRequest.id, "rejected"),
    ).resolves.toEqual(rejected);
    expect(usersRepository.grantRole).not.toHaveBeenCalled();
  });

  it("restores pending status if granting the role fails", async () => {
    const failure = new Error("database unavailable");
    roleRequestsRepository.decidePending.mockResolvedValue(ownerRequest);
    usersRepository.grantRole.mockRejectedValue(failure);

    await expect(
      service.decideForAdmin(["admin"], ownerRequest.id, "approved"),
    ).rejects.toBe(failure);
    expect(roleRequestsRepository.restorePending).toHaveBeenCalledWith(
      ownerRequest.id,
      "approved",
    );
  });

  it("rejects review attempts by non-admin users", async () => {
    await expect(
      service.decideForAdmin(["athlete"], ownerRequest.id, "approved"),
    ).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(roleRequestsRepository.decidePending).not.toHaveBeenCalled();
  });
});
