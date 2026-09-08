import assert from "node:assert/strict";
import test from "node:test";
import { getAppRouteRedirect } from "../../lib/welcome-onboarding";
import { getPostAuthPath } from "../../lib/post-auth-path";
test("first-time visitors reach shared club and payment links without losing their destination", () => {
  for (const path of [
    "/discovery/clubs/shared",
    "/payments/result",
    "/support",
  ]) {
    assert.equal(
      getAppRouteRedirect(path, { welcomeSeen: false, isAuthed: false }),
      null,
    );
  }
  assert.equal(
    getAppRouteRedirect("/", { welcomeSeen: false, isAuthed: false }),
    "/welcome",
  );
});
test("OTP-only athlete can reach their account while owner setup still requires password", () => {
  assert.equal(
    getPostAuthPath({ roles: ["athlete"], hasPassword: false }),
    "/athlete",
  );
  assert.equal(
    getPostAuthPath({ roles: ["owner"], hasPassword: false }),
    "/auth/set-password",
  );
});

import { safeReturnPath } from "../../lib/auth-return-path";
test("login return preserves local query and rejects external redirects and auth loops", () => {
  assert.equal(
    safeReturnPath("/discovery/clubs/one/slots?session=two"),
    "/discovery/clubs/one/slots?session=two",
  );
  for (const value of [
    "https://evil.test",
    "//evil.test/path",
    "/\\evil.test",
    "/auth/login",
    "/welcome",
  ])
    assert.equal(safeReturnPath(value), null);
});

test("role application pages are safe login return destinations", () => {
  for (const role of ["coach", "owner", "requests"])
    assert.equal(safeReturnPath(`/auth/roles/${role}`), `/auth/roles/${role}`);
  assert.equal(safeReturnPath("/auth/roles/unknown"), null);
  assert.equal(safeReturnPath("/auth/set-password"), null);
});
