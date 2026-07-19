"use client";

import { Download, Grid2X2, List, Moon, ShieldCheck, Sun, Trash2 } from "lucide-react";
import type { Density, SavedItem, Theme } from "@/lib/types";

interface SettingsViewProps {
  theme: Theme;
  density: Density;
  items: SavedItem[];
  onThemeChange: (theme: Theme) => void;
  onDensityChange: (density: Density) => void;
  onToast: (message: string) => void;
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

export function SettingsView({
  theme,
  density,
  items,
  onThemeChange,
  onDensityChange,
  onToast,
}: SettingsViewProps) {
  function exportJson() {
    downloadFile(JSON.stringify(items, null, 2), "kept-export.json", "application/json");
    onToast("JSON export downloaded");
  }

  function exportCsv() {
    const quoted = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = [
      ["title", "creator", "category", "destination", "saved_at"],
      ...items.map((item) => [item.title, item.creator, item.category, item.destinationUrl, item.savedAt]),
    ];
    downloadFile(rows.map((row) => row.map(quoted).join(",")).join("\n"), "kept-export.csv", "text/csv");
    onToast("CSV export downloaded");
  }

  return (
    <section className="view-section settings-view" aria-labelledby="settings-title">
      <header className="page-header">
        <div>
          <span className="eyebrow">YOUR ACCOUNT</span>
          <h1 id="settings-title">Settings</h1>
          <p>Choose how your archive feels and keep control of what you have saved.</p>
        </div>
      </header>

      <div className="settings-grid">
        <article className="settings-card profile-card">
          <span className="settings-avatar">GS</span>
          <div><h2>Gurtej</h2><p>gurtej@example.com</p></div>
          <span className="plan-badge">Free archive</span>
        </article>

        <article className="settings-card">
          <div className="settings-card-heading"><Sun size={19} aria-hidden="true" /><div><h2>Appearance</h2><p>Keep the archive calm in either theme.</p></div></div>
          <div className="segmented-control" aria-label="Color theme">
            <button type="button" className={theme === "light" ? "active" : ""} onClick={() => onThemeChange("light")}><Sun size={16} /> Light</button>
            <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => onThemeChange("dark")}><Moon size={16} /> Dark</button>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-heading"><Grid2X2 size={19} aria-hidden="true" /><div><h2>Library view</h2><p>Choose visual recall or compact management.</p></div></div>
          <div className="segmented-control" aria-label="Library view">
            <button type="button" className={density === "grid" ? "active" : ""} onClick={() => onDensityChange("grid")}><Grid2X2 size={16} /> Masonry</button>
            <button type="button" className={density === "list" ? "active" : ""} onClick={() => onDensityChange("list")}><List size={16} /> List</button>
          </div>
        </article>

        <article className="settings-card export-card">
          <div className="settings-card-heading"><Download size={19} aria-hidden="true" /><div><h2>Export your archive</h2><p>Your titles, notes, categories, links, and dates remain portable.</p></div></div>
          <div className="settings-actions">
            <button className="secondary-button" type="button" onClick={exportJson}>Download JSON</button>
            <button className="secondary-button" type="button" onClick={exportCsv}>Download CSV</button>
          </div>
        </article>

        <article className="settings-card privacy-card">
          <div className="settings-card-heading"><ShieldCheck size={19} aria-hidden="true" /><div><h2>Privacy by default</h2><p>Collections start private. Kept never asks for your Instagram password or reads private DMs.</p></div></div>
          <button className="quiet-action" type="button" onClick={() => onToast("Search history cleared")}>Clear search history</button>
        </article>

        <article className="settings-card danger-card">
          <div className="settings-card-heading"><Trash2 size={19} aria-hidden="true" /><div><h2>Delete account</h2><p>Start a recoverable account deletion request.</p></div></div>
          <button className="danger-outline-button" type="button" onClick={() => onToast("Deletion request requires confirmation")}>Request deletion</button>
        </article>
      </div>
    </section>
  );
}
