import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field, PageHeader, Panel, Pill, Stat } from "@/components/admin/kit";
import { assetUrl } from "@/lib/format";
import { useInventoryRows, useRecentAdjustments, useAdjustStock, type InventoryRow } from "@/lib/queries/inventory";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_admin/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Luce by Lucia Admin" },
      { name: "description", content: "Stock levels, reserved units and adjustment history by variant." },
      { property: "og:title", content: "Inventory — Luce by Lucia Admin" },
      { property: "og:description", content: "Stock levels, reserved units and adjustment history." },
    ],
  }),
  component: InventoryPage,
});

const input = "h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold";
const filters = ["All", "In stock", "Low stock", "Out of stock"];
const reasons = ["Stock received", "Sale", "Return", "Damage", "Manual adjustment", "Correction"];

const statusOf = (available: number, threshold: number) =>
  available <= 0 ? "Out of stock" : available <= threshold ? "Low stock" : "In stock";

function InventoryPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [adjust, setAdjust] = useState<InventoryRow | null>(null);
  const [quantityChange, setQuantityChange] = useState(1);
  const [reason, setReason] = useState(reasons[0]);

  const { data: inventoryRows = [], isLoading } = useInventoryRows();
  const { data: adjustments = [] } = useRecentAdjustments();
  const adjustStock = useAdjustStock();

  const rows = useMemo(
    () =>
      inventoryRows.filter((r) => {
        const status = statusOf(r.available, r.threshold);
        return (
          (filter === "All" || status === filter) &&
          (r.product.toLowerCase().includes(q.toLowerCase()) || r.sku.toLowerCase().includes(q.toLowerCase()))
        );
      }),
    [inventoryRows, q, filter],
  );

  const openAdjust = (r: InventoryRow) => {
    setAdjust(r);
    setQuantityChange(1);
    setReason(reasons[0]);
  };

  const handleAdjust = () => {
    if (!adjust) return;
    adjustStock.mutate(
      { variantId: adjust.variantId, quantityChange, reason },
      {
        onSuccess: () => {
          toast.success("Inventory adjusted and logged");
          setAdjust(null);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to adjust stock"),
      },
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Commerce"
        title="Inventory"
        description="Stock by variant across the atelier, with a full adjustment trail."
      />

      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Units on hand" value={String(inventoryRows.reduce((s, r) => s + r.stock, 0))} />
        <Stat label="Reserved" value={String(inventoryRows.reduce((s, r) => s + r.reserved, 0))} hint="in open orders" />
        <Stat
          label="Low stock variants"
          value={String(inventoryRows.filter((r) => statusOf(r.available, r.threshold) === "Low stock").length)}
        />
        <Stat label="Out of stock" value={String(inventoryRows.filter((r) => r.available <= 0).length)} />
      </div>

      <div className="surface flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search product or SKU"
            className="h-10 w-full border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-gold"
          />
        </div>
        <div className="flex items-center gap-1 border border-border p-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs tracking-wide transition-colors",
                filter === f ? "bg-ink text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="surface overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading inventory…
          </div>
        ) : (
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] tracking-[0.18em] text-muted-foreground">
                <th className="px-5 py-3">PRODUCT</th>
                <th className="py-3">VARIANT</th>
                <th className="py-3">SKU</th>
                <th className="py-3">STOCK</th>
                <th className="py-3">RESERVED</th>
                <th className="py-3">AVAILABLE</th>
                <th className="py-3">THRESHOLD</th>
                <th className="py-3">STATUS</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.slice(0, 20).map((r) => {
                const status = statusOf(r.available, r.threshold);
                return (
                  <tr key={r.variantId} className="transition-colors hover:bg-accent/25">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={assetUrl(r.image)} alt="" className="size-10 object-cover" loading="lazy" />
                        <span>{r.product}</span>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{r.variant}</td>
                    <td className="py-3 text-muted-foreground">{r.sku}</td>
                    <td className="py-3">{r.stock}</td>
                    <td className="py-3">{r.reserved}</td>
                    <td className="py-3">{r.available}</td>
                    <td className="py-3 text-muted-foreground">{r.threshold}</td>
                    <td className="py-3">
                      <Pill tone={status === "In stock" ? "success" : status === "Low stock" ? "warning" : "danger"}>
                        {status}
                      </Pill>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openAdjust(r)}
                        className="text-[11px] tracking-widest text-muted-foreground hover:text-foreground"
                      >
                        ADJUST
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Panel title="Recent adjustments" padded={false}>
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] tracking-[0.18em] text-muted-foreground">
              <th className="px-5 py-3">SKU</th>
              <th className="py-3">CHANGE</th>
              <th className="py-3">REASON</th>
              <th className="py-3">USER</th>
              <th className="px-5 py-3">WHEN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {adjustments.map((a) => (
              <tr key={a.id}>
                <td className="px-5 py-3">{a.sku}</td>
                <td className={cn("py-3", a.change > 0 ? "text-emerald-600" : "text-destructive")}>
                  {a.change > 0 ? `+${a.change}` : a.change}
                </td>
                <td className="py-3">{a.reason}</td>
                <td className="py-3 text-muted-foreground">{a.user}</td>
                <td className="px-5 py-3 text-muted-foreground">{a.at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Dialog open={!!adjust} onOpenChange={(o) => !o && setAdjust(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Adjust stock</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {adjust?.product} · {adjust?.variant} · current {adjust?.stock}
          </p>
          <div className="space-y-4">
            <Field label="Quantity change" hint="Use a negative number to reduce stock">
              <input
                type="number"
                className={input}
                value={quantityChange}
                onChange={(e) => setQuantityChange(Number(e.target.value))}
              />
            </Field>
            <Field label="Reason">
              <select className={input} value={reason} onChange={(e) => setReason(e.target.value)}>
                {reasons.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <button
              onClick={handleAdjust}
              disabled={adjustStock.isPending}
              className="h-10 w-full bg-ink text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {adjustStock.isPending ? "Recording…" : "Record adjustment"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
