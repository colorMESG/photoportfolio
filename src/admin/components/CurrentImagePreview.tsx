import { SourceBadge, Thumb } from "./Thumb";

/**
 * Read-only plate for a photograph the public site currently renders.
 * Unsplash placeholders stay here until a storage path is saved — they are
 * never copied into Supabase.
 */
export default function CurrentImagePreview({
  title,
  src,
  alt,
  managed,
}: {
  title: string;
  src: string;
  alt: string;
  managed?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-neutral-200">{title}</h3>
        <SourceBadge source={managed ? "supabase" : "static-current"} />
      </div>
      <div className="relative aspect-[3/4] max-w-[220px] overflow-hidden border border-neutral-800 bg-neutral-900">
        <Thumb src={src} alt={alt} width={440} height={586} className="size-full" eager />
      </div>
      <p className="text-xs text-neutral-500">{alt}</p>
    </div>
  );
}
