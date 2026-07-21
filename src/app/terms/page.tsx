import Link from "next/link";

export const metadata = { title: "Terms — Kept", description: "Plain-language terms for using Kept." };

export default function TermsPage() {
  return <main className="legal-page"><Link href="/">← Back to Kept</Link><span className="eyebrow">TERMS</span><h1>Use Kept for things you are allowed to keep.</h1><p>Kept is a private archive tool. You remain responsible for the links, notes, images, and other material you save and share.</p><h2>No source ownership</h2><p>Saving a reference does not transfer ownership of the original content. Kept links back to the destination and does not promise that third-party sources will remain available.</p><h2>Availability</h2><p>Local browser storage can be cleared or evicted by the browser. Use the complete ZIP backup and, when configured, account sync to reduce that risk.</p><h2>Prohibited use</h2><p>Do not use Kept to store unlawful material, credentials, malware, or content that violates another person’s privacy or rights.</p><h2>Changes</h2><p>These terms may evolve before public launch. Material changes should be dated and communicated inside the product.</p></main>;
}
