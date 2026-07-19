"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleX,
  Filter,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { CollectionsView } from "./collections-view";
import { DetailPanel } from "./detail-panel";
import { MemoryCard } from "./memory-card";
import { type NewItemInput, SaveComposer } from "./save-composer";
import { SettingsView } from "./settings-view";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { seedCollections, seedItems } from "@/lib/seed";
import {
  categories,
  type Category,
  type Collection,
  type DateFilter,
  type Density,
  type ItemState,
  type ReelStatus,
  type SavedItem,
  type Theme,
  type ViewId,
} from "@/lib/types";
import { domainFromUrl } from "@/lib/urls";

const STORAGE_KEY = "reelrecall-v1";

interface ToastState {
  message: string;
  undo?: () => void;
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

function withinDateFilter(value: string, filter: DateFilter) {
  if (filter === "all") return true;
  const date = new Date(value);
  const now = new Date();
  if (filter === "today") return sameDay(date, now);
  const difference = now.getTime() - date.getTime();
  if (filter === "week") return difference <= 7 * 86_400_000;
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

const viewCopy: Record<ViewId, { eyebrow: string; title: string; description: string }> = {
  home: {
    eyebrow: "YOUR ARCHIVE",
    title: "Things worth finding again",
    description: "A visual trail of what caught your attention.",
  },
  search: {
    eyebrow: "SEARCH",
    title: "What do you remember?",
    description: "A word, a creator, or roughly when you saw it is enough.",
  },
  all: {
    eyebrow: "ALL SAVES",
    title: "Your complete archive",
    description: "Everything you have kept, ordered by the moment you saved it.",
  },
  archive: {
    eyebrow: "ARCHIVE",
    title: "Put away, not forgotten",
    description: "Older finds stay searchable and keep their original context.",
  },
  trash: {
    eyebrow: "TRASH",
    title: "Recently removed",
    description: "Restore a memory before it is permanently deleted after 30 days.",
  },
  collections: { eyebrow: "", title: "", description: "" },
  shared: { eyebrow: "", title: "", description: "" },
  settings: { eyebrow: "", title: "", description: "" },
};

export function ReelRecallApp() {
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<SavedItem[]>(seedItems);
  const [collections, setCollections] = useState<Collection[]>(seedCollections);
  const [activeView, setActiveView] = useState<ViewId>("home");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [reelFilter, setReelFilter] = useState<ReelStatus | "all">("all");
  const [density, setDensity] = useState<Density>("grid");
  const [theme, setTheme] = useState<Theme>("light");
  const [composerOpen, setComposerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  useEffect(() => {
    const hydrationTask = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as {
            items?: SavedItem[];
            collections?: Collection[];
            density?: Density;
            theme?: Theme;
          };
          if (Array.isArray(parsed.items)) setItems(parsed.items);
          if (Array.isArray(parsed.collections)) setCollections(parsed.collections);
          if (parsed.density) setDensity(parsed.density);
          if (parsed.theme) setTheme(parsed.theme);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(hydrationTask);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items, collections, density, theme }),
      );
    } catch {
      // The in-memory archive remains usable if the browser storage quota is full.
    }
  }, [collections, density, hydrated, items, theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((message: string, undo?: () => void) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ message, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const closeComposer = useCallback(() => setComposerOpen(false), []);
  const closeDetail = useCallback(() => setSelectedItemId(null), []);

  const visibleItems = useMemo(() => {
    const desiredState: ItemState = activeView === "archive" ? "archived" : activeView === "trash" ? "trashed" : "active";
    const normalizedQuery = query.trim().toLowerCase();
    return [...items]
      .filter((item) => item.state === desiredState)
      .filter((item) => withinDateFilter(item.savedAt, dateFilter))
      .filter((item) => categoryFilter === "all" || item.category === categoryFilter)
      .filter((item) => reelFilter === "all" || item.reelStatus === reelFilter)
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [
          item.title,
          item.creator,
          item.handle,
          item.category,
          item.domain,
          item.notes,
          ...item.tags,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime());
  }, [activeView, categoryFilter, dateFilter, items, query, reelFilter]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, SavedItem[]>();
    visibleItems.forEach((item) => {
      const label = groupLabel(item.savedAt);
      groups.set(label, [...(groups.get(label) ?? []), item]);
    });
    return Array.from(groups.entries());
  }, [visibleItems]);

  function navigate(view: ViewId) {
    setActiveView(view);
    setNotificationsOpen(false);
    if (view === "search") {
      window.requestAnimationFrame(() => searchRef.current?.focus());
    }
  }

  function saveNewItem(input: NewItemInput) {
    const existing = items.find((item) => item.destinationUrl === input.destinationUrl && item.state !== "trashed");
    const id = crypto.randomUUID();
    const creator = input.creator.replace(/^@/, "");
    const item: SavedItem = {
      id,
      title: input.title,
      creator: creator || "Creator pending",
      handle: creator ? `@${creator.toLowerCase().replaceAll(" ", "")}` : "@pending",
      savedAt: new Date().toISOString(),
      receivedAt: input.receivedAt ? new Date(`${input.receivedAt}T12:00:00`).toISOString() : undefined,
      category: input.category,
      domain: domainFromUrl(input.destinationUrl),
      destinationUrl: input.destinationUrl,
      reelUrl: input.reelUrl || undefined,
      notes: input.notes,
      tags: [],
      collectionIds: input.collectionId ? [input.collectionId] : [],
      state: "active",
      reelStatus: "unknown",
      metadataStatus: input.title ? "complete" : "incomplete",
      spriteIndex: input.thumbnailData ? -1 : items.length % 12,
      variant: ["standard", "portrait", "short", "tall"][items.length % 4] as SavedItem["variant"],
      thumbnailData: input.thumbnailData,
    };
    setItems((current) => [item, ...current]);
    if (input.collectionId) {
      setCollections((current) => current.map((collection) => collection.id === input.collectionId
        ? { ...collection, itemIds: [id, ...collection.itemIds], updatedAt: new Date().toISOString() }
        : collection));
    }
    setComposerOpen(false);
    setActiveView("home");
    showToast(existing ? "Saved another copy with new context" : "Saved to your archive");
  }

  function updateItem(id: string, patch: Partial<SavedItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function moveItem(id: string, state: ItemState) {
    const previous = items.find((item) => item.id === id)?.state ?? "active";
    updateItem(id, { state });
    if (state === "trashed") setSelectedItemId(null);
    const label = state === "active" ? "Restored to your archive" : state === "archived" ? "Moved to archive" : "Moved to trash";
    showToast(label, () => {
      updateItem(id, { state: previous });
      showToast("Action undone");
    });
  }

  function createCollection(title: string, description: string) {
    setCollections((current) => [{
      id: crypto.randomUUID(),
      title,
      description: description || "A new place for related finds.",
      itemIds: [],
      shared: false,
      updatedAt: new Date().toISOString(),
    }, ...current]);
    showToast("Collection created");
  }

  function toggleShare(id: string) {
    setCollections((current) => current.map((collection) => collection.id === id
      ? { ...collection, shared: !collection.shared, updatedAt: new Date().toISOString() }
      : collection));
    const collection = collections.find((value) => value.id === id);
    showToast(collection?.shared ? "Share link revoked" : "Private share link created");
  }

  const filtersActive = categoryFilter !== "all" || reelFilter !== "all";
  const currentCopy = viewCopy[activeView];
  const showLibrary = !["collections", "shared", "settings"].includes(activeView);

  return (
    <div className="ambient-shell">
      <a className="skip-link" href="#main-content">Skip to archive</a>
      <div className="app-board" aria-hidden={composerOpen || Boolean(selectedItem) ? true : undefined} inert={composerOpen || Boolean(selectedItem) ? true : undefined}>
        <Sidebar activeView={activeView} onNavigate={navigate} onSave={() => setComposerOpen(true)} />

        <div className="app-column">
          <header className="mobile-topbar">
            <button type="button" className="mobile-brand" onClick={() => navigate("home")}>
              <span>R</span> ReelRecall
            </button>
            <div>
              <button className="icon-button" type="button" onClick={() => setNotificationsOpen((value) => !value)} aria-label="Open notifications">
                <Bell size={20} aria-hidden="true" />
                <span className="notification-dot" />
              </button>
              <span className="avatar">GS</span>
            </div>
          </header>

          <main id="main-content" className="main-content">
            {showLibrary && (
              <>
                <header className="archive-header">
                  <div className="archive-heading-row">
                    <div>
                      <span className="eyebrow">{currentCopy.eyebrow}</span>
                      <h1>{currentCopy.title}</h1>
                      <p>{currentCopy.description}</p>
                    </div>
                    <div className="header-actions">
                      <button className="icon-button notification-button" type="button" onClick={() => setNotificationsOpen((value) => !value)} aria-label="Open notifications">
                        <Bell size={20} aria-hidden="true" />
                        <span className="notification-dot" />
                      </button>
                      <span className="avatar">GS</span>
                    </div>
                  </div>

                  <div className="hero-search-wrap">
                    <Search aria-hidden="true" size={30} strokeWidth={1.55} />
                    <input
                      ref={searchRef}
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search what you remember..."
                      aria-label="Search by title, creator, category, notes, or domain"
                    />
                    {query ? (
                      <button className="clear-search" type="button" onClick={() => setQuery("")} aria-label="Clear search"><CircleX size={21} /></button>
                    ) : (
                      <kbd>/</kbd>
                    )}
                  </div>

                  <div className="library-toolbar">
                    <div className="date-rail" aria-label="Date range">
                      {([
                        ["today", "Today"],
                        ["week", "This week"],
                        ["month", new Intl.DateTimeFormat("en", { month: "long" }).format(new Date())],
                        ["all", "All dates"],
                      ] as Array<[DateFilter, string]>).map(([value, label]) => (
                        <button key={value} type="button" className={dateFilter === value ? "active" : ""} onClick={() => setDateFilter(value)}>
                          {value === "all" && <CalendarDays size={15} aria-hidden="true" />}{label}
                        </button>
                      ))}
                    </div>
                    <div className="toolbar-actions">
                      <button className={`filter-button ${filtersActive ? "active" : ""}`} type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}>
                        <SlidersHorizontal size={16} aria-hidden="true" /> Filters{filtersActive ? " · 1+" : ""}
                      </button>
                      <div className="view-toggle" aria-label="Library layout">
                        <button type="button" className={density === "grid" ? "active" : ""} onClick={() => setDensity("grid")} aria-label="Masonry grid view"><Grid2X2 size={17} /></button>
                        <button type="button" className={density === "list" ? "active" : ""} onClick={() => setDensity("list")} aria-label="Compact list view"><List size={17} /></button>
                      </div>
                    </div>
                  </div>

                  {filtersOpen && (
                    <div className="filter-drawer">
                      <div className="form-stack">
                        <label htmlFor="filter-category">Category</label>
                        <div className="select-wrap">
                          <select id="filter-category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as Category | "all")}>
                            <option value="all">All categories</option>
                            {categories.map((category) => <option key={category}>{category}</option>)}
                          </select>
                          <ChevronDown size={16} aria-hidden="true" />
                        </div>
                      </div>
                      <div className="form-stack">
                        <label htmlFor="filter-status">Reel status</label>
                        <div className="select-wrap">
                          <select id="filter-status" value={reelFilter} onChange={(event) => setReelFilter(event.target.value as ReelStatus | "all")}>
                            <option value="all">Any status</option>
                            <option value="available">Available</option>
                            <option value="unknown">Unknown</option>
                            <option value="deleted">Deleted</option>
                          </select>
                          <ChevronDown size={16} aria-hidden="true" />
                        </div>
                      </div>
                      <button className="quiet-action clear-filters" type="button" onClick={() => { setCategoryFilter("all"); setReelFilter("all"); }}>
                        <X size={15} aria-hidden="true" /> Clear filters
                      </button>
                    </div>
                  )}
                </header>

                <div className="result-summary" aria-live="polite">
                  <span>{visibleItems.length} {visibleItems.length === 1 ? "memory" : "memories"}</span>
                  {query && <span>matching “{query}”</span>}
                </div>

                {groupedItems.length === 0 ? (
                  <div className="empty-state">
                    <h2>{activeView === "trash" ? "Trash is empty." : activeView === "archive" ? "Nothing is archived." : "Nothing matches that memory yet."}</h2>
                    <p>{activeView === "home" || activeView === "search" || activeView === "all" ? "Try a creator name, remove a date filter, or save a new find." : "Items you move here will keep their reel and destination context."}</p>
                    {(activeView === "home" || activeView === "search" || activeView === "all") && (
                      <button className="primary-button" type="button" onClick={() => setComposerOpen(true)}>Save your first link</button>
                    )}
                  </div>
                ) : (
                  <div className={density === "grid" ? "timeline" : "timeline list-timeline"}>
                    {groupedItems.map(([label, group], groupIndex) => (
                      <section className="timeline-group" key={label} aria-labelledby={`group-${groupIndex}`}>
                        <header className="timeline-heading">
                          <h2 id={`group-${groupIndex}`}>{label}</h2>
                          <span>{group.length} {group.length === 1 ? "memory" : "memories"}</span>
                          <span className="timeline-rule" />
                        </header>
                        <div className={density === "grid" ? "masonry-grid" : "memory-list"}>
                          {group.map((item, index) => (
                            <MemoryCard key={item.id} item={item} onOpen={(value) => setSelectedItemId(value.id)} list={density === "list"} priority={groupIndex === 0 && index < 4} />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeView === "collections" && (
              <CollectionsView collections={collections} items={items} onCreate={createCollection} onToggleShare={toggleShare} onOpenItem={(item) => setSelectedItemId(item.id)} />
            )}
            {activeView === "shared" && (
              <CollectionsView sharedOnly collections={collections} items={items} onCreate={createCollection} onToggleShare={toggleShare} onOpenItem={(item) => setSelectedItemId(item.id)} />
            )}
            {activeView === "settings" && (
              <SettingsView theme={theme} density={density} items={items} onThemeChange={setTheme} onDensityChange={setDensity} onToast={showToast} />
            )}
          </main>
        </div>

        {notificationsOpen && (
          <aside className="notifications-popover" aria-label="Notifications">
            <header><div><span className="eyebrow">THIS WEEK</span><h2>Small reminders</h2></div><button className="icon-button" type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={18} /></button></header>
            <button type="button" onClick={() => { setNotificationsOpen(false); setSelectedItemId("quiet-cafe"); }}>
              <span className="notification-icon"><CalendarDays size={18} /></span>
              <span><strong>You saved this two weeks ago</strong><small>The quiet cafe near the old book market</small></span>
            </button>
            <button type="button" onClick={() => { setNotificationsOpen(false); setSelectedItemId("portfolio-notes"); }}>
              <span className="notification-icon warning"><Filter size={18} /></span>
              <span><strong>One memory needs details</strong><small>Add the reel thumbnail when you have a moment.</small></span>
            </button>
          </aside>
        )}

        <MobileNav activeView={activeView} onNavigate={navigate} onSave={() => setComposerOpen(true)} />
      </div>

      {composerOpen && <SaveComposer collections={collections} onClose={closeComposer} onSave={saveNewItem} />}
      {selectedItem && <DetailPanel key={selectedItem.id} item={selectedItem} collections={collections} onClose={closeDetail} onUpdate={updateItem} onMove={moveItem} onToast={showToast} />}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <Check size={17} aria-hidden="true" />
          <span>{toast.message}</span>
          {toast.undo && <button type="button" onClick={toast.undo}>Undo</button>}
          <button className="toast-close" type="button" onClick={() => setToast(null)} aria-label="Dismiss message"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
