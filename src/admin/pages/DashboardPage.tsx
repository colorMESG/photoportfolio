import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase";
import { PageHeader } from "../components/PageHeader";

type Counts = Record<string, number | null>;

const TABLES = ["projects", "project_images", "gallery_images", "services"] as const;

export default function DashboardPage() {
  const [counts, setCounts] = useState<Counts>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let alive = true;

    void (async () => {
      const results: Counts = {};
      for (const table of TABLES) {
        const { count, error: err } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        if (err) {
          if (alive) setError(err.message);
          return;
        }
        results[table] = count ?? 0;
      }
      if (alive) setCounts(results);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Content currently stored in Supabase."
      />

      {error ? (
        <div className="rounded-lg border border-red-900/60 bg-red-950/30 px-5 py-4 text-sm text-red-300">
          <p className="font-medium">Could not read from the database.</p>
          <p className="mt-1 text-red-400/90">{error}</p>
          <p className="mt-2 text-red-400/70">
            If the tables do not exist yet, run the files in{" "}
            <code>supabase/migrations/</code> in order.
          </p>
        </div>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TABLES.map((table) => (
            <div
              key={table}
              className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3"
            >
              <dt className="text-xs tracking-wide text-neutral-500 uppercase">
                {table.replace(/_/g, " ")}
              </dt>
              <dd className="mt-1 text-2xl font-medium text-neutral-100 tabular-nums">
                {counts[table] ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-8 max-w-prose text-sm leading-relaxed text-neutral-500">
        Public content resolves as{" "}
        <code className="text-neutral-400">hidden override → nothing</code>
        {", "}
        <code className="text-neutral-400">published managed project → managed</code>
        {", otherwise "}
        <code className="text-neutral-400">static fallback</code>
        . Hiding a static-backed project does not restore it when the database row is missing.
        Page copy uses{" "}
        <code className="text-neutral-400">Save Draft</code> then{" "}
        <code className="text-neutral-400">Publish</code>. Run{" "}
        <code className="text-neutral-400">supabase/migrations/0005_content_publish.sql</code>
        {", "}
        <code className="text-neutral-400">0006_image_derivatives.sql</code>
        {", then "}
        <code className="text-neutral-400">0007_project_image_display_metadata.sql</code>
        {", then "}
        <code className="text-neutral-400">0008_project_visibility_overrides.sql</code>{" "}
        in the SQL Editor. Photographs are optimized in the browser before
        upload — originals are not stored on the Free plan. Until 0005 is
        applied, drafts share the live{" "}
        <code className="text-neutral-400">data</code> column.
      </p>
    </>
  );
}
