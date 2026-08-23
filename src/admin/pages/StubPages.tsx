import { ComingNext, PageHeader } from "../components/PageHeader";

/**
 * Placeholders for the sections built in later phases. Each is a real route now
 * so navigation, guards and layout can be verified before the CRUD lands.
 */

export function GalleryPage() {
  return (
    <>
      <PageHeader
        title="Personal Gallery"
        description="Standalone images with no parent project."
      />
      <ComingNext what="Upload, ordering, focal points and captions arrive with the image manager." />
    </>
  );
}

export function ContentPage() {
  return (
    <>
      <PageHeader
        title="About / Content"
        description="Page copy: hero, marquee, statement, about, contact and footer."
      />
      <ComingNext what="Edits the content_blocks table. Arrives in phase 11." />
    </>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Site Settings"
        description="Brand name, contact details and SEO metadata."
      />
      <ComingNext what="Edits the single site_settings row. Arrives in phase 11." />
    </>
  );
}

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Not found" description="No admin page at this address." />
    </>
  );
}
