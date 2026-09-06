import { prepareMedia } from "./media.service";

describe("prepareMedia", () => {
  it("returns a SHA-256 hash of decoded media bytes", () => {
    expect(prepareMedia("data:image/png;base64,aGVsbG8=", "IMAGE/PNG")).toEqual(
      {
        url: "data:image/png;base64,aGVsbG8=",
        mimeType: "image/png",
        hash: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
        byteSize: 5,
      },
    );
  });

  it("normalizes external URLs before hashing", () => {
    const first = prepareMedia(
      " https://example.com/image.jpg ",
      " IMAGE/JPEG ",
    );
    const second = prepareMedia("https://example.com/image.jpg", "image/jpeg");

    expect(first).toEqual(second);
  });
});
