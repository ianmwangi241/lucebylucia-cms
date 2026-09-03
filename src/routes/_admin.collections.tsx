import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, CalendarDays, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field, PageHeader, Panel, Pill } from "@/components/admin/kit";
import { KES, assetUrl } from "@/lib/format";
import {
  useCollectionsAdmin,
  useSaveCollection,
  useCollectionProducts,
  useAllProductsPicker,
  useAssignProducts,
  type CollectionAdmin,
} from "@/lib/queries/collections";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_admin/collections")({
  head: () => ({
    meta: [
      { title: "Collections — Luce by Lucia Admin" },
      { name: "description", content: "Curate seasonal drops and campaigns for the Luce by Lucia store." },
      { property: "og:title", content: "Collections — Luce by Lucia Admin" },
      { property: "og:description", content: "Curate seasonal drops and campaigns." },
    ],
  }),
  component: CollectionsPage,
});

const input = "h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold";

const emptyCollection: CollectionAdmin = {
  id: "",
  name: "New collection",
  slug: "",
  description: "",
  cover: "",
  coverImageId: null,
  active: false,
  featured: false,
  productCount: 0,
};

function CollectionsPage() {
  const { data: collections = [], isLoading } = useCollectionsAdmin();
  const [activeId, setActiveId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<CollectionAdmin | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveCollection = useSaveCollection();
  const collectionQueryId = activeId && activeId !== "new" ? activeId : undefined;
  const { data: assignedProducts = [] } = useCollectionProducts(collectionQueryId);
  const { data: allProducts = [] } = useAllProductsPicker();
  const assignProducts = useAssignProducts(collectionQueryId);

  useEffect(() => {
    if (!isLoading && collections.length && activeId === null) {
      selectCollection(collections[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, collections, activeId]);

  const selectCollection = (id: string) => {
    setActiveId(id);
    setDraft(collections.find((c) => c.id === id) ?? null);
    setCoverFile(null);
  };

  const startNew = () => {
    setActiveId("new");
    setDraft({ ...emptyCollection });
    setCoverFile(null);
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Collection name is required");
      return;
    }
    if (!draft.coverImageId && !coverFile) {
      toast.error("A cover image is required");
      return;
    }
    try {
      const id = await saveCollection.mutateAsync({
        id: draft.id || undefined,
        name: draft.name,
        slug: draft.slug,
        description: draft.description,
        active: draft.active,
        featured: draft.featured,
        order: 0,
        coverImageId: draft.coverImageId,
        newCoverFile: coverFile ?? undefined,
      });
      toast.success(`${draft.name} saved`);
      setActiveId(id);
      setCoverFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save collection");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading collections…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Content"
        title="Collections"
        description="Curated campaigns and drops — the editorial layer above categories."
        actions={
          <button
            onClick={startNew}
            className="inline-flex h-10 items-center gap-2 bg-ink px-4 text-sm text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" strokeWidth={1.5} /> New collection
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-3">
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCollection(c.id)}
              className={cn(
                "surface group flex w-full items-center gap-3 p-3 text-left transition-colors",
                activeId === c.id ? "border-gold" : "hover:border-gold/60",
              )}
            >
              <img src={assetUrl(c.cover)} alt="" className="size-14 object-cover" loading="lazy" />
              <div className="min-w-0">
                <p className="truncate text-sm">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.productCount} products</p>
              </div>
              {c.featured && <Star className="ml-auto size-3.5 fill-gold text-gold" />}
            </button>
          ))}
        </aside>

        {draft && (
          <div className="space-y-6">
            <div className="surface relative overflow-hidden">
              <img
                src={coverFile ? URL.createObjectURL(coverFile) : assetUrl(draft.cover)}
                alt={draft.name}
                className="h-72 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 text-primary-foreground">
                <p className="text-[10px] tracking-[0.28em] opacity-80">COLLECTION</p>
                <h2 className="mt-2 font-display text-4xl">{draft.name}</h2>
                <p className="mt-2 max-w-lg text-sm opacity-85">{draft.description}</p>
              </div>
              <div className="absolute right-6 top-6 flex gap-2">
                <Pill tone={draft.active ? "success" : "warning"}>{draft.active ? "Published" : "Draft"}</Pill>
                {draft.featured && <Pill tone="gold">Featured</Pill>}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Collection details">
                <div className="space-y-4">
                  <Field label="Collection name">
                    <input
                      className={input}
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </Field>
                  <Field label="Slug">
                    <input
                      className={input}
                      value={draft.slug}
                      onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      rows={3}
                      className="w-full border border-border bg-background p-3 text-sm outline-none focus:border-gold"
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    />
                  </Field>
                  <div className="flex gap-3">
                    <label className="flex flex-1 items-center justify-between border border-border px-4 py-3 text-sm">
                      <span>Published</span>
                      <input
                        type="checkbox"
                        checked={draft.active}
                        onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                      />
                    </label>
                    <label className="flex flex-1 items-center justify-between border border-border px-4 py-3 text-sm">
                      <span>Featured</span>
                      <input
                        type="checkbox"
                        checked={draft.featured}
                        onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                      />
                    </label>
                  </div>
                </div>
              </Panel>

              <Panel title="Imagery">
                <div className="grid gap-4 sm:grid-cols-3">
                  <figure className="border border-border">
                    <img
                      src={coverFile ? URL.createObjectURL(coverFile) : assetUrl(draft.cover)}
                      alt="Cover"
                      className="aspect-[3/4] w-full object-cover"
                      loading="lazy"
                    />
                    <figcaption className="flex items-center justify-between border-t border-border px-2 py-1.5 text-[10px] text-muted-foreground">
                      Cover
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="tracking-widest hover:text-foreground"
                      >
                        CHANGE
                      </button>
                    </figcaption>
                  </figure>
                  {["Hero", "Banner"].map((label) => (
                    <figure key={label} className="border border-border">
                      <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted text-center text-[10px] text-muted-foreground">
                        Not in schema yet
                      </div>
                      <figcaption className="flex items-center justify-between border-t border-border px-2 py-1.5 text-[10px] text-muted-foreground">
                        {label}
                        <span className="opacity-50">—</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCoverFile(file);
                    e.target.value = "";
                  }}
                />
                <div className="mt-5 flex items-center gap-2 border border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
                  <CalendarDays className="size-4" strokeWidth={1.5} />
                  Scheduling (start/end dates) isn't in the schema yet — add columns to persist this.
                </div>
              </Panel>
            </div>

            <Panel
              title={`Products in ${draft.name}`}
              action={
                draft.id ? (
                  <button
                    onClick={() => setPickerOpen(true)}
                    className="text-[11px] tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    ASSIGN PRODUCTS
                  </button>
                ) : (
                  <span className="text-[11px] text-muted-foreground opacity-50">Save first to assign products</span>
                )
              }
            >
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {assignedProducts.length === 0 ? (
                  <p className="col-span-full text-sm text-muted-foreground">No products assigned yet.</p>
                ) : (
                  assignedProducts.map((p) => (
                    <figure key={p.id} className="border border-border">
                      <img src={assetUrl(p.image)} alt={p.name} className="aspect-[3/4] w-full object-cover" loading="lazy" />
                      <figcaption className="space-y-0.5 border-t border-border p-2">
                        <p className="truncate text-[11px]">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{KES(p.price)}</p>
                      </figcaption>
                    </figure>
                  ))
                )}
              </div>
            </Panel>

            <div className="flex justify-end gap-2">
              <button className="h-10 border border-border bg-card px-4 text-sm hover:border-gold">Preview</button>
              <button
                onClick={handleSave}
                disabled={saveCollection.isPending}
                className="h-10 bg-ink px-5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saveCollection.isPending ? "Saving…" : "Save collection"}
              </button>
            </div>
          </div>
        )}
      </div>

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">Assign products</SheetTitle>
            <SheetDescription>Choose which products belong to {draft?.name}.</SheetDescription>
          </SheetHeader>
          <ProductPicker
            allProducts={allProducts}
            initiallySelected={assignedProducts.map((p) => p.id)}
            saving={assignProducts.isPending}
            onSave={async (ids) => {
              await assignProducts.mutateAsync(ids);
              toast.success("Products updated");
              setPickerOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProductPicker({
  allProducts,
  initiallySelected,
  onSave,
  saving,
}: {
  allProducts: { id: string; name: string }[];
  initiallySelected: string[];
  onSave: (ids: string[]) => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(initiallySelected);

  return (
    <div className="space-y-4 px-4 pb-6">
      <div className="max-h-[60vh] space-y-1 overflow-y-auto">
        {allProducts.map((p) => (
          <label key={p.id} className="flex items-center gap-2 border-b border-border py-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={(e) =>
                setSelected((s) => (e.target.checked ? [...s, p.id] : s.filter((id) => id !== p.id)))
              }
            />
            {p.name}
          </label>
        ))}
      </div>
      <button
        onClick={() => onSave(selected)}
        disabled={saving}
        className="h-10 w-full bg-ink text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save assignments"}
      </button>
    </div>
  );
}
