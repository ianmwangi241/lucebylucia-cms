import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus, Layers, ShoppingBag, LayoutTemplate, Percent, ArrowUpRight } from "lucide-react";
import { PageHeader, Panel, Stat, Pill, statusTone } from "@/components/admin/kit";
import {
  KES,
  assetUrl,
  categorySales,
  customers,
  orders,
  products,
  revenueSeries,
  topProducts,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Luce by Lucia Admin" },
      { name: "description", content: "Live view of sales, orders, inventory and customers for Luce by Lucia." },
      { property: "og:title", content: "Dashboard — Luce by Lucia Admin" },
      { property: "og:description", content: "Live view of sales, orders, inventory and customers." },
    ],
  }),
  component: Dashboard,
});

const ranges = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "This month", "Last month", "Custom"];

const chartColors = ["oklch(0.24 0.008 60)", "oklch(0.72 0.09 82)", "oklch(0.78 0.06 20)", "oklch(0.6 0.03 70)", "oklch(0.86 0.02 80)"];

function Dashboard() {
  const [range, setRange] = useState("Last 30 days");
  const lowStock = products.filter((p) => p.qty <= p.lowStock && p.status !== "Archived");
  const pending = orders.filter((o) => o.status === "Pending" || o.payment === "Pending");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="The Art of Being You"
        title="Good morning, Lucia"
        description="Here is what is happening across the atelier and the store today."
        actions={
          <div className="flex flex-wrap gap-1 border border-border bg-card p-1">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1.5 text-xs tracking-wide transition-colors",
                  range === r ? "bg-ink text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total sales" value={KES(1137000)} delta="+18.4%" hint={`vs previous · ${range}`} />
        <Stat label="Orders" value="88" delta="+11.2%" hint="8 awaiting action" />
        <Stat label="Revenue (net)" value={KES(1042500)} delta="+16.1%" hint="after refunds" />
        <Stat label="Average order value" value={KES(12920)} delta="+4.6%" hint="per order" />
        <Stat label="Products" value="42" hint="34 published · 6 draft" />
        <Stat label="Customers" value="316" delta="+27" hint="new this month" />
        <Stat label="Low-stock products" value={String(lowStock.length)} delta="-2" hint="at or below threshold" />
        <Stat label="Pending orders" value={String(pending.length)} hint="need confirmation" />
      </div>

      <Panel title="Quick actions" className="bg-card">
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
          {[
            { to: "/products/new" as "/", label: "Add Product", icon: Plus },
            { to: "/collections" as "/", label: "Create Collection", icon: Layers },
            { to: "/orders" as "/", label: "View Orders", icon: ShoppingBag },
            { to: "/homepage" as "/", label: "Homepage Content", icon: LayoutTemplate },
            { to: "/discounts" as "/", label: "Create Discount", icon: Percent },
          ].map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="group flex items-center gap-3 bg-card px-4 py-5 transition-colors hover:bg-accent/40"
            >
              <a.icon className="size-4 text-gold" strokeWidth={1.5} />
              <span className="text-sm">{a.label}</span>
              <ArrowUpRight className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
            </Link>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Revenue over time" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueSeries} margin={{ left: -18, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.72 0.09 82)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="oklch(0.72 0.09 82)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.9 0.008 80)" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => KES(v)} />
              <Area dataKey="revenue" stroke="oklch(0.24 0.008 60)" strokeWidth={1.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Sales by category">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categorySales} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none">
                {categorySales.map((_, i) => (
                  <Cell key={i} fill={chartColors[i % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => KES(v)} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-1.5">
            {categorySales.map((c, i) => (
              <li key={c.name} className="flex items-center gap-2 text-xs">
                <span className="size-2" style={{ background: chartColors[i % chartColors.length] }} />
                <span>{c.name}</span>
                <span className="ml-auto text-muted-foreground">{KES(c.value)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Orders over time" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueSeries} margin={{ left: -22, right: 8, top: 8 }}>
              <CartesianGrid stroke="oklch(0.9 0.008 80)" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="orders" fill="oklch(0.24 0.008 60)" radius={[2, 2, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Top-selling products">
          <ul className="divide-y divide-border">
            {topProducts.map((t) => (
              <li key={t.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <img src={assetUrl(t.image)} alt={t.name} className="size-12 object-cover" loading="lazy" />
                <div className="min-w-0">
                  <p className="truncate text-sm">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.units} units sold</p>
                </div>
                <span className="ml-auto text-xs">{KES(t.revenue)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Recent orders"
          className="lg:col-span-2"
          padded={false}
          action={
            <Link to="/orders" className="text-[11px] tracking-widest text-muted-foreground hover:text-foreground">
              VIEW ALL
            </Link>
          }
        >
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {orders.slice(0, 6).map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-accent/30">
                  <td className="px-5 py-3">
                    <Link to="/orders/$orderId" params={{ orderId: o.id }} className="font-medium hover:text-gold">
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">{o.customer}</td>
                  <td className="px-2 py-3">
                    <Pill tone={statusTone(o.payment)}>{o.payment}</Pill>
                  </td>
                  <td className="px-2 py-3">
                    <Pill tone={statusTone(o.status)}>{o.status}</Pill>
                  </td>
                  <td className="px-5 py-3 text-right">{KES(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-6">
          <Panel title="Low-stock products">
            <ul className="divide-y divide-border">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <img src={assetUrl(p.image)} alt={p.name} className="size-10 object-cover" loading="lazy" />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.sku}</p>
                  </div>
                  <Pill tone={p.qty === 0 ? "danger" : "warning"} className="ml-auto">
                    {p.qty === 0 ? "Out of stock" : `${p.qty} left`}
                  </Pill>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recent customers">
            <ul className="divide-y divide-border">
              {customers.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="grid size-9 place-items-center rounded-full bg-accent font-display text-xs text-accent-foreground">
                    {c.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.location} · {c.orders} orders</p>
                  </div>
                  <span className="ml-auto text-xs">{KES(c.spent)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
