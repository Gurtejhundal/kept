"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleX,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { CollectionsView } from "./collections-view";
import { DetailPanel } from "./detail-panel";
import { HomeView } from "./home-view";
import { MemoryCard } from "./memory-card";
import { MobileNav } from "./mobile-nav";
import { type NewItemInput, SaveComposer } from "./save-composer";
import { SettingsView, type StorageEstimate } from "./settings-view";
import { Sidebar } from "./sidebar";
import {
  clearLocalArchive,
  consumePendingShare,
  deleteCollectionPermanently,
  deleteItemPermanently,
  getAssetBlob,
  getStorageEstimate,
  loadArchive,
  persistCollection,
  persistItem,
  persistItems,
  persistPreferences,
  replaceItemThumbnail,
  requestPersistentStorage,
} from "@/lib/archive-db";
import { validateAndOptimizeImage } from "@/lib/images";
import { memoryDate, searchScore } from "@/lib/search";
import {
  categories,
  sourcePlatforms,
  type ArchivePreferences,
  type Category,
  type Collection,
  type DateFilter,
  type DateBasis,
  type Density,
  type ItemState,
  type SavedItem,
  type SortOrder,
  type SourcePlatform,
  type SourceStatus,
  type Theme,
  type ViewId,
} from "@/lib/types";
import { domainFromUrl, extractUrls, splitSharedLinks } from "@/lib/urls";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { syncArchive } from "@/lib/sync";
import type { User } from "@supabase/supabase-js";

interface ToastState {
  message: string;
  undo?: () => Promise<void> | void;
}

interface SharedCapture {
  media?: Blob;
  text?: string;
  title?: string;
  url?: string;
}

interface KeptAppProps {
  sharedCapture?: SharedCapture;
}

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function groupLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

