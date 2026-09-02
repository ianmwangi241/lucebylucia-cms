import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// Assumes orders.status uses exactly these strings — adjust if your checkout flow writes different values.
export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Ready for delivery",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded",
];

export interface OrderRow {
  id: string;
  number: string;
  customer: string;
  phone: string;
  email: string;
  total: number;
  payment: string; // latest payments.status for this order, or "No payment"
  status: string;
  location: string; // delivery_town / delivery_county — there's no separate fulfilment-stage field in the schema
  date: string;
}

async function attachLatestPayments<T extends { id: string }>(
  supabase: ReturnType<typeof createClient>,
  orders: T[],
): Promise<Map<string, string>> {
  const ids = orders.map((o) => o.id);
  if (!ids.length) return new Map();
  const { data: payments } = await supabase
    .from("payments")
    .select("order_id, status, created_at")
    .in("order_id", ids)
    .order("created_at", { ascending: false });
  const latest = new Map<string, string>();
  for (const p of payments ?? []) {
    if (!latest.has(p.order_id)) latest.set(p.order_id, p.status); // first hit per order_id is the most recent, since sorted desc
  }
  return latest;
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders", "list"],
    queryFn: async (): Promise<OrderRow[]> => {
      const supabase = createClient();
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, customer_email, delivery_name, delivery_phone, delivery_town, delivery_county, total, status, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500); // no pagination UI yet in this view — raise or paginate if the order volume grows
      if (error) throw error;

      const paymentByOrder = await attachLatestPayments(supabase, orders ?? []);

      return (orders ?? []).map((o) => ({
        id: o.id,
        number: o.order_number,
        customer: o.delivery_name,
        phone: o.delivery_phone,
        email: o.customer_email,
        total: o.total,
        payment: paymentByOrder.get(o.id) ?? "No payment",
        status: o.status,
        location: [o.delivery_town, o.delivery_county].filter(Boolean).join(", "),
        date: o.created_at,
      }));
    },
  });
}

export interface OrderStats {
  todayCount: number;
  countDelta: string;
  awaitingPayment: number;
  toFulfil: number;
  todayValue: number;
  valueDelta: string;
}

export function useOrderStats() {
  return useQuery({
    queryKey: ["orders", "stats"],
    queryFn: async (): Promise<OrderStats> => {
      const supabase = createClient();
      const now = new Date();
      const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();

      const [{ data: todayOrders }, { data: yesterdayOrders }, { data: openOrders }] = await Promise.all([
        supabase.from("orders").select("id, total, status").gte("created_at", startToday),
        supabase.from("orders").select("id, total").gte("created_at", startYesterday).lt("created_at", startToday),
        supabase.from("orders").select("id").in("status", ["Confirmed", "Processing"]),
      ]);

      const paymentByOrder = await attachLatestPayments(supabase, todayOrders ?? []);
      const awaitingPayment = (todayOrders ?? []).filter((o) => paymentByOrder.get(o.id) === "Pending").length;

      const todayValue = (todayOrders ?? []).reduce((s, o) => s + o.total, 0);
      const yesterdayValue = (yesterdayOrders ?? []).reduce((s, o) => s + o.total, 0);
      const todayCount = todayOrders?.length ?? 0;
      const yesterdayCount = yesterdayOrders?.length ?? 0;

      const countDelta = todayCount - yesterdayCount;
      const valuePct = yesterdayValue ? ((todayValue - yesterdayValue) / yesterdayValue) * 100 : todayValue ? 100 : 0;

      return {
        todayCount,
        countDelta: `${countDelta >= 0 ? "+" : ""}${countDelta}`,
        awaitingPayment,
        toFulfil: openOrders?.length ?? 0,
        todayValue,
        valueDelta: `${valuePct >= 0 ? "+" : ""}${valuePct.toFixed(1)}%`,
      };
    },
  });
}

// ---- Order detail ----

export interface OrderItemDetail {
  id: string;
  name: string;
  variant: string;
  sku: string;
  image: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentDetail {
  id: string;
  method: string;
  provider: string;
  reference: string;
  status: string;
  amount: number;
  paidAt: string | null;
  createdAt: string;
}

export interface OrderDetailData {
  id: string;
  number: string;
  status: string;
  customerEmail: string;
  deliveryName: string;
  deliveryPhone: string;
  addressLine: string;
  estate: string;
  town: string;
  county: string;
  deliveryInstructions: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  discount: number; // inferred as subtotal + shipping - total; there's no real discount column/ledger
  createdAt: string;
  items: OrderItemDetail[];
  payments: PaymentDetail[];
  notes: string | null; // requires an `internal_notes` text column on orders — see useSaveOrderNotes
}

export function useOrderDetail(orderId: string | undefined) {
  return useQuery({
    queryKey: ["orders", "detail", orderId],
    enabled: !!orderId,
    queryFn: async (): Promise<OrderDetailData> => {
      const supabase = createClient();
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId as string)
        .single();
      if (error) throw error;

      const [{ data: items }, { data: payments }] = await Promise.all([
        supabase
          .from("order_items")
          .select(
            `id, quantity, unit_price, total, sku, variant_name,
             product_variants ( products ( name, product_images ( storage_path, is_primary, sort_order ) ) )`,
          )
          .eq("order_id", orderId as string),
        supabase.from("payments").select("*").eq("order_id", orderId as string).order("created_at", { ascending: true }),
      ]);

      const mappedItems: OrderItemDetail[] = (items ?? []).map((i: any) => {
        const product = i.product_variants?.products;
        const images = [...(product?.product_images ?? [])].sort(
          (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
        const primary = images.find((im: any) => im.is_primary) ?? images[0];
        return {
          id: i.id,
          name: product?.name ?? i.sku,
          variant: i.variant_name,
          sku: i.sku,
          image: primary?.storage_path ?? "",
          quantity: i.quantity,
          unitPrice: i.unit_price,
          total: i.total,
        };
      });

      const discount = Math.max(0, order.subtotal + order.shipping_fee - order.total);

      return {
        id: order.id,
        number: order.order_number,
        status: order.status,
        customerEmail: order.customer_email,
        deliveryName: order.delivery_name,
        deliveryPhone: order.delivery_phone,
        addressLine: order.delivery_address_line,
        estate: order.delivery_estate,
        town: order.delivery_town,
        county: order.delivery_county,
        deliveryInstructions: order.delivery_instructions,
        subtotal: order.subtotal,
        shippingFee: order.shipping_fee,
        total: order.total,
        discount,
        createdAt: order.created_at,
        items: mappedItems,
        payments: (payments ?? []).map((p) => ({
          id: p.id,
          method: p.payment_method,
          provider: p.provider,
          reference: p.provider_reference,
          status: p.status,
          amount: p.amount,
          paidAt: p.paid_at,
          createdAt: p.created_at,
        })),
        notes: (order as any).internal_notes ?? null,
      };
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
    },
  });
}

// Marks the order Refunded. Does not talk to M-Pesa or any payment gateway to
// actually reverse funds — wire that up separately if you need real refund execution.
export function useRefundOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status: "Refunded", updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
    },
  });
}

// Requires an `internal_notes text` column on `orders` — it isn't in the schema yet.
// This will error until that column is added via migration.
export function useSaveOrderNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: string; notes: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("orders").update({ internal_notes: notes } as any).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: (_, { orderId }) => queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] }),
  });
}