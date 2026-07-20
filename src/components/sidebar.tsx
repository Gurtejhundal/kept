import { Archive, Bookmark, FolderHeart, Home, Plus, Search, Settings, Trash2 } from "lucide-react";
import Image from "next/image";
import type { ViewId } from "@/lib/types";

const primaryNav: Array<{ id: ViewId; label: string; icon: typeof Home }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "all", label: "All saves", icon: Bookmark },
  { id: "collections", label: "Collections", icon: FolderHeart },
];

const utilityNav: Array<{ id: ViewId; label: string; icon: typeof Home }> = [
  { id: "archive", label: "Archive", icon: Archive },
  { id: "trash", label: "Trash", icon: Trash2 },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  onSave: () => void;
}

export function Sidebar({ activeView, onNavigate, onSave }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand-block">
        <Image src="/kept-mark.svg" alt="" className="brand-mark-img" width={35} height={35} priority />
        <span className="brand-name">Kept</span>
      </div>
      <nav className="desktop-nav">
        {primaryNav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`nav-item ${activeView === id ? "active" : ""}`}
            onClick={() => onNavigate(id)}
            aria-current={activeView === id ? "page" : undefined}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
        <button type="button" className="sidebar-save" onClick={onSave}>
          <Plus aria-hidden="true" size={19} />
          <span>Save a find</span>
        </button>
      </nav>
      <nav className="desktop-nav utility-nav" aria-label="Library management">
        {utilityNav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`nav-item ${activeView === id ? "active" : ""}`}
            onClick={() => onNavigate(id)}
            aria-current={activeView === id ? "page" : undefined}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <button type="button" className="profile-summary" onClick={() => onNavigate("settings")}>
        <span className="avatar">K</span>
        <span><strong>Local archive</strong><small>Private on this device</small></span>
      </button>
    </aside>
  );
}
