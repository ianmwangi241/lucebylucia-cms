import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { Field, PageHeader, Panel, Pill } from "@/components/admin/kit";
import { assetUrl, categories as seed } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_admin/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Luce by Lucia Admin" },
      { name: "description", content: "Organise dresses, sets, jumpsuits, lounge and occasion wear." },
      { property: "og:title", content: "Categories — Luce by Lucia Admin" },
      { property: "og:description", content: "Organise dresses, sets, jumpsuits, lounge and occasion wear." },
    ],
  }),
  component: CategoriesPage,
});

const input = "h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold";

function CategoriesPage() {
  const [items, setItems] = useState(seed);
  const [drag, setDrag] = useState<number | null>(null);
  const [editing, setEditing] = useState<(typeof seed)[number] | null>(null);

  const move = (from: number, to: number) =>
    setItems((list) => {
      const next = [...list];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next.map((c, i) => ({ ...c, order: i + 1 }));
    });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Commerce"
        title="Categories"
        description="How the shop is browsed. Drag to change the order they appear on the website."
        actions={
          <button
            onClick={() => setEditing(seed[0])}
            className="inline-flex h-10 items-center gap-2 bg-ink px-4 text-sm text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" strokeWidth={1.5} /> New category
          </button>
        }
      />

      <div className="grid gap-4">
        {items.map((c, i) => (
          <article
            key={c.id}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag !== null && drag !== i) move(drag, i);
              setDrag(null);
            }}
            className={cn(
              "surface flex items-center gap-5 p-4 transition-colors hover:border-gold",
              drag === i && "opacity-50",
            )}
          >
            <GripVertical className="size-4 cursor-grab text-muted-foreground" />
            <img src={assetUrl(c.image)} alt={c.name} className="size-20 object-cover" loading="lazy" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl">{c.name}</h2>
                <Pill tone={c.active ? "success" : "neutral"}>{c.active ? "Active" : "Inactive"}</Pill>
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">{c.description}</p>
              <p className="mt-1 text-[11px] tracking-wide text-muted-foreground">
                /{c.slug} · {c.count} products · order {c.order}
              </p>
            </div>
            <button
              onClick={() => setEditing(c)}
              className="h-9 border border-border px-4 text-xs tracking-widest hover:border-gold"
            >
              EDIT
            </button>
          </article>
        ))}
      </div>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">{editing?.name}</SheetTitle>
            <SheetDescription>Category details shown across the shop navigation.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            <Panel padded={false}>
              <img src={assetUrl(editing?.image ?? "sahara.webp")} alt="" className="aspect-[16/10] w-full object-cover" />
            </Panel>
            <Field label="Name">
              <input className={input} defaultValue={editing?.name} />
            </Field>
            <Field label="Slug">
              <input className={input} defaultValue={editing?.slug} />
            </Field>
            <Field label="Description">
              <textarea rows={3} className="w-full border border-border bg-background p-3 text-sm outline-none focus:border-gold" defaultValue={editing?.description} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Display order">
                <input className={input} defaultValue={editing?.order} />
              </Field>
              <Field label="Status">
                <select className={input} defaultValue={editing?.active ? "Active" : "Inactive"}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </Field>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  toast.success("Category saved");
                  setEditing(null);
                }}
                className="h-10 flex-1 bg-ink text-sm text-primary-foreground hover:opacity-90"
              >
                Save category
              </button>
              <button
                onClick={() => toast.error("Removing a category unassigns its products")}
                className="h-10 border border-destructive/40 px-4 text-sm text-destructive"
              >
                Delete
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
