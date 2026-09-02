import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { GripVertical, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field, PageHeader, Panel, Pill } from "@/components/admin/kit";
import { assetUrl } from "@/lib/format";
import {
  useCategoriesAdmin,
  useSaveCategory,
  useDeleteCategory,
  useReorderCategories,
  type CategoryAdmin,
} from "@/lib/queries/categories";
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

const emptyCategory: CategoryAdmin = {
  id: "",
  name: "",
  slug: "",
  description: "",
  image: "",
  active: true,
  count: 0,
  order: 0,
};

function CategoriesPage() {
  const { data: items = [], isLoading } = useCategoriesAdmin();
  const saveCategory = useSaveCategory();
  const deleteCategory = useDeleteCategory();
  const reorder = useReorderCategories();

  const [drag, setDrag] = useState<number | null>(null);
  const [editing, setEditing] = useState<CategoryAdmin | null>(null);
  const [isNew, setIsNew] = useState(false);

  const move = (from: number, to: number) => {
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    reorder.mutate(next.map((c, i) => ({ id: c.id, order: i + 1 })));
  };

  const openNew = () => {
    setEditing({ ...emptyCategory, order: items.length + 1 });
    setIsNew(true);
  };

  const openEdit = (c: CategoryAdmin) => {
    setEditing(c);
    setIsNew(false);
  };

  const handleSave = async (form: CategoryAdmin, imageFile?: File) => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!form.image && !imageFile) {
      toast.error("An image is required");
      return;
    }
    try {
      await saveCategory.mutateAsync({ ...form, newImageFile: imageFile });
      toast.success("Category saved");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save category");
    }
  };

  const handleDelete = async () => {
    if (!editing?.id) return;
    if (!window.confirm(`Delete "${editing.name}"? Products keep any other categories they have.`)) return;
    try {
      await deleteCategory.mutateAsync(editing.id);
      toast.success("Category deleted");
      setEditing(null);
    } catch {
      toast.error("Removing a category unassigns its products");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Commerce"
        title="Categories"
        description="How the shop is browsed. Drag to change the order they appear on the website."
        actions={
          <button
            onClick={openNew}
            className="inline-flex h-10 items-center gap-2 bg-ink px-4 text-sm text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" strokeWidth={1.5} /> New category
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading categories…
        </div>
      ) : (
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
              <img
                src={assetUrl(c.image)}
                alt={c.name}
                className="size-20 object-cover"
                loading="lazy"
              />
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
                onClick={() => openEdit(c)}
                className="h-9 border border-border px-4 text-xs tracking-widest hover:border-gold"
              >
                EDIT
              </button>
            </article>
          ))}
        </div>
      )}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">{isNew ? "New category" : editing?.name}</SheetTitle>
            <SheetDescription>Category details shown across the shop navigation.</SheetDescription>
          </SheetHeader>
          {editing && (
            <CategoryForm
              key={editing.id || "new"}
              initial={editing}
              onSave={handleSave}
              onDelete={isNew ? undefined : handleDelete}
              saving={saveCategory.isPending}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CategoryForm({
  initial,
  onSave,
  onDelete,
  saving,
}: {
  initial: CategoryAdmin;
  onSave: (form: CategoryAdmin, imageFile?: File) => void;
  onDelete?: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4 px-4 pb-6">
      <Panel padded={false}>
        <div className="relative">
          <img
            src={imageFile ? URL.createObjectURL(imageFile) : assetUrl(form.image)}
            alt=""
            className="aspect-[16/10] w-full object-cover"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 border border-border bg-card px-3 py-1.5 text-[11px] tracking-widest hover:border-gold"
          >
            CHANGE IMAGE
          </button>
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
        </div>
      </Panel>
      <Field label="Name">
        <input className={input} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </Field>
      <Field label="Slug">
        <input
          className={input}
          value={form.slug ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
      </Field>
      <Field label="Description">
        <textarea
          rows={3}
          className="w-full border border-border bg-background p-3 text-sm outline-none focus:border-gold"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Display order">
          <input
            type="number"
            className={input}
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
          />
        </Field>
        <Field label="Status">
          <select
            className={input}
            value={form.active ? "Active" : "Inactive"}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "Active" }))}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </Field>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSave(form, imageFile ?? undefined)}
          disabled={saving}
          className="h-10 flex-1 bg-ink text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save category"}
        </button>
        {onDelete && (
          <button onClick={onDelete} className="h-10 border border-destructive/40 px-4 text-sm text-destructive">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
