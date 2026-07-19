import { FolderHeart, Home, Plus, Search } from "lucide-react";
import type { ViewId } from "@/lib/types";

interface MobileNavProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  onSave: () => void;
}

const mobileItems = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "search" as const, label: "Search", icon: Search },
  { id: "collections" as const, label: "Collections", icon: FolderHeart },
];

export function MobileNav({ activeView, onNavigate, onSave }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {mobileItems.slice(0, 2).map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" className={activeView === id ? "active" : ""} onClick={() => onNavigate(id)}>
          <Icon aria-hidden="true" size={21} />
          <span>{label}</span>
        </button>
      ))}
      <button className="mobile-save" type="button" onClick={onSave} aria-label="Save a new find">
        <Plus aria-hidden="true" size={24} />
        <span>Save</span>
      </button>
      {mobileItems.slice(2).map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" className={activeView === id ? "active" : ""} onClick={() => onNavigate(id)}>
          <Icon aria-hidden="true" size={21} />
          <span>{label}</span>
        </button>
      ))}
      <button type="button" className={activeView === "settings" ? "active" : ""} onClick={() => onNavigate("settings")}>
        <span className="mobile-avatar">GS</span>
        <span>Profile</span>
      </button>
    </nav>
  );
}
