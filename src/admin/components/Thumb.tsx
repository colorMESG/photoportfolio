import { useState } from "react";
import { previewUrl } from "../../lib/images";

/**
 * Admin thumbnail. Never shows a broken-image icon: if the preview URL fails
 * it retries the original, and if that fails it shows a neutral plate.
 */
export function Thumb({
  src,
  alt,
  className = "",
  objectPosition,
  width = 320,
  height = 400,
  eager = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  objectPosition?: string;
  width?: number;
  height?: number;
  eager?: boolean;
}) {
  const original = src ?? "";
  const sized = original ? previewUrl(original, { width, height }) : "";
  const [stage, setStage] = useState<"preview" | "original" | "empty">(
    original ? "preview" : "empty"
  );

  const shown = stage === "original" ? original : sized;

  if (stage === "empty" || !shown) {
    return (
      <div
        className={`bg-neutral-900 ${className}`}
        aria-hidden
        title="No photograph"
      />
    );
  }

  return (
    <img
      src={shown}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`bg-neutral-900 object-cover ${className}`}
      style={objectPosition ? { objectPosition } : undefined}
      onError={() => {
        if (stage === "preview" && sized !== original && original) {
          setStage("original");
          return;
        }
        setStage("empty");
      }}
    />
  );
}

export function SourceBadge({
  source,
}: {
  source: "static" | "supabase" | "static-current" | "supabase-new";
}) {
  const label = {
    static: "STATIC",
    supabase: "MANAGED",
    "static-current": "CURRENT · STATIC",
    "supabase-new": "NEW · SUPABASE",
  }[source];

  const tone =
    source === "supabase" || source === "supabase-new"
      ? "border-emerald-900/70 bg-emerald-950/50 text-emerald-300"
      : "border-neutral-700 bg-neutral-950/70 text-neutral-300";

  return (
    <span
      className={`inline-flex items-center border px-1.5 py-0.5 font-mono text-[10px] tracking-wider ${tone}`}
    >
      {label}
    </span>
  );
}
