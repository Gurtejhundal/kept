import { describe, expect, it } from "vitest";
import { isExpiredTrashItem, migrateLegacyState, normalizeSavedItem } from "./archive-db";
import type { SavedItem } from "./types";

describe("archive data migration", () => {
  it("migrates reel fields to general source fields", () => {
    const item = normalizeSavedItem({
      id: "legacy",
      title: "Legacy save",
      destinationUrl: "https://example.com/item",
      reelUrl: "https://instagram.com/reel/legacy",
      reelStatus: "deleted",
      state: "active",
    });
    expect(item).toMatchObject({
      sourcePlatform: "Instagram",
      sourceStatus: "unavailable",
      sourceUrl: "https://instagram.com/reel/legacy",
    });
  });

  it("drops invalid items and removes collection item mirrors", () => {
    const migrated = migrateLegacyState(JSON.stringify({
      items: [
        { id: "kept", title: "Kept", destinationUrl: "https://example.com", state: "active" },
        { id: "unsafe", title: "Unsafe", destinationUrl: "javascript:alert(1)" },
      ],
      collections: [{ id: "ideas", title: "Ideas", itemIds: ["kept"], shared: true }],
      density: "list",
      theme: "dark",
    }));
    expect(migrated.items).toHaveLength(1);
    expect(migrated.collections).toEqual([{ id: "ideas", title: "Ideas", description: "", updatedAt: expect.any(String), sortOrder: 0 }]);
    expect(migrated.preferences).toMatchObject({ density: "list", theme: "dark" });
  });

  it("repairs malformed persisted dates", () => {
    const item = normalizeSavedItem({
      id: "bad-date",
      title: "Date repaired",
      destinationUrl: "https://example.com",
      savedAt: "not-a-date",
      state: "trashed",
      trashedAt: "also-not-a-date",
    });
    expect(Number.isFinite(new Date(item?.savedAt ?? "").getTime())).toBe(true);
    expect(Number.isFinite(new Date(item?.trashedAt ?? "").getTime())).toBe(true);
  });

  it("expires trashed items only after the 30-day retention window", () => {
    const item = normalizeSavedItem({
      id: "trashed",
      title: "Trashed item",
      destinationUrl: "https://example.com",
      state: "trashed",
      savedAt: "2026-01-01T00:00:00.000Z",
      trashedAt: "2026-01-10T00:00:00.000Z",
    }) as SavedItem;
    expect(isExpiredTrashItem(item, new Date("2026-02-08T23:59:59.000Z").getTime())).toBe(false);
    expect(isExpiredTrashItem(item, new Date("2026-02-09T00:00:00.000Z").getTime())).toBe(true);
  });
});
