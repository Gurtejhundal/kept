import Image from "next/image";
import { ImagePlus } from "lucide-react";

interface MemoryMediaProps {
  title: string;
  spriteIndex: number;
  thumbnailData?: string;
  priority?: boolean;
}

export function MemoryMedia({
  title,
  spriteIndex,
  thumbnailData,
  priority = false,
}: MemoryMediaProps) {
  if (thumbnailData) {
    return (
      <Image
        src={thumbnailData}
        alt={`Saved reel thumbnail for ${title}`}
        fill
        unoptimized
        sizes="(max-width: 767px) 50vw, (max-width: 1279px) 30vw, 20vw"
        className="memory-image"
      />
    );
  }

  if (spriteIndex < 0) {
    return (
      <div className="missing-image" aria-label={`No thumbnail for ${title}`}>
        <ImagePlus aria-hidden="true" size={24} />
        <span>Add thumbnail</span>
      </div>
    );
  }

  return (
    <Image
      src={`/memories/memory-${String((spriteIndex % 12) + 1).padStart(2, "0")}.jpg`}
      alt={`Saved reel thumbnail for ${title}`}
      fill
      priority={priority}
      sizes="(max-width: 767px) 50vw, (max-width: 1279px) 30vw, 20vw"
      className="memory-image"
    />
  );
}
