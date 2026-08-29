import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Field, PageHeader, Pill, Stat } from "@/components/admin/kit";
import { KES, discounts } from "@/lib/mock-data";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_admin/discounts")({
  head: () => ({
    meta: [
      { title: "Discounts — Luce by Lucia Admin" },
      { name: "description", content: "Promo codes, seasonal offers and usage limits for the Luce store." },
      { property: "og:title", content: "Discounts — Luce by Lucia Admin" },
      { property: "og:description", content: "Promo codes, seasonal offers and usage limits." },
    ],
  }),
  component: DiscountsPage,
});

const input = "h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold";

function DiscountsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Commerce"
        title="Discounts & promotions"
        description="Codes applied at checkout, scoped to products, categories or collections."
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 bg-ink px-4 text-sm text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" strokeWidth={1.5} /> Create discount
          </button>
        }
      />

      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active codes" value="3" />
        <Stat label="Redemptions" value="197" delta="+22" hint="last 30 days" />
        <Stat label="Discounted revenue" value={KES(284000)} />
        <Stat label="Average discount" value={KES(1180)} />
      </div>

      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] tracking-[0.18em] text-muted-foreground">
              <th className="px-5 py-3">CODE</th>
              <th className="py-3">TYPE</th>
              <th className="py-3">VALUE</th>
              <th className="py-3">APPLIES TO</th>
              <th className="py-3">MIN ORDER</th>
              <th className="py-3">USAGE</th>
              <th className="py-3">WINDOW</th>
              <th className="px-5 py-3">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {discounts.map((d) => (
              <tr key={d.id} className="transition-colors hover:bg-accent/25">
                <td className="px-5 py-3">
                  <span className="border border-border bg-muted px-2 py-1 font-medium tracking-widest">{d.code}</span>
                </td>
                <td className="py-3">{d.type}</td>
                <td className="py-3">{d.type === "Percentage" ? `${d.value}%` : KES(d.value)}</td>
                <td className="py-3 text-muted-foreground">{d.applies}</td>
                <td className="py-3">{KES(d.min)}</td>
                <td className="py-3 text-muted-foreground">
                  {d.uses} / {d.limit}
                </td>
                <td className="py-3 text-muted-foreground">
                  {d.start} → {d.end}
                </td>
                <td className="px-5 py-3">
                  <Pill tone={d.active ? "success" : "neutral"}>{d.active ? "Active" : "Inactive"}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">Create discount</SheetTitle>
            <SheetDescription>Codes are case-insensitive at checkout.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-8">
            <Field label="Code">
              <input className={input} placeholder="LUCE10" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select className={input}>
                  <option>Percentage</option>
                  <option>Fixed amount</option>
                </select>
              </Field>
              <Field label="Value">
                <input className={input} placeholder="10" />
              </Field>
            </div>
            <Field label="Applies to">
              <select className={input}>
                <option>All products</option>
                <option>Specific products</option>
                <option>Category</option>
                <option>Collection</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Minimum order (KSh)">
                <input className={input} placeholder="5000" />
              </Field>
              <Field label="Maximum discount (KSh)">
                <input className={input} placeholder="3000" />
              </Field>
            </div>
            <Field label="Usage limit">
              <input className={input} placeholder="300" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start date">
                <input type="date" className={input} />
              </Field>
              <Field label="End date">
                <input type="date" className={input} />
              </Field>
            </div>
            <label className="flex items-center justify-between border border-border px-4 py-3 text-sm">
              <span>Active</span>
              <input type="checkbox" defaultChecked />
            </label>
            <button
              onClick={() => {
                toast.success("Discount created");
                setOpen(false);
              }}
              className="h-10 w-full bg-ink text-sm text-primary-foreground hover:opacity-90"
            >
              Create discount
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
