import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

// "Custom" has no date picker wired up yet — falls back to Last 30 days.
// Add a real range picker and pass explicit start/end through if you need true custom ranges.
function resolveRange(range: string): { start: Date; end: Date } {
  const now = new Date();
  switch (range) {
    case "Today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "Yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }
    case "Last 7 days": {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { start: startOfDay(s), end: endOfDay(now) };
    }
    case "This month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) };
    case "Last month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "Custom":
    case "Last 30 days":
    default: {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { start: startOfDay(s), end: endOfDay(now) };
    }
  }
}

function pctDelta(curr: number, prev: number): string {
  if (!prev) return curr ? "+100%" : "—";
  const pct = ((curr - prev) / prev) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

export interface DashboardData {
  totalSales: number;
  salesDelta: string;
  netRevenue: number;
  netRevenueDelta: string;
  orderCount: number;
  ordersDelta: string;
  aov: number;
  aovDelta: string;
  pendingCount: number;
  revenueSeries: { day: string; revenue: number; orders: number }[];
  categorySales: { name: string; value: number }[];
  topProducts: { name: string; image: string; units: number; revenue: number }[];
  recentOrders: {
    id: string;
    number: string;
    customer: string;
    payment: string;
    status: string;
    total: number;
  }[];
}

export function useDashboardData(range: string) {
  return useQuery({
    queryKey: ["dashboard", range],
    queryFn: async (): Promise<DashboardData> => {
      const supabase = createClient();
      const { start, end } = resolveRange(range);

      const { data: orders, error: ordersErr } = await supabase
        .from("orders")
        .select("id, order_number, customer_email, status, total, created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });
      if (ordersErr) throw ordersErr;

      const orderIds = (orders ?? []).map((o) => o.id);

      const [{ data: payments }, { data: orderItems }] = await Promise.all([
        orderIds.length
          ? supabase.from("payments").select("order_id, status").in("order_id", orderIds)
          : Promise.resolve({ data: [] as { order_id: string; status: string }[] }),
        orderIds.length
          ? supabase
              .from("order_items")
              .select(
                `order_id, quantity, total, product_variant_id,
                 product_variants ( product_id, products ( name, product_images ( storage_path, is_primary, sort_order ), product_categories ( categories ( name ) ) ) )`,
              )
              .in("order_id", orderIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const paymentByOrder = new Map<string, string>();
      for (const p of payments ?? []) paymentByOrder.set(p.order_id, p.status);

      // Revenue/orders bucketed by day for the charts
      const seriesMap = new Map<string, { day: string; revenue: number; orders: number }>();
      for (const o of orders ?? []) {
        const day = new Date(o.created_at).toLocaleDateString("en-KE", { month: "short", day: "numeric" });
        const entry = seriesMap.get(day) ?? { day, revenue: 0, orders: 0 };
        entry.revenue += o.total;
        entry.orders += 1;
        seriesMap.set(day, entry);
      }
      const revenueSeries = [...seriesMap.values()].reverse();

      // Category + top-product breakdowns from order_items in range
      const categoryTotals = new Map<string, number>();
      const productTotals = new Map<string, { name: string; image: string; units: number; revenue: number }>();
      for (const item of orderItems ?? []) {
        const product = item.product_variants?.products;
        const categoryName = product?.product_categories?.[0]?.categories?.name ?? "Uncategorized";
        categoryTotals.set(categoryName, (categoryTotals.get(categoryName) ?? 0) + item.total);

        const productId = item.product_variants?.product_id;
        if (productId) {
          const images = [...(product?.product_images ?? [])].sort(
            (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
          );
          const primary = images.find((i: any) => i.is_primary) ?? images[0];
          const existing = productTotals.get(productId) ?? {
            name: product?.name ?? "—",
            image: primary?.storage_path ?? "",
            units: 0,
            revenue: 0,
          };
          existing.units += item.quantity;
          existing.revenue += item.total;
          productTotals.set(productId, existing);
        }
      }
      const categorySales = [...categoryTotals.entries()].map(([name, value]) => ({ name, value }));
      const topProducts = [...productTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      const totalSales = (orders ?? []).reduce((s, o) => s + o.total, 0);
      // "Net" = excludes orders marked Refunded/Cancelled. Adjust these status strings to match your checkout flow.
      const netRevenue = (orders ?? [])
        .filter((o) => o.status !== "Refunded" && o.status !== "Cancelled")
        .reduce((s, o) => s + o.total, 0);
      const orderCount = (orders ?? []).length;
      const aov = orderCount ? totalSales / orderCount : 0;
      const pendingCount = (orders ?? []).filter(
        (o) => o.status === "Pending" || paymentByOrder.get(o.id) === "Pending",
      ).length;

      const recentOrders = (orders ?? []).slice(0, 6).map((o) => ({
        id: o.id,
        number: o.order_number,
        customer: o.customer_email,
        payment: paymentByOrder.get(o.id) ?? "—",
        status: o.status,
        total: o.total,
      }));

      // Previous period of equal length, for the deltas shown next to each stat
      const durationMs = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - durationMs);
      const { data: prevOrders } = await supabase
        .from("orders")
        .select("total, status")
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());
      const prevSales = (prevOrders ?? []).reduce((s, o) => s + o.total, 0);
      const prevNet = (prevOrders ?? [])
        .filter((o) => o.status !== "Refunded" && o.status !== "Cancelled")
        .reduce((s, o) => s + o.total, 0);
      const prevCount = (prevOrders ?? []).length;
      const prevAov = prevCount ? prevSales / prevCount : 0;

      return {
        totalSales,
        salesDelta: pctDelta(totalSales, prevSales),
        netRevenue,
        netRevenueDelta: pctDelta(netRevenue, prevNet),
        orderCount,
        ordersDelta: pctDelta(orderCount, prevCount),
        aov,
        aovDelta: pctDelta(aov, prevAov),
        pendingCount,
        revenueSeries,
        categorySales,
        topProducts,
        recentOrders,
      };
    },
  });
}

// ---- Customers (all-time, not scoped to the selected range) ----

export interface RecentCustomer {
  id: string;
  name: string;
  location: string;
  orders: number;
  spent: number;
}

export function useCustomerStats() {
  return useQuery({
    queryKey: ["dashboard", "customers"],
    queryFn: async () => {
      const supabase = createClient();
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [{ count: total }, { count: newThisMonth }] = await Promise.all([
        supabase.from("customer").select("*", { count: "exact", head: true }),
        supabase.from("customer").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth),
      ]);

      return { total: total ?? 0, newThisMonth: newThisMonth ?? 0 };
    },
  });
}

export function useRecentCustomers() {
  return useQuery({
    queryKey: ["dashboard", "recent-customers"],
    queryFn: async (): Promise<RecentCustomer[]> => {
      const supabase = createClient();
      const { data: customers, error } = await supabase
        .from("customer")
        .select("id, name, email")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;

      const emails = (customers ?? []).map((c) => c.email);
      let ordersByEmail = new Map<string, { count: number; spent: number }>();
      if (emails.length) {
        // Lifetime orders/spend, matched by email since orders.user_id isn't
        // guaranteed populated for guest checkouts. Assumes customer.email is unique.
        const { data: orders } = await supabase
          .from("orders")
          .select("customer_email, total")
          .in("customer_email", emails);
        for (const o of orders ?? []) {
          const entry = ordersByEmail.get(o.customer_email) ?? { count: 0, spent: 0 };
          entry.count += 1;
          entry.spent += o.total;
          ordersByEmail.set(o.customer_email, entry);
        }
      }

      return (customers ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        location: "—", // no location column on customer/addresses join wired up here
        orders: ordersByEmail.get(c.email)?.count ?? 0,
        spent: ordersByEmail.get(c.email)?.spent ?? 0,
      }));
    },
  });
}

// ---- Product status counts (for the "Products" stat card) ----

export function useProductStatusCounts() {
  return useQuery({
    queryKey: ["dashboard", "product-status-counts"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("products").select("status");
      if (error) throw error;
      const total = data?.length ?? 0;
      const published = (data ?? []).filter((p) => p.status === "Published").length;
      const draft = (data ?? []).filter((p) => p.status === "Draft").length;
      return { total, published, draft };
    },
  });
}