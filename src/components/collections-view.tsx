"use client";

import { FormEvent, useState } from "react";
import { Check, LockKeyhole, Plus, Share2, X } from "lucide-react";
import type { Collection, SavedItem } from "@/lib/types";
import { MemoryMedia } from "./memory-media";

interface CollectionsViewProps {
  collections: Collection[];
  items: SavedItem[];
  sharedOnly?: boolean;
  onCreate: (title: string, description: string) => void;
  onToggleShare: (id: string) => void;
  onOpenItem: (item: SavedItem) => void;
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
  sharedOnly = false,
  onCreate,
  onToggleShare,
  onOpenItem,
}: CollectionsViewProps) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const visible = sharedOnly ? collections.filter((collection) => collection.shared) : collections;

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim(), description.trim());
    setTitle("");
    setDescription("");
    setCreating(false);
  }

  return (
    <section className="view-section" aria-labelledby="collections-title">
      <header className="page-header">
        <div>
          <span className="eyebrow">CURATED BOARDS</span>
          <h1 id="collections-title">{sharedOnly ? "Shared collections" : "Your collections"}</h1>
          <p>{sharedOnly ? "Collections with an active private share link." : "Small moodboards for the ideas that belong together."}</p>
        </div>
        {!sharedOnly && (
          <button className="primary-button" type="button" onClick={() => setCreating(true)}>
            <Plus size={18} aria-hidden="true" /> New collection
          </button>
        )}
      </header>

      {creating && (
        <form className="collection-composer" onSubmit={handleCreate}>
          <div>
            <label htmlFor="collection-title">Collection title</label>
            <input id="collection-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Tiny apartment ideas" />
          </div>
          <div>
            <label htmlFor="collection-description">Description</label>
            <input id="collection-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What belongs here?" />
          </div>
          <button className="primary-button" type="submit"><Check size={17} aria-hidden="true" /> Create</button>
          <button className="icon-button" type="button" onClick={() => setCreating(false)} aria-label="Cancel new collection"><X size={19} /></button>
        </form>
      )}

      {visible.length === 0 ? (
        <div className="empty-state">
          <h2>{sharedOnly ? "Nothing is shared right now." : "This space is waiting for its first collection."}</h2>
          <p>{sharedOnly ? "Share a collection when you want someone else to browse it." : "Group finds by a plan, a mood, or a future version of you."}</p>
        </div>
      ) : (
        <div className="collection-grid">
          {visible.map((collection) => {
            const collectionItems = collection.itemIds
              .map((id) => items.find((item) => item.id === id))
              .filter((item): item is SavedItem => Boolean(item))
              .slice(0, 4);
            return (
              <article className="collection-card" key={collection.id}>
                <div className={`collection-collage count-${collectionItems.length}`}>
                  {collectionItems.length === 0 ? (
                    <div className="collection-placeholder" />
                  ) : collectionItems.map((item) => (
                    <button type="button" key={item.id} onClick={() => onOpenItem(item)} aria-label={`Open ${item.title}`}>
                      <MemoryMedia title={item.title} spriteIndex={item.spriteIndex} thumbnailData={item.thumbnailData} />
                    </button>
                  ))}
                </div>
                <div className="collection-copy">
                  <div>
                    <h2>{collection.title}</h2>
                    <p>{collection.description}</p>
                  </div>
                  <div className="collection-meta">
                    <span>{collection.itemIds.length} {collection.itemIds.length === 1 ? "memory" : "memories"} · updated {formatUpdated(collection.updatedAt)}</span>
                    <button type="button" onClick={() => onToggleShare(collection.id)} className={collection.shared ? "is-shared" : ""}>
                      {collection.shared ? <Share2 size={15} aria-hidden="true" /> : <LockKeyhole size={15} aria-hidden="true" />}
                      {collection.shared ? "Shared" : "Private"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
