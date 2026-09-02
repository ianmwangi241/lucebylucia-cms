import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Phone, Mail, MapPin, Printer, Loader2 } from "lucide-react";
import { EmptyState, PageHeader, Panel, Pill, statusTone } from "@/components/admin/kit";
import { KES, assetUrl } from "@/lib/format";
import {
  useOrderDetail,
  useUpdateOrderStatus,
  useRefundOrder,
  useSaveOrderNotes,
  ORDER_STATUSES,
} from "@/lib/queries/orders";

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

function OrderDetail() {
  const { orderId } = Route.useParams();
  const { data: order, isLoading, isError } = useOrderDetail(orderId);
  const updateStatus = useUpdateOrderStatus();
  const refundOrder = useRefundOrder();
  const saveNotes = useSaveOrderNotes();

  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setNotes(order.notes ?? "");
    }
  }, [order]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading order…
      </div>
    );
  }

  if (isError || !order) {
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

  const latestPayment = order.payments[order.payments.length - 1];

  // Best-effort timeline from what's actually stored — order placement + payment events.
  // There's no order_status_history table, so intermediate transitions (confirmed, picked,
  // shipped, etc.) aren't recorded anywhere and can't be shown here. Add an audit table if
  // you want a full trail.
  const timeline = [
    ...order.payments.map((p) => ({
      at: p.paidAt ?? p.createdAt,
      label: `Payment ${p.status.toLowerCase()} via ${p.provider}`,
      detail: p.reference || "—",
    })),
    { at: order.createdAt, label: "Order placed", detail: order.customerEmail },
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const handleSaveStatus = () => {
    updateStatus.mutate(
      { orderId: order.id, status },
      {
        onSuccess: () => toast.success("Order updated"),
        onError: () => toast.error("Failed to update order"),
      },
    );
  };

  const handleRefund = () => {
    if (!window.confirm("Mark this order as refunded? This does not reverse the M-Pesa payment automatically.")) return;
    refundOrder.mutate(order.id, {
      onSuccess: () => toast.success("Order marked refunded"),
      onError: () => toast.error("Failed to refund order"),
    });
  };

  const handleSaveNotes = () => {
    saveNotes.mutate(
      { orderId: order.id, notes },
      {
        onSuccess: () => toast.success("Note saved"),
        onError: () =>
          toast.error("Failed to save note — orders needs an internal_notes column for this to persist"),
      },
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <Link to="/orders" className="eyebrow inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="size-3" /> ORDERS
          </Link>
        }
        title={order.number}
        description={`Placed ${new Date(order.createdAt).toLocaleString()} · ${order.items.length} item(s)`}
        actions={
          <>
            <button
              onClick={() => toast.success("Packing slip sent to printer")}
              className="inline-flex h-10 items-center gap-2 border border-border bg-card px-4 text-sm hover:border-gold"
            >
              <Printer className="size-4" strokeWidth={1.5} /> Packing slip
            </button>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 border border-border bg-card px-3 text-sm outline-none focus:border-gold"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={handleSaveStatus}
              disabled={updateStatus.isPending}
              className="h-10 bg-ink px-5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {updateStatus.isPending ? "Saving…" : "Save"}
            </button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Pill tone={statusTone(latestPayment?.status ?? "")}>Payment · {latestPayment?.status ?? "No payment"}</Pill>
        <Pill tone={statusTone(order.status)}>Order · {order.status}</Pill>
        <Pill tone="ink">Delivery · {order.town || order.county || "—"}</Pill>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items" padded={false}>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={assetUrl(i.image)} alt={i.name} className="size-16 object-cover" loading="lazy" />
                        <div>
                          <p>{i.name}</p>
                          <p className="text-[11px] text-muted-foreground">{i.variant}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-muted-foreground">× {i.quantity}</td>
                    <td className="px-5 py-4 text-right">{KES(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="space-y-2 border-t border-border px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{KES(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>{KES(order.shippingFee)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount (inferred)</dt>
                  <dd className="text-gold">− {KES(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 font-display text-xl">
                <dt>Total</dt>
                <dd>{KES(order.total)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Order timeline">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded yet.</p>
            ) : (
              <ol className="relative space-y-5 border-l border-border pl-5">
                {timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[23px] top-1.5 size-1.5 rounded-full bg-gold" />
                    <p className="text-sm">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(t.at).toLocaleString()} · {t.detail}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Internal notes">
            <p className="mb-2 text-[11px] text-muted-foreground">
              Requires an <code>internal_notes</code> column on <code>orders</code> — add it via migration if this
              errors on save.
            </p>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note for the team…"
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

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="font-display text-xl">{order.deliveryName}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="size-3.5" /> {order.deliveryPhone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-3.5" /> {order.customerEmail}
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
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              {[order.addressLine, order.estate, order.town, order.county].filter(Boolean).join(", ")}
            </p>
            {order.deliveryInstructions && (
              <p className="mt-2 text-[11px] text-muted-foreground">Note: {order.deliveryInstructions}</p>
            )}
            <p className="mt-3 text-[11px] tracking-wide text-muted-foreground">Nationwide courier · Kenya</p>
          </Panel>

          <Panel title="Payment">
            {order.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment recorded yet.</p>
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd>{latestPayment.method}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd>{latestPayment.reference || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Pill tone={statusTone(latestPayment.status)}>{latestPayment.status}</Pill>
                  </dd>
                </div>
              </dl>
            )}
            <button
              onClick={handleRefund}
              disabled={refundOrder.isPending}
              className="mt-4 h-9 w-full border border-destructive/40 text-xs tracking-widest text-destructive disabled:opacity-50"
            >
              {refundOrder.isPending ? "PROCESSING…" : "REFUND ORDER"}
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
