import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Copy, Search, Trash2, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill } from "@/components/admin/kit";
import { siteAssetUrl, SITE_IMAGES_BUCKET } from "@/lib/format";
import { useMediaFiles, useUploadMedia, useDeleteMedia, type MediaFile } from "@/lib/queries/media";
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
  const [selected, setSelected] = useState<number[]>([]);
  const [detail, setDetail] = useState<MediaFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: mediaFiles = [], isLoading } = useMediaFiles();
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();

  const files = useMemo(
    () =>
      mediaFiles.filter(
        (m) => (folder === "All" || m.folder === folder) && m.filename.toLowerCase().includes(q.toLowerCase()),
      ),
    [mediaFiles, folder, q],
  );

  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const uploadFiles = async (fileList: FileList | File[]) => {
    const targetFolder = folder === "All" ? "Products" : folder;
    const list = Array.from(fileList);
    for (const file of list) {
      try {
        await uploadMedia.mutateAsync({ file, folder: targetFolder });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
        return;
      }
    }
    toast.success(`${list.length} file(s) uploaded to ${targetFolder}`);
  };

  const handleDeleteSelected = () => {
    const targets = mediaFiles.filter((m) => selected.includes(m.id)).map((m) => ({ id: m.id, path: m.file }));
    if (!window.confirm(`Delete ${targets.length} file(s)? This is permanent.`)) return;
    deleteMedia.mutate(targets, {
      onSuccess: () => {
        toast.success(`${targets.length} file(s) deleted`);
        setSelected([]);
      },
      onError: () => toast.error("Failed to delete files"),
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Content"
        title="Media library"
        description={`Images are stored in the ${SITE_IMAGES_BUCKET} bucket and reused across products, collections and the homepage.`}
        actions={
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 items-center gap-2 bg-ink px-4 text-sm text-primary-foreground hover:opacity-90"
          >
            <Upload className="size-4" strokeWidth={1.5} /> Upload images
          </button>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        className="grid place-items-center border border-dashed border-border bg-card px-6 py-10 text-center"
      >
        <Upload className="size-5 text-muted-foreground" strokeWidth={1.25} />
        <p className="mt-3 text-sm">Drag images here to upload</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Uploads go to "{folder === "All" ? "Products" : folder}" — switch the folder tab below to change that.
        </p>
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
            onClick={handleDeleteSelected}
            className="inline-flex h-10 items-center gap-2 border border-destructive/40 px-3 text-xs tracking-widest text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" /> DELETE {selected.length}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading media…
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {files.map((m) => (
            <figure
              key={m.id}
              className={cn(
                "surface group relative cursor-pointer overflow-hidden transition-colors hover:border-gold",
                selected.includes(m.id) && "border-gold",
              )}
              onClick={() => setDetail(m)}
            >
              <img src={siteAssetUrl(m.file)} alt={m.filename} className="aspect-square w-full object-cover" loading="lazy" />
              <input
                type="checkbox"
                checked={selected.includes(m.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggle(m.id)}
                className="absolute left-2 top-2 size-4"
              />
              <figcaption className="space-y-1 border-t border-border p-3">
                <p className="truncate text-xs">{m.filename}</p>
                <p className="text-[10px] text-muted-foreground">{m.dims}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-6" onClick={() => setDetail(null)}>
          <div
            className="surface grid max-h-[85vh] w-full max-w-4xl grid-cols-1 overflow-auto md:grid-cols-[1.4fr_1fr]"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={siteAssetUrl(detail.file)} alt={detail.filename} className="h-full w-full object-cover" />
            <div className="space-y-4 border-l border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display text-2xl">{detail.filename}</h2>
                <button onClick={() => setDetail(null)} aria-label="Close">
                  <X className="size-4" />
                </button>
              </div>
              <Pill tone="gold">{detail.folder}</Pill>
              <dl className="space-y-2 text-sm">
                {[
                  ["Dimensions", detail.dims],
                  ["Type", detail.mimeType ?? "—"],
                  ["Uploaded", new Date(detail.date).toLocaleDateString()],
                  ["Bucket", SITE_IMAGES_BUCKET],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border pb-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <button
                onClick={() => {
                  void navigator.clipboard?.writeText(siteAssetUrl(detail.file));
                  toast.success("Public URL copied");
                }}
                className="inline-flex h-10 w-full items-center justify-center gap-2 border border-border text-sm hover:border-gold"
              >
                <Copy className="size-4" strokeWidth={1.5} /> Copy public URL
              </button>
              <button
                onClick={() => {
                  deleteMedia.mutate([{ id: detail.id, path: detail.file }], {
                    onSuccess: () => {
                      toast.success("Image deleted");
                      setDetail(null);
                    },
                    onError: () => toast.error("Failed to delete image"),
                  });
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
