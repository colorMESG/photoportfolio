import type { OptimizedPair, OptimizeStage } from "../../lib/optimizeImage";
import { formatBytes, formatPixels, STAGE_LABEL } from "../../lib/optimizeImage";

export interface InflightUpload {
  key: string;
  name: string;
  preview: string | null;
  stage: OptimizeStage;
  percent: number;
  error: string | null;
  optimized: OptimizedPair | null;
}

export function OptimizeReport({
  sourceName,
  stage,
  percent,
  optimized,
  error,
}: {
  sourceName: string;
  stage: OptimizeStage | null;
  percent?: number | null;
  optimized?: OptimizedPair | null;
  error?: string | null;
}) {
  return (
    <div className="space-y-1 font-mono text-[11px] leading-relaxed text-neutral-400">
      <p className="truncate text-neutral-300">{sourceName}</p>
      {error ? (
        <p className="text-red-400">{error}</p>
      ) : stage && stage !== "done" ? (
        <p>
          {STAGE_LABEL[stage]}
          {percent != null && (stage === "uploading-web" || stage === "uploading-thumb")
            ? ` ${percent}%`
            : ""}
        </p>
      ) : stage === "done" ? (
        <p className="text-emerald-400">{STAGE_LABEL.done}</p>
      ) : null}
      {optimized && (
        <ul className="space-y-0.5 text-neutral-500">
          <li>
            Original: {formatPixels(optimized.sourceWidth, optimized.sourceHeight)} ·{" "}
            {formatBytes(optimized.sourceBytes)}
          </li>
          <li>
            Optimized: {formatPixels(optimized.webWidth, optimized.webHeight)} ·{" "}
            {formatBytes(optimized.webBytes)}
          </li>
          <li>
            Thumbnail: {formatPixels(optimized.thumbWidth, optimized.thumbHeight)} ·{" "}
            {formatBytes(optimized.thumbBytes)}
          </li>
        </ul>
      )}
    </div>
  );
}

export function StoredOptimizeNote({
  filename,
  sourceWidth,
  sourceHeight,
  sourceBytes,
  webWidth,
  webHeight,
  webBytes,
  thumbBytes,
}: {
  filename?: string | null;
  sourceWidth?: number | null;
  sourceHeight?: number | null;
  sourceBytes?: number | null;
  webWidth?: number | null;
  webHeight?: number | null;
  webBytes?: number | null;
  thumbBytes?: number | null;
}) {
  if (!sourceWidth && !webBytes && !webWidth) return null;
  return (
    <ul className="space-y-0.5 font-mono text-[11px] text-neutral-500">
      {filename && <li className="truncate text-neutral-400">{filename}</li>}
      {sourceWidth && sourceHeight && (
        <li>
          Original: {formatPixels(sourceWidth, sourceHeight)}
          {sourceBytes ? ` · ${formatBytes(sourceBytes)}` : ""}
        </li>
      )}
      {webWidth && webHeight && (
        <li>
          Optimized: {formatPixels(webWidth, webHeight)}
          {webBytes ? ` · ${formatBytes(webBytes)}` : ""}
        </li>
      )}
      {thumbBytes ? <li>Thumbnail: {formatBytes(thumbBytes)}</li> : null}
    </ul>
  );
}
