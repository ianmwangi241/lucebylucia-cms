import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill, statusTone, EmptyState } from "@/components/admin/kit";
import { KES, assetUrl } from "@/lib/format";
import { useCategories } from "@/lib/queries/categories";
import { useProducts, useDeleteProducts, useSetProductsStatus } from "@/lib/queries/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/products/")({
  head: () => ({
    meta: [
      { title: "Products — Luce by Lucia Admin" },
      { name: "description", content: "Manage the Luce by Lucia ready-to-wear catalogue, pricing and stock." },
      { property: "og:title", content: "Products — Luce by Lucia Admin" },
      { property: "og:description", content: "Manage the ready-to-wear catalogue, pricing and stock." },
    ],
  }),
  component: ProductsPage,
});

const statuses = ["All", "Published", "Draft", "Archived"];

function ProductsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [selected, setSelected] = useState<string[]>([]);

  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const deleteProducts = useDeleteProducts();
  const setStatusMutation = useSetProductsStatus();

  const rows = useMemo(() => {
    let r = products.filter(
      (p) =>
        (status === "All" || p.status === status) &&
        (category === "All" || p.category === category) &&
        (p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())),
    );
    r = [...r].sort((a, b) =>
      sort === "Newest"
        ? b.created.localeCompare(a.created)
        : sort === "Price high"
          ? b.price - a.price
          : sort === "Price low"
            ? a.price - b.price
            : a.name.localeCompare(b.name),
    );
    return r;
  }, [products, q, status, category, sort]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handlePublish = () =>
    setStatusMutation.mutate(
      { ids: selected, status: "Published" },
      {
        onSuccess: () => {
          toast.success("Products published");
          setSelected([]);
        },
        onError: () => toast.error("Failed to publish products"),
      },
    );

  const handleDraft = () =>
    setStatusMutation.mutate(
      { ids: selected, status: "Draft" },
      {
        onSuccess: () => {
          toast.success("Products moved to draft");
          setSelected([]);
        },
        onError: () => toast.error("Failed to update products"),
      },
    );

  const handleDelete = () => {
    if (!window.confirm(`Delete ${selected.length} product(s)? This is permanent.`)) return;
    deleteProducts.mutate(selected, {
      onSuccess: () => {
        toast.success("Products deleted");
        setSelected([]);
      },
      onError: () => toast.error("Failed to delete products"),
    });
  };

  const handleExport = () => {
    const header = ["Name", "SKU", "Category", "Price", "Sale price", "Stock", "Status", "Created"];
    const lines = rows.map((p) =>
      [p.name, p.sku, p.category, p.price, p.salePrice ?? "", p.qty, p.status, p.created].join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Catalogue exported as CSV");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Commerce"
        title="Products"
        description="Every ready-to-wear piece in the Luce by Lucia catalogue."
        actions={
          <>
            <button
              onClick={handleExport}
              className="inline-flex h-10 items-center gap-2 border border-border bg-card px-4 text-sm transition-colors hover:border-gold"
            >
              <Download className="size-4" strokeWidth={1.5} /> Export
            </button>
            <Link
              to="/products/new"
              className="inline-flex h-10 items-center gap-2 bg-ink px-4 text-sm text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" strokeWidth={1.5} /> Add product
            </Link>
          </>
        }
      />

      <div className="surface flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or SKU"
            className="h-10 w-full border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-gold"
          />
        </div>
        <div className="flex items-center gap-1 border border-border p-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "px-3 py-1.5 text-xs tracking-wide transition-colors",
                status === s ? "bg-ink text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 border border-border bg-background px-3 text-sm outline-none focus:border-gold"
        >
          <option>All</option>
          {categories.map((c) => (
            <option key={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-10 border border-border bg-background px-3 text-sm outline-none focus:border-gold"
        >
          <option>Newest</option>
          <option>Name</option>
          <option>Price high</option>
          <option>Price low</option>
        </select>
        <button className="grid size-10 place-items-center border border-border transition-colors hover:border-gold">
          <SlidersHorizontal className="size-4" strokeWidth={1.5} />
        </button>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-3 border border-gold bg-gold-soft/30 px-4 py-3 text-sm">
          <span>{selected.length} selected</span>
          <button onClick={handlePublish} className="text-xs tracking-widest hover:text-gold">
            PUBLISH
          </button>
          <button onClick={handleDraft} className="text-xs tracking-widest hover:text-gold">
            DRAFT
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 text-xs tracking-widest text-destructive"
          >
            <Trash2 className="size-3.5" /> DELETE
          </button>
          <button onClick={() => setSelected([])} className="ml-auto text-xs text-muted-foreground">
            Clear
          </button>
        </div>
      )}

      <div className="surface overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading products…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No pieces match that search"
            description="Try a different name, SKU, category or status filter."
          />
        ) : (
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] tracking-[0.18em] text-muted-foreground">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.length === rows.length}
                    onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])}
                  />
                </th>
                <th className="py-3">PRODUCT</th>
                <th className="py-3">SKU</th>
                <th className="py-3">CATEGORY</th>
                <th className="py-3">PRICE</th>
                <th className="py-3">STOCK</th>
                <th className="py-3">STATUS</th>
                <th className="py-3">CREATED</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-accent/25">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img src={assetUrl(p.image)} alt={p.name} className="size-14 object-cover" loading="lazy" />
                      <div>
                        <Link to="/products/$productId" params={{ productId: p.id }} className="hover:text-gold">
                          {p.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">{p.collection}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">{p.sku}</td>
                  <td className="py-3">{p.category}</td>
                  <td className="py-3">
                    {p.salePrice ? (
                      <span className="flex flex-col">
                        <span className="text-gold">{KES(p.salePrice)}</span>
                        <span className="text-[11px] text-muted-foreground line-through">{KES(p.price)}</span>
                      </span>
                    ) : (
                      KES(p.price)
                    )}
                  </td>
                  <td className="py-3">
                    <Pill tone={p.qty === 0 ? "danger" : p.qty <= p.lowStock ? "warning" : "success"}>
                      {p.qty === 0 ? "Out of stock" : p.qty <= p.lowStock ? `Low · ${p.qty}` : `${p.qty} in stock`}
                    </Pill>
                  </td>
                  <td className="py-3">
                    <Pill tone={statusTone(p.status)}>{p.status}</Pill>
                  </td>
                  <td className="py-3 text-muted-foreground">{p.created}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/products/$productId"
                      params={{ productId: p.id }}
                      className="text-[11px] tracking-widest text-muted-foreground hover:text-foreground"
                    >
                      EDIT
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {rows.length} of {products.length} products
        </span>
        <div className="flex items-center gap-1">
          {["1", "2", "3"].map((n, i) => (
            <button
              key={n}
              className={cn(
                "size-8 border border-border transition-colors",
                i === 0 ? "bg-ink text-primary-foreground" : "hover:border-gold",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
