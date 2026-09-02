import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  GripVertical,
  Eye,
  EyeOff,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Field, PageHeader, Panel, Pill } from "@/components/admin/kit";
import { assetUrl, siteAssetUrl } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import {
  useHomeSections,
  useSeedHomepage,
  useUpdateSection,
  useReorderSections,
  type HomeSection,
} from "@/lib/queries/homepage";
import { useCategories } from "@/lib/queries/categories";
import { useProducts } from "@/lib/queries/products";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_admin/homepage")({
  head: () => ({
    meta: [
      { title: "Homepage — Luce by Lucia Admin" },
      { name: "description", content: "Compose the Luce by Lucia homepage section by section, then preview it." },
      { property: "og:title", content: "Homepage — Luce by Lucia Admin" },
      { property: "og:description", content: "Compose the homepage section by section, then preview it." },
    ],
  }),
  component: HomepagePage,
});

const input = "h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold";
const area = "w-full border border-border bg-background p-3 text-sm outline-none focus:border-gold";

function HomepagePage() {
  const { data: sections = [], isLoading } = useHomeSections();
  const seedHomepage = useSeedHomepage();
  const updateSection = useUpdateSection();
  const reorder = useReorderSections();
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();

  const [drag, setDrag] = useState<number | null>(null);
  const [editing, setEditing] = useState<HomeSection | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const move = (from: number, to: number) => {
    const next = [...sections];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    reorder.mutate(next.map((s, i) => ({ dbId: s.dbId, order: i })));
  };

  const toggle = (s: HomeSection) =>
    updateSection.mutate(
      { dbId: s.dbId, enabled: !s.enabled },
      { onError: () => toast.error("Failed to toggle section") },
    );

  const handleSaveSection = async (
    section: HomeSection,
    patch: { title?: string; content?: string; settings: Record<string, any> },
  ) => {
    try {
      await updateSection.mutateAsync({ dbId: section.dbId, ...patch });
      toast.success(`${section.name} saved`);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save section");
    }
  };

  const width = device === "desktop" ? "100%" : device === "tablet" ? "768px" : "390px";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading homepage…
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="space-y-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">
          No homepage sections yet. Set up the default section list to get started.
        </p>
        <button
          onClick={() =>
            seedHomepage.mutate(undefined, {
              onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to set up homepage"),
            })
          }
          disabled={seedHomepage.isPending}
          className="mx-auto inline-flex h-10 items-center gap-2 bg-ink px-4 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {seedHomepage.isPending ? "Setting up…" : "Set up homepage"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Content"
        title="Homepage"
        description="Sections appear here in the exact order they appear on lucebylucia.co.ke. Drag to rearrange."
        actions={
          <>
            <div className="flex items-center gap-1 border border-border bg-card p-1">
              {([
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as const).map(([d, Icon]) => (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  aria-label={`Preview ${d}`}
                  className={cn(
                    "grid size-8 place-items-center transition-colors",
                    device === d ? "bg-ink text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <button
              onClick={() => toast.success("Opening the live website preview")}
              className="inline-flex h-10 items-center gap-2 border border-border bg-card px-4 text-sm hover:border-gold"
            >
              <ExternalLink className="size-4" strokeWidth={1.5} /> Preview website
            </button>
            <button
              onClick={() => toast.success("Homepage published")}
              className="h-10 bg-ink px-5 text-sm text-primary-foreground hover:opacity-90"
            >
              Publish changes
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        <div className="space-y-3">
          {sections.map((s, i) => (
            <article
              key={s.dbId}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (drag !== null && drag !== i) move(drag, i);
                setDrag(null);
              }}
              className={cn(
                "surface flex items-center gap-3 p-3 transition-colors hover:border-gold",
                drag === i && "opacity-40",
                !s.enabled && "bg-muted",
              )}
            >
              <GripVertical className="size-4 cursor-grab text-muted-foreground" />
              {s.settings.image ? (
                <img src={siteAssetUrl(s.settings.image)} alt="" className="size-12 object-cover" loading="lazy" />
              ) : (
                <span className="grid size-12 place-items-center border border-border font-display text-xs text-muted-foreground">
                  {i + 1}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm", !s.enabled && "text-muted-foreground line-through")}>{s.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{s.summary}</p>
              </div>
              <button onClick={() => toggle(s)} aria-label="Toggle section" className="text-muted-foreground hover:text-foreground">
                {s.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
              <button
                onClick={() => setEditing(s)}
                className="h-8 border border-border px-3 text-[10px] tracking-widest hover:border-gold"
              >
                EDIT
              </button>
            </article>
          ))}
        </div>

        <Panel title={`Preview · ${device}`} className="h-fit">
          <div className="mx-auto overflow-hidden border border-border bg-background transition-all" style={{ width, maxWidth: "100%" }}>
            {sections
              .filter((s) => s.enabled)
              .map((s) => (
                <PreviewBlock key={s.dbId} section={s} device={device} categories={categories} products={products} />
              ))}
          </div>
        </Panel>
      </div>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">{editing?.name}</SheetTitle>
            <SheetDescription>Content shown in this section of the homepage.</SheetDescription>
          </SheetHeader>
          {editing && (
            <SectionEditorForm
              key={editing.dbId}
              section={editing}
              categories={categories}
              products={products}
              onSave={(patch) => handleSaveSection(editing, patch)}
              saving={updateSection.isPending}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---- Editor form: fields shown depend on section.type, everything persists to settings JSON ----

function SectionEditorForm({
  section,
  categories,
  products,
  onSave,
  saving,
}: {
  section: HomeSection;
  categories: { id: string; name: string }[];
  products: ReturnType<typeof useProducts>["data"];
  onSave: (patch: { title?: string; content?: string; settings: Record<string, any> }) => void;
  saving: boolean;
}) {
  const [settings, setSettings] = useState<Record<string, any>>(section.settings);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const set = (patch: Record<string, any>) => setSettings((s) => ({ ...s, ...patch }));

  const handleSave = async () => {
    let finalSettings = settings;
    if (imageFile) {
      const supabase = createClient();
      const path = `homepage/${crypto.randomUUID()}-${imageFile.name}`;
      const { error } = await supabase.storage.from("site-images").upload(path, imageFile);
      if (error) {
        toast.error("Failed to upload image");
        return;
      }
      finalSettings = { ...settings, image: path };
    }
    onSave({ settings: finalSettings });
  };

  return (
    <div className="space-y-4 px-4 pb-10">
      {section.type === "ticker" && (
        <>
          <p className="eyebrow">Ticker items</p>
          {(settings.tickerItems ?? []).map((t: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="size-4 text-muted-foreground" />
              <input
                className={input}
                value={t}
                onChange={(e) =>
                  set({ tickerItems: settings.tickerItems.map((x: string, j: number) => (j === i ? e.target.value : x)) })
                }
              />
              <button
                onClick={() => set({ tickerItems: settings.tickerItems.filter((_: string, j: number) => j !== i) })}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => set({ tickerItems: [...(settings.tickerItems ?? []), "NEW ITEM"] })}
            className="inline-flex h-9 items-center gap-2 border border-border px-3 text-xs tracking-widest hover:border-gold"
          >
            <Plus className="size-3.5" /> ADD ITEM
          </button>
        </>
      )}

      {section.type === "categories" && (
        <>
          <p className="eyebrow">Categories shown in this section</p>
          {categories.map((c) => {
            const selected: string[] = settings.categoryIds ?? [];
            const checked = selected.includes(c.id);
            return (
              <label key={c.id} className="flex items-center gap-3 border border-border p-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    set({
                      categoryIds: checked ? selected.filter((id) => id !== c.id) : [...selected, c.id],
                    })
                  }
                />
                <span className="text-sm">{c.name}</span>
              </label>
            );
          })}
        </>
      )}

      {section.type === "new-arrivals" && (
        <>
          <Field label="Source">
            <select
              className={input}
              value={settings.source ?? "automatic"}
              onChange={(e) => set({ source: e.target.value })}
            >
              <option value="automatic">Automatic — newest products</option>
              <option value="manual">Manual selection</option>
            </select>
          </Field>
          {settings.source === "manual" ? (
            <ProductChecklist
              products={products ?? []}
              selected={settings.productIds ?? []}
              onChange={(ids) => set({ productIds: ids })}
            />
          ) : (
            <Field label="Number of products">
              <input
                type="number"
                className={input}
                value={settings.count ?? 8}
                onChange={(e) => set({ count: Number(e.target.value) })}
              />
            </Field>
          )}
        </>
      )}

      {section.type === "featured-products" && (
        <>
          <p className="eyebrow">Selected products</p>
          <ProductChecklist
            products={products ?? []}
            selected={settings.productIds ?? []}
            onChange={(ids) => set({ productIds: ids })}
          />
        </>
      )}

      {section.type === "reviews" && (
        <>
          <p className="text-xs text-muted-foreground">
            No dedicated reviews table exists yet — these are stored as JSON on this section. Add a real{" "}
            <code>reviews</code> table if you want moderation or reuse elsewhere.
          </p>
          {(settings.items ?? []).map((r: any, i: number) => (
            <div key={i} className="space-y-2 border border-border p-3">
              <div className="flex items-center justify-between">
                <input
                  className="border-none bg-transparent text-sm outline-none"
                  value={r.customer ?? ""}
                  placeholder="Customer name"
                  onChange={(e) =>
                    set({
                      items: settings.items.map((x: any, j: number) =>
                        j === i ? { ...x, customer: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  onClick={() => set({ items: settings.items.filter((_: any, j: number) => j !== i) })}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
              <textarea
                rows={2}
                className={area}
                value={r.text ?? ""}
                onChange={(e) =>
                  set({ items: settings.items.map((x: any, j: number) => (j === i ? { ...x, text: e.target.value } : x)) })
                }
              />
            </div>
          ))}
          <button
            onClick={() => set({ items: [...(settings.items ?? []), { customer: "", location: "", rating: 5, text: "" }] })}
            className="inline-flex h-9 items-center gap-2 border border-border px-3 text-xs tracking-widest hover:border-gold"
          >
            <Plus className="size-3.5" /> ADD REVIEW
          </button>
        </>
      )}

      {section.type === "instagram" && (
        <>
          <Field label="Instagram username">
            <input className={input} value={settings.username ?? ""} onChange={(e) => set({ username: e.target.value })} />
          </Field>
          <Field label="Profile URL">
            <input className={input} value={settings.profileUrl ?? ""} onChange={(e) => set({ profileUrl: e.target.value })} />
          </Field>
          <p className="text-xs text-muted-foreground">
            Grid images are managed from the Media Library — this section just links to it for now.
          </p>
        </>
      )}

      {!["ticker", "categories", "new-arrivals", "featured-products", "reviews", "instagram"].includes(section.type) && (
        <>
          <figure className="border border-border">
            <img
              src={imageFile ? URL.createObjectURL(imageFile) : siteAssetUrl(settings.image)}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
            <figcaption className="flex items-center justify-between border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
              {settings.image ?? "No image set"}
              <button onClick={() => fileInputRef.current?.click()} className="tracking-widest hover:text-foreground">
                CHANGE IMAGE
              </button>
            </figcaption>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImageFile(file);
                e.target.value = "";
              }}
            />
          </figure>
          <Field label="Eyebrow">
            <input className={input} value={settings.eyebrow ?? ""} onChange={(e) => set({ eyebrow: e.target.value })} />
          </Field>
          <Field label="Heading">
            <input className={input} value={settings.heading ?? ""} onChange={(e) => set({ heading: e.target.value })} />
          </Field>
          <Field label="Description">
            <textarea
              rows={3}
              className={area}
              value={settings.description ?? ""}
              onChange={(e) => set({ description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary button">
              <input
                className={input}
                value={settings.primaryButton ?? ""}
                onChange={(e) => set({ primaryButton: e.target.value })}
              />
            </Field>
            <Field label="Primary button URL">
              <input
                className={input}
                value={settings.primaryButtonUrl ?? ""}
                onChange={(e) => set({ primaryButtonUrl: e.target.value })}
              />
            </Field>
            <Field label="Secondary button">
              <input
                className={input}
                value={settings.secondaryButton ?? ""}
                onChange={(e) => set({ secondaryButton: e.target.value })}
              />
            </Field>
            <Field label="Secondary button URL">
              <input
                className={input}
                value={settings.secondaryButtonUrl ?? ""}
                onChange={(e) => set({ secondaryButtonUrl: e.target.value })}
              />
            </Field>
          </div>
          {section.type === "brand-story" && (
            <Field label="Quote">
              <input className={input} value={settings.quote ?? ""} onChange={(e) => set({ quote: e.target.value })} />
            </Field>
          )}
          {section.type === "newsletter" && (
            <Field label="Background">
              <select className={input} value={settings.background ?? "Ivory"} onChange={(e) => set({ background: e.target.value })}>
                <option>Ivory</option>
                <option>Ink</option>
                <option>Blush</option>
              </select>
            </Field>
          )}
        </>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="h-10 w-full bg-ink text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save section"}
      </button>
    </div>
  );
}

function ProductChecklist({
  products,
  selected,
  onChange,
}: {
  products: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="max-h-64 space-y-1 overflow-y-auto border border-border p-2">
      {products.map((p) => {
        const checked = selected.includes(p.id);
        return (
          <label key={p.id} className="flex items-center gap-2 border-b border-border py-1.5 text-sm last:border-0">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onChange(checked ? selected.filter((id) => id !== p.id) : [...selected, p.id])}
            />
            {p.name}
          </label>
        );
      })}
    </div>
  );
}

// ---- Live preview ----

function PreviewBlock({
  section,
  device,
  categories,
  products,
}: {
  section: HomeSection;
  device: string;
  categories: { id: string; name: string }[];
  products: NonNullable<ReturnType<typeof useProducts>["data"]>;
}) {
  const compact = device === "mobile";
  const s = section.settings;

  if (section.type === "hero")
    return (
      <div className="relative">
        <img
          src={siteAssetUrl(s.image)}
          alt=""
          className={cn("w-full object-cover", compact ? "h-64" : "h-80")}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/30 text-center text-primary-foreground">
          <p className="text-[9px] tracking-[0.3em]">{(s.eyebrow ?? "").toUpperCase()}</p>
          <h3 className="font-display text-3xl">{s.heading ?? section.name}</h3>
          <p className="max-w-xs text-xs opacity-90">{s.description}</p>
          {s.primaryButton && (
            <span className="mt-2 border border-primary-foreground px-4 py-1.5 text-[10px] tracking-widest">
              {s.primaryButton.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    );

  if (section.type === "ticker")
    return (
      <div className="flex items-center gap-6 overflow-hidden bg-ink px-4 py-2.5 text-[9px] tracking-[0.28em] text-primary-foreground">
        {(s.tickerItems ?? []).map((t: string, i: number) => (
          <span key={i} className="whitespace-nowrap">
            {t} ·
          </span>
        ))}
      </div>
    );

  if (section.type === "categories") {
    const shown = categories.filter((c) => (s.categoryIds ?? []).includes(c.id));
    return (
      <div className="p-6">
        <p className="eyebrow text-center">SHOP BY CATEGORY</p>
        <div className={cn("mt-4 grid gap-2", compact ? "grid-cols-2" : "grid-cols-5")}>
          {shown.slice(0, 5).map((c) => (
            <figure key={c.id}>
              <div className="aspect-[3/4] w-full bg-muted" />
              <figcaption className="pt-1.5 text-center text-[10px] tracking-widest">{c.name.toUpperCase()}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "new-arrivals" || section.type === "featured-products") {
    const list =
      s.source === "manual" || section.type === "featured-products"
        ? products.filter((p) => (s.productIds ?? []).includes(p.id))
        : [...products].sort((a, b) => b.created.localeCompare(a.created)).slice(0, s.count ?? 8);
    return (
      <div className="p-6">
        <p className="eyebrow text-center">{section.name.toUpperCase()}</p>
        <div className={cn("mt-4 grid gap-2", compact ? "grid-cols-2" : "grid-cols-4")}>
          {list.slice(0, 4).map((p) => (
            <figure key={p.id}>
              <img src={assetUrl(p.image)} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
              <figcaption className="pt-1.5 text-center text-[10px]">{p.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "reviews") {
    const review = (s.items ?? [])[0];
    return (
      <div className="bg-accent/40 p-8 text-center">
        <p className="eyebrow">WHAT SHE SAYS</p>
        {review ? (
          <>
            <p className="mx-auto mt-3 max-w-md font-display text-xl italic">“{review.text}”</p>
            <p className="mt-2 text-[10px] tracking-widest text-muted-foreground">
              {(review.customer ?? "").toUpperCase()} · {(review.location ?? "").toUpperCase()}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No reviews added yet.</p>
        )}
      </div>
    );
  }

  if (section.type === "instagram")
    return (
      <div className="p-6">
        <p className="eyebrow text-center">@{s.username ?? "lucebylucia"}</p>
        <div className="mt-3 grid grid-cols-6 gap-1">
          {(s.images ?? []).length === 0 ? (
            <p className="col-span-6 text-center text-xs text-muted-foreground">No images set — add some in Media Library.</p>
          ) : (
            (s.images ?? []).map((img: string, i: number) => (
              <img key={i} src={siteAssetUrl(img)} alt="" className="aspect-square w-full object-cover" loading="lazy" />
            ))
          )}
        </div>
      </div>
    );

  if (section.type === "newsletter")
    return (
      <div className="bg-ink px-6 py-10 text-center text-primary-foreground">
        <h3 className="font-display text-2xl">{s.heading ?? "Join the Luce list"}</h3>
        <p className="mt-1 text-xs opacity-80">{s.description ?? "Early access to drops, and nothing else."}</p>
        <div className="mx-auto mt-4 flex max-w-sm">
          <span className="flex-1 border border-primary-foreground/40 px-3 py-2 text-left text-[10px] opacity-70">
            your@email.com
          </span>
          <span className="bg-gold px-4 py-2 text-[10px] tracking-widest text-ink">SUBSCRIBE</span>
        </div>
      </div>
    );

  return (
    <div className={cn("grid items-center", compact ? "grid-cols-1" : "grid-cols-2")}>
      <img src={siteAssetUrl(s.image)} alt="" className="h-56 w-full object-cover" loading="lazy" />
      <div className="space-y-2 p-6">
        <p className="eyebrow">{(s.eyebrow ?? section.name).toUpperCase()}</p>
        <h3 className="font-display text-2xl">{s.heading ?? section.summary}</h3>
        <p className="text-xs text-muted-foreground">{s.description}</p>
        {s.primaryButton && (
          <span className="inline-block border border-ink px-4 py-1.5 text-[10px] tracking-widest">
            {s.primaryButton.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
