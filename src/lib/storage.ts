import { supabaseAnonKey, supabaseUrl } from "./env";
import { PORTFOLIO_BUCKET } from "./images";
import { requireSupabase } from "./supabase";

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * Uploads the original file bytes to the `portfolio` bucket.
 *
 * Uses XHR rather than supabase-js so the admin can show per-file progress.
 * Nothing is resized or recompressed — photography quality is left alone.
 */
export async function uploadOriginal(
  path: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ error: string | null }> {
  const session = await requireSupabase().auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) return { error: "You are not signed in." };

  const url = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${PORTFOLIO_BUCKET}/${path}`;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("apikey", supabaseAnonKey);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "31536000");
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);

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
      resolve({ error: storageMessage(xhr.status, xhr.responseText, file.name) });
    };
    xhr.onerror = () => resolve({ error: `${file.name}: network error during upload.` });
    xhr.onabort = () => resolve({ error: `${file.name}: upload cancelled.` });
    xhr.send(file);
  });
}

export async function deleteStoredObject(path: string): Promise<{ error: string | null }> {
  const { error } = await requireSupabase().storage.from(PORTFOLIO_BUCKET).remove([path]);
  if (!error) return { error: null };
  return { error: error.message };
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
