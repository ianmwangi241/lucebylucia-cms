import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, Panel, Pill, Stat, statusTone } from "@/components/admin/kit";
import { KES } from "@/lib/format";
import { useCustomerDetail, useSaveCustomerNotes } from "@/lib/queries/customers";

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
  const { data: customer, isLoading, isError } = useCustomerDetail(customerId);
  const saveNotes = useSaveCustomerNotes();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (customer) setNotes(customer.notes ?? "");
  }, [customer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading customer…
      </div>
    );
  }

  if (isError || !customer) {
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

  const handleSaveNotes = () => {
    saveNotes.mutate(
      { customerId: customer.id, notes },
      {
        onSuccess: () => toast.success("Note saved"),
        onError: () =>
          toast.error("Failed to save note — customer needs an internal_notes column for this to persist"),
      },
    );
  };

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
          <a
            href={`mailto:${customer.email}`}
            className="h-10 inline-flex items-center bg-ink px-5 text-sm text-primary-foreground hover:opacity-90"
          >
            Email customer
          </a>
        }
      />

      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Orders" value={String(customer.orders)} />
        <Stat label="Total spent" value={KES(customer.spent)} />
        <Stat
          label="Average order"
          value={customer.orders ? KES(Math.round(customer.spent / customer.orders)) : "—"}
        />
        <Stat label="Last order" value={customer.last ? new Date(customer.last).toLocaleDateString() : "—"} />
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
                  {customer.addressLine ?? "No address on file yet"}
                </p>
                {customer.addressLine && (
                  <Pill tone="gold" className="mt-2">
                    Default
                  </Pill>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Notes">
            <p className="mb-2 text-[11px] text-muted-foreground">
              Requires an <code>internal_notes</code> column on <code>customer</code> — see migrations/002.
            </p>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VIP client, prefers evening delivery…"
              className="w-full border border-border bg-background p-3 text-sm outline-none focus:border-gold"
            />
            <button
              onClick={handleSaveNotes}
              disabled={saveNotes.isPending}
              className="mt-3 h-9 border border-border px-4 text-xs tracking-widest hover:border-gold disabled:opacity-50"
            >
              {saveNotes.isPending ? "SAVING…" : "SAVE NOTE"}
            </button>
          </Panel>
        </div>

        <Panel title="Order history" padded={false}>
          {customer.history.length === 0 ? (
            <EmptyState title="No orders yet" description="This customer has not completed a purchase." />
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {customer.history.map((o) => (
                  <tr key={o.id} className="hover:bg-accent/25">
                    <td className="px-5 py-3">
                      <Link to="/orders/$orderId" params={{ orderId: o.id }} className="hover:text-gold">
                        {o.number}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">{new Date(o.date).toLocaleDateString()}</td>
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
