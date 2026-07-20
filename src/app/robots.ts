import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/share" },
    sitemap: "https://reelrecall-archive.gurtejbirsinghh.chatgpt.site/sitemap.xml",
  };
}
