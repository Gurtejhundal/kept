import Link from "next/link";

export const metadata = { title: "Privacy — Kept", description: "How Kept handles private archive data." };

export default function PrivacyPage() {
  return <main className="legal-page"><Link href="/">← Back to Kept</Link><span className="eyebrow">PRIVACY</span><h1>Your archive is yours.</h1><p>Kept stores saves locally in your browser first. When you connect an account, only the data needed to sync your archive is sent to the configured Kept backend.</p><h2>What Kept stores</h2><p>Saved titles, notes, links, categories, tags, collections, dates, and image references that you choose to add. Kept does not request social-media passwords, scrape private messages, or store full conversations.</p><h2>Analytics</h2><p>Private notes, message text, and full URLs must never be included in analytics events. Analytics and crash reporting remain disabled unless the deployment explicitly configures them.</p><h2>Your controls</h2><p>You can download a complete ZIP backup, clear local browser data, revoke sessions, or delete a connected account and its synced cloud data from Settings.</p><h2>Sharing</h2><p>Collections are private by default. A future shared link must be explicitly created, revocable, and exclude private notes by default.</p></main>;
}