function withinDateFilter(value: string, filter: DateFilter, customStart: string, customEnd: string) {
  if (filter === "all") return true;
  const date = new Date(value);
  const now = new Date();
  if (filter === "today") return sameDay(date, now);
  const difference = now.getTime() - date.getTime();
  if (filter === "week") return difference <= 7 * 86_400_000;
  if (filter === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  const timestamp = date.getTime();
  const start = customStart ? new Date(`${customStart}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const end = customEnd ? new Date(`${customEnd}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  return timestamp >= start && timestamp <= end;
}

const viewCopy: Record<Exclude<ViewId, "home" | "collections" | "settings">, { eyebrow: string; title: string; description: string }> = {
  search: {
    eyebrow: "SEARCH",
    title: "What do you remember?",
    description: "Search across titles, creators, platforms, notes, and dates.",
  },
  all: {
    eyebrow: "ALL SAVES",
    title: "Your complete archive",
    description: "A chronological library with sorting and bulk management.",
  },
  archive: {
    eyebrow: "ARCHIVE",
    title: "Put away, not forgotten",
    description: "Older finds stay searchable and keep their original context.",
  },
  trash: {
    eyebrow: "TRASH",
    title: "Recently removed",
    description: "Items are permanently removed from this device 30 days after they enter trash.",
  },
};

const EMPTY_STORAGE: StorageEstimate = { persisted: false, quota: 0, usage: 0 };
const RESURFACE_BEFORE = Date.now() - 14 * 86_400_000;

export function KeptApp({ sharedCapture }: KeptAppProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | null>(null);
  const shareProcessed = useRef(false);
  const notificationTriggerRef = useRef<HTMLButtonElement | null>(null);
  const notificationPopoverRef = useRef<HTMLElement>(null);
  const thumbnailUrlsRef = useRef<Record<string, string>>({});

  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [activeView, setActiveView] = useState<ViewId>("home");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [dateBasis, setDateBasis] = useState<DateBasis>("memory");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<SourcePlatform | "all">("all");
  const [creatorFilter, setCreatorFilter] = useState("");
  const [sourceStatusFilter, setSourceStatusFilter] = useState<SourceStatus | "all">("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [density, setDensity] = useState<Density>("grid");
  const [theme, setTheme] = useState<Theme>("system");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerSharedText, setComposerSharedText] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [storage, setStorage] = useState<StorageEstimate>(EMPTY_STORAGE);
  const [storageError, setStorageError] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingCapture, setPendingCapture] = useState<SharedCapture | undefined>(sharedCapture);
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState("");

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  const refreshStorage = useCallback(async () => {
    setStorage(await getStorageEstimate());
  }, []);

  const showToast = useCallback((message: string, undo?: () => Promise<void> | void) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ message, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), 4800);
  }, []);

  const preferences = useMemo<ArchivePreferences>(() => ({ density, recentSearches, theme }), [density, recentSearches, theme]);

  const savePreferences = useCallback(async (next: ArchivePreferences) => {
    try {
      await persistPreferences(next);
      setStorageError("");
    } catch {
      setStorageError("Kept could not persist your preferences. Export your archive before closing this tab.");
    }
  }, []);

  const applySnapshot = useCallback(async () => {
    const snapshot = await loadArchive();
    Object.values(thumbnailUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    setItems(snapshot.items);
    setCollections(snapshot.collections);
    setThumbnailUrls(snapshot.thumbnailUrls);
    setDensity(snapshot.preferences.density);
    setRecentSearches(snapshot.preferences.recentSearches);
    setTheme(snapshot.preferences.theme);
    setHydrated(true);
    await refreshStorage();
  }, [refreshStorage]);

  useEffect(() => {
    let cancelled = false;
    void loadArchive().then((snapshot) => {
      if (cancelled) {
        Object.values(snapshot.thumbnailUrls).forEach((url) => URL.revokeObjectURL(url));
        return;
      }
      setItems(snapshot.items);
      setCollections(snapshot.collections);
      setThumbnailUrls(snapshot.thumbnailUrls);
      setDensity(snapshot.preferences.density);
      setRecentSearches(snapshot.preferences.recentSearches);
      setTheme(snapshot.preferences.theme);
      setHydrated(true);
      void refreshStorage();
    }).catch(() => {
      if (!cancelled) {
        setStorageError("Kept could not open IndexedDB. Nothing new will be claimed as saved until storage recovers.");
        setHydrated(true);
      }
    });
    return () => { cancelled = true; };
  }, [refreshStorage]);

  useEffect(() => {
    if (!hydrated || sharedCapture) return;
    void consumePendingShare().then((capture) => {
      if (capture) setPendingCapture(capture);
    }).catch(() => setStorageError("Kept received a shared item but could not read it from local storage."));
  }, [hydrated, sharedCapture]);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    void client.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = client.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    thumbnailUrlsRef.current = thumbnailUrls;
  }, [thumbnailUrls]);

  useEffect(() => () => {
    Object.values(thumbnailUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      document.documentElement.dataset.theme = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.themePreference = theme;
      window.localStorage.setItem("kept-theme", theme);
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        setActiveView("search");
        window.requestAnimationFrame(() => searchRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
      const onMessage = (event: MessageEvent<{ type?: string }>) => {
        if (event.data?.type === "KEPT_UPDATED") showToast("Kept was updated. Reload when you are ready.");
      };
      navigator.serviceWorker.addEventListener("message", onMessage);
      return () => navigator.serviceWorker.removeEventListener("message", onMessage);
    }
  }, [showToast]);

  useEffect(() => {
    if (!hydrated || sharedCapture) return;
    const frame = window.requestAnimationFrame(() => {
      const requestedView = new URLSearchParams(window.location.search).get("view");
      if (requestedView === "search" || requestedView === "all" || requestedView === "collections" || requestedView === "archive" || requestedView === "trash" || requestedView === "settings") {
        setActiveView(requestedView);
        if (requestedView === "search") window.requestAnimationFrame(() => searchRef.current?.focus());
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hydrated, sharedCapture]);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;
    const popover = notificationPopoverRef.current;
    popover?.querySelector<HTMLElement>("button")?.focus();
    const closeOnEscapeOrOutside = (event: KeyboardEvent | MouseEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        setNotificationsOpen(false);
        notificationTriggerRef.current?.focus();
      }
      if (event instanceof MouseEvent && popover && event.target instanceof Node && !popover.contains(event.target) && !notificationTriggerRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscapeOrOutside);
    document.addEventListener("mousedown", closeOnEscapeOrOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscapeOrOutside);
      document.removeEventListener("mousedown", closeOnEscapeOrOutside);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!hydrated || !pendingCapture || shareProcessed.current) return;
    shareProcessed.current = true;
    const processCapture = async () => {
      const sharedText = [pendingCapture.title, pendingCapture.text, pendingCapture.url].filter(Boolean).join(" ");
      const detected = splitSharedLinks(extractUrls(sharedText));
      if (!detected.destinationUrl && !pendingCapture.media) {
        setComposerSharedText(sharedText);
        setComposerOpen(true);
        return;
      }
      const duplicate = detected.destinationUrl
        ? items.find((item) => item.destinationUrl === detected.destinationUrl && item.state !== "trashed")
        : undefined;
      if (duplicate) {
        setSelectedItemId(duplicate.id);
        showToast("This link is already in your archive");
        return;
      }
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const media = pendingCapture.media ? await validateAndOptimizeImage(pendingCapture.media) : undefined;
      const captured: SavedItem = {
        id,
        title: pendingCapture.title?.trim() || (detected.destinationUrl ? `Saved from ${domainFromUrl(detected.destinationUrl)}` : "Saved image"),
        creator: "Creator unknown",
        handle: "@unknown",
        savedAt: now,
        category: "Other",
        domain: detected.destinationUrl ? domainFromUrl(detected.destinationUrl) : "image capture",
        destinationUrl: detected.destinationUrl,
        sourceUrl: detected.sourceUrl || undefined,
        sourcePlatform: detected.sourcePlatform,
        notes: pendingCapture.text?.trim() ?? "",
        tags: [],
        collectionIds: [],
        state: "active",
        sourceStatus: "unchecked",
        metadataStatus: pendingCapture.title ? "complete" : "partial",
        spriteIndex: -1,
        variant: "standard",
        thumbnailKey: media ? id : undefined,
        updatedAt: now,
        syncVersion: 0,
      };
      await persistItem(captured, media);
      setItems((current) => [captured, ...current]);
      if (media) setThumbnailUrls((current) => ({ ...current, [id]: URL.createObjectURL(media) }));
      setSelectedItemId(id);
      setStorageError("");
      showToast("Saved from the share target");
      window.history.replaceState({}, "", "/");
      await refreshStorage();
    };
    void processCapture().catch(() => {
      shareProcessed.current = false;
      setStorageError("The shared item could not be stored. Kept opened the capture form instead of claiming success.");
      setComposerSharedText([pendingCapture.title, pendingCapture.text, pendingCapture.url].filter(Boolean).join(" "));
      setComposerOpen(true);
    });
  }, [hydrated, items, pendingCapture, refreshStorage, showToast]);

  const visibleItems = useMemo(() => {
    const desiredState: ItemState = activeView === "archive" ? "archived" : activeView === "trash" ? "trashed" : "active";
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedCreator = creatorFilter.trim().toLowerCase();
    const filtered = items
      .filter((item) => item.state === desiredState)
      .filter((item) => withinDateFilter(memoryDate(item, dateBasis), dateFilter, customStart, customEnd))
      .filter((item) => categoryFilter === "all" || item.category === categoryFilter)
      .filter((item) => sourceFilter === "all" || item.sourcePlatform === sourceFilter)
      .filter((item) => sourceStatusFilter === "all" || item.sourceStatus === sourceStatusFilter)
      .filter((item) => collectionFilter === "all" || item.collectionIds.includes(collectionFilter))
      .filter((item) => !normalizedCreator || `${item.creator} ${item.handle}`.toLowerCase().includes(normalizedCreator))
      .filter((item) => !normalizedQuery || searchScore(item, collections, normalizedQuery) > 0);

    return filtered.sort((left, right) => {
      if (normalizedQuery) {
        const rankDifference = searchScore(right, collections, normalizedQuery) - searchScore(left, collections, normalizedQuery);
        if (rankDifference !== 0) return rankDifference;
      }
      if (sortOrder === "title") return left.title.localeCompare(right.title);
      const difference = new Date(memoryDate(right, dateBasis)).getTime() - new Date(memoryDate(left, dateBasis)).getTime();
      return sortOrder === "oldest" ? -difference : difference;
    });
  }, [activeView, categoryFilter, collectionFilter, collections, creatorFilter, customEnd, customStart, dateBasis, dateFilter, items, query, sortOrder, sourceFilter, sourceStatusFilter]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, SavedItem[]>();
    visibleItems.forEach((item) => {
      const label = groupLabel(memoryDate(item, dateBasis));
      groups.set(label, [...(groups.get(label) ?? []), item]);
    });
    return Array.from(groups.entries());
  }, [dateBasis, visibleItems]);

  const notificationItems = useMemo(() => {
    const incomplete = items.filter((item) => item.state === "active" && !["complete", "manual"].includes(item.metadataStatus)).slice(0, 2);
    const resurface = items.find((item) => item.state === "active" && new Date(item.savedAt).getTime() < RESURFACE_BEFORE);
    return resurface && !incomplete.some((item) => item.id === resurface.id) ? [...incomplete, resurface] : incomplete;
  }, [items]);

  function navigate(view: ViewId) {
    setActiveView(view);
    setNotificationsOpen(false);
    setBulkMode(false);
    setBulkSelection([]);
    if (view === "search") window.requestAnimationFrame(() => searchRef.current?.focus());
  }

  async function saveNewItem(input: NewItemInput) {
    const duplicate = input.destinationUrl ? items.find((item) => item.destinationUrl === input.destinationUrl && item.state !== "trashed") : undefined;
    if (duplicate) {
      setComposerOpen(false);
      setSelectedItemId(duplicate.id);
      showToast("This link is already in your archive");
      return;
    }
    const id = crypto.randomUUID();
    const creator = input.creator.replace(/^@/, "");
    const now = new Date().toISOString();
    const item: SavedItem = {
      id,
      title: input.title,
      creator: creator || "Creator unknown",
      handle: creator ? `@${creator.toLowerCase().replaceAll(" ", "")}` : "@unknown",
      savedAt: now,
      receivedAt: input.receivedAt ? new Date(`${input.receivedAt}T12:00:00`).toISOString() : undefined,
      category: input.category,
      domain: input.destinationUrl ? domainFromUrl(input.destinationUrl) : "image capture",
      destinationUrl: input.destinationUrl,
      sourceUrl: input.sourceUrl || undefined,
      sourcePlatform: input.sourcePlatform,
      notes: input.notes,
      tags: [],
      collectionIds: input.collectionId ? [input.collectionId] : [],
      state: "active",
      sourceStatus: "unchecked",
      metadataStatus: "manual",
      spriteIndex: -1,
      variant: ["standard", "portrait", "short", "tall"][items.length % 4] as SavedItem["variant"],
      thumbnailKey: input.thumbnailBlob ? id : undefined,
      updatedAt: now,
      syncVersion: 0,
    };
    await persistItem(item, input.thumbnailBlob);
    setItems((current) => [item, ...current]);
    const thumbnailBlob = input.thumbnailBlob;
    if (thumbnailBlob) setThumbnailUrls((current) => ({ ...current, [id]: URL.createObjectURL(thumbnailBlob) }));
    if (input.collectionId) {
      const collection = collections.find((value) => value.id === input.collectionId);
      if (collection) {
        const updated = { ...collection, updatedAt: new Date().toISOString() };
        setCollections((current) => current.map((value) => value.id === updated.id ? updated : value));
        void persistCollection(updated).catch(() => setStorageError("The item was saved, but Kept could not update the collection timestamp."));
      }
    }
    setStorageError("");
    setComposerOpen(false);
    setComposerSharedText("");
    setActiveView("home");
    showToast("Saved to your archive");
    void refreshStorage();
  }

  const updateItem = useCallback(async (id: string, patch: Partial<SavedItem>) => {
    const currentItem = items.find((item) => item.id === id);
    if (!currentItem) return;
    const updated = { ...currentItem, ...patch, updatedAt: new Date().toISOString(), syncVersion: currentItem.syncVersion + 1 };
    try {
      await persistItem(updated);
      setItems((current) => current.map((item) => item.id === id ? updated : item));
      setStorageError("");
    } catch {
      setStorageError("Kept could not persist that edit. The previous saved version remains intact.");
      throw new Error("The edit could not be stored on this device.");
    }
  }, [items]);

  const moveItem = useCallback((id: string, state: ItemState) => {
    const item = items.find((value) => value.id === id);
    if (!item) return;
    const previous = item;
    const updated = { ...item, state, trashedAt: state === "trashed" ? new Date().toISOString() : undefined };
    void persistItem(updated)
      .then(() => {
        setItems((current) => current.map((value) => value.id === id ? updated : value));
        setSelectedItemId(null);
        const label = state === "active" ? "Restored to your archive" : state === "archived" ? "Moved to archive" : "Moved to trash for 30 days";
        showToast(label, async () => {
          try {
            await persistItem(previous);
            setItems((current) => current.map((value) => value.id === id ? previous : value));
            showToast("Action undone");
          } catch {
            setStorageError("Kept could not undo that move. The current saved state has not changed.");
          }
        });
      })
      .catch(() => setStorageError("Kept could not move that item. Its previous state remains saved."));
  }, [items, showToast]);

  async function createCollection(title: string, description: string) {
    const collection: Collection = {
      id: crypto.randomUUID(),
      title,
      description: description || "A new place for related finds.",
      updatedAt: new Date().toISOString(),
      sortOrder: collections.length,
    };
    await persistCollection(collection);
    setCollections((current) => [...current, collection]);
    showToast("Collection created");
  }

  async function updateCollection(collection: Collection, patch: Partial<Collection>) {
    const updated = { ...collection, ...patch, updatedAt: new Date().toISOString() };
    await persistCollection(updated);
    setCollections((current) => current.map((value) => value.id === updated.id ? updated : value));
    showToast("Collection updated");
  }

  async function archiveCollection(collection: Collection, archived: boolean) {
    await updateCollection(collection, { archivedAt: archived ? new Date().toISOString() : undefined });
  }

  async function deleteCollection(collection: Collection) {
    await deleteCollectionPermanently(collection.id);
    setCollections((current) => current.filter((value) => value.id !== collection.id));
    setItems((current) => current.map((item) => item.collectionIds.includes(collection.id) ? { ...item, collectionIds: item.collectionIds.filter((id) => id !== collection.id) } : item));
    if (collectionFilter === collection.id) setCollectionFilter("all");
    showToast("Collection deleted; its items stayed in your archive");
  }

  async function reorderCollection(collection: Collection, direction: -1 | 1) {
    const ordered = [...collections].sort((left, right) => left.sortOrder - right.sortOrder);
    const index = ordered.findIndex((value) => value.id === collection.id);
    const target = ordered[index + direction];
    if (!target) return;
    const updatedCollection = { ...collection, sortOrder: target.sortOrder, updatedAt: new Date().toISOString() };
    const updatedTarget = { ...target, sortOrder: collection.sortOrder, updatedAt: new Date().toISOString() };
    await Promise.all([persistCollection(updatedCollection), persistCollection(updatedTarget)]);
    setCollections((current) => current.map((value) => value.id === updatedCollection.id ? updatedCollection : value.id === updatedTarget.id ? updatedTarget : value));
  }

  async function replaceThumbnail(id: string, blob: Blob) {
    const item = items.find((value) => value.id === id);
    if (!item) return;
    const updated = { ...item, thumbnailKey: id, updatedAt: new Date().toISOString(), syncVersion: item.syncVersion + 1 };
    await replaceItemThumbnail(updated, blob);
    const previousUrl = thumbnailUrls[id];
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    setItems((current) => current.map((value) => value.id === id ? updated : value));
    setThumbnailUrls((current) => ({ ...current, [id]: URL.createObjectURL(blob) }));
  }

  async function deleteItem(id: string) {
    await deleteItemPermanently(id);
    const thumbnailUrl = thumbnailUrls[id];
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    setItems((current) => current.filter((item) => item.id !== id));
    setThumbnailUrls((current) => { const next = { ...current }; delete next[id]; return next; });
    setSelectedItemId(null);
    showToast("Item permanently deleted");
  }

  async function duplicateItem(id: string) {
    const original = items.find((item) => item.id === id);
    if (!original) return;
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const asset = await getAssetBlob(id);
    const duplicate = { ...original, id: newId, title: `Copy of ${original.title}`, savedAt: now, updatedAt: now, lastOpenedAt: undefined, trashedAt: undefined, state: "active" as const, syncVersion: 0, thumbnailKey: asset ? newId : undefined };
    await persistItem(duplicate, asset);
    setItems((current) => [duplicate, ...current]);
    if (asset) setThumbnailUrls((current) => ({ ...current, [newId]: URL.createObjectURL(asset) }));
    setSelectedItemId(newId);
    showToast("Duplicate created");
  }

  function rememberSearch(value = query) {
    const normalized = value.trim();
    if (!normalized) return;
    const next = [normalized, ...recentSearches.filter((entry) => entry.toLowerCase() !== normalized.toLowerCase())].slice(0, 8);
    setRecentSearches(next);
    void savePreferences({ ...preferences, recentSearches: next });
  }

  function changeDensity(next: Density) {
    setDensity(next);
    void savePreferences({ ...preferences, density: next });
  }

  function changeTheme(next: Theme) {
    setTheme(next);
    void savePreferences({ ...preferences, theme: next });
  }

  async function clearSearchHistory() {
    setRecentSearches([]);
    await savePreferences({ ...preferences, recentSearches: [] });
    showToast("Search history cleared");
  }

  async function resetArchive() {
    await clearLocalArchive();
    Object.values(thumbnailUrls).forEach((url) => URL.revokeObjectURL(url));
    setThumbnailUrls({});
    setItems([]);
    setCollections([]);
    setRecentSearches([]);
    setStorageError("");
    showToast("Local archive deleted");
    await refreshStorage();
  }

  async function protectStorage() {
    const persisted = await requestPersistentStorage();
    await refreshStorage();
    showToast(persisted ? "Browser storage protection enabled" : "This browser did not grant persistent storage");
  }

  async function runSync() {
    if (!user) return;
    setSyncStatus("Syncing local and cloud changes…");
    try {
      const result = await syncArchive(user);
      await applySnapshot();
      setSyncStatus(`Synced ${result.items} items and ${result.collections} collections at ${new Intl.DateTimeFormat("en", { timeStyle: "short" }).format(new Date())}.`);
      showToast("Archive synced across devices");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed.";
      setSyncStatus(`Sync failed: ${message}`);
      setStorageError("Cross-device sync failed. Your local archive remains intact.");
    }
  }

  async function bulkMove(state: ItemState) {
    const selected = items.filter((item) => bulkSelection.includes(item.id));
    const updated = selected.map((item) => ({ ...item, state, trashedAt: state === "trashed" ? new Date().toISOString() : undefined }));
    try {
      await persistItems(updated);
      const map = new Map(updated.map((item) => [item.id, item]));
      setItems((current) => current.map((item) => map.get(item.id) ?? item));
      setBulkSelection([]);
      setBulkMode(false);
      showToast(`${updated.length} ${updated.length === 1 ? "item" : "items"} moved`);
    } catch {
      setStorageError("Kept could not complete the bulk action. The transaction was rolled back.");
    }
  }

  function toggleBulkItem(id: string) {
    setBulkSelection((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  const filtersActive = categoryFilter !== "all" || sourceFilter !== "all" || sourceStatusFilter !== "all" || collectionFilter !== "all" || creatorFilter.trim() !== "";
  const showLibrary = ["search", "all", "archive", "trash"].includes(activeView);
  const currentCopy = showLibrary ? viewCopy[activeView as keyof typeof viewCopy] : null;

  if (!hydrated) {
    return (
      <div className="ambient-shell">
        <div className="app-board loading-board" role="status" aria-live="polite">
          <Image src="/kept-mark.svg" alt="" width={42} height={42} priority />
          <span className="eyebrow">OPENING YOUR LOCAL ARCHIVE</span>
          <h1>Kept</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="ambient-shell">
      <a className="skip-link" href="#main-content">Skip to archive</a>
      <div className="app-board" aria-hidden={composerOpen || Boolean(selectedItem) ? true : undefined} inert={composerOpen || Boolean(selectedItem) ? true : undefined}>
        <Sidebar activeView={activeView} onNavigate={navigate} onSave={() => setComposerOpen(true)} />

        <div className="app-column">
          <header className="mobile-topbar">
            <button type="button" className="mobile-brand" onClick={() => navigate("home")}>
              <Image src="/kept-mark.svg" alt="" className="brand-mark-img" width={35} height={35} priority /> Kept
            </button>
            <div>
              <button className="icon-button" type="button" onClick={(event) => { notificationTriggerRef.current = event.currentTarget; setNotificationsOpen((value) => !value); }} aria-label="Open reminders" aria-expanded={notificationsOpen} aria-controls="notifications-popover">
                <Bell size={20} aria-hidden="true" />
                {notificationItems.length > 0 && <span className="notification-dot" />}
              </button>
              <button className="avatar mobile-profile-button" type="button" onClick={() => navigate("settings")} aria-label="Open settings">K</button>
            </div>
          </header>

          {storageError && (
            <div className="storage-error-banner" role="alert">
              <strong>Storage needs attention.</strong><span>{storageError}</span><button type="button" onClick={() => navigate("settings")}>Review storage</button>
            </div>
          )}

          <main id="main-content" className="main-content">
            {activeView === "home" && (
              <HomeView collections={collections} items={items} thumbnailUrls={thumbnailUrls} onNavigateCollections={() => navigate("collections")} onOpenItem={(item) => setSelectedItemId(item.id)} onSave={() => setComposerOpen(true)} onSearch={(value) => { setQuery(value); navigate("search"); rememberSearch(value); }} />
            )}

            {showLibrary && currentCopy && (
              <>
                <header className="archive-header">
                  <div className="archive-heading-row">
                    <div><span className="eyebrow">{currentCopy.eyebrow}</span><h1>{currentCopy.title}</h1><p>{currentCopy.description}</p></div>
                    <div className="header-actions">
                      <button className="icon-button notification-button" type="button" onClick={(event) => { notificationTriggerRef.current = event.currentTarget; setNotificationsOpen((value) => !value); }} aria-label="Open reminders" aria-expanded={notificationsOpen} aria-controls="notifications-popover">
                        <Bell size={20} aria-hidden="true" />{notificationItems.length > 0 && <span className="notification-dot" />}
                      </button>
                      <span className="avatar">K</span>
                    </div>
                  </div>
                </header>

                <div className="sticky-library-controls">
                  <div className="hero-search-wrap">
                    <Search aria-hidden="true" size={30} strokeWidth={1.55} />
                    <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") rememberSearch(); }} placeholder={activeView === "search" ? "Search titles, creators, notes, or platforms..." : "Filter this library..."} aria-label="Search by title, creator, platform, category, notes, or domain" />
                    {query ? <button className="clear-search" type="button" onClick={() => setQuery("")} aria-label="Clear search"><CircleX size={21} /></button> : <kbd>/</kbd>}
                  </div>

                  {activeView === "search" && query === "" && recentSearches.length > 0 && (
                    <div className="recent-searches" aria-label="Recent searches"><span>Recent</span>{recentSearches.map((entry) => <button type="button" key={entry} onClick={() => setQuery(entry)}>{entry}</button>)}</div>
                  )}

                  <div className="library-toolbar">
                    <div className="date-rail" aria-label="Date range">
                      {([["today", "Today"], ["week", "This week"], ["month", new Intl.DateTimeFormat("en", { month: "long" }).format(new Date())], ["custom", "Custom"], ["all", "All dates"]] as Array<[DateFilter, string]>).map(([value, label]) => (
                        <button key={value} type="button" className={dateFilter === value ? "active" : ""} onClick={() => setDateFilter(value)}>{value === "all" && <CalendarDays size={15} aria-hidden="true" />}{label}</button>
                      ))}
                    </div>
                    <div className="toolbar-actions">
                      {activeView === "all" && (
                        <div className="select-wrap sort-select"><select aria-label="Sort archive" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select><ChevronDown size={16} aria-hidden="true" /></div>
                      )}
                      <button className={`filter-button ${filtersActive ? "active" : ""}`} type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} aria-controls="filter-drawer"><SlidersHorizontal size={16} aria-hidden="true" /> Filters{filtersActive ? " · active" : ""}</button>
                      <div className="view-toggle" aria-label="Library layout">
                        <button type="button" className={density === "grid" ? "active" : ""} onClick={() => changeDensity("grid")} aria-label="Masonry grid view"><Grid2X2 size={17} aria-hidden="true" /></button>
                        <button type="button" className={density === "list" ? "active" : ""} onClick={() => changeDensity("list")} aria-label="Compact list view"><List size={17} aria-hidden="true" /></button>
                      </div>
                      {activeView === "all" && <button className={`filter-button ${bulkMode ? "active" : ""}`} type="button" onClick={() => { setBulkMode((value) => !value); setBulkSelection([]); }}>{bulkMode ? <X size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}{bulkMode ? "Cancel selection" : "Select"}</button>}
                    </div>
                  </div>

                  {filtersOpen && (
                    <div className="filter-drawer" id="filter-drawer">
                      <div className="form-stack"><label htmlFor="filter-date-basis">Date meaning</label><div className="select-wrap"><select id="filter-date-basis" value={dateBasis} onChange={(event) => setDateBasis(event.target.value as DateBasis)}><option value="memory">Received, then saved</option><option value="received">Date received</option><option value="saved">Date saved</option></select><ChevronDown size={16} aria-hidden="true" /></div></div>
                      {dateFilter === "custom" && <><div className="form-stack"><label htmlFor="filter-start">From</label><input id="filter-start" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></div><div className="form-stack"><label htmlFor="filter-end">To</label><input id="filter-end" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></div></>}
                      <div className="form-stack"><label htmlFor="filter-category">Category</label><div className="select-wrap"><select id="filter-category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as Category | "all")}><option value="all">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div></div>
                      <div className="form-stack"><label htmlFor="filter-platform">Platform</label><div className="select-wrap"><select id="filter-platform" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as SourcePlatform | "all")}><option value="all">All platforms</option>{sourcePlatforms.map((platform) => <option key={platform}>{platform}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div></div>
                      <div className="form-stack"><label htmlFor="filter-creator">Creator</label><input id="filter-creator" value={creatorFilter} onChange={(event) => setCreatorFilter(event.target.value)} placeholder="Name or @handle" /></div>
                      <div className="form-stack"><label htmlFor="filter-status">Source status</label><div className="select-wrap"><select id="filter-status" value={sourceStatusFilter} onChange={(event) => setSourceStatusFilter(event.target.value as SourceStatus | "all")}><option value="all">Any status</option><option value="available">Available</option><option value="unchecked">Not checked</option><option value="unavailable">Unavailable</option></select><ChevronDown size={16} aria-hidden="true" /></div></div>
                      <div className="form-stack"><label htmlFor="filter-collection">Collection</label><div className="select-wrap"><select id="filter-collection" value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value)}><option value="all">All collections</option>{collections.filter((collection) => !collection.archivedAt).map((collection) => <option key={collection.id} value={collection.id}>{collection.title}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div></div>
                      <button className="quiet-action clear-filters" type="button" onClick={() => { setCategoryFilter("all"); setSourceFilter("all"); setSourceStatusFilter("all"); setCollectionFilter("all"); setCreatorFilter(""); setCustomStart(""); setCustomEnd(""); }}><X size={15} aria-hidden="true" /> Clear filters</button>
                    </div>
                  )}
                </div>

                {bulkMode && bulkSelection.length > 0 && (
                  <div className="bulk-action-bar" role="region" aria-label="Bulk actions"><span>{bulkSelection.length} selected</span><button type="button" onClick={() => void bulkMove("archived")}>Archive</button><button type="button" onClick={() => void bulkMove("trashed")}>Move to trash</button></div>
                )}

                <div className="result-summary" aria-live="polite"><span>{visibleItems.length} {visibleItems.length === 1 ? "memory" : "memories"}</span>{query && <span>matching “{query}”</span>}</div>

                {groupedItems.length === 0 ? (
                  <div className="empty-state"><h2>{activeView === "trash" ? "Trash is empty." : activeView === "archive" ? "Nothing is archived." : activeView === "search" && !query && !filtersActive ? "Start with anything you remember." : "Nothing matches those filters."}</h2><p>{activeView === "search" ? "Try a title, creator, platform, note, or date range." : "Change the filters or save another find."}</p></div>
                ) : (
                  <div className={density === "grid" ? "timeline" : "timeline list-timeline"}>
                    {groupedItems.map(([label, group], groupIndex) => (
                      <section className="timeline-group" key={label} aria-labelledby={`group-${groupIndex}`}>
                        <header className="timeline-heading"><h2 id={`group-${groupIndex}`}>{label}</h2><span>{group.length} {group.length === 1 ? "memory" : "memories"}</span><span className="timeline-rule" /></header>
                        <div className={density === "grid" ? "masonry-grid" : "memory-list"}>
                          {group.map((item, index) => (
                            <div className={`bulk-card-wrap ${bulkSelection.includes(item.id) ? "is-selected" : ""}`} key={item.id}>
                              {bulkMode && <label className="bulk-select"><input type="checkbox" checked={bulkSelection.includes(item.id)} onChange={() => toggleBulkItem(item.id)} /><span>Select {item.title}</span></label>}
                              <MemoryCard item={item} onOpen={(value) => setSelectedItemId(value.id)} list={density === "list"} priority={groupIndex === 0 && index < 4} thumbnailUrl={thumbnailUrls[item.id]} />
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeView === "collections" && <CollectionsView collections={collections} items={items} thumbnailUrls={thumbnailUrls} onArchive={archiveCollection} onCreate={createCollection} onDelete={deleteCollection} onFilter={(id) => { setCollectionFilter(id); navigate("all"); setFiltersOpen(true); }} onOpenItem={(item) => setSelectedItemId(item.id)} onReorder={reorderCollection} onUpdate={updateCollection} />}
            {activeView === "settings" && <SettingsView theme={theme} density={density} items={items} collections={collections} recentSearches={recentSearches} storage={storage} syncStatus={syncStatus} user={user} onArchiveImported={applySnapshot} onSync={runSync} onThemeChange={changeTheme} onDensityChange={changeDensity} onClearSearchHistory={clearSearchHistory} onRequestPersistence={protectStorage} onResetArchive={resetArchive} onToast={showToast} />}
          </main>
        </div>

        {notificationsOpen && (
          <aside ref={notificationPopoverRef} className="notifications-popover" id="notifications-popover" role="dialog" aria-modal="false" aria-labelledby="notifications-title">
            <header><div><span className="eyebrow">FROM YOUR ARCHIVE</span><h2 id="notifications-title">Useful reminders</h2></div><button className="icon-button" type="button" onClick={() => { setNotificationsOpen(false); notificationTriggerRef.current?.focus(); }} aria-label="Close reminders"><X size={18} aria-hidden="true" /></button></header>
            {notificationItems.length ? notificationItems.map((item) => (
              <button type="button" key={item.id} onClick={() => { setNotificationsOpen(false); setSelectedItemId(item.id); }}><span className="notification-icon"><CalendarDays size={18} aria-hidden="true" /></span><span><strong>{!["complete", "manual"].includes(item.metadataStatus) ? "This save needs context" : "Worth another look"}</strong><small>{item.title}</small></span></button>
            )) : <p className="popover-empty">No reminders right now.</p>}
          </aside>
        )}

        <MobileNav activeView={activeView} onNavigate={navigate} onSave={() => setComposerOpen(true)} />
      </div>

      {composerOpen && <SaveComposer collections={collections} initialSharedText={composerSharedText} onClose={() => { setComposerOpen(false); setComposerSharedText(""); }} onSave={saveNewItem} />}
      {selectedItem && <DetailPanel key={selectedItem.id} item={selectedItem} collections={collections} thumbnailUrl={thumbnailUrls[selectedItem.id]} onClose={() => setSelectedItemId(null)} onDelete={deleteItem} onDuplicate={duplicateItem} onReplaceThumbnail={replaceThumbnail} onUpdate={updateItem} onMove={moveItem} onToast={showToast} />}
      {toast && <div className="toast" role="status" aria-live="polite"><Check size={17} aria-hidden="true" /><span>{toast.message}</span>{toast.undo && <button type="button" onClick={() => void toast.undo?.()}>Undo</button>}<button className="toast-close" type="button" onClick={() => setToast(null)} aria-label="Dismiss message"><X size={16} aria-hidden="true" /></button></div>}
    </div>
  );
}
