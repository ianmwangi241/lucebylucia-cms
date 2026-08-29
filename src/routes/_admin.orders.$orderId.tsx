import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Phone, Mail, MapPin, Printer } from "lucide-react";
import { EmptyState, PageHeader, Panel, Pill, statusTone } from "@/components/admin/kit";
import { KES, assetUrl, orders } from "@/lib/mock-data";

export const Route = createFileRoute("/_admin/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order detail — Luce by Lucia Admin" },
      { name: "description", content: "Full order detail: items, payment, delivery and internal notes." },
      { property: "og:title", content: "Order detail — Luce by Lucia Admin" },
      { property: "og:description", content: "Items, payment, delivery and internal notes." },
    ],
  }),
  component: OrderDetail,
});

const timeline = [
  { at: "Today · 09:41", label: "Payment received via M-Pesa", detail: "Ref SJ82KD91LM" },
  { at: "Today · 09:39", label: "Order placed", detail: "Guest checkout" },
  { at: "Today · 10:12", label: "Order confirmed", detail: "By Kevin Maina" },
  { at: "Today · 11:05", label: "Picking started", detail: "Atelier, Nairobi" },
];

function OrderDetail() {
  const { orderId } = Route.useParams();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order number does not exist or has been removed."
        action={
          <Link to="/orders" className="mt-2 inline-flex h-10 items-center bg-ink px-4 text-sm text-primary-foreground">
            Back to orders
          </Link>
        }
      />
    );
  }

  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <Link to="/orders" className="eyebrow inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="size-3" /> ORDERS
          </Link>
        }
        title={order.number}
        description={`Placed ${order.date} · ${order.items.length} item(s)`}
        actions={
          <>
            <button
              onClick={() => toast.success("Packing slip sent to printer")}
              className="inline-flex h-10 items-center gap-2 border border-border bg-card px-4 text-sm hover:border-gold"
            >
              <Printer className="size-4" strokeWidth={1.5} /> Packing slip
            </button>
            <select
              defaultValue={order.status}
              onChange={(e) => toast.success(`Order marked ${e.target.value}`)}
              className="h-10 border border-border bg-card px-3 text-sm outline-none focus:border-gold"
            >
              {["Pending", "Confirmed", "Processing", "Ready for delivery", "Shipped", "Delivered", "Cancelled", "Refunded"].map(
                (s) => (
                  <option key={s}>{s}</option>
                ),
              )}
            </select>
            <button
              onClick={() => toast.success("Order updated")}
              className="h-10 bg-ink px-5 text-sm text-primary-foreground hover:opacity-90"
            >
              Save
            </button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Pill tone={statusTone(order.payment)}>Payment · {order.payment}</Pill>
        <Pill tone={statusTone(order.status)}>Order · {order.status}</Pill>
        <Pill tone="ink">Delivery · {order.fulfilment}</Pill>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items" padded={false}>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {order.items.map((i) => (
                  <tr key={i.name}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={assetUrl(i.image)} alt={i.name} className="size-16 object-cover" loading="lazy" />
                        <div>
                          <p>{i.name}</p>
                          <p className="text-[11px] text-muted-foreground">{i.variant}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-muted-foreground">× {i.qty}</td>
                    <td className="px-5 py-4 text-right">{KES(i.price * i.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="space-y-2 border-t border-border px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{KES(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>{KES(order.delivery)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="text-gold">− {KES(order.discount)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-display text-xl">
                <dt>Total</dt>
                <dd>{KES(order.total)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Order timeline">
            <ol className="relative space-y-5 border-l border-border pl-5">
              {timeline.map((t) => (
                <li key={t.label} className="relative">
                  <span className="absolute -left-[23px] top-1.5 size-1.5 rounded-full bg-gold" />
                  <p className="text-sm">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.at} · {t.detail}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Internal notes">
            <textarea
              rows={3}
              defaultValue={order.notes}
              placeholder="Add a note for the team…"
              className="w-full border border-border bg-background p-3 text-sm outline-none focus:border-gold"
            />
            <button
              onClick={() => toast.success("Note added")}
              className="mt-3 h-9 border border-border px-4 text-xs tracking-widest hover:border-gold"
            >
              ADD NOTE
            </button>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="font-display text-xl">{order.customer}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="size-3.5" /> {order.phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-3.5" /> {order.email}
              </li>
            </ul>
            <Link
              to="/customers"
              className="mt-4 inline-block text-[11px] tracking-widest text-muted-foreground hover:text-foreground"
            >
              VIEW CUSTOMER
            </Link>
          </Panel>

          <Panel title="Delivery address">
            <p className="flex gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" /> {order.address}
            </p>
            <p className="mt-3 text-[11px] tracking-wide text-muted-foreground">Nationwide courier · Kenya</p>
          </Panel>

          <Panel title="Payment">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Method</dt>
                <dd>M-Pesa</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Reference</dt>
                <dd>SJ82KD91LM</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Pill tone={statusTone(order.payment)}>{order.payment}</Pill>
                </dd>
              </div>
            </dl>
            <button
              onClick={() => toast.error("Refunds are irreversible — confirm before proceeding")}
              className="mt-4 h-9 w-full border border-destructive/40 text-xs tracking-widest text-destructive"
            >
              REFUND ORDER
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
