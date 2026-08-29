import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill } from "@/components/admin/kit";
import { assetUrl, mediaFiles } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/media")({
  head: () => ({
    meta: [
      { title: "Media Library — Luce by Lucia Admin" },
      { name: "description", content: "Every campaign, product and editorial image used across the Luce store." },
      { property: "og:title", content: "Media Library — Luce by Lucia Admin" },
      { property: "og:description", content: "Campaign, product and editorial imagery in one library." },
    ],
  }),
  component: MediaPage,
});

const folders = ["All", "Products", "Editorial", "Homepage"];

function MediaPage() {
  const [folder, setFolder] = useState("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<(typeof mediaFiles)[number] | null>(null);

  const files = useMemo(
    () =>
      mediaFiles.filter(
        (m) => (folder === "All" || m.folder === folder) && m.file.toLowerCase().includes(q.toLowerCase()),
      ),
    [folder, q],
  );

  const toggle = (f: string) =>
    setSelected((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Content"
        title="Media library"
        description="Images are stored in the site-images bucket and reused across products, collections and the homepage."
        actions={
          <button
            onClick={() => toast.success("Upload dialog ready — drop files to add them to the library")}
            className="inline-flex h-10 items-center gap-2 bg-ink px-4 text-sm text-primary-foreground hover:opacity-90"
          >
            <Upload className="size-4" strokeWidth={1.5} /> Upload images
          </button>
        }
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          toast.success("Files queued for upload");
        }}
        className="grid place-items-center border border-dashed border-border bg-card px-6 py-10 text-center"
      >
        <Upload className="size-5 text-muted-foreground" strokeWidth={1.25} />
        <p className="mt-3 text-sm">Drag images here to upload</p>
        <p className="mt-1 text-xs text-muted-foreground">WEBP or JPG, up to 5 MB. Recommended 1600×2000 for products.</p>
      </div>

      <div className="surface flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search filenames"
            className="h-10 w-full border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-gold"
          />
        </div>
        <div className="flex items-center gap-1 border border-border p-1">
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className={cn(
                "px-3 py-1.5 text-xs tracking-wide transition-colors",
                folder === f ? "bg-ink text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <button
            onClick={() => {
              toast.success(`${selected.length} file(s) deleted`);
              setSelected([]);
            }}
            className="inline-flex h-10 items-center gap-2 border border-destructive/40 px-3 text-xs tracking-widest text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" /> DELETE {selected.length}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {files.map((m) => (
          <figure
            key={m.file}
            className={cn(
              "surface group relative cursor-pointer overflow-hidden transition-colors hover:border-gold",
              selected.includes(m.file) && "border-gold",
            )}
            onClick={() => setDetail(m)}
          >
            <img src={assetUrl(m.file)} alt={m.file} className="aspect-square w-full object-cover" loading="lazy" />
            <input
              type="checkbox"
              checked={selected.includes(m.file)}
              onClick={(e) => e.stopPropagation()}
              onChange={() => toggle(m.file)}
              className="absolute left-2 top-2 size-4"
            />
            <figcaption className="space-y-1 border-t border-border p-3">
              <p className="truncate text-xs">{m.file}</p>
              <p className="text-[10px] text-muted-foreground">
                {m.dims} · {m.size}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-6" onClick={() => setDetail(null)}>
          <div
            className="surface grid max-h-[85vh] w-full max-w-4xl grid-cols-1 overflow-auto md:grid-cols-[1.4fr_1fr]"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={assetUrl(detail.file)} alt={detail.file} className="h-full w-full object-cover" />
            <div className="space-y-4 border-l border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display text-2xl">{detail.file}</h2>
                <button onClick={() => setDetail(null)} aria-label="Close">
                  <X className="size-4" />
                </button>
              </div>
              <Pill tone="gold">{detail.folder}</Pill>
              <dl className="space-y-2 text-sm">
                {[
                  ["Dimensions", detail.dims],
                  ["Size", detail.size],
                  ["Uploaded", detail.date],
                  ["Bucket", "site-images"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border pb-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <button
                onClick={() => {
                  void navigator.clipboard?.writeText(assetUrl(detail.file));
                  toast.success("Public URL copied");
                }}
                className="inline-flex h-10 w-full items-center justify-center gap-2 border border-border text-sm hover:border-gold"
              >
                <Copy className="size-4" strokeWidth={1.5} /> Copy public URL
              </button>
              <button
                onClick={() => {
                  toast.success("Image deleted");
                  setDetail(null);
                }}
                className="h-10 w-full border border-destructive/40 text-sm text-destructive hover:bg-destructive/10"
              >
                Delete image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
