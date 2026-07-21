import type { SourcePlatform } from "./types";

const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/gi;

export function extractUrls(value: string): string[] {
  const matches = value.match(URL_PATTERN) ?? [];
  return Array.from(
    new Set(
      matches.map((url) => url.replace(/[.,!?;:]+$/, "")).filter(isSafeWebUrl),
    ),
  );
}

export function isSafeWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeUrl(value: string): string {
  const url = new URL(value);
  [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "igshid",
    "mc_cid",
    "mc_eid",
  ].forEach((key) => url.searchParams.delete(key));
  url.hash = "";
  return url.toString();
}

export function domainFromUrl(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "link pending";
  }
}

export function detectSourcePlatform(value: string): SourcePlatform {
  try {
    const hostname = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) return "Instagram";
    if (hostname === "tiktok.com" || hostname.endsWith(".tiktok.com")) return "TikTok";
    if (["youtube.com", "youtu.be"].includes(hostname) || hostname.endsWith(".youtube.com")) return "YouTube";
    if (["wa.me", "whatsapp.com"].includes(hostname) || hostname.endsWith(".whatsapp.com")) return "WhatsApp";
    if (["t.me", "telegram.me"].includes(hostname)) return "Telegram";
    return "Web";
  } catch {
    return "Other";
  }
}

export function splitSharedLinks(urls: string[]) {
  const normalized = urls.map(normalizeUrl);
  const platformUrl = normalized.find((url) => detectSourcePlatform(url) !== "Web") ?? "";
  const destinationUrl = normalized.find((url) => url !== platformUrl) ?? platformUrl ?? normalized[0] ?? "";
  const sourcePlatform = detectSourcePlatform(platformUrl || destinationUrl);
  const sourceUrl = normalized.length > 1 && platformUrl ? platformUrl : "";
  return {
    destinationUrl,
    sourcePlatform,
    sourceUrl,
  };
}
