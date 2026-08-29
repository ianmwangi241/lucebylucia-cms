import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { GripVertical, ImagePlus, Star, Trash2, X } from "lucide-react";
import { Field, Panel, Pill } from "@/components/admin/kit";
import { assetUrl, categories, collections, type Product } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const input =
  "h-10 w-full border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-gold";
const area =
  "w-full border border-border bg-background p-3 text-sm outline-none transition-colors focus:border-gold";

const ALL_SIZES = ["XS", "S", "M", "L", "XL"];
const ALL_COLORS = ["Black", "Brown", "Cream", "Ivory", "Rose"];

export function ProductEditor({ product }: { product?: Product }) {
  const [tab, setTab] = useState("Details");
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? ["S", "M", "L"]);
  const [colors, setColors] = useState<string[]>(product?.colors ?? ["Black"]);
  const [images, setImages] = useState<string[]>(
    product
      ? [product.image, "signature-1.webp", "everyday-set-long-1.webp", "sahara.webp"]
      : ["aura-set-long.webp", "signature-1.webp"],
  );
  const [primary, setPrimary] = useState(0);
  const [track, setTrack] = useState(true);
  const [backorder, setBackorder] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    setImages((imgs) => {
      const next = [...imgs];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
    setPrimary((p) => (p === from ? to : p));
  };

  const toggleIn = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const variants = sizes.flatMap((s) => colors.map((c) => ({ size: s, color: c })));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="eyebrow">{product ? "Editing product" : "New product"}</p>
          <h1 className="font-display text-3xl md:text-4xl">{product?.name ?? "Untitled piece"}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Pill tone={product?.status === "Published" ? "success" : "warning"}>
              {product?.status ?? "Draft"}
            </Pill>
            <span>{product?.sku ?? "SKU pending"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/products" className="inline-flex h-10 items-center border border-border bg-card px-4 text-sm hover:border-gold">
            Cancel
          </Link>
          <button
            onClick={() => toast.success("Saved as draft")}
            className="inline-flex h-10 items-center border border-border bg-card px-4 text-sm hover:border-gold"
          >
            Save draft
          </button>
          <button
            onClick={() => toast.success(product ? "Product updated" : "Product published")}
            className="inline-flex h-10 items-center bg-ink px-5 text-sm text-primary-foreground hover:opacity-90"
          >
            {product ? "Save changes" : "Publish"}
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {["Details", "Media", "Variants", "Inventory", "SEO"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors",
              tab === t ? "border-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Details" && (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Panel title="Basic information">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name" className="sm:col-span-2">
                  <input className={input} defaultValue={product?.name} placeholder="Aura Set Long" />
                </Field>
                <Field label="Slug" hint="lucebylucia.co.ke/shop/…">
                  <input className={input} defaultValue={product?.slug} placeholder="aura-set-long" />
                </Field>
                <Field label="SKU">
                  <input className={input} defaultValue={product?.sku} placeholder="LUC-AUR-001" />
                </Field>
                <Field label="Short description" className="sm:col-span-2">
                  <input className={input} defaultValue={product?.shortDescription} />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <textarea rows={6} className={area} defaultValue={product?.description} />
                </Field>
              </div>
            </Panel>

            <Panel title="Pricing">
              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Price (KSh)">
                  <input className={input} defaultValue={product?.price} />
                </Field>
                <Field label="Sale price (KSh)">
                  <input className={input} defaultValue={product?.salePrice ?? ""} placeholder="—" />
                </Field>
                <Field label="Cost price (KSh)">
                  <input className={input} defaultValue={product?.costPrice} />
                </Field>
                <Field label="Currency">
                  <select className={input}>
                    <option>KES — Kenyan Shilling</option>
                  </select>
                </Field>
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Organisation">
              <div className="space-y-4">
                <Field label="Status">
                  <select className={input} defaultValue={product?.status ?? "Draft"}>
                    <option>Draft</option>
                    <option>Published</option>
                    <option>Archived</option>
                  </select>
                </Field>
                <Field label="Category">
                  <select className={input} defaultValue={product?.category}>
                    {categories.map((c) => (
                      <option key={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Collection">
                  <select className={input} defaultValue={product?.collection}>
                    {collections.map((c) => (
                      <option key={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Tags" hint="Press enter to add">
                  <input className={input} placeholder="nairobi, occasion, silk" />
                </Field>
                <div className="flex flex-wrap gap-1.5">
                  {(product?.tags ?? ["ready-to-wear"]).map((t) => (
                    <Pill key={t} tone="blush">
                      {t} <X className="size-3 cursor-pointer" />
                    </Pill>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Primary image" padded={false}>
              <img
                src={assetUrl(images[primary] ?? images[0])}
                alt="Primary product"
                className="aspect-[3/4] w-full object-cover"
              />
            </Panel>
          </div>
        </div>
      )}

      {tab === "Media" && (
        <Panel
          title="Product photography"
          action={
            <button
              onClick={() => toast.success("Upload opens the site-images bucket")}
              className="inline-flex items-center gap-2 text-[11px] tracking-widest text-muted-foreground hover:text-foreground"
            >
              <ImagePlus className="size-3.5" /> UPLOAD
            </button>
          }
        >
          <p className="mb-4 text-xs text-muted-foreground">
            Drag to reorder. The first image is the primary image shown in the shop grid. Files are stored in
            the <span className="text-foreground">site-images</span> bucket.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img, i) => (
              <figure
                key={img + i}
                draggable
                onDragStart={() => setDrag(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (drag !== null && drag !== i) move(drag, i);
                  setDrag(null);
                }}
                className={cn(
                  "group relative border border-border bg-card transition-shadow",
                  drag === i && "opacity-50",
                )}
              >
                <img src={assetUrl(img)} alt={img} className="aspect-[3/4] w-full object-cover" loading="lazy" />
                {i === primary && (
                  <span className="absolute left-2 top-2">
                    <Pill tone="gold">Primary</Pill>
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-background/90 px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical className="size-3.5 cursor-grab text-muted-foreground" />
                  <button onClick={() => setPrimary(i)} title="Set primary">
                    <Star className={cn("size-3.5", i === primary ? "fill-gold text-gold" : "text-muted-foreground")} />
                  </button>
                  <select className="ml-auto border border-border bg-background px-1 text-[10px]">
                    <option>No variant</option>
                    {colors.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setImages((x) => x.filter((_, j) => j !== i))}
                    className="text-destructive"
                    title="Delete image"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <figcaption className="truncate border-t border-border px-2 py-1.5 text-[10px] text-muted-foreground">
                  {img}
                </figcaption>
              </figure>
            ))}
            <button
              onClick={() => setImages((x) => [...x, "zola-1.webp"])}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-2 border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-gold hover:text-foreground"
            >
              <ImagePlus className="size-5" strokeWidth={1.3} />
              Add image
            </button>
          </div>
        </Panel>
      )}

      {tab === "Variants" && (
        <div className="space-y-6">
          <Panel title="Options">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-3">Size</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleIn(sizes, setSizes, s)}
                      className={cn(
                        "min-w-11 border px-3 py-1.5 text-xs transition-colors",
                        sizes.includes(s) ? "border-ink bg-ink text-primary-foreground" : "border-border hover:border-gold",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow mb-3">Colour</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleIn(colors, setColors, c)}
                      className={cn(
                        "border px-3 py-1.5 text-xs transition-colors",
                        colors.includes(c) ? "border-ink bg-ink text-primary-foreground" : "border-border hover:border-gold",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title={`${variants.length} variants`} padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[10px] tracking-[0.18em] text-muted-foreground">
                    <th className="px-5 py-3">VARIANT</th>
                    <th className="py-3">SKU</th>
                    <th className="py-3">PRICE</th>
                    <th className="py-3">STOCK</th>
                    <th className="px-5 py-3">IMAGE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {variants.map((v, i) => (
                    <tr key={`${v.size}-${v.color}`} className="hover:bg-accent/25">
                      <td className="px-5 py-2.5">
                        {v.size} / {v.color}
                      </td>
                      <td className="py-2.5">
                        <input
                          className="h-9 w-40 border border-border bg-background px-2 text-xs outline-none focus:border-gold"
                          defaultValue={`${product?.sku ?? "LUC-NEW"}-${v.size}-${v.color.slice(0, 2).toUpperCase()}`}
                        />
                      </td>
                      <td className="py-2.5">
                        <input
                          className="h-9 w-28 border border-border bg-background px-2 text-xs outline-none focus:border-gold"
                          defaultValue={product?.price ?? 0}
                        />
                      </td>
                      <td className="py-2.5">
                        <input
                          className="h-9 w-20 border border-border bg-background px-2 text-xs outline-none focus:border-gold"
                          defaultValue={Math.max(0, (product?.qty ?? 10) - i)}
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <img
                          src={assetUrl(images[i % images.length])}
                          alt=""
                          className="size-10 cursor-pointer object-cover"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {tab === "Inventory" && (
        <Panel title="Inventory" className="max-w-2xl">
          <div className="space-y-4">
            <Field label="SKU">
              <input className={input} defaultValue={product?.sku} />
            </Field>
            <label className="flex items-center justify-between border border-border px-4 py-3 text-sm">
              <span>Track inventory</span>
              <input type="checkbox" checked={track} onChange={(e) => setTrack(e.target.checked)} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quantity">
                <input className={input} defaultValue={product?.qty ?? 0} disabled={!track} />
              </Field>
              <Field label="Low-stock threshold">
                <input className={input} defaultValue={product?.lowStock ?? 6} disabled={!track} />
              </Field>
            </div>
            <label className="flex items-center justify-between border border-border px-4 py-3 text-sm">
              <span>Allow backorders</span>
              <input type="checkbox" checked={backorder} onChange={(e) => setBackorder(e.target.checked)} />
            </label>
          </div>
        </Panel>
      )}

      {tab === "SEO" && (
        <Panel title="Search & social" className="max-w-2xl">
          <div className="space-y-4">
            <Field label="Meta title">
              <input className={input} defaultValue={`${product?.name ?? "New piece"} — Luce by Lucia`} />
            </Field>
            <Field label="Meta description">
              <textarea rows={3} className={area} defaultValue={product?.shortDescription} />
            </Field>
            <Field label="Social sharing image">
              <input className={input} defaultValue={product?.image ?? ""} />
            </Field>
          </div>
        </Panel>
      )}
    </div>
  );
}
