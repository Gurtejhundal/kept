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

export function splitSharedLinks(urls: string[]) {
  const reelUrl =
    urls.find((url) => /instagram\.com\/(reel|p)\//i.test(url)) ?? "";
  const destinationUrl = urls.find((url) => url !== reelUrl) ?? reelUrl ?? "";
  return { destinationUrl, reelUrl };
}
