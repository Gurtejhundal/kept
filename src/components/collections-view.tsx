"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Archive, ArrowDown, ArrowLeft, ArrowUp, Check, FolderSearch, LockKeyhole, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import type { Collection, SavedItem } from "@/lib/types";
import { MemoryCard } from "./memory-card";
import { MemoryMedia } from "./memory-media";

interface CollectionsViewProps {
  collections: Collection[];
  items: SavedItem[];
  onArchive: (collection: Collection, archived: boolean) => Promise<void>;
  onCreate: (title: string, description: string) => Promise<void>;
  onDelete: (collection: Collection) => Promise<void>;
  onFilter: (collectionId: string) => void;
  onOpenItem: (item: SavedItem) => void;
  onReorder: (collection: Collection, direction: -1 | 1) => Promise<void>;
  onUpdate: (collection: Collection, patch: Partial<Collection>) => Promise<void>;
  thumbnailUrls: Record<string, string>;
}

function formatUpdated(value: string) {
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    -Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 86_400_000)),
    "day",
  );
}

export function CollectionsView({
  collections,
  items,
  onArchive,
  onCreate,
  onDelete,
  onFilter,
  onOpenItem,
  onReorder,
  onUpdate,
  thumbnailUrls,
}: CollectionsViewProps) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("collection"));
  const [editing, setEditing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState("");
  const sortedCollections = useMemo(() => [...collections].sort((left, right) => left.sortOrder - right.sortOrder || right.updatedAt.localeCompare(left.updatedAt)), [collections]);
  const visibleCollections = sortedCollections.filter((collection) => showArchived ? Boolean(collection.archivedAt) : !collection.archivedAt);
  const selected = collections.find((collection) => collection.id === selectedId) ?? null;
  const selectedItems = selected ? items.filter((item) => item.state === "active" && item.collectionIds.includes(selected.id)) : [];

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await onCreate(title.trim(), description.trim());
      setTitle("");
      setDescription("");
      setCreating(false);
      setError("");
    } catch {
      setError("The collection could not be stored.");
    }
  }

  async function saveCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !title.trim()) return;
    try {
      await onUpdate(selected, { title: title.trim(), description: description.trim() });
      setEditing(false);
      setError("");
    } catch {
      setError("The collection changes could not be stored.");
    }
  }

  function openCollection(collection: Collection) {
    setSelectedId(collection.id);
    setTitle(collection.title);
    setDescription(collection.description);
    setEditing(false);
    window.history.replaceState({}, "", `/?view=collections&collection=${encodeURIComponent(collection.id)}`);
  }

  function closeCollection() {
    setSelectedId(null);
    setEditing(false);
    window.history.replaceState({}, "", "/?view=collections");
  }

  if (selected) {
    return (
      <section className="view-section collection-detail-page" aria-labelledby="collection-detail-title">
        <button className="quiet-action collection-back" type="button" onClick={closeCollection}><ArrowLeft size={17} aria-hidden="true" /> All collections</button>
        <header className="page-header collections-page-header">
          <div>
            <span className="eyebrow">PRIVATE COLLECTION</span>
            <h1 id="collection-detail-title">{selected.title}</h1>
            <p>{selected.description || "A focused place for related finds."}</p>
          </div>
          <div className="collection-detail-actions">
            <button className="secondary-button" type="button" onClick={() => { setTitle(selected.title); setDescription(selected.description); setEditing(true); }}><Pencil size={17} aria-hidden="true" /> Rename</button>
            <button className="secondary-button" type="button" onClick={() => onFilter(selected.id)}><FolderSearch size={17} aria-hidden="true" /> Filter library</button>
          </div>
        </header>

        {editing && (
          <form className="collection-composer" onSubmit={saveCollection}>
            <div><label htmlFor="rename-collection">Collection title</label><input id="rename-collection" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} /></div>
            <div><label htmlFor="rename-description">Description</label><input id="rename-description" value={description} onChange={(event) => setDescription(event.target.value)} /></div>
            <button className="primary-button" type="submit"><Check size={17} aria-hidden="true" /> Save</button>
            <button className="icon-button" type="button" onClick={() => setEditing(false)} aria-label="Cancel editing"><X size={19} aria-hidden="true" /></button>
          </form>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="collection-detail-meta"><span>{selectedItems.length} {selectedItems.length === 1 ? "memory" : "memories"}</span><span><LockKeyhole size={15} aria-hidden="true" /> Private on this device</span><span>Updated {formatUpdated(selected.updatedAt)}</span></div>
        {selectedItems.length ? (
          <div className="masonry-grid collection-detail-grid">
            {selectedItems.map((item, index) => <MemoryCard key={item.id} item={item} onOpen={onOpenItem} priority={index < 4} thumbnailUrl={thumbnailUrls[item.id]} />)}
          </div>
        ) : (
          <div className="empty-state"><h2>This collection is empty.</h2><p>Use “Filter library” to browse items, then add them from item details.</p></div>
        )}

        <footer className="collection-management">
          <button type="button" onClick={() => void onArchive(selected, !selected.archivedAt)}>{selected.archivedAt ? <RotateCcw size={17} aria-hidden="true" /> : <Archive size={17} aria-hidden="true" />}{selected.archivedAt ? "Restore collection" : "Archive collection"}</button>
          <button className="danger-action" type="button" onClick={() => { if (window.confirm(`Delete “${selected.title}”? Items will remain in your archive.`)) void onDelete(selected).then(closeCollection); }}><Trash2 size={17} aria-hidden="true" /> Delete collection</button>
        </footer>
      </section>
    );
  }

  return (
    <section className="view-section" aria-labelledby="collections-title">
      <header className="page-header collections-page-header">
        <div><span className="eyebrow">CURATED BOARDS</span><h1 id="collections-title">Your collections</h1><p>Private, local moodboards for the ideas that belong together.</p></div>
        <div className="collection-detail-actions">
          <button className="secondary-button" type="button" onClick={() => setShowArchived((value) => !value)}>{showArchived ? "Active collections" : "Archived collections"}</button>
          <button className="primary-button" type="button" onClick={() => setCreating(true)}><Plus size={18} aria-hidden="true" /> New collection</button>
        </div>
      </header>

      {creating && (
        <form className="collection-composer" onSubmit={handleCreate}>
          <div><label htmlFor="collection-title">Collection title</label><input id="collection-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Tiny apartment ideas" /></div>
          <div><label htmlFor="collection-description">Description</label><input id="collection-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What belongs here?" /></div>
          <button className="primary-button" type="submit"><Check size={17} aria-hidden="true" /> Create</button>
          <button className="icon-button" type="button" onClick={() => setCreating(false)} aria-label="Cancel new collection"><X size={19} aria-hidden="true" /></button>
        </form>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}

      {visibleCollections.length === 0 ? (
        <div className="empty-state"><h2>{showArchived ? "No archived collections." : "This space is waiting for its first collection."}</h2><p>{showArchived ? "Archived collections will stay here until you restore them." : "Group finds by a plan, a mood, or a future version of you."}</p></div>
      ) : (
        <div className="collection-grid">
          {visibleCollections.map((collection, collectionIndex) => {
            const allCollectionItems = items.filter((item) => item.state === "active" && item.collectionIds.includes(collection.id));
            const collectionItems = allCollectionItems.slice(0, 4);
            return (
              <article className="collection-card" key={collection.id}>
                <button className={`collection-collage count-${collectionItems.length}`} type="button" onClick={() => openCollection(collection)} aria-label={`Open ${collection.title}`}>
                  {collectionItems.length === 0 ? <span className="collection-placeholder" /> : collectionItems.map((item) => <MemoryMedia key={item.id} title="" spriteIndex={item.spriteIndex} thumbnailUrl={thumbnailUrls[item.id]} />)}
                </button>
                <div className="collection-copy">
                  <button className="collection-title-button" type="button" onClick={() => openCollection(collection)} aria-label={`Open ${collection.title} details`}><h2>{collection.title}</h2><p>{collection.description}</p></button>
                  <div className="collection-meta"><span>{allCollectionItems.length} {allCollectionItems.length === 1 ? "memory" : "memories"} · updated {formatUpdated(collection.updatedAt)}</span><span className="collection-private"><LockKeyhole size={15} aria-hidden="true" /> Private on this device</span></div>
                  <div className="collection-order-actions"><button type="button" disabled={collectionIndex === 0} onClick={() => void onReorder(collection, -1)} aria-label={`Move ${collection.title} earlier`}><ArrowUp size={15} /></button><button type="button" disabled={collectionIndex === visibleCollections.length - 1} onClick={() => void onReorder(collection, 1)} aria-label={`Move ${collection.title} later`}><ArrowDown size={15} /></button></div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
