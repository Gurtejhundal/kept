import { describe, expect, it } from "vitest";
import { hasSupportedImageSignature } from "./images";

describe("image signatures", () => {
  it("accepts PNG, JPEG, and WebP signatures", () => {
    expect(hasSupportedImageSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(hasSupportedImageSignature(new Uint8Array([0xff, 0xd8, 0xff]))).toBe(true);
    expect(hasSupportedImageSignature(new TextEncoder().encode("RIFF0000WEBP"))).toBe(true);
  });

  it("rejects spoofed and SVG content", () => {
    expect(hasSupportedImageSignature(new TextEncoder().encode("<svg></svg>"))).toBe(false);
  });
});
