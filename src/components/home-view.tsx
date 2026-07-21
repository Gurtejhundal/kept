import { type FormEvent, useState } from "react";
import { ArrowRight, CalendarRange, Clock3, FolderHeart, Search, Sparkles } from "lucide-react";
import type { Collection, SavedItem } from "@/lib/types";
import { MemoryCard } from "./memory-card";

const RESURFACE_BEFORE = Date.now() - 14 * 86_400_000;

interface HomeViewProps {
  collections: Collection[];
  items: SavedItem[];
  onNavigateCollections: () => void;
  onOpenItem: (item: SavedItem) => void;
  onSearch: (query: string) => void;
  onSave: () => void;
  thumbnailUrls: Record<string, string>;
}

export function HomeView({
  collections,
  items,
  onNavigateCollections,
  onOpenItem,
  onSearch,
  onSave,
  thumbnailUrls,
}: HomeViewProps) {
  const [query, setQuery] = useState("");
  const activeItems = items
    .filter((item) => item.state === "active")
    .sort((left, right) => new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime());
  const recent = activeItems.slice(0, 4);
  const resurfaced = [...activeItems]
    .filter((item) => new Date(item.savedAt).getTime() < RESURFACE_BEFORE)
    .sort((left, right) => left.id.localeCompare(right.id))
    .slice(0, 2);
  const incomplete = activeItems.filter((item) => !["complete", "manual"].includes(item.metadataStatus)).slice(0, 3);
  const recentlyOpened = [...activeItems]
    .filter((item) => item.lastOpenedAt)
    .sort((left, right) => new Date(right.lastOpenedAt ?? 0).getTime() - new Date(left.lastOpenedAt ?? 0).getTime())
    .slice(0, 3);
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const lastMonthItems = activeItems.filter((item) => {
    const date = new Date(item.receivedAt ?? item.savedAt);
    return date.getMonth() === lastMonth.getMonth()
      && date.getFullYear() === lastMonth.getFullYear()
      && Math.abs(date.getDate() - lastMonth.getDate()) <= 3;
  }).slice(0, 3);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim()) onSearch(query.trim());
  }

  return (
    <section className="home-view" aria-labelledby="home-title">
      <header className="home-hero">
        <div>
          <span className="eyebrow">YOUR ARCHIVE</span>
          <h1 id="home-title">Things worth finding again</h1>
          <p>A visual trail of what caught your attention, with the loose ends kept visible.</p>
        </div>
        <button className="primary-button" type="button" onClick={onSave}>Save a find</button>
      </header>

      <form className="home-search" role="search" onSubmit={submitSearch}>
        <Search size={22} aria-hidden="true" />
        <label className="sr-only" htmlFor="home-search">Search your archive</label>
        <input id="home-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a title, creator, tag, collection, or memory…" />
        <button className="primary-button" type="submit">Search</button>
      </form>

      <section className="home-section" aria-labelledby="recent-title">
        <header className="section-heading-row"><div><span className="eyebrow">RECENT SAVES</span><h2 id="recent-title">Still fresh in your mind</h2></div><span>{recent.length} items</span></header>
        {recent.length ? (
          <div className="masonry-grid home-memory-grid">
            {recent.map((item, index) => <MemoryCard key={item.id} item={item} onOpen={onOpenItem} priority={index < 2} thumbnailUrl={thumbnailUrls[item.id]} />)}
          </div>
        ) : <div className="empty-state compact-empty"><h2>Your archive is empty.</h2><button className="primary-button" type="button" onClick={onSave}>Save your first find</button></div>}
      </section>

      <div className="home-editorial-grid">
        <section className="home-section home-feature" aria-labelledby="resurface-title">
          <header className="section-heading-row"><div><Sparkles size={18} aria-hidden="true" /><h2 id="resurface-title">Worth another look</h2></div></header>
          {resurfaced.length ? resurfaced.map((item) => (
            <button className="resurface-row" type="button" key={item.id} onClick={() => onOpenItem(item)}>
              <span><strong>{item.title}</strong><small>Saved {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(item.savedAt))}</small></span><ArrowRight size={18} aria-hidden="true" />
            </button>
          )) : <p className="muted-copy">Older finds will resurface here after two weeks.</p>}
        </section>

        <section className="home-section home-feature" aria-labelledby="incomplete-title">
          <header className="section-heading-row"><div><Clock3 size={18} aria-hidden="true" /><h2 id="incomplete-title">Needs context</h2></div><span>{incomplete.length}</span></header>
          {incomplete.length ? incomplete.map((item) => (
            <button className="resurface-row" type="button" key={item.id} onClick={() => onOpenItem(item)}>
              <span><strong>{item.title}</strong><small>Add notes, a creator, or a visual reference</small></span><ArrowRight size={18} aria-hidden="true" />
            </button>
          )) : <p className="muted-copy">Every active save has enough context.</p>}
        </section>
      </div>

      <section className="home-section collection-glance" aria-labelledby="collection-glance-title">
        <header className="section-heading-row"><div><FolderHeart size={18} aria-hidden="true" /><h2 id="collection-glance-title">Collections at a glance</h2></div><button className="quiet-action" type="button" onClick={onNavigateCollections}>View all <ArrowRight size={15} aria-hidden="true" /></button></header>
        <div className="collection-glance-grid">
          {collections.slice(0, 3).map((collection) => {
            const count = activeItems.filter((item) => item.collectionIds.includes(collection.id)).length;
            return <button type="button" key={collection.id} onClick={onNavigateCollections}><strong>{collection.title}</strong><span>{count} {count === 1 ? "memory" : "memories"}</span></button>;
          })}
          {collections.length === 0 && <p className="muted-copy">Create a collection when a few finds start to belong together.</p>}
        </div>
      </section>

      <section className="home-section recently-opened" aria-labelledby="opened-title">
        <header className="section-heading-row"><div><h2 id="opened-title">Recently opened</h2></div></header>
        {recentlyOpened.length ? recentlyOpened.map((item) => <button type="button" key={item.id} onClick={() => onOpenItem(item)}>{item.title}</button>) : <p className="muted-copy">Links you open will appear here for quick return.</p>}
      </section>

      <section className="home-section recently-opened" aria-labelledby="last-month-title">
        <header className="section-heading-row"><div><CalendarRange size={18} aria-hidden="true" /><h2 id="last-month-title">Saved this time last month</h2></div></header>
        {lastMonthItems.length ? lastMonthItems.map((item) => <button type="button" key={item.id} onClick={() => onOpenItem(item)}>{item.title}</button>) : <p className="muted-copy">Memories from this part of last month will appear here.</p>}
      </section>
    </section>
  );
}
