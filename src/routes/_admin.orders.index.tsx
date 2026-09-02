import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, Pill, Stat, statusTone } from "@/components/admin/kit";
import { KES } from "@/lib/format";
import { useOrders, useOrderStats, ORDER_STATUSES } from "@/lib/queries/orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/orders/")({
  head: () => ({
    meta: [
      { title: "Orders — Luce by Lucia Admin" },
      { name: "description", content: "Track M-Pesa payments, fulfilment and nationwide delivery for every order." },
      { property: "og:title", content: "Orders — Luce by Lucia Admin" },
      { property: "og:description", content: "Track payments, fulfilment and nationwide delivery." },
    ],
  }),
  component: OrdersPage,
});

const tabs = ["All", ...ORDER_STATUSES];

function OrdersPage() {
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");

  const { data: orders = [], isLoading } = useOrders();
  const { data: stats } = useOrderStats();

  const rows = useMemo(
    () =>
      orders.filter(
        (o) =>
          (tab === "All" || o.status === tab) &&
          (o.number.toLowerCase().includes(q.toLowerCase()) ||
            o.customer.toLowerCase().includes(q.toLowerCase()) ||
            o.phone.includes(q)),
      ),
    [orders, tab, q],
  );

  const handleExport = () => {
    const header = ["Order", "Customer", "Phone", "Email", "Total", "Payment", "Status", "Location", "Date"];
    const lines = rows.map((o) =>
      [o.number, o.customer, o.phone, o.email, o.total, o.payment, o.status, o.location, o.date].join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Orders exported");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Commerce"
        title="Orders"
        description="Every order placed on lucebylucia.co.ke, including guest checkouts."
        actions={
          <button
            onClick={handleExport}
            className="inline-flex h-10 items-center gap-2 border border-border bg-card px-4 text-sm hover:border-gold"
          >
            <Download className="size-4" strokeWidth={1.5} /> Export
          </button>
        }
      />

      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Orders today" value={String(stats?.todayCount ?? 0)} delta={stats?.countDelta} hint="vs yesterday" />
        <Stat label="Awaiting payment" value={String(stats?.awaitingPayment ?? 0)} hint="M-Pesa pending" />
        <Stat label="To fulfil" value={String(stats?.toFulfil ?? 0)} hint="confirmed & packed" />
        <Stat label="Order value today" value={KES(stats?.todayValue ?? 0)} delta={stats?.valueDelta} />
      </div>

      <div className="surface flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order number, customer or phone"
            className="h-10 w-full border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-gold"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 border border-border p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 text-xs tracking-wide transition-colors",
                tab === t ? "bg-ink text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="surface overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading orders…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No orders here yet" description="Orders with this status will appear in this view." />
        ) : (
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] tracking-[0.18em] text-muted-foreground">
                <th className="px-5 py-3">ORDER</th>
                <th className="py-3">CUSTOMER</th>
                <th className="py-3">CONTACT</th>
                <th className="py-3">TOTAL</th>
                <th className="py-3">PAYMENT</th>
                <th className="py-3">ORDER</th>
                <th className="py-3">DELIVERY</th>
                <th className="px-5 py-3">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-accent/25">
                  <td className="px-5 py-3">
                    <Link to="/orders/$orderId" params={{ orderId: o.id }} className="font-medium hover:text-gold">
                      {o.number}
                    </Link>
                  </td>
                  <td className="py-3">{o.customer}</td>
                  <td className="py-3 text-muted-foreground">
                    <span className="block text-xs">{o.phone}</span>
                    <span className="block text-[11px]">{o.email}</span>
                  </td>
                  <td className="py-3">{KES(o.total)}</td>
                  <td className="py-3">
                    <Pill tone={statusTone(o.payment)}>{o.payment}</Pill>
                  </td>
                  <td className="py-3">
                    <Pill tone={statusTone(o.status)}>{o.status}</Pill>
                  </td>
                  <td className="py-3 text-muted-foreground">{o.location || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(o.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
