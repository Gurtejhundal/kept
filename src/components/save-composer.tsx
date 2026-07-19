"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  ImagePlus,
  Link2,
  LoaderCircle,
  X,
} from "lucide-react";
import { categories, type Category, type Collection } from "@/lib/types";
import {
  domainFromUrl,
  extractUrls,
  isSafeWebUrl,
  normalizeUrl,
  splitSharedLinks,
} from "@/lib/urls";

export interface NewItemInput {
  title: string;
  creator: string;
  category: Category;
  collectionId: string;
  destinationUrl: string;
  reelUrl: string;
  notes: string;
  receivedAt: string;
  thumbnailData?: string;
}

interface SaveComposerProps {
  collections: Collection[];
  onClose: () => void;
  onSave: (input: NewItemInput) => void;
}

export function SaveComposer({ collections, onClose, onSave }: SaveComposerProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [sharedText, setSharedText] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [reelUrl, setReelUrl] = useState("");
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [category, setCategory] = useState<Category>("Other");
  const [collectionId, setCollectionId] = useState("");
  const [notes, setNotes] = useState("");
  const [receivedAt, setReceivedAt] = useState("");
  const [thumbnailData, setThumbnailData] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const detectedUrls = useMemo(() => extractUrls(sharedText), [sharedText]);
  const visibleDomain = destinationUrl ? domainFromUrl(destinationUrl) : "Waiting for a link";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.classList.add("modal-open");
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  function applyDetectedLinks() {
    const detected = splitSharedLinks(detectedUrls);
    if (detected.destinationUrl) setDestinationUrl(detected.destinationUrl);
    if (detected.reelUrl) setReelUrl(detected.reelUrl);
    if (!title && detected.destinationUrl) {
      const domain = domainFromUrl(detected.destinationUrl).split(".")[0];
      setTitle(`Find from ${domain.charAt(0).toUpperCase()}${domain.slice(1)}`);
    }
    titleRef.current?.focus();
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file for the thumbnail.");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setError("Keep the thumbnail under 1.5 MB so this local archive remains reliable.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setThumbnailData(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isSafeWebUrl(destinationUrl)) {
      setError("Add a valid http or https destination link.");
      return;
    }
    if (reelUrl && !isSafeWebUrl(reelUrl)) {
      setError("The reel link must use http or https.");
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      onSave({
        title: title.trim() || `Saved from ${domainFromUrl(destinationUrl)}`,
        creator: creator.trim(),
        category,
        collectionId,
        destinationUrl: normalizeUrl(destinationUrl),
        reelUrl,
        notes: notes.trim(),
        receivedAt,
        thumbnailData,
      });
    }, 360);
  }

  return (
    <div
      className="modal-backdrop composer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="save-composer" role="dialog" aria-modal="true" aria-labelledby="composer-title">
        <header className="panel-header">
          <div>
            <span className="eyebrow">QUICK CAPTURE</span>
            <h2 id="composer-title">Add to your archive</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close save composer">
            <X aria-hidden="true" size={21} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="capture-paste-block">
            <label htmlFor="shared-message">Paste the DM or shared text</label>
            <textarea
              id="shared-message"
            value={sharedText}
              autoFocus
              onChange={(event) => setSharedText(event.target.value)}
              placeholder="Paste the message from Instagram. We’ll find the links."
              rows={3}
            />
            <div className="paste-summary">
              <span><Link2 size={15} aria-hidden="true" /> {detectedUrls.length || "No"} link{detectedUrls.length === 1 ? "" : "s"} detected</span>
              <button type="button" onClick={applyDetectedLinks} disabled={detectedUrls.length === 0}>
                Use detected links <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="composer-preview">
            {thumbnailData ? (
              <Image src={thumbnailData} alt="New save thumbnail preview" fill unoptimized className="memory-image" />
            ) : (
              <label className="thumbnail-picker" htmlFor="thumbnail-file">
                <ImagePlus size={27} aria-hidden="true" />
                <strong>Add reel screenshot</strong>
                <span>Optional · JPG, PNG, or WebP</span>
              </label>
            )}
            <input id="thumbnail-file" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} />
            {thumbnailData && (
              <label className="replace-thumbnail" htmlFor="thumbnail-file">Replace image</label>
            )}
          </div>

          <div className="form-stack">
            <label htmlFor="item-title">Title</label>
            <input
              ref={titleRef}
              id="item-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A title you will remember"
            />
          </div>

          <div className="form-grid">
            <div className="form-stack">
              <label htmlFor="item-category">Category</label>
              <div className="select-wrap">
                <select id="item-category" value={category} onChange={(event) => setCategory(event.target.value as Category)}>
                  {categories.map((value) => <option key={value}>{value}</option>)}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </div>
            </div>
            <div className="form-stack">
              <label htmlFor="item-collection">Collection</label>
              <div className="select-wrap">
                <select id="item-collection" value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>
                  <option value="">No collection</option>
                  {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.title}</option>)}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="form-stack">
            <label htmlFor="destination-link">Destination link</label>
            <div className="link-input-wrap">
              <Link2 size={17} aria-hidden="true" />
              <input
                id="destination-link"
                inputMode="url"
                value={destinationUrl}
                onChange={(event) => setDestinationUrl(event.target.value)}
                placeholder="https://..."
                required
              />
            </div>
            <span className="input-hint">{visibleDomain}</span>
          </div>

          <details className="advanced-fields">
            <summary>More details <ChevronDown size={16} aria-hidden="true" /></summary>
            <div className="advanced-grid">
              <div className="form-stack">
                <label htmlFor="reel-link">Original reel link</label>
                <input id="reel-link" inputMode="url" value={reelUrl} onChange={(event) => setReelUrl(event.target.value)} placeholder="https://instagram.com/reel/..." />
              </div>
              <div className="form-stack">
                <label htmlFor="creator">Creator</label>
                <input id="creator" value={creator} onChange={(event) => setCreator(event.target.value)} placeholder="Name or @handle" />
              </div>
              <div className="form-stack">
                <label htmlFor="received-at">Date received</label>
                <input id="received-at" type="date" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} />
              </div>
              <div className="form-stack form-span">
                <label htmlFor="notes">Notes</label>
                <textarea id="notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Why did this catch your eye?" />
              </div>
            </div>
          </details>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="composer-domain-line">
            <Clock3 size={15} aria-hidden="true" />
            <span>Metadata can finish in the background. Your save will not wait.</span>
          </div>

          <button className="primary-button save-submit" type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={19} aria-hidden="true" /> : <Check size={19} aria-hidden="true" />}
            {saving ? "Saving…" : "Save memory"}
          </button>
        </form>
      </section>
    </div>
  );
}
