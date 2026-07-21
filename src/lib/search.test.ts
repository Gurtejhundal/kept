import { describe, expect, it } from "vitest";
import { memoryDate, searchScore } from "./search";
import type { Collection, SavedItem } from "./types";

const item = {
  id: "one",
  title: "Perfect study desk",
  creator: "Mira",
  handle: "@mira",
  savedAt: "2026-07-20T12:00:00.000Z",
  receivedAt: "2026-07-18T12:00:00.000Z",
  category: "Study",
  domain: "example.com",
  destinationUrl: "https://example.com",
  sourcePlatform: "Web",
  notes: "For the dorm room",
  tags: ["workspace"],
  collectionIds: ["ideas"],
  state: "active",
  sourceStatus: "unchecked",
  metadataStatus: "manual",
  spriteIndex: -1,
  variant: "standard",
  updatedAt: "2026-07-20T12:00:00.000Z",
  syncVersion: 0,
} satisfies SavedItem;

const collections = [{ id: "ideas", title: "Room ideas", description: "", updatedAt: item.savedAt, sortOrder: 0 }] satisfies Collection[];

describe("offline search ranking", () => {
  it("uses the received date as the memory date when available", () => {
    expect(memoryDate(item)).toBe(item.receivedAt);
    expect(memoryDate(item, "saved")).toBe(item.savedAt);
  });

  it("ranks an exact title above notes and searches collection names", () => {
    expect(searchScore(item, collections, "Perfect study desk")).toBeGreaterThan(searchScore(item, collections, "dorm"));
    expect(searchScore(item, collections, "Room ideas")).toBeGreaterThan(0);
  });
});
