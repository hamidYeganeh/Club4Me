import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { RolesGuard } from "../auth/guards/roles.guard";
import { ROLES_KEY } from "../auth/decorators/roles.decorator";
import { ResourcesController } from "./resources.controller";

describe("Resources authorization", () => {
  it("marks every resource endpoint as admin-only", () => {
    expect(Reflect.getMetadata(ROLES_KEY, ResourcesController)).toEqual([
      "admin",
    ]);
  });

  it("returns a 403 application error for an authenticated non-admin", () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => ResourcesController.prototype.list,
      getClass: () => ResourcesController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: ["athlete"] } }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(
      expect.objectContaining({ status: 403, code: "FORBIDDEN" }),
    );
  });
});
