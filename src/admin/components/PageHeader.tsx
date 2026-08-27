import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex items-start justify-between gap-6">
      <div className="space-y-1">
        <h1 className="text-xl font-medium text-neutral-100">{title}</h1>
        {description && <p className="text-sm text-neutral-500">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

export function ViewOnSite({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="text-sm text-neutral-400 transition-colors hover:text-neutral-200"
    >
      View on site ↗
    </a>
  );
}

/** Stand-in for sections that arrive in a later phase. */
export function ComingNext({ what }: { what: string }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-800 px-5 py-8 text-sm text-neutral-500">
      {what}
    </div>
  );
}
