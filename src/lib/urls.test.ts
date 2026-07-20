import { describe, expect, it } from "vitest";
import {
  domainFromUrl,
  detectSourcePlatform,
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

  it("separates a source post from its destination", () => {
    expect(
      splitSharedLinks([
        "https://instagram.com/reel/abc",
        "https://example.com/item",
      ]),
    ).toEqual({
      destinationUrl: "https://example.com/item",
      sourcePlatform: "Instagram",
      sourceUrl: "https://instagram.com/reel/abc",
    });
  });

  it("does not duplicate a single destination as an original post", () => {
    expect(splitSharedLinks(["https://example.com/article"])).toEqual({
      destinationUrl: "https://example.com/article",
      sourcePlatform: "Web",
      sourceUrl: "",
    });
  });

  it("detects common sharing platforms", () => {
    expect(detectSourcePlatform("https://www.tiktok.com/@kept/video/1")).toBe("TikTok");
    expect(detectSourcePlatform("https://youtu.be/example")).toBe("YouTube");
    expect(detectSourcePlatform("https://example.com/article")).toBe("Web");
  });

  it("returns a readable domain", () => {
    expect(domainFromUrl("https://www.example.com/product")).toBe("example.com");
  });
});
