import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteProject, listProjects, setPublished } from "../../lib/db/projects";
import type { ProjectKind, ProjectRow } from "../../lib/db/types";
import { Badge, Button, ErrorNote } from "../components/Form";
import { PageHeader } from "../components/PageHeader";

const COPY: Record<ProjectKind, { title: string; description: string; empty: string }> = {
  photography: {
    title: "Projects",
    description: "Editorial photography series shown under Selected Works.",
    empty: "No projects yet.",
  },
  flycam: {
    title: "Flycam",
    description: "Aerial work, with coordinates and altitude.",
    empty: "No aerial projects yet.",
  },
  corporate: {
    title: "Corporate",
    description: "Headshots, events and team photography.",
    empty: "No corporate projects yet.",
  },
};

export default function ProjectsListPage({ kind }: { kind: ProjectKind }) {
  const copy = COPY[kind];
  const navigate = useNavigate();
  const [rows, setRows] = useState<ProjectRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await listProjects(kind);
    setError(err);
    setRows(data ?? []);
  }, [kind]);

  useEffect(() => {
    setRows(null);
    void load();
  }, [load]);

  async function togglePublished(row: ProjectRow) {
    setBusyId(row.id);
    const { error: err } = await setPublished(row.id, !row.published);
    setBusyId(null);
    if (err) return setError(err);
    await load();
  }

  async function remove(row: ProjectRow) {
    const ok = window.confirm(
      `Delete “${row.title}”?\n\nIts photographs are removed from the database too. This cannot be undone.`
    );
    if (!ok) return;
    setBusyId(row.id);
    const { error: err } = await deleteProject(row.id);
    setBusyId(null);
    if (err) return setError(err);
    await load();
  }

  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Button variant="primary" onClick={() => navigate("new")}>
            New project
          </Button>
        }
      />

      {error && <div className="mb-5"><ErrorNote>{error}</ErrorNote></div>}

      {rows === null ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 px-5 py-10 text-center">
          <p className="text-sm text-neutral-400">{copy.empty}</p>
          <p className="mt-1 text-xs text-neutral-600">
            Create one, then add photographs to it.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900/60 text-xs tracking-wide text-neutral-500 uppercase">
              <tr>
                <th className="px-4 py-2.5 font-medium">Label</th>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Year</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-900/40">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                    {row.display_number ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={row.id}
                      className="font-medium text-neutral-100 hover:underline"
                    >
                      {row.title}
                    </Link>
                    <span className="block font-mono text-xs text-neutral-600">
                      /{row.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{row.year ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={row.published ? "on" : "off"}>
                      {row.published ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        disabled={busyId === row.id}
                        onClick={() => void togglePublished(row)}
                      >
                        {row.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="danger"
                        disabled={busyId === row.id}
                        onClick={() => void remove(row)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows !== null && rows.length > 1 && (
        <p className="mt-4 text-xs text-neutral-600">
          Listed in sort order. Drag-to-reorder arrives in the next phase; the
          visible label above is independent of that order.
        </p>
      )}
    </>
  );
}
