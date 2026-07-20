"use client";

import { Download, Grid2X2, HardDrive, List, Monitor, Moon, ShieldCheck, Sun, Trash2 } from "lucide-react";
import type { Density, SavedItem, Theme } from "@/lib/types";

export interface StorageEstimate {
  persisted: boolean;
  quota: number;
  usage: number;
}

interface SettingsViewProps {
  density: Density;
  items: SavedItem[];
  onClearSearchHistory: () => Promise<void>;
  onDensityChange: (density: Density) => void;
  onRequestPersistence: () => Promise<void>;
  onResetArchive: () => Promise<void>;
  onThemeChange: (theme: Theme) => void;
  onToast: (message: string) => void;
  recentSearches: string[];
  storage: StorageEstimate;
  theme: Theme;
}

function downloadFile(contents: string, fileName: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatBytes(value: number) {
  if (!value) return "0 MB";
  return `${(value / 1024 / 1024).toFixed(value > 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function SettingsView({
  density,
  items,
  onClearSearchHistory,
  onDensityChange,
  onRequestPersistence,
  onResetArchive,
  onThemeChange,
  onToast,
  recentSearches,
  storage,
  theme,
}: SettingsViewProps) {
  function exportJson() {
    downloadFile(JSON.stringify(items, null, 2), "kept-export.json", "application/json");
    onToast("JSON export downloaded");
  }

  function exportCsv() {
    const quoted = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = [
      ["title", "creator", "category", "platform", "destination", "saved_at"],
      ...items.map((item) => [item.title, item.creator, item.category, item.sourcePlatform, item.destinationUrl, item.savedAt]),
    ];
    downloadFile(rows.map((row) => row.map(quoted).join(",")).join("\n"), "kept-export.csv", "text/csv");
    onToast("CSV export downloaded");
  }

  async function confirmReset() {
    if (!window.confirm("Delete every locally stored item, collection, and visual reference from this browser?")) return;
    await onResetArchive();
  }

  const storagePercentage = storage.quota > 0 ? Math.min(100, (storage.usage / storage.quota) * 100) : 0;

  return (
    <section className="view-section settings-view" aria-labelledby="settings-title">
      <header className="page-header">
        <div>
          <span className="eyebrow">THIS DEVICE</span>
          <h1 id="settings-title">Settings</h1>
          <p>Control how this local archive looks, persists, and leaves your browser.</p>
        </div>
      </header>

      <div className="settings-grid">
        <article className="settings-card profile-card">
          <span className="settings-avatar">K</span>
          <div><h2>Local archive</h2><p>No account is connected. Data stays in this browser.</p></div>
          <span className="plan-badge">Device only</span>
        </article>

        <article className="settings-card">
          <div className="settings-card-heading"><Sun size={19} aria-hidden="true" /><div><h2>Appearance</h2><p>Follow the device or choose a fixed theme.</p></div></div>
          <div className="segmented-control three-options" aria-label="Color theme">
            <button type="button" className={theme === "light" ? "active" : ""} onClick={() => onThemeChange("light")}><Sun size={16} aria-hidden="true" /> Light</button>
            <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => onThemeChange("dark")}><Moon size={16} aria-hidden="true" /> Dark</button>
            <button type="button" className={theme === "system" ? "active" : ""} onClick={() => onThemeChange("system")}><Monitor size={16} aria-hidden="true" /> System</button>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-heading"><Grid2X2 size={19} aria-hidden="true" /><div><h2>Library view</h2><p>Choose visual recall or compact management.</p></div></div>
          <div className="segmented-control" aria-label="Library view">
            <button type="button" className={density === "grid" ? "active" : ""} onClick={() => onDensityChange("grid")}><Grid2X2 size={16} aria-hidden="true" /> Masonry</button>
            <button type="button" className={density === "list" ? "active" : ""} onClick={() => onDensityChange("list")}><List size={16} aria-hidden="true" /> List</button>
          </div>
        </article>

        <article className="settings-card storage-card">
          <div className="settings-card-heading"><HardDrive size={19} aria-hidden="true" /><div><h2>Browser storage</h2><p>{formatBytes(storage.usage)} used of {formatBytes(storage.quota)} available to this origin.</p></div></div>
          <div className="storage-meter" role="meter" aria-label="Browser storage used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(storagePercentage)}><span style={{ width: `${storagePercentage}%` }} /></div>
          <div className="storage-status"><span>{storage.persisted ? "Protected from automatic browser eviction" : "The browser may evict data under storage pressure"}</span>{!storage.persisted && <button className="quiet-action" type="button" onClick={() => void onRequestPersistence()}>Protect local data</button>}</div>
        </article>

        <article className="settings-card export-card">
          <div className="settings-card-heading"><Download size={19} aria-hidden="true" /><div><h2>Export your archive</h2><p>Titles, notes, platforms, links, and dates remain portable.</p></div></div>
          <div className="settings-actions">
            <button className="secondary-button" type="button" onClick={exportJson}>Download JSON</button>
            <button className="secondary-button" type="button" onClick={exportCsv}>Download CSV</button>
          </div>
        </article>

        <article className="settings-card privacy-card">
          <div className="settings-card-heading"><ShieldCheck size={19} aria-hidden="true" /><div><h2>Privacy by default</h2><p>Kept does not request social-media passwords or read private messages.</p></div></div>
          <button className="quiet-action" type="button" disabled={recentSearches.length === 0} onClick={() => void onClearSearchHistory()}>Clear {recentSearches.length || "no"} recent searches</button>
        </article>

        <article className="settings-card danger-card">
          <div className="settings-card-heading"><Trash2 size={19} aria-hidden="true" /><div><h2>Reset local archive</h2><p>Permanently remove this browser’s items, collections, and image blobs.</p></div></div>
          <button className="danger-outline-button" type="button" onClick={() => void confirmReset()}>Delete local data</button>
        </article>
      </div>
    </section>
  );
}
