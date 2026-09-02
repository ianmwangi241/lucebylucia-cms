import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill } from "@/components/admin/kit";
import { KES, assetUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCategories, useCollections } from "@/lib/queries/categories";
import {
  useProduct,
  useSaveProduct,
  type ImageInput,
  type ProductFull,
  type ProductStatus,
  type VariantInput,
} from "@/lib/queries/products";

interface ProductEditorProps {
  productId?: string; // absent = create mode
}

const emptyProduct: ProductFull = {
  id: "",
  name: "",
  slug: "",
  description: "",
  short_description: "",
  base_price: 0,
  sale_price: null,
  status: "Draft",
  featured: false,
  variants: [],
  images: [],
  categoryIds: [],
  collectionIds: [],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function ProductEditor({ productId }: ProductEditorProps) {
  const isEditing = !!productId;
  const navigate = useNavigate();
  const { data: existing, isLoading } = useProduct(productId);
  const { data: categories = [] } = useCategories();
  const { data: collections = [] } = useCollections();
  const saveProduct = useSaveProduct();

  const [form, setForm] = useState<ProductFull>(emptyProduct);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const updateField = <K extends keyof ProductFull>(key: K, value: ProductFull[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateVariant = (index: number, patch: Partial<VariantInput>) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));

  const addVariant = () =>
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        { sku: "", size: null, color: null, price: f.base_price, stock_quantity: 0, is_available: true },
      ],
    }));

  const removeVariant = (index: number) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));

  const addImageFile = (file: File) => {
    const img: ImageInput = {
      storage_path: "",
      alt_text: form.name,
      is_primary: form.images.length === 0,
      sort_order: form.images.length,
      file,
    };
    setForm((f) => ({ ...f, images: [...f.images, img] }));
  };

  const setPrimaryImage = (index: number) =>
    setForm((f) => ({
      ...f,
      images: f.images.map((img, i) => ({ ...img, is_primary: i === index })),
    }));

  const removeImage = (index: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));

  const toggleCategory = (id: string) =>
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((c) => c !== id)
        : [...f.categoryIds, id],
    }));

  const toggleCollection = (id: string) =>
    setForm((f) => ({
      ...f,
      collectionIds: f.collectionIds.includes(id)
        ? f.collectionIds.filter((c) => c !== id)
        : [...f.collectionIds, id],
    }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (form.variants.length === 0) {
      toast.error("Add at least one variant (SKU) before saving");
      return;
    }

    try {
      const id = await saveProduct.mutateAsync({
        ...form,
        slug: form.slug || slugify(form.name),
      });
      toast.success(isEditing ? "Product updated" : "Product created");
      if (!isEditing) {
        navigate({ to: "/products/$productId", params: { productId: id } });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Commerce"
        title={isEditing ? `Edit ${existing?.name ?? "product"}` : "New product"}
        description="Core details, variants, photography, categories and collections."
        actions={
          <button
            onClick={handleSave}
            disabled={saveProduct.isPending}
            className="inline-flex h-10 items-center gap-2 bg-ink px-4 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saveProduct.isPending && <Loader2 className="size-4 animate-spin" />}
            {isEditing ? "Save changes" : "Create product"}
          </button>
        }
      />

      {/* Core fields */}
      <div className="surface grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Name">
          <input
            value={form.name}
            onChange={(e) => {
              updateField("name", e.target.value);
              if (!slugTouched) updateField("slug", slugify(e.target.value));
            }}
            className="h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
          />
        </Field>
        <Field label="Slug">
          <input
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              updateField("slug", e.target.value);
            }}
            className="h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
          />
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value as ProductStatus)}
            className="h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
          >
            <option>Draft</option>
            <option>Published</option>
            <option>Archived</option>
          </select>
        </Field>
        <Field label="Base price (KES)">
          <input
            type="number"
            value={form.base_price}
            onChange={(e) => updateField("base_price", Number(e.target.value))}
            className="h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
          />
        </Field>
        <Field label="Sale price (optional)">
          <input
            type="number"
            value={form.sale_price ?? ""}
            onChange={(e) =>
              updateField("sale_price", e.target.value === "" ? null : Number(e.target.value))
            }
            className="h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
          />
        </Field>
        <Field label="Featured">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => updateField("featured", e.target.checked)}
            />
            Show in featured collections
          </label>
        </Field>
        <Field label="Short description" full>
          <input
            value={form.short_description ?? ""}
            onChange={(e) => updateField("short_description", e.target.value)}
            className="h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
          />
        </Field>
        <Field label="Description" full>
          <textarea
            value={form.description ?? ""}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
            className="w-full border border-border bg-background p-3 text-sm outline-none focus:border-gold"
          />
        </Field>
      </div>

      {/* Variants */}
      <div className="surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium">Variants</h2>
          <button
            onClick={addVariant}
            className="inline-flex items-center gap-1.5 text-xs tracking-widest text-muted-foreground hover:text-gold"
          >
            <Plus className="size-3.5" /> ADD VARIANT
          </button>
        </div>
        {form.variants.length === 0 ? (
          <p className="text-sm text-muted-foreground">No variants yet — add at least one SKU.</p>
        ) : (
          <div className="space-y-2">
            {form.variants.map((v, i) => (
              <div key={v.id ?? `new-${i}`} className="grid grid-cols-6 items-center gap-2">
                <input
                  placeholder="SKU"
                  value={v.sku}
                  onChange={(e) => updateVariant(i, { sku: e.target.value })}
                  className="h-9 border border-border bg-background px-2 text-sm outline-none focus:border-gold"
                />
                <input
                  placeholder="Size"
                  value={v.size ?? ""}
                  onChange={(e) => updateVariant(i, { size: e.target.value || null })}
                  className="h-9 border border-border bg-background px-2 text-sm outline-none focus:border-gold"
                />
                <input
                  placeholder="Color"
                  value={v.color ?? ""}
                  onChange={(e) => updateVariant(i, { color: e.target.value || null })}
                  className="h-9 border border-border bg-background px-2 text-sm outline-none focus:border-gold"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) => updateVariant(i, { price: Number(e.target.value) })}
                  className="h-9 border border-border bg-background px-2 text-sm outline-none focus:border-gold"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={v.stock_quantity}
                  onChange={(e) => updateVariant(i, { stock_quantity: Number(e.target.value) })}
                  className="h-9 border border-border bg-background px-2 text-sm outline-none focus:border-gold"
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={v.is_available}
                      onChange={(e) => updateVariant(i, { is_available: e.target.checked })}
                    />
                    Available
                  </label>
                  <button onClick={() => removeVariant(i)} className="text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className="surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium">Photography</h2>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs tracking-widest text-muted-foreground hover:text-gold">
            <Plus className="size-3.5" /> ADD IMAGE
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) addImageFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {form.images.length === 0 ? (
          <p className="text-sm text-muted-foreground">No photos yet.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {form.images.map((img, i) => (
              <div key={img.id ?? `new-${i}`} className="relative w-32">
                <img
                  src={img.file ? URL.createObjectURL(img.file) : assetUrl(img.storage_path)}
                  alt={img.alt_text ?? ""}
                  className="aspect-square w-32 rounded border border-border object-cover"
                />
                <div className="mt-1 flex items-center justify-between">
                  <button
                    onClick={() => setPrimaryImage(i)}
                    className={cn(
                      "flex items-center gap-1 text-[11px]",
                      img.is_primary ? "text-gold" : "text-muted-foreground hover:text-gold",
                    )}
                  >
                    <Star className="size-3" fill={img.is_primary ? "currentColor" : "none"} />
                    {img.is_primary ? "Primary" : "Set primary"}
                  </button>
                  <button onClick={() => removeImage(i)} className="text-destructive">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories & collections */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="surface p-5">
          <h2 className="mb-3 text-sm font-medium">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                className={cn(
                  "border px-2.5 py-1 text-xs transition-colors",
                  form.categoryIds.includes(c.id)
                    ? "border-gold bg-gold-soft/30 text-gold"
                    : "border-border text-muted-foreground hover:border-gold",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="surface p-5">
          <h2 className="mb-3 text-sm font-medium">Collections</h2>
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleCollection(c.id)}
                className={cn(
                  "border px-2.5 py-1 text-xs transition-colors",
                  form.collectionIds.includes(c.id)
                    ? "border-gold bg-gold-soft/30 text-gold"
                    : "border-border text-muted-foreground hover:border-gold",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isEditing && existing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Current price shown to customers: <Pill tone="info">{KES(existing.sale_price ?? existing.base_price)}</Pill>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn("block space-y-1.5", full && "sm:col-span-2")}>
      <span className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{label}</span>
      {children}
    </label>
  );
}
