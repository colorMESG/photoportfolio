/**
 * Builds a URL-safe slug from a title.
 *
 * Handles Vietnamese properly, which the usual one-liner does not: NFD
 * decomposition strips the tone and vowel marks, but đ/Đ is a distinct letter
 * with no combining form, so it needs an explicit mapping. Without that,
 * "Nghiên cứu Chân dung" and "Đà Nẵng" would slug to "nghien-cu-chan-dung" and
 * "-a-n-ng".
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Appends -2, -3, … until the slug no longer collides with `taken`. */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = slugify(base) || "untitled";
  if (!used.has(root)) return root;
  for (let n = 2; n < 500; n++) {
    const candidate = `${root}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${root}-${Date.now()}`;
}
