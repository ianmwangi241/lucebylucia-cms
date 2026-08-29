import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill, Stat } from "@/components/admin/kit";
import { KES, customers } from "@/lib/mock-data";

export const Route = createFileRoute("/_admin/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — Luce by Lucia Admin" },
      { name: "description", content: "Guest and registered customers, lifetime spend and order history." },
      { property: "og:title", content: "Customers — Luce by Lucia Admin" },
      { property: "og:description", content: "Guest and registered customers, spend and order history." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const [q, setQ] = useState("");
  const rows = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.email.toLowerCase().includes(q.toLowerCase()) ||
      c.phone.includes(q),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Customers"
        title="Customers"
        description="Guests can buy without an account — their history links up automatically if they register later."
        actions={
          <button
            onClick={() => toast.success("Customer list exported")}
            className="inline-flex h-10 items-center gap-2 border border-border bg-card px-4 text-sm hover:border-gold"
          >
            <Download className="size-4" strokeWidth={1.5} /> Export
          </button>
        }
      />

      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total customers" value="316" delta="+27" hint="this month" />
        <Stat label="Guest checkouts" value="61%" hint="of all orders" />
        <Stat label="Repeat rate" value="34%" delta="+3.2%" />
        <Stat label="Lifetime value" value={KES(21400)} hint="average" />
      </div>

      <div className="surface p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email or phone"
            className="h-10 w-full border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-gold"
          />
        </div>
      </div>

      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] tracking-[0.18em] text-muted-foreground">
              <th className="px-5 py-3">CUSTOMER</th>
              <th className="py-3">CONTACT</th>
              <th className="py-3">ORDERS</th>
              <th className="py-3">TOTAL SPENT</th>
              <th className="py-3">LAST ORDER</th>
              <th className="px-5 py-3">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-accent/25">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-accent font-display text-xs text-accent-foreground">
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <div>
                      <Link to="/customers/$customerId" params={{ customerId: c.id }} className="hover:text-gold">
                        {c.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{c.location}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-muted-foreground">
                  <span className="block text-xs">{c.email}</span>
                  <span className="block text-[11px]">{c.phone}</span>
                </td>
                <td className="py-3">{c.orders}</td>
                <td className="py-3">{KES(c.spent)}</td>
                <td className="py-3 text-muted-foreground">{c.last}</td>
                <td className="px-5 py-3">
                  <Pill tone={c.type === "Account" ? "gold" : "neutral"}>{c.type}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
