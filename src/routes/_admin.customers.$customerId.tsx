import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, Panel, Pill, Stat, statusTone } from "@/components/admin/kit";
import { KES, customers, orders } from "@/lib/mock-data";

export const Route = createFileRoute("/_admin/customers/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer profile — Luce by Lucia Admin" },
      { name: "description", content: "Contact details, addresses, orders and notes for this customer." },
      { property: "og:title", content: "Customer profile — Luce by Lucia Admin" },
      { property: "og:description", content: "Contact details, addresses, orders and notes." },
    ],
  }),
  component: CustomerDetail,
});

function CustomerDetail() {
  const { customerId } = Route.useParams();
  const customer = customers.find((c) => c.id === customerId);

  if (!customer) {
    return (
      <EmptyState
        title="Customer not found"
        description="This profile may have been merged or removed."
        action={
          <Link to="/customers" className="mt-2 inline-flex h-10 items-center bg-ink px-4 text-sm text-primary-foreground">
            Back to customers
          </Link>
        }
      />
    );
  }

  const history = orders.filter((o) => o.customer === customer.name);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <Link to="/customers" className="eyebrow inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="size-3" /> CUSTOMERS
          </Link>
        }
        title={customer.name}
        description={`${customer.type} · ${customer.location}, Kenya`}
        actions={
          <button
            onClick={() => toast.success("Email drafted")}
            className="h-10 bg-ink px-5 text-sm text-primary-foreground hover:opacity-90"
          >
            Email customer
          </button>
        }
      />

      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Orders" value={String(customer.orders)} />
        <Stat label="Total spent" value={KES(customer.spent)} />
        <Stat label="Average order" value={KES(Math.round(customer.spent / customer.orders))} />
        <Stat label="Last order" value={customer.last} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <Panel title="Contact">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="size-3.5" /> {customer.email}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-3.5" /> {customer.phone}
              </li>
            </ul>
          </Panel>

          <Panel title="Addresses">
            <div className="space-y-3 text-sm">
              <div className="border border-border p-3">
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  {customer.location} · Delivery address on file
                </p>
                <Pill tone="gold" className="mt-2">
                  Default
                </Pill>
              </div>
            </div>
          </Panel>

          <Panel title="Notes">
            <textarea
              rows={4}
              placeholder="VIP client, prefers evening delivery…"
              className="w-full border border-border bg-background p-3 text-sm outline-none focus:border-gold"
            />
            <button
              onClick={() => toast.success("Note saved")}
              className="mt-3 h-9 border border-border px-4 text-xs tracking-widest hover:border-gold"
            >
              SAVE NOTE
            </button>
          </Panel>
        </div>

        <Panel title="Order history" padded={false}>
          {history.length === 0 ? (
            <EmptyState title="No orders yet" description="This customer has not completed a purchase." />
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {history.map((o) => (
                  <tr key={o.id} className="hover:bg-accent/25">
                    <td className="px-5 py-3">
                      <Link to="/orders/$orderId" params={{ orderId: o.id }} className="hover:text-gold">
                        {o.number}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">{o.date}</td>
                    <td className="py-3">
                      <Pill tone={statusTone(o.status)}>{o.status}</Pill>
                    </td>
                    <td className="px-5 py-3 text-right">{KES(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}
