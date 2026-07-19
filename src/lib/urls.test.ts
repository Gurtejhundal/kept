import { describe, expect, it } from "vitest";
import {
  domainFromUrl,
  extractUrls,
  isSafeWebUrl,
  normalizeUrl,
  splitSharedLinks,
} from "./urls";

describe("URL ingestion", () => {
  it("extracts, deduplicates, and trims shared links", () => {
    expect(
      extractUrls(
        "Reel https://instagram.com/reel/abc and link https://example.com/item?x=1. https://example.com/item?x=1",
      ),
    ).toEqual([
      "https://instagram.com/reel/abc",
      "https://example.com/item?x=1",
    ]);
  });

  it("rejects unsafe protocols", () => {
    expect(isSafeWebUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeWebUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeWebUrl("https://example.com")).toBe(true);
  });

  it("removes known tracking parameters", () => {
    expect(
      normalizeUrl("https://example.com/item?utm_source=ig&color=black#details"),
    ).toBe("https://example.com/item?color=black");
  });

  it("separates the reel from the destination", () => {
    expect(
      splitSharedLinks([
        "https://instagram.com/reel/abc",
        "https://example.com/item",
      ]),
    ).toEqual({
      reelUrl: "https://instagram.com/reel/abc",
      destinationUrl: "https://example.com/item",
    });
  });

  it("returns a readable domain", () => {
    expect(domainFromUrl("https://www.example.com/product")).toBe("example.com");
  });
});
