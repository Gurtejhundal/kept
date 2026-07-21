"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import {
  Archive,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  CopyPlus,
  ExternalLink,
  Link2,
  MoreHorizontal,
  RotateCcw,
  Share2,
  Trash2,
  ImagePlus,
  X,
} from "lucide-react";
import { categories, sourcePlatforms, type Category, type Collection, type ItemState, type SavedItem, type SourcePlatform, type SourceStatus } from "@/lib/types";
import { validateAndOptimizeImage } from "@/lib/images";
import { domainFromUrl, isSafeWebUrl, normalizeUrl } from "@/lib/urls";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import { MemoryMedia } from "./memory-media";

interface DetailPanelProps {
  item: SavedItem;
  collections: Collection[];
  thumbnailUrl?: string;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onReplaceThumbnail: (id: string, blob: Blob) => Promise<void>;
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

export function DetailPanel({ item, collections, thumbnailUrl, onClose, onDelete, onDuplicate, onReplaceThumbnail, onUpdate, onMove, onToast }: DetailPanelProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes);
  const [creator, setCreator] = useState(item.creator === "Creator unknown" ? "" : item.creator);
  const [handle, setHandle] = useState(item.handle === "@unknown" ? "" : item.handle);
  const [tags, setTags] = useState(item.tags.join(", "));
  const [destinationUrl, setDestinationUrl] = useState(item.destinationUrl);
  const [sourceUrl, setSourceUrl] = useState(item.sourceUrl ?? "");
  const [sourcePlatform, setSourcePlatform] = useState<SourcePlatform>(item.sourcePlatform);
  const [sourceStatus, setSourceStatus] = useState<SourceStatus>(item.sourceStatus);
  const [receivedAt, setReceivedAt] = useState(item.receivedAt?.slice(0, 10) ?? "");
  const [category, setCategory] = useState<Category>(item.category);
  const [collectionId, setCollectionId] = useState(item.collectionIds[0] ?? "");
  const [editError, setEditError] = useState("");
  const [savingImage, setSavingImage] = useState(false);

  useDialogFocus(dialogRef, { initialFocusRef: closeButtonRef, onClose });

