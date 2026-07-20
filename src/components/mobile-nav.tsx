import { Bookmark, FolderHeart, Home, Plus, Search } from "lucide-react";
import type { ViewId } from "@/lib/types";

interface MobileNavProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  onSave: () => void;
}

const mobileItems = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "search" as const, label: "Search", icon: Search },
  { id: "all" as const, label: "All saves", icon: Bookmark },
  { id: "collections" as const, label: "Collections", icon: FolderHeart },
];

export function MobileNav({ activeView, onNavigate, onSave }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {mobileItems.slice(0, 2).map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" className={activeView === id ? "active" : ""} onClick={() => onNavigate(id)} aria-current={activeView === id ? "page" : undefined}>
          <Icon aria-hidden="true" size={21} />
          <span>{label}</span>
        </button>
      ))}
      <button className="mobile-save" type="button" onClick={onSave} aria-label="Save a new find">
        <Plus aria-hidden="true" size={24} />
        <span>Save</span>
      </button>
      {mobileItems.slice(2).map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" className={activeView === id ? "active" : ""} onClick={() => onNavigate(id)} aria-current={activeView === id ? "page" : undefined}>
          <Icon aria-hidden="true" size={21} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
