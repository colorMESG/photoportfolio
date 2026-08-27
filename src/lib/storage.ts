import { supabaseAnonKey, supabaseUrl } from "./env";
import { PORTFOLIO_BUCKET } from "./images";
import { requireSupabase } from "./supabase";

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * Uploads bytes to the `portfolio` bucket. Used for optimized WebP derivatives,
 * never for the photographer's original file.
 */
export async function uploadOriginal(
  path: string,
  file: Blob,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ error: string | null }> {
  const session = await requireSupabase().auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) return { error: "You are not signed in." };

  const url = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${PORTFOLIO_BUCKET}/${path}`;
  const name = file instanceof File ? file.name : path.split("/").pop() ?? path;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("apikey", supabaseAnonKey);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "31536000");
    const type = file.type || "image/webp";
    xhr.setRequestHeader("Content-Type", type);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress({
        loaded: event.loaded,
        total: event.total,
        percent: Math.round((event.loaded / event.total) * 100),
      });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
        resolve({ error: null });
        return;
      }
      resolve({ error: storageMessage(xhr.status, xhr.responseText, name) });
    };
    xhr.onerror = () => resolve({ error: `${name}: network error during upload.` });
    xhr.onabort = () => resolve({ error: `${name}: upload cancelled.` });
    xhr.send(file);
  });
}

export async function deleteStoredObject(path: string): Promise<{ error: string | null }> {
  const { error } = await requireSupabase().storage.from(PORTFOLIO_BUCKET).remove([path]);
  if (!error) return { error: null };
  return { error: error.message };
}

export async function deleteStoredObjects(paths: string[]): Promise<{ error: string | null }> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return { error: null };
  const { error } = await requireSupabase().storage.from(PORTFOLIO_BUCKET).remove(unique);
  if (!error) return { error: null };
  return { error: error.message };
}

/** Download an existing public Storage object so a legacy original can be re-optimized. */
export async function fetchStoredBlob(
  path: string
): Promise<{ data: Blob | null; error: string | null }> {
  const { data, error } = await requireSupabase().storage.from(PORTFOLIO_BUCKET).download(path);
  if (error || !data) {
    return { data: null, error: error?.message ?? `Could not download ${path}.` };
  }
  return { data, error: null };
}

function storageMessage(status: number, body: string, name: string): string {
  let detail = "";
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    detail = parsed.message ?? parsed.error ?? "";
  } catch {
    detail = body.slice(0, 180);
  }
  if (status === 409) return `${name} already exists in storage. Try again.`;
  if (status === 413) return `${name} is larger than the project’s upload limit.`;
  if (status === 401 || status === 403) {
    return `${name}: the database refused this upload. The signed-in account is not an administrator.`;
  }
  return `${name}: upload failed (${status})${detail ? ` — ${detail}` : ""}`;
}
