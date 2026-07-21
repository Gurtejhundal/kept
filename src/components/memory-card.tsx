import { ArrowUpRight, CircleAlert, CircleCheck } from "lucide-react";
import type { SavedItem } from "@/lib/types";
import { MemoryMedia } from "./memory-media";

interface MemoryCardProps {
  item: SavedItem;
  onOpen: (item: SavedItem) => void;
  list?: boolean;
  priority?: boolean;
  thumbnailUrl?: string;
}

function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function MemoryCard({ item, onOpen, list = false, priority, thumbnailUrl }: MemoryCardProps) {
  const needsContext = !["complete", "manual"].includes(item.metadataStatus);
  const statusLabel =
    item.sourceStatus === "unavailable"
      ? "Source unavailable"
      : needsContext
        ? "Details incomplete"
        : item.sourceStatus === "unchecked"
          ? "Source not checked"
          : "Source available";

  if (list) {
    return (
      <button className="memory-list-row" type="button" onClick={() => onOpen(item)}>
        <span className="list-thumbnail">
          <MemoryMedia title={item.title} spriteIndex={item.spriteIndex} thumbnailUrl={thumbnailUrl} />
        </span>
        <span className="list-copy">
          <strong>{item.title}</strong>
          <span>{item.handle} · {item.domain}</span>
        </span>
        <span className="list-category">{item.category}</span>
        <span className="list-date">{formatCompactDate(item.savedAt)}</span>
        <span className={`status-text status-${item.sourceStatus}`}>{statusLabel}</span>
        <ArrowUpRight aria-hidden="true" size={18} />
      </button>
    );
  }

  return (
    <article className={`memory-card variant-${item.variant}`}>
      <button
        className="memory-card-button"
        type="button"
        onClick={() => onOpen(item)}
        aria-label={`Open ${item.title}`}
      >
        <span className={`memory-card-media ${item.sourceStatus === "unavailable" ? "is-deleted" : ""}`}>
          <MemoryMedia
            title={item.title}
            spriteIndex={item.spriteIndex}
            thumbnailUrl={thumbnailUrl}
            priority={priority}
          />
          <span className="card-open-icon" aria-hidden="true">
            <ArrowUpRight size={17} />
          </span>
          {item.sourceStatus === "unavailable" && (
            <span className="deleted-badge"><CircleAlert size={13} /> Source unavailable</span>
          )}
        </span>
        <span className="memory-card-copy">
          <strong>{item.title}</strong>
          <span className="card-byline">{item.handle} · {formatCompactDate(item.savedAt)}</span>
          <span className="card-footer">
            <span className={`category category-${item.category.toLowerCase()}`}>{item.category}</span>
            <span className={`card-status status-${item.sourceStatus}`} title={statusLabel}>
              {needsContext ? (
                <CircleAlert size={13} aria-hidden="true" />
              ) : (
                <CircleCheck size={13} aria-hidden="true" />
              )}
              <span>{needsContext ? "Complete details" : "Saved"}</span>
            </span>
          </span>
        </span>
      </button>
    </article>
  );
}
