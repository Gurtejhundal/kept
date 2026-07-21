import { lookup } from "node:dns/promises";
import { NextResponse } from "next/server";
import { Agent, fetch } from "undici";
import { assertPublicHttpUrl, isPrivateAddress } from "@/lib/metadata-security";

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

function contentValue(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const propertyFirst = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  const contentFirst = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i");
  return propertyFirst.exec(html)?.[1] ?? contentFirst.exec(html)?.[1] ?? "";
}

function decodeEntities(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

async function assertPublicHost(url: URL) {
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error("The destination resolves to a private network address.");
  return addresses[0];
}

async function safeFetch(initialUrl: string) {
  let current = assertPublicHttpUrl(initialUrl);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const selected = await assertPublicHost(current);
    const dispatcher = new Agent({
      connect: {
        lookup: (_hostname, options, callback) => {
          if (options.all) callback(null, [selected]);
          else callback(null, selected.address, selected.family);
        },
      },
    });
    try {
      const response = await fetch(current, {
        dispatcher,
        redirect: "manual",
        headers: { accept: "text/html,application/xhtml+xml", "user-agent": "KeptMetadata/1.0" },
        signal: AbortSignal.timeout(8_000),
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirects === MAX_REDIRECTS) throw new Error("The destination redirected too many times.");
        current = assertPublicHttpUrl(new URL(location, current).toString());
        continue;
      }
      if (!response.ok) throw new Error(`The destination returned HTTP ${response.status}.`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) throw new Error("The destination is not an HTML page.");
      const declaredLength = Number(response.headers.get("content-length") || 0);
      if (declaredLength > MAX_RESPONSE_BYTES) throw new Error("The page is too large to inspect safely.");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("The destination returned no readable body.");
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          throw new Error("The page is too large to inspect safely.");
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(total);
      let offset = 0;
      chunks.forEach((chunk) => { bytes.set(chunk, offset); offset += chunk.byteLength; });
      return { html: new TextDecoder().decode(bytes), url: current };
    } finally {
      await dispatcher.close();
    }
  }
  throw new Error("The destination could not be inspected.");
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== "string" || body.url.length > 4_096) return NextResponse.json({ error: "Provide one valid URL." }, { status: 400 });
    const { html, url } = await safeFetch(body.url);
    const title = contentValue(html, "og:title") || /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || "";
    const description = contentValue(html, "og:description") || contentValue(html, "description");
    const image = contentValue(html, "og:image");
    const canonical = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html)?.[1] ?? "";
    return NextResponse.json({
      canonicalUrl: canonical ? new URL(canonical, url).toString() : url.toString(),
      description: decodeEntities(description).slice(0, 1_000),
      domain: url.hostname.replace(/^www\./, ""),
      imageUrl: image ? new URL(image, url).toString() : "",
      status: title || description || image ? "complete" : "partial",
      title: decodeEntities(title).slice(0, 500),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Metadata extraction failed." }, { status: 422 });
  }
}
