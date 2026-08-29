import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, CalendarDays, Star } from "lucide-react";
import { toast } from "sonner";
import { Field, PageHeader, Panel, Pill } from "@/components/admin/kit";
import { assetUrl, collections, products, KES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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

function CollectionsPage() {
  const [active, setActive] = useState(collections[0]);
  const assigned = products.slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Content"
        title="Collections"
        description="Curated campaigns and drops — the editorial layer above categories."
        actions={
          <button
            onClick={() => toast.success("New collection drafted")}
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
              onClick={() => setActive(c)}
              className={cn(
                "surface group flex w-full items-center gap-3 p-3 text-left transition-colors",
                active.id === c.id ? "border-gold" : "hover:border-gold/60",
              )}
            >
              <img src={assetUrl(c.cover)} alt="" className="size-14 object-cover" loading="lazy" />
              <div className="min-w-0">
                <p className="truncate text-sm">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.products} products</p>
              </div>
              {c.featured && <Star className="ml-auto size-3.5 fill-gold text-gold" />}
            </button>
          ))}
        </aside>

        <div className="space-y-6">
          <div className="surface relative overflow-hidden">
            <img src={assetUrl(active.cover)} alt={active.name} className="h-72 w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 text-primary-foreground">
              <p className="text-[10px] tracking-[0.28em] opacity-80">COLLECTION</p>
              <h2 className="mt-2 font-display text-4xl">{active.name}</h2>
              <p className="mt-2 max-w-lg text-sm opacity-85">{active.description}</p>
            </div>
            <div className="absolute right-6 top-6 flex gap-2">
              <Pill tone={active.published ? "success" : "warning"}>
                {active.published ? "Published" : "Draft"}
              </Pill>
              {active.featured && <Pill tone="gold">Featured</Pill>}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Collection details">
              <div className="space-y-4">
                <Field label="Collection name">
                  <input className={input} defaultValue={active.name} key={active.id + "n"} />
                </Field>
                <Field label="Slug">
                  <input className={input} defaultValue={active.slug} key={active.id + "s"} />
                </Field>
                <Field label="Description">
                  <textarea
                    rows={3}
                    key={active.id + "d"}
                    className="w-full border border-border bg-background p-3 text-sm outline-none focus:border-gold"
                    defaultValue={active.description}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Start date">
                    <input type="date" className={input} defaultValue={active.start} key={active.id + "st"} />
                  </Field>
                  <Field label="End date">
                    <input type="date" className={input} defaultValue={active.end} key={active.id + "en"} />
                  </Field>
                </div>
                <div className="flex gap-3">
                  <label className="flex flex-1 items-center justify-between border border-border px-4 py-3 text-sm">
                    <span>Published</span>
                    <input type="checkbox" defaultChecked={active.published} key={active.id + "p"} />
                  </label>
                  <label className="flex flex-1 items-center justify-between border border-border px-4 py-3 text-sm">
                    <span>Featured</span>
                    <input type="checkbox" defaultChecked={active.featured} key={active.id + "f"} />
                  </label>
                </div>
              </div>
            </Panel>

            <Panel title="Imagery">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Cover", file: active.cover },
                  { label: "Hero", file: "hero.webp" },
                  { label: "Banner", file: "after-dark.webp" },
                ].map((s) => (
                  <figure key={s.label} className="border border-border">
                    <img src={assetUrl(s.file)} alt={s.label} className="aspect-[3/4] w-full object-cover" loading="lazy" />
                    <figcaption className="flex items-center justify-between border-t border-border px-2 py-1.5 text-[10px] text-muted-foreground">
                      {s.label}
                      <button className="tracking-widest hover:text-foreground">CHANGE</button>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 border border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
                <CalendarDays className="size-4" strokeWidth={1.5} />
                Scheduled {active.start || "—"} → {active.end || "ongoing"}
              </div>
            </Panel>
          </div>

          <Panel
            title={`Products in ${active.name}`}
            action={
              <button
                onClick={() => toast.success("Product picker opened")}
                className="text-[11px] tracking-widest text-muted-foreground hover:text-foreground"
              >
                ASSIGN PRODUCTS
              </button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {assigned.map((p) => (
                <figure key={p.id} className="border border-border">
                  <img src={assetUrl(p.image)} alt={p.name} className="aspect-[3/4] w-full object-cover" loading="lazy" />
                  <figcaption className="space-y-0.5 border-t border-border p-2">
                    <p className="truncate text-[11px]">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{KES(p.price)}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Panel>

          <div className="flex justify-end gap-2">
            <button className="h-10 border border-border bg-card px-4 text-sm hover:border-gold">Preview</button>
            <button
              onClick={() => toast.success(`${active.name} saved`)}
              className="h-10 bg-ink px-5 text-sm text-primary-foreground hover:opacity-90"
            >
              Save collection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
