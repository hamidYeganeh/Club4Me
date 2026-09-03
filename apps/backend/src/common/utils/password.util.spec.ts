import { hashPassword, verifyPassword } from "./password.util";

describe("password.util", () => {
  it("hashes with a unique salt and verifies with timing-safe comparison", async () => {
    const first = await hashPassword("secret-pass");
    const second = await hashPassword("secret-pass");

    expect(first).not.toBe(second);
    expect(first.startsWith("scrypt:")).toBe(true);
    await expect(verifyPassword("secret-pass", first)).resolves.toBe(true);
    await expect(verifyPassword("secret-pass", second)).resolves.toBe(true);
    await expect(verifyPassword("wrong-pass", first)).resolves.toBe(false);
  });

  it("rejects malformed stored hashes", async () => {
    await expect(verifyPassword("secret-pass", "bcrypt:nope")).resolves.toBe(
      false,
    );
  });
});