  async function saveEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (destinationUrl && !isSafeWebUrl(destinationUrl)) {
      setEditError("Destination link must use http or https.");
      return;
    }
    if (sourceUrl && !isSafeWebUrl(sourceUrl)) {
      setEditError("Original source link must use http or https.");
      return;
    }
    try {
      const parsedTags = Array.from(new Set(tags.split(",").map((tag) => tag.trim()).filter(Boolean))).slice(0, 20);
      await onUpdate(item.id, {
        title: title.trim() || item.title,
        notes: notes.trim(),
        creator: creator.trim() || "Creator unknown",
        handle: handle.trim() ? `@${handle.trim().replace(/^@/, "")}` : "@unknown",
        tags: parsedTags,
        destinationUrl: destinationUrl ? normalizeUrl(destinationUrl) : "",
        domain: destinationUrl ? domainFromUrl(destinationUrl) : "image capture",
        sourceUrl: sourceUrl ? normalizeUrl(sourceUrl) : undefined,
        sourcePlatform,
        sourceStatus,
        receivedAt: receivedAt ? new Date(`${receivedAt}T12:00:00`).toISOString() : undefined,
        category,
        collectionIds: collectionId ? [collectionId] : [],
        metadataStatus: "manual",
      });
      setEditError("");
      setEditing(false);
      onToast("Details updated");
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "The edit could not be stored.");
    }
  }

  async function replaceThumbnail(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSavingImage(true);
    setEditError("");
    try {
      await onReplaceThumbnail(item.id, await validateAndOptimizeImage(file));
      onToast("Visual reference replaced");
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "The image could not be stored.");
    } finally {
      setSavingImage(false);
      event.target.value = "";
    }
  }

  async function copyLink() {
    if (!item.destinationUrl) return;
    await navigator.clipboard.writeText(item.destinationUrl);
    onToast("Link copied");
  }

  async function shareItem() {
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url: item.destinationUrl || undefined, text: item.notes || undefined });
        onToast("Share sheet opened");
        return;
      }
      await navigator.clipboard.writeText([item.title, item.destinationUrl].filter(Boolean).join("\n"));
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
            <div className="detail-thumbnail-editor">
              <input className="sr-only" id="edit-thumbnail" type="file" accept="image/png,image/jpeg,image/webp" onChange={replaceThumbnail} />
              <label className="secondary-button" htmlFor="edit-thumbnail"><ImagePlus size={17} aria-hidden="true" /> {savingImage ? "Preparing image…" : thumbnailUrl ? "Replace thumbnail" : "Add thumbnail"}</label>
            </div>
            <div className="form-stack">
              <label htmlFor="edit-title">Title</label>
              <input id="edit-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="form-grid">
              <div className="form-stack"><label htmlFor="edit-creator">Creator</label><input id="edit-creator" value={creator} onChange={(event) => setCreator(event.target.value)} /></div>
              <div className="form-stack"><label htmlFor="edit-handle">Handle</label><input id="edit-handle" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@handle" /></div>
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
            <div className="form-stack"><label htmlFor="edit-tags">Tags</label><input id="edit-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="study, apartment, later" /><span className="input-hint">Separate tags with commas.</span></div>
            <div className="form-stack"><label htmlFor="edit-destination">Destination URL</label><input id="edit-destination" inputMode="url" value={destinationUrl} onChange={(event) => setDestinationUrl(event.target.value)} placeholder="https://…" /></div>
            <div className="form-grid">
              <div className="form-stack"><label htmlFor="edit-source">Original source URL</label><input id="edit-source" inputMode="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" /></div>
              <div className="form-stack"><label htmlFor="edit-platform">Source platform</label><div className="select-wrap"><select id="edit-platform" value={sourcePlatform} onChange={(event) => setSourcePlatform(event.target.value as SourcePlatform)}>{sourcePlatforms.map((platform) => <option key={platform}>{platform}</option>)}</select><ChevronDown aria-hidden="true" size={16} /></div></div>
              <div className="form-stack"><label htmlFor="edit-received">Date received</label><input id="edit-received" type="date" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} /></div>
              <div className="form-stack"><label htmlFor="edit-source-status">Source status</label><div className="select-wrap"><select id="edit-source-status" value={sourceStatus} onChange={(event) => setSourceStatus(event.target.value as SourceStatus)}><option value="unchecked">Not checked</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select><ChevronDown aria-hidden="true" size={16} /></div></div>
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

            {item.destinationUrl && <div className="detail-primary-actions"><a className="primary-button" href={item.destinationUrl} target="_blank" rel="noreferrer" onClick={() => void onUpdate(item.id, { lastOpenedAt: new Date().toISOString() })}>Open link <ExternalLink size={17} aria-hidden="true" /></a><button className="secondary-button icon-only-mobile" type="button" onClick={copyLink}><Copy size={17} aria-hidden="true" /> <span>Copy</span></button></div>}
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
              <div><dt>Details</dt><dd>{item.metadataStatus === "complete" || item.metadataStatus === "manual" ? "Complete" : "Needs attention"}</dd></div>
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
          <button type="button" onClick={() => void onDuplicate(item.id)}><CopyPlus size={17} aria-hidden="true" /> Duplicate</button>
          {item.state === "active" ? (
            <button type="button" onClick={() => onMove(item.id, "archived")}><Archive size={17} aria-hidden="true" /> Archive</button>
          ) : (
            <button type="button" onClick={() => onMove(item.id, "active")}><RotateCcw size={17} aria-hidden="true" /> Restore</button>
          )}
          {item.state !== "trashed" && (
            <button className="danger-action" type="button" onClick={() => onMove(item.id, "trashed")}><Trash2 size={17} aria-hidden="true" /> Move to trash</button>
          )}
          {item.state === "trashed" && <button className="danger-action" type="button" onClick={() => { if (window.confirm("Delete this item and its visual reference permanently?")) void onDelete(item.id); }}><Trash2 size={17} aria-hidden="true" /> Delete permanently</button>}
          <span><Clock3 size={14} aria-hidden="true" /> Your note and visual reference remain if the source changes.</span>
        </footer>
      </aside>
    </div>
  );
}
