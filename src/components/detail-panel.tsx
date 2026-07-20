"use client";

import { FormEvent, useRef, useState } from "react";
import {
  Archive,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  Link2,
  MoreHorizontal,
  RotateCcw,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { categories, type Category, type Collection, type ItemState, type SavedItem } from "@/lib/types";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import { MemoryMedia } from "./memory-media";

interface DetailPanelProps {
  item: SavedItem;
  collections: Collection[];
  thumbnailUrl?: string;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<SavedItem>) => Promise<void>;
  onMove: (id: string, state: ItemState) => void;
  onToast: (message: string) => void;
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DetailPanel({ item, collections, thumbnailUrl, onClose, onUpdate, onMove, onToast }: DetailPanelProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes);
  const [category, setCategory] = useState<Category>(item.category);
  const [collectionId, setCollectionId] = useState(item.collectionIds[0] ?? "");
  const [editError, setEditError] = useState("");

  useDialogFocus(dialogRef, { initialFocusRef: closeButtonRef, onClose });

  async function saveEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await onUpdate(item.id, {
        title: title.trim() || item.title,
        notes: notes.trim(),
        category,
        collectionIds: collectionId ? [collectionId] : [],
        metadataStatus: title.trim() && notes.trim() ? "complete" : "incomplete",
      });
      setEditError("");
      setEditing(false);
      onToast("Details updated");
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "The edit could not be stored.");
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(item.destinationUrl);
    onToast("Link copied");
  }

  async function shareItem() {
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url: item.destinationUrl });
        onToast("Share sheet opened");
        return;
      }
      await navigator.clipboard.writeText(item.destinationUrl);
      onToast("Share link copied");
    } catch {
      // Native share cancellation is an intentional no-op.
    }
  }

  return (
    <div
      className="detail-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside ref={dialogRef} tabIndex={-1} className="detail-panel" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="detail-topbar">
          <button className="quiet-action" type="button" onClick={() => setEditing((value) => !value)}>
            {editing ? "Cancel editing" : "Edit details"}
          </button>
          <div className="detail-top-actions">
            <button className="icon-button" type="button" onClick={shareItem} aria-label="Share saved item">
              <Share2 aria-hidden="true" size={19} />
            </button>
            <button className="icon-button" type="button" onClick={() => setEditing(true)} aria-label="Edit item details">
              <MoreHorizontal aria-hidden="true" size={20} />
            </button>
            <button ref={closeButtonRef} className="icon-button" type="button" onClick={onClose} aria-label="Close item detail">
              <X aria-hidden="true" size={21} />
            </button>
          </div>
        </div>

        <div className={`detail-media ${item.sourceStatus === "unavailable" ? "is-deleted" : ""}`}>
          <MemoryMedia title={item.title} spriteIndex={item.spriteIndex} thumbnailUrl={thumbnailUrl} priority />
          <span className={`detail-status status-${item.sourceStatus}`}>
            <span aria-hidden="true" />
            {item.sourceStatus === "unavailable" ? "Source unavailable" : item.sourceStatus === "unchecked" ? "Source not checked" : "Source available"}
          </span>
        </div>

        {editing ? (
          <form className="detail-edit-form" onSubmit={saveEdits}>
            <div className="form-stack">
              <label htmlFor="edit-title">Title</label>
              <input id="edit-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="form-grid">
              <div className="form-stack">
                <label htmlFor="edit-category">Category</label>
                <div className="select-wrap">
                  <select id="edit-category" value={category} onChange={(event) => setCategory(event.target.value as Category)}>
                    {categories.map((value) => <option key={value}>{value}</option>)}
                  </select>
                  <ChevronDown aria-hidden="true" size={16} />
                </div>
              </div>
              <div className="form-stack">
                <label htmlFor="edit-collection">Collection</label>
                <div className="select-wrap">
                  <select id="edit-collection" value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>
                    <option value="">No collection</option>
                    {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.title}</option>)}
                  </select>
                  <ChevronDown aria-hidden="true" size={16} />
                </div>
              </div>
            </div>
            <div className="form-stack">
              <label htmlFor="edit-notes">Notes</label>
              <textarea id="edit-notes" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
            {editError && <p className="form-error" role="alert">{editError}</p>}
            <button className="primary-button" type="submit"><Check size={18} aria-hidden="true" /> Save changes</button>
          </form>
        ) : (
          <div className="detail-content">
            <div className="detail-heading">
              <span className="eyebrow">{item.category}</span>
              <h2 id="detail-title">{item.title}</h2>
              <p>{item.creator || "Creator not detected"} <span>·</span> {item.handle || "Handle pending"}</p>
            </div>

            <div className="detail-primary-actions">
              <a className="primary-button" href={item.destinationUrl} target="_blank" rel="noreferrer" onClick={() => void onUpdate(item.id, { lastOpenedAt: new Date().toISOString() })}>
                Open link <ExternalLink size={17} aria-hidden="true" />
              </a>
              <button className="secondary-button icon-only-mobile" type="button" onClick={copyLink}>
                <Copy size={17} aria-hidden="true" /> <span>Copy</span>
              </button>
            </div>
            {item.sourceUrl && (
              <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
                <Link2 size={17} aria-hidden="true" /> View original post on {item.sourcePlatform} <ExternalLink size={15} aria-hidden="true" />
              </a>
            )}

            <dl className="metadata-grid">
              <div><dt>Saved</dt><dd>{formatLongDate(item.savedAt)}</dd></div>
              <div><dt>Destination</dt><dd>{item.domain}</dd></div>
              <div><dt>Source</dt><dd>{item.sourcePlatform}</dd></div>
              <div><dt>Collection</dt><dd>{collections.find((value) => item.collectionIds.includes(value.id))?.title ?? "Not collected"}</dd></div>
              <div><dt>Details</dt><dd>{item.metadataStatus === "complete" ? "Complete" : "Needs attention"}</dd></div>
            </dl>

            <section className="detail-notes">
              <h3>Why you saved it</h3>
              <p>{item.notes || "No note yet. Add one to make this easier to remember."}</p>
            </section>

            {item.tags.length > 0 && (
              <div className="tag-row" aria-label="Tags">
                {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            )}
          </div>
        )}

        <footer className="detail-footer">
          {item.state === "active" ? (
            <button type="button" onClick={() => onMove(item.id, "archived")}><Archive size={17} aria-hidden="true" /> Archive</button>
          ) : (
            <button type="button" onClick={() => onMove(item.id, "active")}><RotateCcw size={17} aria-hidden="true" /> Restore</button>
          )}
          {item.state !== "trashed" && (
            <button className="danger-action" type="button" onClick={() => onMove(item.id, "trashed")}><Trash2 size={17} aria-hidden="true" /> Move to trash</button>
          )}
          <span><Clock3 size={14} aria-hidden="true" /> Your note and visual reference remain if the source changes.</span>
        </footer>
      </aside>
    </div>
  );
}
