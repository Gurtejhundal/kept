import { KeptApp } from "@/components/kept-app";

interface ShareParameters {
  title?: string;
  text?: string;
  url?: string;
}

export const metadata = {
  title: "Save to Kept",
  robots: { index: false, follow: false },
};

export default async function SharePage({ searchParams }: { searchParams: Promise<ShareParameters> }) {
  const sharedCapture = await searchParams;
  return <KeptApp sharedCapture={sharedCapture} />;
}
