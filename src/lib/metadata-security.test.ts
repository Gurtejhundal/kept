import { describe, expect, it } from "vitest";
import { assertPublicHttpUrl, isPrivateAddress } from "./metadata-security";

describe("metadata URL security", () => {
  it("blocks loopback, link-local, and private ranges", () => {
    ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.1.1", "::1", "localhost"].forEach((address) => expect(isPrivateAddress(address)).toBe(true));
  });

  it("rejects unsafe schemes and embedded credentials", () => {
    expect(() => assertPublicHttpUrl("file:///etc/passwd")).toThrow();
    expect(() => assertPublicHttpUrl("https://user:pass@example.com")).toThrow();
    expect(assertPublicHttpUrl("https://example.com/article").hostname).toBe("example.com");
  });
});
